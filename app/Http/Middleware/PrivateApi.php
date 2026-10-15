<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class PrivateApi
{
    public function handle(Request $request, Closure $next): mixed
    {
        $response = $next($request);
        $response->headers->set('Cache-Control', 'no-store, private');
        return $response;
    }
}