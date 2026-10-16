<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PageController extends Controller
{
    /**
     * Display a listing of pages.
     */
    public function index(Request $request)
    {
        $query = Page::query();

        // Filter by status
        if ($request->has('status')) {
            if ($request->status === 'published') {
                $query->published();
            } elseif ($request->status === 'draft') {
                $query->where('is_published', false);
            }
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function($q) use ($search) {
                $q->where('title_id', 'like', "%{$search}%")
                ->orWhere('title_en', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        if (!in_array($sortBy, ['created_at', 'title_id', 'slug', 'is_published'], true)) {
            $sortBy = 'created_at';
        }
        $sortOrder = $request->get('sort_order', 'desc') === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $pages = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $pages
        ]);
    }

    /**
     * Store a newly created page.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title_id' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'slug' => 'nullable|string|max:255|alpha_dash|unique:pages,slug',
            'content_id' => 'required|string',
            'content_en' => 'nullable|string',
            'meta_title_id' => 'nullable|string|max:255',
            'meta_title_en' => 'nullable|string|max:255',
            'meta_description_id' => 'nullable|string',
            'meta_description_en' => 'nullable|string',
            'is_published' => 'nullable|boolean',
        ]);

        // Generate a route from the title when no explicit slug is provided.
        $validated['slug'] = Str::slug($validated['slug'] ?? $validated['title_id']);

        // Ensure unique slug
        $originalSlug = $validated['slug'];
        $count = 1;
        while (Page::where('slug', $validated['slug'])->exists()) {
            $validated['slug'] = $originalSlug . '-' . $count;
            $count++;
        }

        // Set is_published to true by default if not provided
        if (!isset($validated['is_published'])) {
            $validated['is_published'] = true;
        }

        $page = Page::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Page created successfully',
            'data' => $page
        ], 201);
    }

    /**
     * Display the specified page.
     */
    public function show($id)
    {
        $page = Page::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $page
        ]);
    }

    /**
     * Update the specified page.
     */
    public function update(Request $request, $id)
    {
        $page = Page::findOrFail($id);

        $validated = $request->validate([
            'title_id' => 'sometimes|required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'slug' => ['sometimes', 'required', 'string', 'max:255', 'alpha_dash', \Illuminate\Validation\Rule::unique('pages', 'slug')->ignore($id)],
            'content_id' => 'sometimes|required|string',
            'content_en' => 'nullable|string',
            'meta_title_id' => 'nullable|string|max:255',
            'meta_title_en' => 'nullable|string|max:255',
            'meta_description_id' => 'nullable|string',
            'meta_description_en' => 'nullable|string',
            'is_published' => 'nullable|boolean',
        ]);

        // Regenerate the route only when the title changes and no slug was supplied.
        if (!isset($validated['slug']) && isset($validated['title_id']) && $validated['title_id'] !== $page->title_id) {
            $slug = Str::slug($validated['title_id']);
            $originalSlug = $slug;
            $count = 1;
            while (Page::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                $slug = $originalSlug . '-' . $count;
                $count++;
            }
            $validated['slug'] = $slug;
        }

        $page->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Page updated successfully',
            'data' => $page
        ]);
    }

    /**
     * Remove the specified page.
     */
    public function destroy($id)
    {
        $page = Page::findOrFail($id);
        $page->delete();

        return response()->json([
            'success' => true,
            'message' => 'Page deleted successfully'
        ]);
    }

    /**
     * Toggle publish status.
     */
    public function togglePublish($id)
    {
        $page = Page::findOrFail($id);

        $page->is_published = !$page->is_published;
        $message = $page->is_published ? 'Page published successfully' : 'Page unpublished successfully';

        $page->save();

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $page
        ]);
    }
}
