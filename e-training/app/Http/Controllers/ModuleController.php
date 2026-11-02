<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Models\Course;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ModuleController extends Controller
{
    public function store(Request $request, Course $course): RedirectResponse
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $maxOrder = $course->modules()->max('sort_order') ?? 0;

        $course->modules()->create([
            'title'       => $request->title,
            'description' => $request->description,
            'sort_order'  => $maxOrder + 1,
        ]);

        return back()->with('success', 'Modul berhasil ditambahkan.');
    }

    public function update(Request $request, Module $module): RedirectResponse
    {
        $request->validate([
            'title'        => 'sometimes|required|string|max:255',
            'description'  => 'nullable|string',
            'is_published' => 'boolean',
            'requires_completion' => 'sometimes|boolean',
            'start_at'     => 'nullable|date',
            'end_at'       => [
                'nullable',
                'date',
                Rule::when($request->filled('start_at'), ['after:start_at']),
            ],
        ], [
            'end_at.after' => 'Waktu selesai harus setelah waktu mulai.',
        ]);

        $module->update($request->only([
            'title',
            'description',
            'is_published',
            'requires_completion',
            'start_at',
            'end_at',
        ]));

        return back()->with('success', 'Modul berhasil diperbarui.');
    }

    public function destroy(Module $module): RedirectResponse
    {
        $module->delete();
        return back()->with('success', 'Modul berhasil dihapus.');
    }

    /**
     * Reorder modul: terima array of { id, sort_order }
     */
    public function reorder(Request $request): RedirectResponse
    {
        $request->validate([
            'modules'             => 'required|array',
            'modules.*.id'        => 'required|exists:modules,id',
            'modules.*.sort_order' => 'required|integer',
        ]);

        foreach ($request->modules as $item) {
            Module::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return back()->with('success', 'Urutan modul disimpan.');
    }
}
