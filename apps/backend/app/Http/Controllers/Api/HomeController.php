<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Slider;
use App\Models\QuickLink;
use App\Models\News;
use App\Models\Partner;
use App\Models\Setting;
use App\Models\Faq;
use Illuminate\Support\Facades\Schema;
class HomeController extends Controller
{
    public function index()
    {
        // Get sliders
        $sliders = Slider::active()
            ->ordered()
            ->get()
            ->map(fn($slider) => [
                'id'       => $slider->id,
                'title'    => $slider->title_id,
                'subtitle' => $slider->subtitle_id,
                // Use relative storage path so it works consistently with frontend origin/proxy.
                'image'    => $slider->image ? '/storage/'.$slider->image : null,
                'link'     => $slider->link,
            ]);

        // Get quick links
        $quickLinks = QuickLink::active()
            ->ordered()
            ->get()
            ->map(fn($link) => [
                'id'          => $link->id,
                'title'       => $link->title_id,
                'description' => $link->description_id,
                'icon'        => $link->icon_url,
                'link'        => $link->link,
            ]);

        // Get latest news
        $latestNews = News::published()
            ->latest('published_at')
            ->take(6)
            ->get()
            ->map(fn($news) => [
                'id'           => $news->id,
                'title'        => $news->title_id,
                'excerpt'      => $news->excerpt_id,
                'image'        => $news->image_url,
                'slug'         => $news->slug,
                'category'     => $news->category,
                'published_at' => $news->published_at->format('Y-m-d'),
            ]);

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

        // Get active FAQs for homepage (limited)
        $faqs = collect();

        if (Schema::hasTable('faqs')) {
            $faqQuery = Faq::active()->ordered();

            if (Schema::hasColumn('faqs', 'show_on_home')) {
                $faqQuery->showOnHome();
            }

            $faqs = $faqQuery
                ->take(4)
                ->get()
                ->map(fn ($faq) => [
                    'id' => $faq->id,
                    'question' => $faq->question,
                    'answer' => $faq->answer,
                ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'sliders' => $sliders,
                'quick_links' => $quickLinks,
                'latest_news' => $latestNews,
                'partners' => $partners,
                'faqs' => $faqs,
            ],
        ]);
    }
}
