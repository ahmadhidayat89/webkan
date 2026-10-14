<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class DocumentController extends Controller
{
    private const LINK_REQUIRED_MESSAGE = 'Link wajib diisi untuk tipe dokumen.';
    private const NOT_FOUND_MESSAGE = 'Data tidak ditemukan.';

    /**
     * Menampilkan semua kategori, subkategori, dan dokumen.
     */
    public function index(): JsonResponse
    {
        $documents = Document::with('parent')
            ->orderByRaw('parent_id IS NOT NULL')
            ->orderBy('parent_id')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Data dokumen berhasil diambil.',
            'data' => $documents,
        ]);
    }

    /**
     * Menyimpan kategori, subkategori, atau dokumen baru.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'parent_id' => [
                'nullable',
                'integer',
                'exists:documents,id',
            ],
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'slug' => [
                'nullable',
                'string',
                'max:255',
            ],
            'description' => [
                'nullable',
                'string',
            ],
            'type' => [
                'required',
                Rule::in(['category', 'document']),
            ],
            'file_type' => [
                'nullable',
                'string',
                'max:100',
            ],
            'language' => [
                'nullable',
                'string',
                'max:100',
            ],
            'link' => [
                'nullable',
                'url',
                'max:2048',
            ],
            'sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],
            'is_active' => [
                'nullable',
                'boolean',
            ],
        ]);

        /*
         * Jika memiliki parent, parent harus berupa category.
         */
        if (!empty($validated['parent_id'])) {
            $parent = Document::find($validated['parent_id']);

            if (!$parent || $parent->type !== 'category') {
                return response()->json([
                    'success' => false,
                    'message' => 'Parent harus berupa kategori.',
                ], 422);
            }
        }

        /*
         * Dokumen wajib memiliki link.
         */
        if ($validated['type'] === 'document' && empty($validated['link'])) {
            return response()->json([
                'success' => false,
                'message' => self::LINK_REQUIRED_MESSAGE,
                'errors' => [
                    'link' => [self::LINK_REQUIRED_MESSAGE],
                ],
            ], 422);
        }

        /*
         * Kategori tidak membutuhkan field dokumen.
         */
        if ($validated['type'] === 'category') {
            $validated['file_type'] = null;
            $validated['language'] = null;
            $validated['link'] = null;
        }

        /*
         * Rapikan slug.
         */
        $validated['slug'] = !empty($validated['slug'])
            ? Str::slug($validated['slug'])
            : Str::slug($validated['name']);

        /*
         * Rapikan link.
         */
        if (!empty($validated['link'])) {
            $validated['link'] = $this->normalizeUrl($validated['link']);
        }

        $validated['sort_order'] = $validated['sort_order'] ?? 0;
        $validated['is_active'] = $validated['is_active'] ?? true;

        $document = Document::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil ditambahkan.',
            'data' => $document->load('parent'),
        ], 201);
    }

    /**
     * Menampilkan satu data.
     */
    public function show(string $id): JsonResponse
    {
        $document = Document::with(['parent', 'children'])
            ->find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => self::NOT_FOUND_MESSAGE,
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil diambil.',
            'data' => $document,
        ]);
    }

    /**
     * Mengubah data kategori, subkategori, atau dokumen.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $document = Document::find($id);
        if (!$document) {
            return response()->json(['success' => false, 'message' => self::NOT_FOUND_MESSAGE], 404);
        }

        $validated = $request->validate($this->updateRules());
        $validationError = $this->validateDocumentUpdate($document, $validated);
        if ($validationError) {
            return $validationError;
        }

        $this->prepareDocumentUpdateFields($document, $validated);
        $document->update($validated);
        return response()->json([
            'success' => true,
            'message' => 'Data berhasil diperbarui.',
            'data' => $document->fresh()->load('parent'),
        ]);
    }

    private function updateRules(): array
    {
        return [
            'parent_id' => ['nullable', 'integer', 'exists:documents,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['sometimes', 'required', Rule::in(['category', 'document'])],
            'file_type' => ['nullable', 'string', 'max:100'],
            'language' => ['nullable', 'string', 'max:100'],
            'link' => ['nullable', 'url', 'max:2048'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    private function validateDocumentUpdate(Document $document, array $validated)
    {
        return $this->validateParentChange($document, $validated)
            ?? $this->validateCategoryConversion($document, $validated)
            ?? $this->validateRequiredLink($document, $validated);
    }

    private function validateParentChange(Document $document, array $validated)
    {
        $message = null;
        if (array_key_exists('parent_id', $validated) && $validated['parent_id'] !== null) {
            if ((int) $validated['parent_id'] === (int) $document->id) {
                $message = 'Data tidak dapat menjadi parent untuk dirinya sendiri.';
            } else {
                $parent = Document::find($validated['parent_id']);
                if (!$parent || $parent->type !== 'category') {
                    $message = 'Parent harus berupa kategori.';
                } elseif ($this->isDescendant($parent, $document)) {
                    $message = 'Data tidak dapat dipindahkan ke salah satu turunannya sendiri.';
                }
            }
        }

        return $message === null
            ? null
            : response()->json(['success' => false, 'message' => $message], 422);
    }

    private function validateCategoryConversion(Document $document, array $validated)
    {
        $newType = $validated['type'] ?? $document->type;
        if ($document->type === 'category' && $newType === 'document' && $document->children()->exists()) {
            return response()->json(['success' => false, 'message' => 'Kategori yang masih memiliki isi tidak dapat diubah menjadi dokumen.'], 422);
        }
        return null;
    }

    private function validateRequiredLink(Document $document, array $validated)
    {
        $newType = $validated['type'] ?? $document->type;
        $newLink = array_key_exists('link', $validated) ? $validated['link'] : $document->link;
        if ($newType === 'document' && empty($newLink)) {
            return response()->json([
                'success' => false,
                'message' => self::LINK_REQUIRED_MESSAGE,
                'errors' => ['link' => [self::LINK_REQUIRED_MESSAGE]],
            ], 422);
        }
        return null;
    }

    private function prepareDocumentUpdateFields(Document $document, array &$validated): void
    {
        $newType = $validated['type'] ?? $document->type;
        if ($newType === 'category') {
            $validated['file_type'] = null;
            $validated['language'] = null;
            $validated['link'] = null;
        } elseif (!empty($validated['link'])) {
            $validated['link'] = $this->normalizeUrl($validated['link']);
        }

        if (array_key_exists('slug', $validated)) {
            $validated['slug'] = !empty($validated['slug'])
                ? Str::slug($validated['slug'])
                : Str::slug($validated['name'] ?? $document->name);
        } elseif (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }
    }

    /**
     * Menghapus data.
     */
    public function destroy(string $id): JsonResponse
    {
        $document = Document::find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => self::NOT_FOUND_MESSAGE,
            ], 404);
        }

        /*
         * Root category tidak boleh dihapus.
         */
        if ($document->parent_id === null) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori utama tidak dapat dihapus.',
            ], 422);
        }

        /*
         * Kategori yang masih memiliki children tidak boleh dihapus.
         */
        if ($document->type === 'category' && $document->children()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori yang masih memiliki isi tidak dapat dihapus.',
            ], 422);
        }

        $document->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil dihapus.',
        ]);
    }

    /**
     * Memastikan parent bukan merupakan keturunan dari document.
     */
    private function isDescendant(Document $parent, Document $document): bool
    {
        $current = $parent;

        while ($current->parent_id !== null) {
            if ((int) $current->parent_id === (int) $document->id) {
                return true;
            }

            $current = Document::find($current->parent_id);

            if (!$current) {
                break;
            }
        }

        return false;
    }

    /**
     * Menambahkan https:// jika URL belum memiliki protocol.
     */
    private function normalizeUrl(string $url): string
    {
        $url = trim($url);

        if (!preg_match('/^https?:\/\//i', $url)) {
            $url = 'https://' . $url;
        }

        return $url;
    }
}
