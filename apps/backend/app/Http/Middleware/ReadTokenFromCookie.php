<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ReadTokenFromCookie
{
    /**
     * Baca token dari httpOnly cookie 'auth_token' dan inject sebagai
     * Authorization header agar auth:sanctum guard bisa memvalidasinya.
     * Jika Authorization header sudah ada (misal: dari API client), tidak ditimpa.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->bearerToken() && $request->cookies->has('auth_token')) {
            $token = $request->cookies->get('auth_token');
            $request->headers->set('Authorization', 'Bearer ' . $token);
        }

        return $next($request);
    }
}
