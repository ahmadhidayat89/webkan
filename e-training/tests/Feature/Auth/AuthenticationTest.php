<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    private const LOGIN_URL = '/login';

    protected function setUp(): void
    {
        parent::setUp();

        // Captcha selalu dianggap valid di lingkungan test
        Validator::extend('captcha', fn () => true);
    }

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get(self::LOGIN_URL);

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->post(self::LOGIN_URL, [
            'username' => $user->email,
            'password' => 'password',
            'captcha' => 'test',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post(self::LOGIN_URL, [
            'username' => $user->email,
            'password' => 'wrong-password',
            'captcha' => 'test',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }
}