<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\AccessCodeService;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RequestPasswordReset implements ShouldQueue, ShouldBeEncrypted
{
    use Queueable;

    public int $tries = 1;

    public function __construct(public string $email)
    {
    }

    public function handle(AccessCodeService $codes): void
    {
        $user = User::where('email', $this->email)->where('role', 'student')->where('is_active', true)->whereNotNull('email_verified_at')->first();
        if ($user) {
            $codes->issue($user, 'password_reset');
        }
    }
}