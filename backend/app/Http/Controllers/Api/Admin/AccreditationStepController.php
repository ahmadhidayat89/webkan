<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccreditationStep;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AccreditationStepController extends Controller
{
    /**
     * Public endpoint — tanpa auth, untuk halaman publik.
     */
    public function publicIndex()
    {
        $steps = AccreditationStep::ordered()->get();

        return response()->json([
            'success' => true,
            'data'    => $steps,
        ]);
    }

    /**
     * Admin endpoint — semua langkah, terurut.
     */
    public function index()
    {
        return $this->publicIndex();
    }

    /**
     * Tambah langkah baru. sort_order otomatis = max + 1.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'icon'        => 'required|string|max:20',
            'title'       => 'required|string|max:255',
            'tag'         => 'required|string|max:100',
            'description' => 'required|string',
        ]);

        $validated['sort_order'] = (AccreditationStep::max('sort_order') ?? 0) + 1;

        $step = AccreditationStep::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Langkah berhasil ditambahkan',
            'data'    => $step,
        ], 201);
    }

    /**
     * Update isi langkah (bukan urutan).
     */
    public function update(Request $request, $id)
    {
        $step = AccreditationStep::findOrFail($id);

        $validated = $request->validate([
            'icon'        => 'sometimes|required|string|max:20',
            'title'       => 'sometimes|required|string|max:255',
            'tag'         => 'sometimes|required|string|max:100',
            'description' => 'sometimes|required|string',
        ]);

        $step->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Langkah berhasil diperbarui',
            'data'    => $step,
        ]);
    }

    /**
     * Hapus langkah dan re-normalisasi sort_order sisanya.
     */
    public function destroy($id)
    {
        $step = AccreditationStep::findOrFail($id);

        DB::transaction(function () use ($step) {
            $step->delete();

            // Re-normalisasi urutan (1, 2, 3, ...)
            $remaining = AccreditationStep::ordered()->get();
            foreach ($remaining as $i => $s) {
                $s->sort_order = $i + 1;
                $s->save();
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Langkah berhasil dihapus',
        ]);
    }

    /**
     * Naikkan urutan langkah (tukar sort_order dengan langkah di atasnya).
     */
    public function moveUp($id)
    {
        $step = AccreditationStep::findOrFail($id);

        $prev = AccreditationStep::where('sort_order', '<', $step->sort_order)
            ->orderBy('sort_order', 'desc')
            ->first();

        if (!$prev) {
            return response()->json([
                'success' => false,
                'message' => 'Langkah sudah di posisi paling atas',
            ], 422);
        }

        DB::transaction(function () use ($step, $prev) {
            $tempOrder        = $step->sort_order;
            $step->sort_order = $prev->sort_order;
            $prev->sort_order = $tempOrder;
            $step->save();
            $prev->save();
        });

        return response()->json([
            'success' => true,
            'message' => 'Urutan berhasil dinaikan',
        ]);
    }

    /**
     * Turunkan urutan langkah (tukar sort_order dengan langkah di bawahnya).
     */
    public function moveDown($id)
    {
        $step = AccreditationStep::findOrFail($id);

        $next = AccreditationStep::where('sort_order', '>', $step->sort_order)
            ->orderBy('sort_order')
            ->first();

        if (!$next) {
            return response()->json([
                'success' => false,
                'message' => 'Langkah sudah di posisi paling bawah',
            ], 422);
        }

        DB::transaction(function () use ($step, $next) {
            $tempOrder        = $step->sort_order;
            $step->sort_order = $next->sort_order;
            $next->sort_order = $tempOrder;
            $step->save();
            $next->save();
        });

        return response()->json([
            'success' => true,
            'message' => 'Urutan berhasil diturunkan',
        ]);
    }
}
