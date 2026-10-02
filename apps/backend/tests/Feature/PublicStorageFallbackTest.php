<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PublicStorageFallbackTest extends TestCase
{
    public function test_it_serves_files_from_the_public_disk_without_a_storage_symlink(): void
    {
        Storage::fake('public');

        $path = UploadedFile::fake()
            ->createWithContent('site-logo.png', 'fake-image-content')
            ->store('settings', 'public');

        $response = $this->get("/storage/{$path}");

        $response->assertOk();
        $this->assertStringContainsString(
            'max-age=86400',
            (string) $response->headers->get('cache-control')
        );
    }

    public function test_it_rejects_path_traversal_attempts(): void
    {
        $response = $this->get('/storage/../.env');

        $response->assertNotFound();
    }
}
