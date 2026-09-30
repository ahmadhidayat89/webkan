<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PageContent;
use App\Services\HtmlAutoTranslator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PageContentController extends Controller
{
    private const SURVEY_PREFIX = 'survey-kepuasan-pelanggan/';

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
            'title' => 'nullable|string|max:150',
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

        if ($request->has('title')) {
            $updateData['title'] = $validated['title'] ?? null;
        }

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

    /**
     * Daftar tahun survei kepuasan pelanggan (public)
     */
    public function surveyYears()
    {
        $years = PageContent::where('page_id', 'like', self::SURVEY_PREFIX . '%')
            ->get(['page_id', 'updated_at'])
            ->map(fn ($c) => [
                'year' => substr($c->page_id, strlen(self::SURVEY_PREFIX)),
                'page_id' => $c->page_id,
                'updated_at' => $c->updated_at,
            ])
            ->sortByDesc('year')
            ->values();

        return response()->json([
            'success' => true,
            'data' => $years,
        ]);
    }

        /**
     * Daftar sub-halaman per kategori Layanan Akreditasi (public)
     * contoh: /layanan-services/laboratorium
     */
    public function subPages(string $category)
    {
        if (!preg_match('/^[a-z0-9-]+$/', $category)) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $prefix = 'layanan/' . $category . '/';

        $items = PageContent::where('page_id', 'like', $prefix . '%')
            ->get(['page_id', 'title', 'updated_at'])
            ->map(function ($c) use ($prefix) {
                $slug = substr($c->page_id, strlen($prefix));
                return [
                    'slug' => $slug,
                    'page_id' => $c->page_id,
                    'title' => $c->title ?: ucwords(str_replace('-', ' ', $slug)),
                    'updated_at' => $c->updated_at,
                ];
            })
            ->filter(fn ($i) => $i['slug'] !== '' && !str_contains($i['slug'], '/'))
            ->sortBy('title')
            ->values();

        return response()->json(['success' => true, 'data' => $items]);
    }

        /**
     * Hapus sub-halaman dinamis (survei tahunan atau sub-halaman layanan)
     */
    public function destroy($pageId)
    {
        $isDynamic = (bool) preg_match(
            '#^(survey-kepuasan-pelanggan/[^/]+|layanan/[^/]+/[^/]+)$#',
            $pageId
        );

        if (!$isDynamic) {
            return response()->json([
                'success' => false,
                'message' => 'Halaman ini tidak dapat dihapus',
            ], 403);
        }

        $content = PageContent::where('page_id', $pageId)->first();

        if ($content) {
            if ($content->image) {
                Storage::disk('public')->delete($content->image);
            }
            $content->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Halaman berhasil dihapus',
        ]);
    }
}