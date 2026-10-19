<?php

namespace App\Services\Survey;

class SurveyContentSanitizer
{
    /**
     * Skala 1–5 selalu menyimpan tepat 5 label (boleh kosong, maks 100 karakter).
     * Jika semua kosong, pakai label bawaan. Tipe lain dikembalikan apa adanya.
     */
    public function cleanOptions(string $type, array $options): array
    {
        if ($type !== 'scale') {
            return $options;
        }

        $labels = [];
        for ($i = 0; $i < 5; $i++) {
            $label = trim(strip_tags((string) ($options[$i] ?? '')));
            $labels[] = mb_substr($label, 0, 100);
        }

        if (count(array_filter($labels, fn ($l) => $l !== '')) === 0) {
            return ['Sangat Tidak Baik', 'Tidak Baik', 'Cukup', 'Baik', 'Sangat Baik'];
        }

        return $labels;
    }

    /**
     * Bersihkan teks pertanyaan (rich text). Jika kosong, pakai teks default.
     */
    public function cleanQuestionText(?string $html, int $index): string
    {
        $clean = $this->sanitizeRichText($html);

        if (trim(html_entity_decode(strip_tags($clean))) === '') {
            return 'Pertanyaan ' . ($index + 1);
        }

        return $clean;
    }

    /**
     * Sanitasi HTML sederhana: hanya tag p, br, strong, em, u, a.
     * Semua atribut dibuang kecuali href (hanya http/https/mailto) pada <a>.
     */
    public function sanitizeRichText(?string $html): string
    {
        $html = html_entity_decode((string) $html, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $html = $this->normalizeRichTextLists($html);
        $html = strip_tags($html, '<p><br><strong><em><u><a><ul><ol><li>');

        return preg_replace_callback('/<(\/?)([a-z0-9]+)([^>]*)>/i', fn ($match) => $this->sanitizeRichTextTag($match), $html);
    }

    private function normalizeRichTextLists(string $html): string
    {
        return preg_replace_callback('/<ol\b[^>]*>(.*?)<\/ol>/is', function ($match) {
            $isBulletList = preg_match('/<li\b[^>]*data-list=["\']bullet["\']/i', $match[1]) === 1;
            $inner = preg_replace('/<li\b[^>]*data-list=["\'](?:bullet|ordered)["\'][^>]*>/', '<li>', $match[1]);
            $inner = preg_replace('/<span\b[^>]*class=["\'][^"\']*ql-ui[^"\']*["\'][^>]*><\/span>/i', '', $inner);
            $tag = $isBulletList ? 'ul' : 'ol';
            return '<' . $tag . '>' . $inner . '</' . $tag . '>';
        }, $html);
    }

    private function sanitizeRichTextTag(array $match): string
    {
        [, $closing, $tag, $attributes] = $match;
        $tag = strtolower($tag);
        $result = "<$tag>";
        if ($closing) {
            $result = "</$tag>";
        } elseif ($tag === 'a' && preg_match('/href\s*=\s*(?:"([^"]*)"|\'([^\']*)\')/i', $attributes, $hrefMatch)) {
            $rawHref = $hrefMatch[1] !== '' ? $hrefMatch[1] : ($hrefMatch[2] ?? '');
            $href = trim(html_entity_decode($rawHref));
            if (preg_match('#^(https?://|mailto:)#i', $href)) {
                $result = '<a href="' . e($href) . '" target="_blank" rel="noopener noreferrer">';
            }
        }
        return $result;
    }
}
