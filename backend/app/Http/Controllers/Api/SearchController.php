<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use App\Models\News;
use App\Models\PageContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class SearchController extends Controller
{
    /**
     * Judul halaman statis yang tidak memiliki kolom title tersendiri.
     */
    private const STATIC_PAGE_TITLES = [
        'tentang-kan' => 'Profil KAN',
        'sejarah-fungsi' => 'Sejarah dan Fungsi KAN',
        'struktur-organisasi' => 'Struktur Organisasi',
        'ketidakberpihakan' => 'Ketidakberpihakan',
        'pengakuan-internasional' => 'Pengakuan Internasional',
        'anggota-kan' => 'Anggota KAN',
        'maklumat-layanan' => 'Maklumat Layanan',
        'standar-layanan' => 'Standar Layanan Akreditasi',
        'proses-akreditasi' => 'Proses Akreditasi',
        'tarif-akreditasi' => 'Tarif Akreditasi',
        'penanganan-komplain' => 'Penanganan Komplain',
        'penanganan-banding' => 'Penanganan Banding',
        'survey-kepuasan-pelanggan' => 'Survey Kepuasan Pelanggan',
        'layanan-akreditasi' => 'Layanan Akreditasi',

        'layanan/laboratorium' => 'Laboratorium',
        'layanan/lembaga-inspeksi' => 'Lembaga Inspeksi',
        'layanan/lembaga-verifikasi-validasi-grk' =>
            'Lembaga Verifikasi dan/atau Validasi Gas Rumah Kaca',
        'layanan/penyelenggara-uji-profisiensi' =>
            'Penyelenggara Uji Profisiensi',
        'layanan/produsen-bahan-acuan' =>
            'Produsen Bahan Acuan',
        'layanan/sistem-manajemen' =>
            'Sistem Manajemen',
        'layanan/sertifikasi-person' =>
            'Sertifikasi Person',
        'layanan/sertifikasi-sni-iso-iec-17065' =>
            'Sertifikasi Berdasarkan SNI ISO/IEC 17065',
        'layanan/sertifikasi-pembangunan-berkelanjutan' =>
            'Sertifikasi Pembangunan Berkelanjutan',

        'unduh/dokumen-akreditasi' =>
            'Dokumen Akreditasi',
        'unduh/materi-kegiatan' =>
            'Materi Kegiatan',
        'unduh/artikel-penilaian-kesesuaian' =>
            'Artikel Penilaian Kesesuaian',
        'unduh/dokumen-internasional' =>
            'Dokumen Internasional',
    ];

    /**
     * Pencarian utama.
     */
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json([
                'success' => true,
                'data' => [
                    'news' => [],
                    'pages' => [],
                    'faqs' => [],
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'news' => $this->searchNews($q),
                'pages' => $this->searchPages($q),
                'faqs' => $this->searchFaqs($q),
            ],
        ]);
    }

    /**
     * Pencarian berita.
     */
    private function searchNews(string $q): array
    {
        try {
            $query = News::query()
                ->where(function ($query) use ($q) {
                    $query->where('title_id', 'ilike', "%{$q}%")
                        ->orWhere('title_en', 'ilike', "%{$q}%")
                        ->orWhere('excerpt_id', 'ilike', "%{$q}%")
                        ->orWhere('excerpt_en', 'ilike', "%{$q}%");
                });

            if (Schema::hasColumn('news', 'is_published')) {
                $query->where('is_published', true);
            }

            $items = $query
                ->orderByDesc('id')
                ->limit(5)
                ->get();
        } catch (\Throwable $e) {
            return [];
        }

        return $items->map(function ($news) use ($q) {
            return [
                'title' => $news->title_id,
                'url' => '/berita/' . $news->slug,
                'snippet' => $this->makeSnippet(
                    $news->excerpt_id ?? $news->title_id,
                    $q
                ),
            ];
        })->all();
    }

    /**
     * Pencarian halaman.
     */
    private function searchPages(string $q): array
    {
        try {
            $items = PageContent::query()
                ->where(function ($query) use ($q) {
                    $query->where('content_id', 'ilike', "%{$q}%")
                        ->orWhere('title', 'ilike', "%{$q}%");
                })
                ->limit(8)
                ->get();
        } catch (\Throwable $e) {
            return [];
        }

        return $items->map(function ($content) use ($q) {
            $pageId = $content->page_id;

            $title = $content->title
                ?: (
                    self::STATIC_PAGE_TITLES[$pageId]
                    ?? ucwords(
                        str_replace(
                            '-',
                            ' ',
                            basename($pageId)
                        )
                    )
                );

            return [
                'title' => $title,
                'url' => '/' . $pageId,
                'snippet' => $this->makeSnippet(
                    strip_tags($content->content_id ?? ''),
                    $q
                ),
            ];
        })->all();
    }

    /**
     * Pencarian FAQ.
     */
    private function searchFaqs(string $q): array
    {
        try {
            $items = Faq::query()
                ->where(function ($query) use ($q) {
                    $query->where('question', 'ilike', "%{$q}%")
                        ->orWhere('answer', 'ilike', "%{$q}%");
                })
                ->limit(5)
                ->get();
        } catch (\Throwable $e) {
            return [];
        }

        return $items->map(function ($faq) use ($q) {
            return [
                'title' => $faq->question,
                'url' => '/#faq',
                'snippet' => $this->makeSnippet(
                    strip_tags($faq->answer ?? ''),
                    $q
                ),
            ];
        })->all();
    }

    /**
     * Membuat cuplikan teks di sekitar kata pencarian.
     */
    private function makeSnippet(
        string $text,
        string $q,
        int $length = 160
    ): string {
        $text = trim(
            preg_replace('/\s+/', ' ', $text)
        );

        if ($text === '') {
            return '';
        }

        $position = mb_stripos($text, $q);

        if ($position === false) {
            return mb_substr($text, 0, $length)
                . (mb_strlen($text) > $length ? '…' : '');
        }

        $start = max(0, $position - 40);

        $snippet = mb_substr(
            $text,
            $start,
            $length
        );

        $prefix = $start > 0 ? '…' : '';

        $suffix = mb_strlen($text) > ($start + $length)
            ? '…'
            : '';

        return $prefix . $snippet . $suffix;
    }
}
