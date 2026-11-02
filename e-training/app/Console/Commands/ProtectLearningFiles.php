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
        $public = Storage::disk('public');
        $private = Storage::disk('local');
        if (! preg_match('#^(lesson-files|discussions)/[a-zA-Z0-9_./-]+$#', $path) || str_contains($path, '..')) {
            $this->error('Jalur lampiran tidak valid.');

            return null;
        }
        if (! $public->exists($path)) {
            return 0;
        }
        $content = $public->get($path);
        if ($private->exists($path) && $private->get($path) !== $content) {
            $this->error('Salinan privat berbeda. File publik dipertahankan.');

            return null;
        }
        if (! $private->put($path, $content) || $private->get($path) !== $content) {
            $this->error('Verifikasi salinan gagal. File publik dipertahankan.');

            return null;
        }
        if (! $public->delete($path)) {
            $this->error('Salinan publik gagal dipindahkan.');

            return null;
        }

        return 1;
    }
}
