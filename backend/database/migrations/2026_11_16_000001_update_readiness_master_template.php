<?php

use App\Services\ReadinessMasterData;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        app(ReadinessMasterData::class)->ensureDefaultTemplateSynced();
    }

    public function down(): void
    {
        // Irreversible template data update
    }
};
