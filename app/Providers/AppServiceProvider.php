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
        // Batas kasar anti-banjir permintaan per IP. Penguncian percobaan gagal ada di AuthController.
        RateLimiter::for('bank-login', function (Request $request) {
            return Limit::perMinute(30)->by('bank-login-ip:'.$request->ip())->response(function (Request $request, array $headers) {
                return response()->json(['message' => 'Terlalu banyak permintaan login. Coba lagi sebentar lagi.', 'code' => 'too_many_attempts'], 429, $headers);
            });
        });
    }
}
