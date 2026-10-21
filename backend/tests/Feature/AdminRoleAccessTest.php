<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminRoleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_users_and_contact_submissions_but_not_settings(): void
    {
        Sanctum::actingAs($this->userWithRole('admin'));

        $this->getJson('/api/v1/admin/users')->assertOk();
        $this->getJson('/api/v1/admin/contact-submissions')->assertOk();
        $this->getJson('/api/v1/admin/settings')->assertForbidden();
        $this->getJson('/api/v1/admin/social-settings')->assertForbidden();

        $this->postJson('/api/v1/admin/users', [
            'name' => 'Social Admin',
            'email' => 'social-admin@example.com',
            'role' => 'adminsosmed',
            'password' => 'Secure-Password1',
        ])->assertCreated();
    }

    public function test_social_admin_can_manage_social_settings_but_not_system_resources(): void
    {
        Sanctum::actingAs($this->userWithRole('adminsosmed'));

        $this->getJson('/api/v1/admin/social-settings')->assertOk();
        $this->getJson('/api/v1/admin/news')->assertOk();
        $this->getJson('/api/v1/admin/settings')->assertForbidden();
        $this->getJson('/api/v1/admin/users')->assertForbidden();
        $this->getJson('/api/v1/admin/contact-submissions')->assertForbidden();
        $this->getJson('/api/v1/admin/menus')->assertForbidden();
    }

    public function test_admin_cannot_create_a_super_admin(): void
    {
        Sanctum::actingAs($this->userWithRole('admin'));

        $this->postJson('/api/v1/admin/users', [
            'name' => 'Unauthorized Super Admin',
            'email' => 'unauthorized@example.com',
            'role' => 'super_admin',
            'password' => 'secure-password',
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('users', ['email' => 'unauthorized@example.com']);
    }

    public function test_admin_can_create_a_page_and_add_its_route_to_the_public_menu(): void
    {
        Sanctum::actingAs($this->userWithRole('admin'));

        $this->postJson('/api/v1/admin/pages', [
            'title_id' => 'Layanan Baru',
            'slug' => 'layanan-baru',
            'content_id' => '<p>Informasi layanan.</p>',
            'is_published' => true,
        ])->assertCreated();

        $this->postJson('/api/v1/admin/menus', [
            'title_id' => 'Layanan Baru',
            'url' => '/layanan-baru',
            'is_active' => true,
        ])->assertCreated();

        $this->getJson('/api/v1/pages/layanan-baru')
            ->assertOk()
            ->assertJsonPath('data.title_id', 'Layanan Baru');
        $this->getJson('/api/v1/menus')
            ->assertOk()
            ->assertJsonPath('data.0.url', '/layanan-baru');
    }

    public function test_public_contact_messages_are_saved_for_the_admin_inbox(): void
    {
        Mail::fake();

        $this->postJson('/api/v1/contact', [
            'name' => 'Test Sender',
            'email' => 'sender@example.com',
            'phone' => '08123456789',
            'subject' => 'Test message',
            'message' => 'Message body',
        ])->assertOk()->assertJsonPath('success', true);

        $this->assertDatabaseHas('contact_submissions', [
            'email' => 'sender@example.com',
            'subject' => 'Test message',
            'message' => 'Message body',
        ]);
    }

    private function userWithRole(string $role): User
    {
        return User::factory()->create([
            'role' => $role,
            'password' => Hash::make('password'),
        ]);
    }
}
