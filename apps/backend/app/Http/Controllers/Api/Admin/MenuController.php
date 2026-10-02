<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    /**
     * List semua menu (parent dengan children).
     */
    public function index()
    {
        $menus = Menu::whereNull('parent_id')
            ->with(['children' => fn($q) => $q->orderBy('order')])
            ->orderBy('order')
            ->get();

        return response()->json(['success' => true, 'data' => $menus]);
    }

    /**
     * Buat menu baru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title_id'  => 'required|string|max:255',
            'url'       => 'nullable|string|max:500',
            'parent_id' => 'nullable|integer|exists:menus,id',
            'is_active' => 'boolean',
        ]);

        $order = Menu::where('parent_id', $validated['parent_id'] ?? null)->max('order') + 1;

        $menu = Menu::create([
            'title_id'  => $validated['title_id'],
            'url'       => $validated['url'] ?? null,
            'parent_id' => $validated['parent_id'] ?? null,
            'order'     => $order,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json(['success' => true, 'data' => $menu->load('children')], 201);
    }

    /**
     * Update menu.
     */
    public function update(Request $request, $id)
    {
        $menu = Menu::findOrFail($id);

        $validated = $request->validate([
            'title_id'  => 'required|string|max:255',
            'url'       => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        $menu->update([
            'title_id'  => $validated['title_id'],
            'url'       => $validated['url'] ?? $menu->url,
            'is_active' => $validated['is_active'] ?? $menu->is_active,
        ]);

        return response()->json(['success' => true, 'data' => $menu->fresh()]);
    }

    /**
     * Hapus menu (dan children-nya).
     */
    public function destroy($id)
    {
        $menu = Menu::findOrFail($id);

        // Hapus children dulu (cascade via DB juga sudah ada, tapi eksplisit lebih aman)
        Menu::where('parent_id', $id)->delete();
        $menu->delete();

        return response()->json(['success' => true, 'message' => 'Menu berhasil dihapus']);
    }

    /**
     * Toggle is_active.
     */
    public function toggleActive($id)
    {
        $menu = Menu::findOrFail($id);
        $menu->update(['is_active' => !$menu->is_active]);

        return response()->json(['success' => true, 'data' => $menu]);
    }

    /**
     * Pindahkan urutan menu ke atas atau bawah.
     */
    public function reorder(Request $request, $id)
    {
        $validated = $request->validate([
            'direction' => 'required|in:up,down',
        ]);

        $menu    = Menu::findOrFail($id);
        $sibling = Menu::where('parent_id', $menu->parent_id)
            ->where('order', $validated['direction'] === 'up' ? '<' : '>', $menu->order)
            ->orderBy('order', $validated['direction'] === 'up' ? 'desc' : 'asc')
            ->first();

        if ($sibling) {
            [$menu->order, $sibling->order] = [$sibling->order, $menu->order];
            $menu->save();
            $sibling->save();
        }

        return response()->json(['success' => true]);
    }
}
