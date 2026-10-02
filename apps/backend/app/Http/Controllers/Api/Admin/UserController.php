<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Kembalikan daftar user.
     * admin hanya melihat user non-super_admin.
     */
    public function index(Request $request)
    {
        $me = $request->user();
        $query = User::query()->orderBy('created_at', 'desc');

        if ($me->role === 'admin') {
            $query->where('role', '!=', 'super_admin');
        }

        $users = $query->get()->map(fn ($u) => [
            'id'         => $u->id,
            'name'       => $u->name,
            'email'      => $u->email,
            'role'       => $u->role,
            'created_at' => $u->created_at,
        ]);

        return response()->json(['success' => true, 'data' => $users]);
    }

    /**
     * Buat user baru.
     * admin hanya boleh membuat user dengan role admin atau sosmed_admin.
     */
    public function store(Request $request)
    {
        $me = $request->user();

        $allowedRoles = $me->role === 'super_admin'
            ? ['super_admin', 'admin', 'sosmed_admin']
            : ['admin', 'sosmed_admin'];

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role'     => 'required|string|in:' . implode(',', $allowedRoles),
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => $validated['role'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User berhasil dibuat',
            'data'    => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'role'       => $user->role,
                'created_at' => $user->created_at,
            ],
        ], 201);
    }

    /**
     * Update user.
     * admin tidak boleh mengedit user dengan role super_admin.
     * Password opsional — jika tidak dikirim, tidak diubah.
     */
    public function update(Request $request, $id)
    {
        $me     = $request->user();
        $target = User::findOrFail($id);

        if ($me->role === 'admin' && $target->role === 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak dapat mengedit super admin.',
            ], 403);
        }

        $allowedRoles = $me->role === 'super_admin'
            ? ['super_admin', 'admin', 'sosmed_admin']
            : ['admin', 'sosmed_admin'];

        $validated = $request->validate([
            'name'     => 'sometimes|required|string|max:255',
            'email'    => 'sometimes|required|email|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8',
            'role'     => 'sometimes|required|string|in:' . implode(',', $allowedRoles),
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $target->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'User berhasil diperbarui',
            'data'    => [
                'id'         => $target->id,
                'name'       => $target->name,
                'email'      => $target->email,
                'role'       => $target->role,
                'created_at' => $target->created_at,
            ],
        ]);
    }

    /**
     * Hapus user.
     * Tidak bisa hapus diri sendiri.
     * admin tidak bisa hapus super_admin.
     */
    public function destroy(Request $request, $id)
    {
        $me     = $request->user();
        $target = User::findOrFail($id);

        if ($me->id === $target->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ], 403);
        }

        if ($me->role === 'admin' && $target->role === 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak dapat menghapus super admin.',
            ], 403);
        }

        $target->delete();

        return response()->json(['success' => true, 'message' => 'User berhasil dihapus']);
    }
}
