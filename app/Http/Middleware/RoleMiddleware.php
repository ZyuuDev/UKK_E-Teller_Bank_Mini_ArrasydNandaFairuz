<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {

        $user = Auth::user();

        if (!in_array($user->role, $roles)) {

            return response()->json([
                'status'  => 'error',
                'message' => 'Akses ditolak. Hak akses Anda tidak mencukupi untuk endpoint ini.',
            ], 403);
        }

        return $next($request);
    }
}