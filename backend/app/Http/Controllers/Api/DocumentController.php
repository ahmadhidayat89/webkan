<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\JsonResponse;

class DocumentController extends Controller
{
    public function index(): JsonResponse
    {
        $documents = $this->getTree();

        return response()->json([
            'success' => true,
            'message' => 'Data dokumen berhasil diambil.',
            'data' => $documents,
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $document = Document::where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Dokumen atau kategori tidak ditemukan.',
            ], 404);
        }

        $document->load('children');

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil diambil.',
            'data' => $document,
        ]);
    }

    private function getTree($parentId = null)
    {
        return Document::where('parent_id', $parentId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(function ($document) {
                $document->children = $this->getTree($document->id);

                return $document;
            })
            ->values();
    }
}
