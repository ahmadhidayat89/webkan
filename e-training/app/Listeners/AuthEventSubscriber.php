<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Events\Dispatcher;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuthEventSubscriber
{
    protected Request $request;

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    public function handleUserLogin(Login $event): void
    {
        AuditLog::create([
            'user_id' => $event->user->id,
            'event' => 'login',
            'ip_address' => $this->request->ip(),
            'session_id' => $this->request->hasSession() ? $this->request->session()->getId() : null,
            'user_agent' => $this->request->userAgent(),
        ]);
    }

    public function handleUserLogout(Logout $event): void
    {
        if ($event->user) {
            AuditLog::create([
                'user_id' => $event->user->id,
                'event' => 'logout',
                'ip_address' => $this->request->ip(),
                'session_id' => $this->request->hasSession() ? $this->request->session()->getId() : null,
                'user_agent' => $this->request->userAgent(),
            ]);
        }
    }

    public function handleUserFailedLogin(Failed $event): void
    {
        AuditLog::create([
            'user_id' => $event->user ? $event->user->id : null,
            'event' => 'failed_login',
            'ip_address' => $this->request->ip(),
            'session_id' => $this->request->hasSession() ? $this->request->session()->getId() : null,
            'user_agent' => $this->request->userAgent(),
            'details' => ['username_attempted' => $event->credentials['username'] ?? $event->credentials['email'] ?? 'unknown'],
        ]);
    }

    public function handlePasswordReset(PasswordReset $event): void
    {
        AuditLog::create([
            'user_id' => $event->user->id,
            'event' => 'password_reset',
            'ip_address' => $this->request->ip(),
            'session_id' => $this->request->hasSession() ? $this->request->session()->getId() : null,
            'user_agent' => $this->request->userAgent(),
        ]);
    }

    public function subscribe(Dispatcher $events): void
    {
        $events->listen(
            Login::class,
            [AuthEventSubscriber::class, 'handleUserLogin']
        );

        $events->listen(
            Logout::class,
            [AuthEventSubscriber::class, 'handleUserLogout']
        );

        $events->listen(
            Failed::class,
            [AuthEventSubscriber::class, 'handleUserFailedLogin']
        );

        $events->listen(
            PasswordReset::class,
            [AuthEventSubscriber::class, 'handlePasswordReset']
        );
    }
}
