<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Mencabut token yang sudah tidak dipakai melebihi batas tidak aktif.
 *
 * Harus berjalan SEBELUM guard Sanctum karena guard memperbarui last_used_at
 * pada setiap permintaan. Urutannya dijamin lewat prependToPriorityList di bootstrap/app.php.
 */
class IdleTimeout
{
    public function handle(Request $request, Closure $next): mixed
    {
        $plain = $request->bearerToken();
        $token = $plain ? PersonalAccessToken::findToken($plain) : null;

        if ($token) {
            $role = $token->tokenable?->role;
            $minutes = $role === 'student'
                ? (int) config('bank.idle_timeout_minutes.student')
                : (int) config('bank.idle_timeout_minutes.staff');
            $lastActivity = $token->last_used_at ?? $token->created_at;

            if ($minutes > 0 && $lastActivity && $lastActivity->lt(now()->subMinutes($minutes))) {
                $token->delete();

                return response()->json([
                    'message' => 'Sesi berakhir karena tidak ada aktivitas. Silakan masuk kembali.',
                    'code' => 'idle_timeout',
                ], 401);
            }
        }

        return $next($request);
    }
}

