<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::query();
        if ($request->user()->role !== 'super_admin') {
            $users->where('role', '!=', 'super_admin');
        }

        return response()->json([
            'success' => true,
            'data' => $users
                ->select(['id', 'name', 'email', 'role', 'created_at'])
                ->orderBy('name')
                ->paginate(25),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'role' => ['required', Rule::in($this->assignableRoles($request))],
            'password' => ['required', 'string', 'max:128', Password::min(8)->letters()->mixedCase()->numbers()],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'password' => $validated['password'],
        ]);

        return response()->json([
            'success' => true,
            'data' => $user->only(['id', 'name', 'email', 'role', 'created_at']),
        ], 201);
    }

    public function update(Request $request, User $user)
    {
        $actor = $request->user();
        $isSuperAdmin = $actor->role === 'super_admin';
        $assignableRoles = $this->assignableRoles($request);

        abort_unless($isSuperAdmin || $user->role !== 'super_admin', 403);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['sometimes', 'required', Rule::in($assignableRoles)],
            'password' => ['sometimes', 'required', 'string', 'max:128', Password::min(8)->letters()->mixedCase()->numbers()],
        ]);

        if ($actor->is($user) && isset($validated['role']) && $validated['role'] !== $user->role) {
            abort(403, 'You cannot change your own role.');
        }

        if (($validated['role'] ?? $user->role) !== 'super_admin' && $user->role === 'super_admin') {
            $this->ensureAnotherSuperAdminExists($user);
        }

        $passwordChanged = isset($validated['password']);
        $user->fill(collect($validated)->except('password')->all());
        if ($passwordChanged) {
            $user->password = Hash::make($validated['password']);
        }
        $user->save();

        if ($passwordChanged || isset($validated['role'])) {
            $user->tokens()->delete();
        }

        return response()->json([
            'success' => true,
            'data' => $user->only(['id', 'name', 'email', 'role', 'created_at']),
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        abort_if($request->user()->is($user), 422, 'You cannot delete your own account.');
        abort_unless($request->user()->role === 'super_admin' || $user->role !== 'super_admin', 403);

        if ($user->role === 'super_admin') {
            $this->ensureAnotherSuperAdminExists($user);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['success' => true]);
    }

    private function assignableRoles(Request $request): array
    {
        return $request->user()->role === 'super_admin'
            ? ['admin', 'adminsosmed', 'super_admin']
            : ['admin', 'adminsosmed'];
    }

    private function ensureAnotherSuperAdminExists(User $user): void
    {
        abort_if(
            User::where('role', 'super_admin')->where('id', '!=', $user->id)->doesntExist(),
            422,
            'At least one super admin must remain.'
        );
    }
}
