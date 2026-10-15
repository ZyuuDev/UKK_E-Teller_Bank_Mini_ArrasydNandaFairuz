<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        abort_unless($request->user() && in_array($request->user()->role, $roles, true), 403, 'Hak akses tidak sesuai.');
        return $next($request);
    }
}