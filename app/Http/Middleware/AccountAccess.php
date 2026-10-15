<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AccountAccess
{
    public function handle(Request $request, Closure $next): mixed
    {
        $user = $request->user();
        abort_unless($user && $user->is_active, 401, 'Akses akun tidak aktif.');
        $allowed = ['api/auth/me', 'api/auth/password', 'api/auth/logout'];
        abort_if($user->must_change_password && !in_array($request->path(), $allowed, true), 403, 'Ganti password sementara terlebih dahulu.');
        return $next($request);
    }
}