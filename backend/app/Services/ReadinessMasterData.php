<?php

namespace App\Services;

use App\Models\ReadinessAssessment;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ReadinessMasterData
{
    public function ensureDefaultTemplateSynced(): void
    {
        $this->ensureResponsesTableExists();

        $settings = DB::table('readiness_master_settings')->first();

        if (! $settings) {
            $this->saveMasterData($this->defaultTemplate());
        } elseif (DB::table('readiness_master_clauses')->where('item_id', 'KAN')->exists()) {
            $this->syncDefaultTemplate($this->defaultTemplate());
        }
    }

    /**
     * Simpan data master baru dan terapkan ke form yang belum terbit.
     *
     * @return int jumlah form yang ikut diperbarui
     */
    public function updateFromDraft(array $draft): int
    {
        $synced = 0;

        DB::transaction(function () use ($draft, &$synced) {
            $old = $this->load();
            $this->saveMasterData($draft);
            $new = $this->load();

            // Hanya form yang belum terbit yang mengikuti perubahan data master.
            ReadinessAssessment::query()->whereNull('published_at')->lockForUpdate()->get()
                ->each(function (ReadinessAssessment $assessment) use ($old, $new, &$synced) {
                    $updated = ReadinessMasterSync::apply($old, $new, $assessment->draft);

                    if ($updated != $assessment->draft) {
                        $assessment->update(['draft' => $updated]);
                        $synced++;
                    }
                });
        });

        return $synced;
    }

    public function load(): array
    {
        // ← pindahkan isi loadMasterData() persis seperti aslinya
    }

    private function defaultTemplate(): array
    {
        $path = resource_path('readiness/lsp-17024.json');

        return json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
    }

    private function syncDefaultTemplate(array $default): void
    {
        // ← pindahkan isi syncDefaultTemplate(), ganti $this->loadMasterData() menjadi $this->load()
    }

    private function saveMasterData(array $draft): void
    {
        // ← pindahkan isi saveMasterData() persis seperti aslinya
    }

    private function ensureResponsesTableExists(): void
    {
        // ← pindahkan isi ensureResponsesTableExists() persis seperti aslinya
    }
}
