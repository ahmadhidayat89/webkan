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
            ->map(fn ($slider) => $this->formatSlider($slider, $lang));

        // Get quick links
        $quickLinks = QuickLink::active()
            ->ordered()
            ->get()
            ->map(fn ($link) => $this->formatQuickLink($link, $lang));

        // Get latest news
        $latestNews = News::published()
            ->latest('published_at')
            ->take(6)
            ->get()
            ->map(fn ($news) => $this->formatNews($news, $lang));

        // Get partners
        $partners = Partner::active()
            ->ordered()
            ->get()
            ->map(fn ($partner) => [
                'id' => $partner->id,
                'name' => $partner->name,
                'logo' => $partner->logo_url,
                'url' => $partner->url,
            ]);

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

    private function localized(string $language, ?string $translation, ?string $original): ?string
    {
        return $language === 'en' && $translation ? $translation : $original;
    }

    private function formatSlider(Slider $slider, string $language): array
    {
        return [
            'id' => $slider->id,
            'title' => $this->localized($language, $slider->title_en, $slider->title_id),
            'subtitle' => $this->localized($language, $slider->subtitle_en, $slider->subtitle_id),
            'image' => $slider->image_url,
            'link' => $slider->link,
        ];
    }

    private function formatQuickLink(QuickLink $link, string $language): array
    {
        return [
            'id' => $link->id,
            'title' => $this->localized($language, $link->title_en, $link->title_id),
            'description' => $this->localized($language, $link->description_en, $link->description_id),
            'icon' => $link->icon_url,
            'link' => $link->link,
        ];
    }

    private function formatNews(News $news, string $language): array
    {
        return [
            'id' => $news->id,
            'title' => $this->localized($language, $news->title_en, $news->title_id),
            'excerpt' => $this->localized($language, $news->excerpt_en, $news->excerpt_id),
            'image' => $news->image_url,
            'slug' => $news->slug,
            'category' => $news->category,
            'published_at' => $news->published_at->format('Y-m-d'),
        ];
    }
}
