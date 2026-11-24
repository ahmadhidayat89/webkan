<?php

namespace Tests\Feature;

use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    public function test_api_unauthenticated_request_returns_json_with_security_headers(): void
    {
        $response = $this->withHeaders(['Accept' => '*/*'])
            ->get('/api/v1/admin/accreditation-steps');

        $response->assertStatus(401);
        $this->assertTrue(
            str_contains($response->headers->get('Content-Type') ?? '', 'application/json'),
            'Response Content-Type should be JSON'
        );
        $this->assertSecurityHeaders($response);
    }

    public function test_public_routes_contain_security_headers(): void
    {
        $response = $this->get('/api/v1/accreditation-steps');
        $this->assertSecurityHeaders($response);

        $welcomeResponse = $this->get('/');
        $this->assertSecurityHeaders($welcomeResponse);
    }

    public function test_not_found_routes_contain_security_headers(): void
    {
        $response = $this->get('/api/v1/non-existent-route-404');
        $response->assertStatus(404);
        $this->assertSecurityHeaders($response);
    }

    private function assertSecurityHeaders($response): void
    {
        $response->assertHeader('Content-Security-Policy');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy');
        $this->assertFalse($response->headers->has('X-Powered-By'), 'X-Powered-By should not be present');

        // Verify Server header does not leak version information (CWE-497)
        if ($response->headers->has('Server')) {
            $serverHeader = $response->headers->get('Server') ?? '';
            $this->assertDoesNotMatchMatchesFormat('%d.%d', $serverHeader);
        }
    }
}
