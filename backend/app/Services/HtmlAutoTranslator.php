<?php

namespace App\Services;

use Illuminate\Http\Client\Pool;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HtmlAutoTranslator
{
    private const CACHE_TTL_SECONDS = 2592000; // 30 days

    private string $libreTranslateUrl;
    private ?string $libreTranslateApiKey;

    public function __construct()
    {
        $this->libreTranslateUrl = rtrim(
            (string) config('services.libretranslate.url', env('LIBRE_TRANSLATE_URL', 'https://libretranslate.com')),
            '/'
        );
        $apiKey = (string) config('services.libretranslate.api_key', env('LIBRE_TRANSLATE_API_KEY'));
        $this->libreTranslateApiKey = $apiKey !== '' ? $apiKey : null;
    }

    /**
     * Translate HTML content while keeping tags/structure.
     */
    public function translateHtml(string $html, string $from = 'id', string $to = 'en'): ?string
    {
        $html = trim($html);
        if ($html === '') {
            return $html;
        }
    
        $dom = $this->loadHtmlDocument($html);
        if ($dom === null || !$this->translateTextNodes($dom, $from, $to)) {
            return null;
        }
    
        return $this->extractRootHtml($dom);
    }
    
    /**
     * Parse HTML ke DOM dengan wrapper #translate-root. Null jika gagal di-parse.
     */
    private function loadHtmlDocument(string $html): ?\DOMDocument
    {
        $dom = new \DOMDocument('1.0', 'UTF-8');
        libxml_use_internal_errors(true);
    
        $loaded = $dom->loadHTML(
            '<?xml encoding="UTF-8"><div id="translate-root">' . $html . '</div>',
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
        );
        libxml_clear_errors();
    
        return $loaded ? $dom : null;
    }
    
    /**
     * Terjemahkan semua text node (kecuali script/style). False jika node tidak bisa di-query.
     */
    private function translateTextNodes(\DOMDocument $dom, string $from, string $to): bool
    {
        $xpath = new \DOMXPath($dom);
        $nodes = $xpath->query('//text()[normalize-space(.) != "" and not(ancestor::script) and not(ancestor::style)]');
    
        if (!$nodes) {
            return false;
        }
    
        $cache = [];
        foreach ($nodes as $node) {
            $original = $node->nodeValue;
            if ($original === null) {
                continue;
            }
    
            if (!array_key_exists($original, $cache)) {
                $cache[$original] = $this->translateText($original, $from, $to);
            }
    
            if ($cache[$original] !== null) {
                $node->nodeValue = $cache[$original];
            }
        }
    
        return true;
    }
    
    private function extractRootHtml(\DOMDocument $dom): ?string
    {
        $root = $dom->getElementById('translate-root');
        if (!$root) {
            return null;
        }
    
        $result = '';
        foreach ($root->childNodes as $child) {
            $result .= $dom->saveHTML($child);
        }
    
        return $result;
    }

    /**
     * Translate list of plain text strings.
     *
     * @param array<int, string> $texts
     * @return array<int, string|null>
     */
    public function translateTexts(array $texts, string $from = 'id', string $to = 'en'): array
    {
        $results = [];
        $normalizedByIndex = [];
        $missingSources = [];

        foreach ($texts as $index => $text) {
            if (!is_string($text)) {
                $results[] = null;
                continue;
            }

            $source = trim($text);
            if ($source === '') {
                $results[] = '';
                continue;
            }

            $normalizedByIndex[$index] = $source;
            $cached = Cache::get($this->cacheKey($source, $from, $to));
            if ($cached === null) {
                $missingSources[$source] = true;
            }
        }

        $freshTranslations = $this->translateMissingSources(array_keys($missingSources), $from, $to);

        foreach ($texts as $index => $text) {
            if (!is_string($text)) {
                $results[] = null;
                continue;
            }

            $source = $normalizedByIndex[$index] ?? trim($text);
            if ($source === '') {
                $results[] = '';
                continue;
            }

            $cacheKey = $this->cacheKey($source, $from, $to);
            $translated = Cache::get($cacheKey);
            if ($translated === null && isset($freshTranslations[$source])) {
                $translated = $freshTranslations[$source];
            }

            $results[] = $translated;
        }

        return $results;
    }

    private function translateText(string $text, string $from, string $to): ?string
    {
        $text = trim($text);
        if ($text === '') {
            return $text;
        }

        $cacheKey = $this->cacheKey($text, $from, $to);
        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return $cached;
        }

        try {
            $payload = [
                'q' => $text,
                'source' => $from,
                'target' => $to,
                'format' => 'text',
            ];
            if ($this->libreTranslateApiKey) {
                $payload['api_key'] = $this->libreTranslateApiKey;
            }

            $response = Http::timeout(20)->post($this->libreTranslateUrl . '/translate', $payload);

            if (!$response->ok()) {
                return null;
            }

            $json = $response->json();
            $translated = is_array($json) ? ($json['translatedText'] ?? null) : null;
            if (!is_string($translated) || trim($translated) === '') {
                return null;
            }

            $result = $translated;
            if ($result !== null) {
                Cache::put($cacheKey, $result, self::CACHE_TTL_SECONDS);
            }
            return $result;
        } catch (\Throwable $e) {
            Log::warning('Auto translate failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Translate uncached sources concurrently.
     *
     * @param array<int, string> $sources
     * @return array<string, string|null>
     */
    private function translateMissingSources(array $sources, string $from, string $to): array
    {
        if (empty($sources)) {
            return [];
        }

        $results = [];
        $chunks = array_chunk($sources, 8); // keep concurrency moderate to reduce rate-limit failures

        foreach ($chunks as $chunk) {
            try {
                $this->translateChunk($chunk, $from, $to, $results);
            } catch (\Throwable $e) {
                Log::warning('Auto translate pool failed: ' . $e->getMessage());
                foreach ($chunk as $source) {
                    $results[$source] = null;
                }
            }

            // Retry failed items sequentially (best-effort) to improve completion rate.
            $this->retryFailedTranslations($chunk, $from, $to, $results);
        }

        return $results;
    }

    private function translateChunk(array $chunk, string $from, string $to, array &$results): void
    {
        $responses = Http::pool(fn (Pool $pool) => $this->buildTranslationRequests($pool, $chunk, $from, $to));

        foreach ($chunk as $source) {
            $translated = $this->parseTranslationResponse($responses[$source] ?? null);
            $results[$source] = $translated;
            if ($translated !== null) {
                Cache::put($this->cacheKey($source, $from, $to), $translated, self::CACHE_TTL_SECONDS);
            }
        }
    }

    private function buildTranslationRequests(Pool $pool, array $chunk, string $from, string $to): array
    {
        $requests = [];
        foreach ($chunk as $source) {
            $requests[$source] = $pool->as($source)
                ->timeout(20)
                ->post($this->libreTranslateUrl . '/translate', $this->translationPayload($source, $from, $to));
        }

        return $requests;
    }

    private function translationPayload(string $source, string $from, string $to): array
    {
        $payload = ['q' => $source, 'source' => $from, 'target' => $to, 'format' => 'text'];
        if ($this->libreTranslateApiKey) {
            $payload['api_key'] = $this->libreTranslateApiKey;
        }

        return $payload;
    }

    private function retryFailedTranslations(array $chunk, string $from, string $to, array &$results): void
    {
        foreach ($chunk as $source) {
            if (($results[$source] ?? null) !== null) {
                continue;
            }

            $retry = $this->translateText($source, $from, $to);
            if ($retry !== null) {
                $results[$source] = $retry;
            }
        }
    }

    private function cacheKey(string $text, string $from, string $to): string
    {
        return 'auto_translate:' . $from . ':' . $to . ':' . hash('sha256', $text);
    }

    private function parseTranslationResponse($response): ?string
    {
        if (!$response || !$response->ok()) {
            return null;
        }

        $payload = $response->json();
        $translated = is_array($payload) ? ($payload['translatedText'] ?? null) : null;
        if (!is_string($translated)) {
            return null;
        }

        return trim($translated) !== '' ? $translated : null;
    }
}
