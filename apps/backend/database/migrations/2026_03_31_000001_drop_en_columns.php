<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('news', function (Blueprint $table) {
            $table->dropColumn(['title_en', 'content_en', 'excerpt_en']);
        });

        Schema::table('sliders', function (Blueprint $table) {
            $table->dropColumn(['title_en', 'subtitle_en']);
        });

        Schema::table('pages', function (Blueprint $table) {
            $table->dropColumn(['title_en', 'content_en', 'meta_title_en', 'meta_description_en']);
        });

        Schema::table('page_contents', function (Blueprint $table) {
            $table->dropColumn(['content_en']);
        });

        Schema::table('quick_links', function (Blueprint $table) {
            $table->dropColumn(['title_en', 'description_en']);
        });

        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn(['value_en']);
        });

        Schema::table('menus', function (Blueprint $table) {
            $table->dropColumn(['title_en']);
        });
    }

    public function down(): void
    {
        Schema::table('news', function (Blueprint $table) {
            $table->text('title_en')->nullable()->after('title_id');
            $table->longText('content_en')->nullable()->after('content_id');
            $table->text('excerpt_en')->nullable()->after('excerpt_id');
        });

        Schema::table('sliders', function (Blueprint $table) {
            $table->string('title_en')->nullable()->after('title_id');
            $table->text('subtitle_en')->nullable()->after('subtitle_id');
        });

        Schema::table('pages', function (Blueprint $table) {
            $table->string('title_en')->nullable()->after('title_id');
            $table->longText('content_en')->nullable()->after('content_id');
            $table->string('meta_title_en')->nullable()->after('meta_title_id');
            $table->text('meta_description_en')->nullable()->after('meta_description_id');
        });

        Schema::table('page_contents', function (Blueprint $table) {
            $table->longText('content_en')->nullable()->after('content_id');
        });

        Schema::table('quick_links', function (Blueprint $table) {
            $table->string('title_en')->nullable()->after('title_id');
            $table->text('description_en')->nullable()->after('description_id');
        });

        Schema::table('settings', function (Blueprint $table) {
            $table->text('value_en')->nullable()->after('value_id');
        });

        Schema::table('menus', function (Blueprint $table) {
            $table->string('title_en')->nullable()->after('title_id');
        });
    }
};
