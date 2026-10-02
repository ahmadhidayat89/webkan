<?php

use App\Http\Middleware\CheckRole;
use App\Http\Middleware\ReadTokenFromCookie;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // ReadTokenFromCookie harus jalan sebelum auth:sanctum (yang punya middleware priority
        // tinggi). Solusi: prepend ke global stack agar selalu jalan lebih awal.
        // Middleware ini aman di-global karena hanya inject header jika belum ada Bearer token.
        $middleware->prepend(ReadTokenFromCookie::class);

        $middleware->alias([
            'role'        => CheckRole::class,
            'cookie.auth' => ReadTokenFromCookie::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();
