<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PageContent;
use App\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PageContentController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => PageContent::all(),
        ]);
    }

    public function getByPageId($pageId)
    {
        $content = PageContent::where('page_id', $pageId)->first();

        // Fallback ke tabel pages jika page_contents kosong
        if (!$content) {
            $page = Page::published()->where('slug', $pageId)->first();
            if ($page) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'page_id'    => $pageId,
                        'content_id' => $page->content_id,
                        'image'      => null,
                    ],
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $content,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'page_id'    => 'required|string|max:100',
            'content_id' => 'nullable|string',
            'image'      => 'nullable|image|max:2048',
            'remove_image' => 'nullable|boolean',
        ]);

        $existing = PageContent::where('page_id', $validated['page_id'])->first();

        // Keep previous content when request only updates image.
        $updateData = [
            'content_id' => $request->has('content_id')
                ? ($validated['content_id'] ?? '')
                : ($existing->content_id ?? ''),
        ];

        if ($request->hasFile('image')) {
            if ($existing && $existing->image) {
                Storage::disk('public')->delete($existing->image);
            }
            $updateData['image'] = $request->file('image')->store('page-contents', 'public');
        } elseif ($request->input('remove_image')) {
            if ($existing && $existing->image) {
                Storage::disk('public')->delete($existing->image);
            }
            $updateData['image'] = null;
        }

        $content = PageContent::updateOrCreate(
            ['page_id' => $validated['page_id']],
            $updateData
        );

        return response()->json([
            'success' => true,
            'message' => 'Konten berhasil disimpan',
            'data'    => $content,
        ]);
    }
}
