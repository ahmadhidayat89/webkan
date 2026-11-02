<?php

namespace App\Console\Commands;

use App\Models\Discussion;
use App\Models\LessonFile;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class ProtectLearningFiles extends Command
{
    protected $signature = 'learning:protect-files';

    protected $description = 'Pindahkan lampiran pembelajaran ke disk privat untuk pemeriksaan akses modul.';

    public function handle(): int
    {
        $count = 0;
        foreach ([LessonFile::query(), Discussion::whereNotNull('file_path')] as $query) {
            foreach ($query->lazyById() as $record) {
                $moved = $this->moveFile($record->file_path);
                if ($moved === null) {
                    return self::FAILURE;
                }
                $count += $moved;
            }
        }
        $this->info($count.' lampiran dipindahkan ke penyimpanan privat.');

        return self::SUCCESS;
    }

    private function moveFile(string $path): ?int
    {
        if (! preg_match('#^(lesson-files|discussions)/[a-zA-Z0-9_./-]+$#', $path) || str_contains($path, '..')) {
            $this->error('Jalur lampiran tidak valid.');

            return null;
        }
        if (! Storage::disk('public')->exists($path)) {
            return 0;
        }

        return $this->transferFile($path) ? 1 : null;
    }

    private function transferFile(string $path): bool
    {
        $content = Storage::disk('public')->get($path);
        $error = $this->transferError($path, $content);
        if ($error !== null) {
            $this->error($error);

            return false;
        }

        return true;
    }

    /** Salin ke disk privat, verifikasi, lalu hapus salinan publik. Return pesan error, atau null jika berhasil. */
    private function transferError(string $path, mixed $content): ?string
    {
        $public = Storage::disk('public');
        $private = Storage::disk('local');
        if ($private->exists($path) && $private->get($path) !== $content) {
            return 'Salinan privat berbeda. File publik dipertahankan.';
        }
        if (! $private->put($path, $content) || $private->get($path) !== $content) {
            return 'Verifikasi salinan gagal. File publik dipertahankan.';
        }

        return $public->delete($path) ? null : 'Salinan publik gagal dipindahkan.';
    }
}