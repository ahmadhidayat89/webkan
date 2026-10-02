<?php

namespace Tests\Feature;

use App\Models\Contact;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ContactSubmissionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.recaptcha.enabled' => true,
            'services.recaptcha.secret_key' => 'test-secret',
        ]);
    }

    public function test_valid_submission_succeeds(): void
    {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response(['success' => true]),
        ]);

        $response = $this->postJson('/api/v1/contact', $this->validPayload());

        $response->assertStatus(200)->assertJson(['success' => true]);
        $this->assertDatabaseCount('contacts', 1);
    }

    public function test_invalid_email_is_rejected(): void
    {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response(['success' => true]),
        ]);

        $payload = $this->validPayload(['email' => '123123123']);
        $response = $this->postJson('/api/v1/contact', $payload);

        $response->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    public function test_invalid_phone_garbage_is_rejected(): void
    {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response(['success' => true]),
        ]);

        $payload = $this->validPayload(['phone' => 'ASDASDASD']);
        $response = $this->postJson('/api/v1/contact', $payload);

        $response->assertStatus(422)->assertJsonValidationErrors(['phone']);
    }

    public function test_filled_honeypot_is_rejected(): void
    {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response(['success' => true]),
        ]);

        $payload = $this->validPayload(['website' => 'spam-bot-field']);
        $response = $this->postJson('/api/v1/contact', $payload);

        $response->assertStatus(422)->assertJsonValidationErrors(['website']);
    }

    public function test_missing_recaptcha_token_is_rejected(): void
    {
        $payload = $this->validPayload(['recaptcha_token' => '']);
        $response = $this->postJson('/api/v1/contact', $payload);

        $response->assertStatus(422)->assertJsonValidationErrors(['recaptcha_token']);
    }

    public function test_invalid_recaptcha_token_is_rejected(): void
    {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response(['success' => false]),
        ]);

        $response = $this->postJson('/api/v1/contact', $this->validPayload());

        $response->assertStatus(422)->assertJsonValidationErrors(['recaptcha_token']);
    }

    public function test_invalid_form_started_at_is_rejected(): void
    {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response(['success' => true]),
        ]);

        $payload = $this->validPayload(['form_started_at' => now()->timestamp]);
        $response = $this->postJson('/api/v1/contact', $payload);

        $response->assertStatus(422)->assertJsonValidationErrors(['form_started_at']);
    }

    public function test_duplicate_submission_is_blocked(): void
    {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response(['success' => true]),
        ]);

        $payload = $this->validPayload();

        $this->postJson('/api/v1/contact', $payload)->assertStatus(200);
        $this->postJson('/api/v1/contact', $payload)->assertStatus(429);
        $this->assertDatabaseCount('contacts', 1);
    }

    public function test_rate_limit_per_ip_is_enforced(): void
    {
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response(['success' => true]),
        ]);

        for ($i = 0; $i < 5; $i++) {
            $payload = $this->validPayload(['email' => "user{$i}@example.com"]);
            $this->postJson('/api/v1/contact', $payload)->assertStatus(200);
        }

        $blockedPayload = $this->validPayload(['email' => 'overlimit@example.com']);
        $this->postJson('/api/v1/contact', $blockedPayload)->assertStatus(429);
    }

    /**
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Andi Pratama',
            'email' => 'andi@example.com',
            'phone' => '+62 812-3456-7890',
            'subject' => 'Permintaan informasi akreditasi',
            'message' => 'Halo tim KAN, saya ingin meminta informasi lengkap mengenai proses akreditasi laboratorium untuk tahun ini.',
            'website' => '',
            'form_started_at' => now()->subSeconds(10)->timestamp,
            'recaptcha_token' => 'valid-recaptcha-token',
        ], $overrides);
    }
}
