<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // For API requests, return null so it throws a 401 JSON response instead of redirecting
        if ($request->is('api/*') || $request->expectsJson()) {
            return null;
        }
        return null; // No web login route in this app
    }
}
