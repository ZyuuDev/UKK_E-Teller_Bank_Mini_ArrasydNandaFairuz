<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\PinRecoveryService;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RequestPinReset implements ShouldBeEncrypted, ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public function __construct(public string $email) {}

    public function handle(PinRecoveryService $codes): void
    {
        $user = User::where('email', $this->email)->where('role', 'student')
            ->where('is_active', true)->where('must_change_password', false)
            ->whereNotNull('email_verified_at')->first();
        if ($user) {
            $codes->issue($user);
        }
    }
}