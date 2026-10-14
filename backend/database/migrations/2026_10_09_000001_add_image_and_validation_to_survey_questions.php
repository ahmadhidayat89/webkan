<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('survey_questions', function (Blueprint $table) {
            $table->text('image_url')->nullable();
            $table->json('validation')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('survey_questions', function (Blueprint $table) {
            $table->dropColumn(['image_url', 'validation']);
        });
    }
};
