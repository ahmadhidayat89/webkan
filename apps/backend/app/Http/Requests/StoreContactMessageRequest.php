<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class StoreContactMessageRequest extends FormRequest
{
    private const DEFAULT_SUBJECT = 'Pesan dari Form Kontak';

    private int $spamScore = 0;

    /**
     * @var array<int, string>
     */
    private array $spamReasons = [];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $recaptchaRule = $this->isRecaptchaEnabled()
            ? ['required', 'string']
            : ['nullable', 'string'];

        return [
            'name' => ['required', 'string', 'min:3', 'max:100', 'regex:/^[\pL\s\'\.\-]+$/u'],
            'email' => ['required', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:25', 'regex:/^\+?[0-9][0-9\-\s().]{6,24}$/'],
            'subject' => ['nullable', 'string', 'min:5', 'max:150'],
            'message' => ['required', 'string', 'min:20', 'max:2000'],
            'website' => ['nullable', 'string', 'max:0'],
            'form_started_at' => ['required', 'integer'],
            'recaptcha_token' => $recaptchaRule,
        ];
    }

    public function messages(): array
    {
        return [
            'name.regex' => 'Nama hanya boleh berisi huruf, spasi, apostrof, titik, dan tanda hubung.',
            'phone.regex' => 'Format nomor telepon tidak valid.',
            'website.max' => 'Permintaan tidak valid.',
            'recaptcha_token.required' => 'Verifikasi keamanan wajib diisi.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => $this->normalizeString($this->input('name')),
            'email' => strtolower($this->normalizeString($this->input('email'))),
            'subject' => $this->normalizeString($this->input('subject')),
            'message' => $this->normalizeString($this->input('message')),
            'phone' => $this->normalizePhone($this->input('phone')),
            'website' => $this->normalizeString($this->input('website')),
            'recaptcha_token' => $this->normalizeString($this->input('recaptcha_token', $this->input('turnstile_token'))),
        ]);
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $forbiddenPayload = $this->findForbiddenPayload();
            if (!empty($forbiddenPayload)) {
                foreach ($forbiddenPayload as $field => $reason) {
                    $validator->errors()->add($field, 'Input mengandung pola yang tidak diizinkan.');
                    $this->logBlocked($reason);
                }
            }

            $message = (string) $this->input('message', '');
            $subject = (string) $this->input('subject', '');

            if (!$this->passesWordCount($message, 3)) {
                $validator->errors()->add('message', 'Pesan minimal terdiri dari 3 kata.');
            }

            if (!$this->passesTimeTrap()) {
                $validator->errors()->add('form_started_at', 'Permintaan terdeteksi tidak valid.');
                $this->logBlocked('time_trap_failed');
            }

            if (!$this->verifyRecaptcha()) {
                $validator->errors()->add('recaptcha_token', 'Verifikasi keamanan gagal. Coba lagi.');
                $this->logBlocked('recaptcha_failed');
            }

            $analysis = $this->analyzeSpam($subject, $message);
            $this->spamScore = $analysis['score'];
            $this->spamReasons = $analysis['reasons'];

            if ($analysis['should_reject']) {
                $validator->errors()->add('message', 'Pesan terdeteksi sebagai spam.');
                $this->logBlocked('spam_rejected');
            }
        });
    }

    public function spamScore(): int
    {
        return $this->spamScore;
    }

    /**
     * @return array<int, string>
     */
    public function spamReasons(): array
    {
        return $this->spamReasons;
    }

    public function isSpamFlagged(): bool
    {
        return $this->spamScore >= 3 || !empty($this->spamReasons);
    }

    public function cleanPayload(): array
    {
        return [
            'name' => (string) $this->input('name'),
            'email' => (string) $this->input('email'),
            'phone' => $this->input('phone') ?: null,
            'subject' => $this->resolveSubject(),
            'message' => (string) $this->input('message'),
        ];
    }

    private function resolveSubject(): string
    {
        $subject = (string) $this->input('subject', '');

        return $subject === '' ? self::DEFAULT_SUBJECT : $subject;
    }

    /**
     * @return array<string, string>
     */
    private function findForbiddenPayload(): array
    {
        $fields = [
            'name' => (string) $this->input('name', ''),
            'email' => (string) $this->input('email', ''),
            'phone' => (string) $this->input('phone', ''),
            'subject' => (string) $this->input('subject', ''),
            'message' => (string) $this->input('message', ''),
        ];

        $matches = [];
        foreach ($fields as $field => $value) {
            if ($value === '') {
                continue;
            }

            if (preg_match('/<\?(?:php|=)?/i', $value)) {
                $matches[$field] = 'forbidden_php_tag_detected';
                continue;
            }

            if (preg_match('/<\s*script\b|<\/script>/i', $value)) {
                $matches[$field] = 'forbidden_script_tag_detected';
                continue;
            }

            if (preg_match('/javascript\s*:/i', $value)) {
                $matches[$field] = 'forbidden_javascript_scheme_detected';
                continue;
            }

            if (preg_match('/on[a-z]+\s*=/i', $value)) {
                $matches[$field] = 'forbidden_inline_handler_detected';
                continue;
            }
        }

        return $matches;
    }

    private function normalizeString(mixed $value): string
    {
        $string = trim((string) ($value ?? ''));
        $string = preg_replace('/\s+/u', ' ', $string) ?? $string;

        return $string;
    }

    private function normalizePhone(mixed $value): ?string
    {
        $string = trim((string) ($value ?? ''));
        if ($string === '') {
            return null;
        }

        // Keep raw characters for validation safety; only collapse whitespace.
        $string = preg_replace('/\s+/u', ' ', $string) ?? $string;

        return trim($string);
    }

    private function passesWordCount(string $value, int $minimum): bool
    {
        $words = preg_split('/\s+/u', trim($value), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        return count($words) >= $minimum;
    }

    private function passesTimeTrap(): bool
    {
        $startedAt = (int) $this->input('form_started_at', 0);
        if ($startedAt <= 0) {
            return false;
        }

        $elapsed = now()->timestamp - $startedAt;
        return $elapsed >= 3 && $elapsed <= 60 * 60 * 12;
    }

    private function verifyRecaptcha(): bool
    {
        if (!$this->isRecaptchaEnabled()) {
            return true;
        }

        $secret = (string) config('services.recaptcha.secret_key');
        $token = (string) $this->input('recaptcha_token');
        $ip = (string) $this->ip();

        if ($secret === '' || $token === '') {
            return false;
        }

        try {
            $response = Http::asForm()
                ->timeout(8)
                ->post('https://www.google.com/recaptcha/api/siteverify', [
                    'secret' => $secret,
                    'response' => $token,
                    'remoteip' => $ip,
                ]);

            if (!$response->ok()) {
                return false;
            }

            return (bool) data_get($response->json(), 'success', false);
        } catch (\Throwable $e) {
            Log::warning('recaptcha_verification_exception', [
                'ip' => $ip,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * @return array{score:int,reasons:array<int,string>,should_reject:bool}
     */
    private function analyzeSpam(string $subject, string $message): array
    {
        $score = 0;
        $reasons = [];
        $reject = false;
        $content = "{$subject} {$message}";

        if (preg_match('/(.)\1{7,}/u', $content)) {
            $score += 4;
            $reasons[] = 'repeated_characters';
            $reject = true;
        }

        $linkCount = preg_match_all('/https?:\/\/|www\./i', $content);
        if ($linkCount >= 3) {
            $score += 4;
            $reasons[] = 'too_many_links';
            $reject = true;
        } elseif ($linkCount >= 1) {
            $score += 1;
            $reasons[] = 'contains_links';
        }

        $words = preg_split('/\s+/u', trim($message), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $wordCount = count($words);
        if ($wordCount < 5) {
            $score += 2;
            $reasons[] = 'very_low_word_count';
        }

        if (preg_match('/^[\W_]+$/u', $message)) {
            $score += 4;
            $reasons[] = 'all_symbols';
            $reject = true;
        }

        $uniqueWords = count(array_unique(array_map(static fn ($word) => mb_strtolower($word), $words)));
        if ($wordCount >= 8 && $uniqueWords > 0) {
            $ratio = $uniqueWords / $wordCount;
            if ($ratio < 0.35) {
                $score += 2;
                $reasons[] = 'low_word_variety';
            }
        }

        if ($score >= 7) {
            $reject = true;
        }

        return [
            'score' => $score,
            'reasons' => array_values(array_unique($reasons)),
            'should_reject' => $reject,
        ];
    }

    private function logBlocked(string $reason): void
    {
        Log::warning('contact_submission_blocked', [
            'reason' => $reason,
            'ip' => $this->ip(),
            'email_hash' => sha1(strtolower((string) $this->input('email'))),
        ]);
    }

    private function isRecaptchaEnabled(): bool
    {
        return (bool) config('services.recaptcha.enabled', false);
    }
}
