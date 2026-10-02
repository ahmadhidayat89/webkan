<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\News;
use Illuminate\Http\Request;

class NewsController extends Controller
{
    /**
     * Get list of published news (public).
     */
    public function index(Request $request)
    {
        $query = News::published()->latest('published_at');

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        $perPage = $request->get('per_page', 12);
        $news = $query->paginate($perPage);

        $news->getCollection()->transform(function ($item) {
            return $this->formatNews($item);
        });

        return response()->json([
            'success' => true,
            'data' => $news,
        ]);
    }

    /**
     * Get single published news by slug (public).
     */
    public function show($slug)
    {
        $news = News::published()->where('slug', $slug)->firstOrFail();

        // Related news: same category, exclude current
        $related = News::published()
            ->where('category', $news->category)
            ->where('id', '!=', $news->id)
            ->latest('published_at')
            ->take(3)
            ->get()
            ->map(fn($item) => $this->formatNews($item));

        return response()->json([
            'success' => true,
            'data' => $this->formatNews($news, full: true),
            'related' => $related,
        ]);
    }

    private function formatNews(News $news, bool $full = false): array
    {
        $data = [
            'id'           => $news->id,
            'title'        => $news->title_id,
            'excerpt'      => $news->excerpt_id,
            'slug'         => $news->slug,
            'category'     => $news->category,
            'image'        => $news->image_url,
            'published_at' => $news->published_at?->format('Y-m-d'),
            'created_at'   => $news->created_at?->toISOString(),
            'created_by'   => $news->created_by,
        ];

        if ($full) {
            $data['content'] = $news->content_id;
        }

        return $data;
    }
}
