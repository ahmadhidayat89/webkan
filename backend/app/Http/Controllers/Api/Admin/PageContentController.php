<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PageContent;
use App\Services\HtmlAutoTranslator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PageContentController extends Controller
{
    public function __construct(private readonly HtmlAutoTranslator $translator)
    {
    }

    /**
     * Get all page contents
     */
    public function index()
    {
        $contents = PageContent::all();

        return response()->json([
            'success' => true,
            'data' => $contents
        ]);
    }

    /**
     * Get specific page content
     */
    public function getByPageId(Request $request, $pageId)
    {
        $content = PageContent::where('page_id', $pageId)->first();
        $lang = strtolower((string) $request->query('lang', 'id'));

        // Auto-generate English content from Indonesian when EN requested.
        if (
            $content &&
            str_starts_with($lang, 'en') &&
            !empty($content->content_id) &&
            empty($content->content_en)
        ) {
            $translated = $this->translator->translateHtml($content->content_id, 'id', 'en');
            if (!empty($translated)) {
                $content->content_en = $translated;
                $content->save();
            }
        }

        return response()->json([
            'success' => true,
            'data' => $content
        ]);
    }

    /**
     * Save or update page content
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'page_id' => 'required|string|max:100',
            'content_id' => 'required|string',
            'content_en' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
        ]);

        $existing = PageContent::where('page_id', $validated['page_id'])->first();

        $updateData = [
            'content_id' => $validated['content_id'],
            // If Indonesian content changes, reset cached translation.
            'content_en' => (
                $request->has('content_en')
                    ? ($validated['content_en'] ?? null)
                    : (($existing && $existing->content_id === $validated['content_id']) ? $existing->content_en : null)
            ),
        ];

        if ($request->hasFile('image')) {
            // Delete old image if exists
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
            'message' => 'Content saved successfully',
            'data' => $content
        ]);
    }
}
