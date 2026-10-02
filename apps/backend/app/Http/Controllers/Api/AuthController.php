<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login admin.
     * Token disimpan sebagai httpOnly cookie, tidak dikembalikan dalam response body.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user->tokens()->delete();
        $token = $user->createToken('admin-token')->plainTextToken;

        // Catat login — auth()->user() belum tersedia, gunakan $user langsung
        ActivityLog::create([
            'user_id'       => $user->id,
            'user_name'     => $user->name,
            'user_email'    => $user->email,
            'action'        => 'login',
            'resource_type' => 'auth',
            'ip_address'    => $request->ip(),
            'user_agent'    => $request->userAgent(),
            'created_at'    => now(),
        ]);

        $cookie = Cookie::make(
            name: 'auth_token',
            value: $token,
            minutes: 0,
            path: '/',
            domain: null,
            secure: false,      // PRODUCTION: ganti ke true (HTTPS)
            httpOnly: true,
            raw: false,
            sameSite: 'lax'
        );

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => ['user' => $user],
        ])->withCookie($cookie);
    }

    /**
     * Logout admin.
     * Hapus token dari DB dan clear cookie.
     */
    public function logout(Request $request)
    {
        // Catat logout sebelum token dihapus
        ActivityLog::recordAction('logout', 'auth');

        $request->user()->currentAccessToken()->delete();
        $cookie = Cookie::forget('auth_token');

        return response()->json([
            'success' => true,
            'message' => 'Logout successful',
        ])->withCookie($cookie);
    }

    /**
     * Get authenticated user.
     */
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $request->user(),
        ]);
    }
}
