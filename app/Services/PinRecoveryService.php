<?php

namespace App\Services;

use App\Jobs\SendPinResetCode;
use App\Models\Member;
use App\Models\Saver;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class PinRecoveryService
{
    public function __construct(private AuditService $audit) {}

    public function issue(User $user): void
    {
        $key = 'pin-code:'.hash_hmac('sha256', strtolower((string) $user->email), config('app.key'));
        if (RateLimiter::tooManyAttempts($key.':minute', 1) || RateLimiter::tooManyAttempts($key.':window', 3)) {
            return;
        }
        RateLimiter::hit($key.':minute', 60);
        RateLimiter::hit($key.':window', 900);
        DB::transaction(function () use ($user) {
            $current = User::whereKey($user->id)->lockForUpdate()->first();
            if (! $this->eligible($current) || $current->email !== $user->email) {
                return;
            }
            $member = Member::whereKey($current->id)->lockForUpdate()->first();
            $saver = Saver::where('user_id', $current->id)->lockForUpdate()->first();
            if (! $member || $member->account_status !== 'active' || ! $saver) {
                return;
            }
            $id = (string) Str::uuid();
            $code = (string) random_int(100000, 999999);
            DB::table('pin_reset_codes')->updateOrInsert(['user_id' => $current->id], [
                'id' => $id,
                'email' => $current->email,
                'code_hash' => Hash::make($code),
                'attempts' => 0,
                'expires_at' => now()->addMinutes(10),
                'consumed_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            SendPinResetCode::dispatch($id, $code)->afterCommit();
        }, 3);
    }

    private function eligible(?User $user): bool
    {
        return $user !== null && $user->role === 'student' && $user->is_active
            && ! $user->must_change_password && $user->email !== null && $user->email_verified_at !== null;
    }

    public function reset(string $email, string $code, string $loginPassword, string $pin): bool
    {
        return DB::transaction(function () use ($email, $code, $loginPassword, $pin) {
            $user = User::where('email', $email)->lockForUpdate()->first();
            if (! $this->eligible($user)) {
                return false;
            }
            $row = DB::table('pin_reset_codes')->where('user_id', $user->id)->lockForUpdate()->first();
            if (! $row || $row->email !== $email || $row->consumed_at || $row->attempts >= 5
                || now()->greaterThanOrEqualTo($row->expires_at)) {
                return false;
            }
            if (! Hash::check($code, $row->code_hash) || ! Hash::check($loginPassword, $user->password)) {
                // Return false agar penambahan attempts tetap tersimpan saat transaksi commit.
                DB::table('pin_reset_codes')->where('id', $row->id)->increment('attempts');

                return false;
            }
            $member = Member::whereKey($user->id)->lockForUpdate()->first();
            $saver = Saver::where('user_id', $user->id)->lockForUpdate()->first();
            if (! $member || $member->account_status !== 'active' || ! $saver) {
                return false;
            }
            $saver->update(['security_pin' => $pin]); // Model Saver memakai hashed cast.
            DB::table('pin_reset_codes')->where('id', $row->id)->update([
                'consumed_at' => now(), 'updated_at' => now(),
            ]);
            $user->tokens()->delete();
            $this->audit->record($user->id, 'student.pin_reset', 'saver', $saver->id);

            return true;
        }, 3);
    }
}