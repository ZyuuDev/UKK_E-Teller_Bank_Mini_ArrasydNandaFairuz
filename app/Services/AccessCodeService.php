<?php

namespace App\Services;

use App\Jobs\SendAccessCode;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AccessCodeService
{
    public function __construct(private AuditService $audit)
    {
    }

    public function issue(User $user, string $purpose): void
    {
        $key = hash_hmac('sha256', strtolower($user->email).':'.$purpose, config('app.key'));
        if (RateLimiter::tooManyAttempts('code-minute:'.$key, 1) || RateLimiter::tooManyAttempts('code-window:'.$key, 3)) {
            return;
        }
        RateLimiter::hit('code-minute:'.$key, 60);
        RateLimiter::hit('code-window:'.$key, 900);
        $code = (string) random_int(100000, 999999);
        $id = (string) Str::uuid();
        DB::transaction(function () use ($user, $purpose, $code, $id) {
            $current = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            abort_unless($current->email && $current->email === $user->email && $current->is_active, 422, 'Email akun berubah. Muat ulang.');
            DB::table('access_codes')->updateOrInsert(['user_id' => $current->id, 'purpose' => $purpose], [
                'id' => $id,
                'email' => $current->email,
                'code_hash' => Hash::make($code),
                'attempts' => 0,
                'expires_at' => now()->addMinutes(10),
                'consumed_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            SendAccessCode::dispatch($id, $code)->afterCommit();
        });
    }

    public function consume(string $email, string $purpose, string $code, ?string $password = null, ?int $expectedUserId = null): bool
    {
        return DB::transaction(function () use ($email, $purpose, $code, $password, $expectedUserId) {
            $user = User::where('email', $email)->where('role', 'student')->where('is_active', true)->lockForUpdate()->first();
            if (!$user || ($expectedUserId !== null && $user->id !== $expectedUserId) || ($purpose === 'password_reset' && !$user->email_verified_at)) {
                return false;
            }
            $row = DB::table('access_codes')->where('user_id', $user->id)->where('purpose', $purpose)->lockForUpdate()->first();
            if (!$row || $row->email !== $email || $row->consumed_at || now()->greaterThanOrEqualTo($row->expires_at) || $row->attempts >= 5) {
                return false;
            }
            if (!Hash::check($code, $row->code_hash)) {
                DB::table('access_codes')->where('id', $row->id)->increment('attempts');
                return false;
            }
            DB::table('access_codes')->where('id', $row->id)->update(['consumed_at' => now(), 'updated_at' => now()]);
            if ($purpose === 'email_verification') {
                $user->update(['email_verified_at' => now()]);
            } else {
                $user->update(['password' => $password, 'must_change_password' => false]);
                $user->tokens()->delete();
            }
            $this->audit->record($user->id, $purpose === 'email_verification' ? 'student.email_verified' : 'student.password_reset', 'user', $user->id);
            return true;
        }, 3);
    }
}