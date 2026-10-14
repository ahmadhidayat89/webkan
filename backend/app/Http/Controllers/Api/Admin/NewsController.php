<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\News;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class NewsController extends Controller
{
    /**
     * Display a listing of news.
     */
    public function index(Request $request)
    {
        $query = News::with('creator:id,name');

        // Filter by category
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Filter by status
        if ($request->has('status')) {
            if ($request->status === 'published') {
                $query->published();
            } elseif ($request->status === 'draft') {
                $query->where('published_at', null);
            }
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('excerpt', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        // Sort
        $sortBy = $request->get('sort_by', 'published_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginate
        $perPage = $request->get('per_page', 15);
        $news = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $news
        ]);
    }

    /**
     * Store a newly created news.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'excerpt' => 'nullable|string',
            'excerpt_en' => 'nullable|string',
            'content' => 'required|string',
            'content_en' => 'nullable|string',
            'category' => 'required|in:news,announcement',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'published_at' => 'nullable|date',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'meta_keywords' => 'nullable|string',
        ]);

        // Map frontend field names to model field names
        $data = [
            'title_id'      => $request->input('title'),
            'title_en'      => $request->input('title_en'),
            'excerpt_id'    => $request->input('excerpt'),
            'excerpt_en'    => $request->input('excerpt_en'),
            'content_id'    => $request->input('content'),
            'content_en'    => $request->input('content_en'),
            'category'      => $request->input('category'),
            'published_at'  => $request->input('published_at') ?: null,
            'is_published'  => !empty($request->input('published_at')),
            'meta_title'    => $request->input('meta_title'),
            'meta_description' => $request->input('meta_description'),
            'meta_keywords' => $request->input('meta_keywords'),
            'created_by'    => auth()->id(),
        ];

        // Handle image upload
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('news', 'public');
        }

        // Auto-generate unique slug from title
        $slug = Str::slug($data['title_id']);
        $originalSlug = $slug;
        $count = 1;
        while (News::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $count;
            $count++;
        }
        $data['slug'] = $slug;

        $news = News::create($data);

        return response()->json([
            'success' => true,
            'message' => 'News created successfully',
            'data' => $news->load('creator:id,name')
        ], 201);
    }

    /**
     * Display the specified news.
     */
    public function show($id)
    {
        $news = News::with('creator:id,name')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $news
        ]);
    }

    /**
     * Update the specified news.
     */
    public function update(Request $request, $id)
    {
        $news = News::findOrFail($id);

        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'excerpt' => 'nullable|string',
            'excerpt_en' => 'nullable|string',
            'content' => 'sometimes|required|string',
            'content_en' => 'nullable|string',
            'category' => 'sometimes|required|in:news,announcement',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'published_at' => 'nullable|date',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'meta_keywords' => 'nullable|string',
        ]);

        $data = $this->mapUpdateFields($request);

        // Handle image upload
        $this->replaceImageIfUploaded($request, $news, $data);

        // Update slug if title_id changed
        if (isset($data['title_id']) && $data['title_id'] !== $news->title_id) {
            $data['slug'] = $this->uniqueSlug($data['title_id'], (int) $id);
        }

        $news->update($data);

        return response()->json([
            'success' => true,
            'message' => 'News updated successfully',
            'data' => $news->load('creator:id,name')
        ]);
    }

    private function mapUpdateFields(Request $request): array
    {
        $fieldMap = [
            'title' => 'title_id',
            'title_en' => 'title_en',
            'excerpt' => 'excerpt_id',
            'excerpt_en' => 'excerpt_en',
            'content' => 'content_id',
            'content_en' => 'content_en',
            'category' => 'category',
            'published_at' => 'published_at',
            'meta_title' => 'meta_title',
            'meta_description' => 'meta_description',
            'meta_keywords' => 'meta_keywords',
        ];

        $data = [];
        foreach ($fieldMap as $input => $column) {
            if ($request->has($input)) {
                $value = $request->input($input);
                $data[$column] = $input === 'published_at' && !$value ? null : $value;
            }
        }

        return $data;
    }

    private function replaceImageIfUploaded(Request $request, News $news, array &$data): void
    {
        if (!$request->hasFile('image')) {
            return;
        }

        if ($news->image) {
            Storage::disk('public')->delete($news->image);
        }

        $data['image'] = $request->file('image')->store('news', 'public');
    }

    private function uniqueSlug(string $title, ?int $exceptId = null): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $suffix = 1;

        while (News::where('slug', $slug)->when($exceptId, fn ($query) => $query->where('id', '!=', $exceptId))->exists()) {
            $slug = $base . '-' . $suffix++;
        }

        return $slug;
    }

    /**
     * Remove the specified news.
     */
    public function destroy($id)
    {
        $news = News::findOrFail($id);

        // Delete image if exists
        if ($news->image) {
            Storage::disk('public')->delete($news->image);
        }

        $news->delete();

        return response()->json([
            'success' => true,
            'message' => 'News deleted successfully'
        ]);
    }

    /**
     * Bulk delete news.
     */
    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:news,id'
        ]);

        $news = News::whereIn('id', $validated['ids'])->get();

        foreach ($news as $item) {
            if ($item->image) {
                Storage::disk('public')->delete($item->image);
            }
            $item->delete();
        }

        return response()->json([
            'success' => true,
            'message' => count($validated['ids']) . ' news deleted successfully'
        ]);
    }

    /**
     * Publish/unpublish news.
     */
    public function togglePublish($id)
    {
        $news = News::findOrFail($id);

        if ($news->published_at) {
            $news->published_at = null;
            $news->is_published = false;
            $message = 'News unpublished successfully';
        } else {
            $news->published_at = now();
            $news->is_published = true;
            $message = 'News published successfully';
        }

        $news->save();

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $news
        ]);
    }
}
