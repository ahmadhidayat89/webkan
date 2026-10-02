<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\News;
use App\Models\Page;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function index(Request $request)
    {
        $q = trim($request->get('q', ''));

        if (strlen($q) < 2) {
            return response()->json([
                'success' => true,
                'query'   => $q,
                'total'   => 0,
                'data'    => ['news' => [], 'pages' => []],
            ]);
        }

        $qLower = strtolower($q);

        $news = News::published()
            ->where(function ($query) use ($qLower) {
                $query->whereRaw('LOWER(title_id) LIKE ?', ["%{$qLower}%"])
                      ->orWhereRaw('LOWER(excerpt_id) LIKE ?', ["%{$qLower}%"]);
            })
            ->latest('published_at')
            ->take(10)
            ->get()
            ->map(fn($item) => [
                'id'           => $item->id,
                'type'         => 'news',
                'title'        => $item->title_id,
                'excerpt'      => $item->excerpt_id,
                'slug'         => $item->slug,
                'category'     => $item->category,
                'image'        => $item->image_url,
                'published_at' => $item->published_at?->format('Y-m-d'),
                'url'          => '/berita/' . $item->slug,
            ]);

        $pages = Page::published()
            ->where(function ($query) use ($qLower) {
                $query->whereRaw('LOWER(title_id) LIKE ?', ["%{$qLower}%"])
                      ->orWhereRaw('LOWER(meta_description_id) LIKE ?', ["%{$qLower}%"]);
            })
            ->take(10)
            ->get()
            ->map(fn($item) => [
                'id'      => $item->id,
                'type'    => 'page',
                'title'   => $item->title_id,
                'excerpt' => $item->meta_description_id,
                'slug'    => $item->slug,
                'url'     => '/' . $item->slug,
            ]);

        return response()->json([
            'success' => true,
            'query'   => $q,
            'total'   => $news->count() + $pages->count(),
            'data'    => [
                'news'  => $news,
                'pages' => $pages,
            ],
        ]);
    }
}
