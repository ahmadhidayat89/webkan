<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class AdminActivityLogger
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only log for authenticated users doing non-GET/HEAD requests on admin routes
        if (Auth::check() && $request->is('admin/*') && !in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'])) {
            
            // Mask sensitive fields
            $details = $request->except(['password', 'password_confirmation', '_token', '_method']);

            AuditLog::create([
                'user_id' => Auth::id(),
                'event' => 'admin_' . strtolower($request->method()) . '_' . str_replace('admin/', '', $request->path()),
                'ip_address' => $request->ip(),
                'session_id' => $request->session()->getId(),
                'user_agent' => $request->userAgent(),
                'details' => $details,
            ]);
        }

        return $response;
    }
}
