<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Tampilkan semua user (admin + peserta).
     */
    public function index(): Response
    {
        $users = User::orderBy('role')->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($user) => [
                'id'           => $user->id,
                'name'         => $user->name,
                'username'     => $user->username,
                'email'        => $user->email,
                'role'         => $user->role,
                'organization' => $user->organization,
                'phone'        => $user->phone,
                'created_at'   => $user->created_at->format('d M Y'),
            ]);

        return Inertia::render('Admin/UserManagement', [
            'users' => $users,
        ]);
    }

    /**
     * Simpan user baru (admin bisa pilih role).
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'         => 'required|string|max:255',
            'username'     => 'required|string|max:50|unique:users,username|alpha_dash',
            'email'        => 'required|string|lowercase|email|max:255|unique:users,email',
            'password'     => ['required', 'confirmed', Rules\Password::defaults()],
            'role'         => 'required|in:peserta,admin',
            'organization' => 'nullable|string|max:255',
            'phone'        => 'nullable|string|max:20',
        ]);

        User::create([
            'name'         => $request->name,
            'username'     => $request->username,
            'email'        => $request->email,
            'password'     => Hash::make($request->password),
            'role'         => $request->role,
            'organization' => $request->organization,
            'phone'        => $request->phone,
        ]);

        $roleLabel = $request->role === 'admin' ? 'Admin' : 'Peserta';
        return back()->with('success', "Akun {$roleLabel} berhasil dibuat.");
    }

    /**
     * Update profil user (admin dapat edit semua field termasuk role).
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'name'         => 'required|string|max:255',
            'username'     => ['required', 'string', 'max:50', 'alpha_dash', Rule::unique('users', 'username')->ignore($user->id)],
            'email'        => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role'         => 'required|in:peserta,admin',
            'organization' => 'nullable|string|max:255',
            'phone'        => 'nullable|string|max:20',
            'password'     => ['nullable', 'confirmed', Rules\Password::defaults()],
        ]);

        $data = [
            'name'         => $request->name,
            'username'     => $request->username,
            'email'        => $request->email,
            'role'         => $request->role,
            'organization' => $request->organization,
            'phone'        => $request->phone,
        ];

        // Hanya update password jika diisi
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return back()->with('success', 'Profil user berhasil diperbarui.');
    }

    /**
     * Hapus user (admin tidak bisa menghapus dirinya sendiri).
     */
    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'Anda tidak dapat menghapus akun sendiri.');
        }

        $user->delete();

        return back()->with('success', 'Akun user berhasil dihapus.');
    }
}
