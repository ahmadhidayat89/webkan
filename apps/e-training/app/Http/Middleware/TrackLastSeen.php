<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class TrackLastSeen
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();
            $cacheKey = 'user_last_seen_' . $user->id;

            // Update setiap 2 menit sekali agar tidak terlalu sering query DB
            if (!Cache::has($cacheKey)) {
                $user->timestamps = false;
                $user->update(['last_seen_at' => now()]);
                Cache::put($cacheKey, true, now()->addMinutes(2));
            }
        }

        return $next($request);
    }
}
