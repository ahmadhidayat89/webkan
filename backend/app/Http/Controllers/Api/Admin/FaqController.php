<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    /**
     * Daftar semua FAQ (admin)
     */
    public function index()
    {
        $faqs = Faq::orderBy('order')->orderBy('id')->get();

        return response()->json([
            'success' => true,
            'data' => $faqs,
        ]);
    }

    /**
     * Tambah FAQ baru
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'question' => 'required|string|max:500',
            'answer' => 'required|string',
            'order' => 'sometimes|nullable|integer|min:0',
            'is_active' => 'sometimes|boolean',
            'show_on_home' => 'sometimes|boolean',
        ]);

        $faq = Faq::create([
            'question' => $validated['question'],
            'answer' => $validated['answer'],
            'order' => $validated['order'] ?? ((Faq::max('order') ?? 0) + 1),
            'is_active' => $validated['is_active'] ?? true,
            'show_on_home' => $validated['show_on_home'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'FAQ berhasil ditambahkan',
            'data' => $faq,
        ], 201);
    }

    /**
     * Ubah FAQ
     */
    public function update(Request $request, $id)
    {
        $faq = Faq::findOrFail($id);

        $validated = $request->validate([
            'question' => 'required|string|max:500',
            'answer' => 'required|string',
            'order' => 'sometimes|nullable|integer|min:0',
            'is_active' => 'sometimes|boolean',
            'show_on_home' => 'sometimes|boolean',
        ]);

        // Jika order dikirim kosong (null), biarkan nilai lama
        if (array_key_exists('order', $validated) && $validated['order'] === null) {
            unset($validated['order']);
        }

        $faq->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'FAQ berhasil diperbarui',
            'data' => $faq,
        ]);
    }

    /**
     * Hapus FAQ
     */
    public function destroy($id)
    {
        $faq = Faq::findOrFail($id);
        $faq->delete();

        return response()->json([
            'success' => true,
            'message' => 'FAQ berhasil dihapus',
        ]);
    }

    /**
     * Atur ulang urutan FAQ
     */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'faqs' => 'required|array',
            'faqs.*.id' => 'required|integer|exists:faqs,id',
            'faqs.*.order' => 'required|integer',
        ]);

        foreach ($validated['faqs'] as $item) {
            Faq::where('id', $item['id'])->update(['order' => $item['order']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Urutan FAQ berhasil disimpan',
        ]);
    }

    /**
     * Aktifkan / nonaktifkan FAQ
     */
    public function toggleActive($id)
    {
        $faq = Faq::findOrFail($id);
        $faq->update(['is_active' => ! $faq->is_active]);

        return response()->json([
            'success' => true,
            'message' => $faq->is_active ? 'FAQ diaktifkan' : 'FAQ dinonaktifkan',
            'data' => $faq,
        ]);
    }

    /**
     * Tampilkan / sembunyikan di beranda
     */
    public function toggleShowHome($id)
    {
        $faq = Faq::findOrFail($id);
        $faq->update(['show_on_home' => ! $faq->show_on_home]);

        return response()->json([
            'success' => true,
            'message' => $faq->show_on_home ? 'FAQ ditampilkan di beranda' : 'FAQ disembunyikan dari beranda',
            'data' => $faq,
        ]);
    }
}
