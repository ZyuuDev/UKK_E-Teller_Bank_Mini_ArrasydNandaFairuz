<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
    }

    public function boot(): void
    {
        RateLimiter::for('bank-login', function (Request $request) {
            $identity = strtolower(trim((string) $request->input('username'))).':'.$request->ip();
            return [
                Limit::perMinute(60)->by('bank-login-ip:'.$request->ip()),
                Limit::perMinute(5)->by('bank-login-account:'.hash_hmac('sha256', $identity, config('app.key'))),
            ];
        });
    }
}