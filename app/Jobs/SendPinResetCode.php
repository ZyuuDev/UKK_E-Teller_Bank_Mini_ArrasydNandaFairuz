<?php

namespace App\Jobs;

use App\Mail\PinResetCodeMail;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class SendPinResetCode implements ShouldBeEncrypted, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 45;

    public function __construct(public string $codeId, public string $code) {}

    public function backoff(): array
    {
        return [30, 60, 120];
    }

    public function handle(): void
    {
        $row = DB::table('pin_reset_codes')->where('id', $this->codeId)
            ->whereNull('consumed_at')->where('expires_at', '>', now())->first();
        if (! $row) {
            return;
        }
        $user = DB::table('users')->where('id', $row->user_id)->where('email', $row->email)
            ->where('role', 'student')->where('is_active', true)
            ->where('must_change_password', false)->whereNotNull('email_verified_at')->first();
        if (! $user) {
            return;
        }
        $expires = Carbon::parse($row->expires_at)->format('d/m/Y H:i');
        Mail::to($row->email)->send(new PinResetCodeMail($this->code, $expires));
    }
}