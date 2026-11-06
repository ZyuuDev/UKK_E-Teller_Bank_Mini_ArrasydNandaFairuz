<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    /** Hash bcrypt tetap, dipakai agar waktu respons sama baik akun ada maupun tidak. */
    private const DUMMY_HASH = '$2y$12$xZO5nxQ9QIvF5tuBJZCNBeLL1Y0uoyUXyzTB1XgNTccKgkzJwsa6S';

    private function profile(User $user): array
    {
        $minutes = $user->role === 'student'
            ? (int) config('bank.idle_timeout_minutes.student')
            : (int) config('bank.idle_timeout_minutes.staff');

        return $user->only(['id', 'username', 'name', 'role', 'must_change_password', 'email', 'email_verified_at']) + ['idle_timeout_seconds' => $minutes * 60];
    }

    private function loginKeys(Request $request, string $username): array
    {
        $username = strtolower(trim($username));

        return [
            'pair' => 'login-pair:'.hash_hmac('sha256', $username.'|'.$request->ip(), config('app.key')),
            'account' => 'login-account:'.hash_hmac('sha256', $username, config('app.key')),
            'ip' => 'login-ip:'.$request->ip(),
        ];
    }

    private function lockedFor(array $keys): int
    {
        $limits = config('bank.login');
        $checks = [
            'pair' => $limits['pair_max_failures'],
            'account' => $limits['account_max_failures'],
            'ip' => $limits['ip_max_failures'],
        ];
        $wait = 0;
        foreach ($checks as $name => $max) {
            if (RateLimiter::tooManyAttempts($keys[$name], $max)) {
                $wait = max($wait, RateLimiter::availableIn($keys[$name]));
            }
        }

        return $wait;
    }

    private function tooMany(int $seconds)
    {
        $minutes = max(1, (int) ceil($seconds / 60));

        return response()->json([
            'message' => "Terlalu banyak percobaan login. Coba lagi dalam {$minutes} menit.",
            'code' => 'too_many_attempts',
            'retry_after' => $seconds,
        ], 429)->header('Retry-After', (string) $seconds);
    }

    public function login(Request $request)
    {
        $data = $request->validate(['username' => 'required|string|max:50', 'password' => 'required|string|max:100', 'client' => 'required|in:web,mobile']);
        $keys = $this->loginKeys($request, $data['username']);

        if ($wait = $this->lockedFor($keys)) {
            return $this->tooMany($wait);
        }

        $user = User::where('username', $data['username'])->first();
        $allowed = $data['client'] === 'mobile' ? ['student'] : ['admin', 'teller'];
        // Selalu jalankan pemeriksaan hash agar tidak membocorkan keberadaan akun lewat waktu respons.
        $passwordOk = Hash::check($data['password'], $user?->password ?? self::DUMMY_HASH);

        if (!$user || !$passwordOk || !$user->is_active || !in_array($user->role, $allowed, true)) {
            $limits = config('bank.login');
            RateLimiter::hit($keys['pair'], $limits['lockout_seconds']);
            RateLimiter::hit($keys['account'], $limits['lockout_seconds']);
            RateLimiter::hit($keys['ip'], $limits['ip_window_seconds']);
            Log::warning('Login gagal', ['ip' => $request->ip(), 'client' => $data['client'], 'account_hash' => substr($keys['account'], -12)]);

            throw ValidationException::withMessages(['username' => 'Akun, password, atau jenis aplikasi tidak sesuai.']);
        }

        RateLimiter::clear($keys['pair']);
        RateLimiter::clear($keys['account']);

        // Batasi jumlah sesi aktif per akun dan buang token kedaluwarsa agar tabel token tidak menumpuk.
        $user->tokens()->where('expires_at', '<', now())->delete();
        $keep = max(1, (int) config('bank.login.max_active_tokens')) - 1;
        $stale = $user->tokens()->orderByDesc('id')->skip($keep)->take(PHP_INT_MAX)->pluck('id');
        if ($stale->isNotEmpty()) {
            PersonalAccessToken::whereIn('id', $stale)->delete();
        }

        $token = $user->createToken('bank-'.$data['client'], ['*'], now()->addHours(12))->plainTextToken;

        return response()->json(['data' => ['token' => $token, 'user' => $this->profile($user)]]);
    }

    public function me(Request $request)
    {
        return response()->json(['data' => $this->profile($request->user())]);
    }

    public function password(Request $request)
    {
        $data = $request->validate(['current_password' => 'required|string', 'password' => 'required|string|min:12|max:100|confirmed|different:current_password']);
        $user = $request->user();
        if (!Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => 'Password saat ini tidak benar.']);
        }
        DB::transaction(function () use ($user, $data) {
            $user->update(['password' => $data['password'], 'must_change_password' => false]);
            DB::table('access_codes')->where('user_id', $user->id)->where('purpose', 'password_reset')->delete();
            $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();
        });

        return response()->json(['data' => $this->profile($user->fresh())]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }
}
