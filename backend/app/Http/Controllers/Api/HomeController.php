<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Slider;
use App\Models\QuickLink;
use App\Models\News;
use App\Models\Partner;
use App\Models\Setting;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    /**
     * Get homepage data.
     */
    public function index(Request $request)
    {
        $lang = $request->get('lang', 'id');

        // Get sliders
        $sliders = Slider::active()
            ->ordered()
            ->get()
            ->map(function ($slider) use ($lang) {
                return [
                    'id' => $slider->id,
                    'title' => $lang === 'en' && $slider->title_en ? $slider->title_en : $slider->title_id,
                    'subtitle' => $lang === 'en' && $slider->subtitle_en ? $slider->subtitle_en : $slider->subtitle_id,
                    'image' => $slider->image_url,
                    'link' => $slider->link,
                ];
            });

        // Get quick links
        $quickLinks = QuickLink::active()
            ->ordered()
            ->get()
            ->map(function ($link) use ($lang) {
                return [
                    'id' => $link->id,
                    'title' => $lang === 'en' && $link->title_en ? $link->title_en : $link->title_id,
                    'description' => $lang === 'en' && $link->description_en ? $link->description_en : $link->description_id,
                    'icon' => $link->icon_url,
                    'link' => $link->link,
                ];
            });

        // Get latest news
        $latestNews = News::published()
            ->latest('published_at')
            ->take(6)
            ->get()
            ->map(function ($news) use ($lang) {
                return [
                    'id' => $news->id,
                    'title' => $lang === 'en' && $news->title_en ? $news->title_en : $news->title_id,
                    'excerpt' => $lang === 'en' && $news->excerpt_en ? $news->excerpt_en : $news->excerpt_id,
                    'image' => $news->image_url,
                    'slug' => $news->slug,
                    'category' => $news->category,
                    'published_at' => $news->published_at->format('Y-m-d'),
                ];
            });

        // Get partners
        $partners = Partner::active()
            ->ordered()
            ->get()
            ->map(function ($partner) {
                return [
                    'id' => $partner->id,
                    'name' => $partner->name,
                    'logo' => $partner->logo_url,
                    'url' => $partner->url,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'sliders' => $sliders,
                'quick_links' => $quickLinks,
                'latest_news' => $latestNews,
                'partners' => $partners,
            ],
        ]);
    }
}