<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class MenuController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Menu::query()->orderBy('parent_id')->orderBy('order')->get(),
        ]);
    }

    public function publicIndex()
    {
        return response()->json([
            'success' => true,
            'data' => Menu::active()
                ->parentOnly()
                ->ordered()
                ->with('children')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validatedMenu($request);

        return response()->json([
            'success' => true,
            'data' => Menu::create($validated),
        ], 201);
    }

    public function update(Request $request, Menu $menu)
    {
        $validated = $this->validatedMenu($request, $menu);
        $menu->update($validated);

        return response()->json(['success' => true, 'data' => $menu->fresh()]);
    }

    public function destroy(Menu $menu)
    {
        $menu->delete();

        return response()->json(['success' => true]);
    }

    private function validatedMenu(Request $request, ?Menu $menu = null): array
    {
        $validated = $request->validate([
            'parent_id' => ['nullable', 'integer', Rule::exists('menus', 'id')],
            'title_id' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'url' => ['required', 'string', 'max:2048', function ($attribute, $value, $fail) {
                $isLocalPath = str_starts_with($value, '/') && !str_starts_with($value, '//');
                $isExternalUrl = preg_match('/^https?:\/\//i', $value) && filter_var($value, FILTER_VALIDATE_URL);
                if (!$isLocalPath && !$isExternalUrl) {
                    $fail('The URL must be a local path or a valid absolute URL.');
                }
            }],
            'icon' => 'nullable|string|max:100',
            'order' => 'nullable|integer|min:0|max:10000',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($menu && isset($validated['parent_id']) && (int) $validated['parent_id'] === $menu->id) {
            throw ValidationException::withMessages(['parent_id' => 'A menu cannot be its own parent.']);
        }

        if (!empty($validated['parent_id']) && Menu::whereKey($validated['parent_id'])->whereNotNull('parent_id')->exists()) {
            throw ValidationException::withMessages(['parent_id' => 'A submenu can only be nested under a top-level menu.']);
        }

        return $validated;
    }
}
