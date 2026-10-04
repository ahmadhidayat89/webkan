<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $role = $request->user()?->role;

        if ($role === 'sosmed_admin') {
            $role = 'adminsosmed';
        }

        abort_unless($role && in_array($role, $roles, true), 403);

        return $next($request);
    }
}
