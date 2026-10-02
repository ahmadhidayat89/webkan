<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\News;
use App\Models\Page;
use Illuminate\Http\Request;

class SitemapController extends Controller
{
    /**
     * Generate sitemap.xml
     */
    public function index()
    {
        $sitemap = '<?xml version="1.0" encoding="UTF-8"?>';
        $sitemap .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        // Homepage
        $sitemap .= $this->generateUrl('https://kan.go.id', now(), 'daily', '1.0');

        // Static pages
        $staticPages = [
            '' => ['priority' => '1.0', 'changefreq' => 'daily'],
            '/tentang-kan' => ['priority' => '0.9', 'changefreq' => 'weekly'],
            '/layanan' => ['priority' => '0.9', 'changefreq' => 'weekly'],
            '/kontak' => ['priority' => '0.8', 'changefreq' => 'monthly'],
            '/visi-misi' => ['priority' => '0.8', 'changefreq' => 'monthly'],
            '/sejarah' => ['priority' => '0.7', 'changefreq' => 'monthly'],
            '/struktur' => ['priority' => '0.7', 'changefreq' => 'monthly'],
            '/anggota' => ['priority' => '0.7', 'changefreq' => 'monthly'],
        ];

        foreach ($staticPages as $url => $config) {
            $sitemap .= $this->generateUrl(
                'https://kan.go.id' . $url,
                now(),
                $config['changefreq'],
                $config['priority']
            );
        }

        // News pages (published only)
        $news = News::published()->orderBy('published_at', 'desc')->get();
        foreach ($news as $item) {
            $sitemap .= $this->generateUrl(
                'https://kan.go.id/berita/' . $item->slug,
                $item->published_at,
                'monthly',
                '0.6'
            );
        }

        // Dynamic pages (published only)
        $pages = Page::published()->get();
        foreach ($pages as $page) {
            $sitemap .= $this->generateUrl(
                'https://kan.go.id/' . $page->slug,
                $page->published_at ?? $page->updated_at,
                'monthly',
                '0.6'
            );
        }

        $sitemap .= '</urlset>';

        return response($sitemap, 200)
            ->header('Content-Type', 'application/xml');
    }

    /**
     * Generate robots.txt
     */
    public function robots()
    {
        $robots = "User-agent: *\n";
        $robots .= "Allow: /\n\n";
        $robots .= "Sitemap: https://kan.go.id/sitemap.xml\n";

        return response($robots, 200)
            ->header('Content-Type', 'text/plain');
    }

    /**
     * Generate URL entry for sitemap
     */
    private function generateUrl($loc, $lastmod, $changefreq, $priority)
    {
        $xml = '<url>';
        $xml .= '<loc>' . htmlspecialchars($loc) . '</loc>';
        $xml .= '<lastmod>' . $lastmod->toAtomString() . '</lastmod>';
        $xml .= '<changefreq>' . $changefreq . '</changefreq>';
        $xml .= '<priority>' . $priority . '</priority>';
        $xml .= '</url>';
        return $xml;
    }
}
