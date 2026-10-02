<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            if (!Schema::hasColumn('contacts', 'ip_address')) {
                $table->string('ip_address', 45)->nullable()->after('is_read')->index();
            }
            if (!Schema::hasColumn('contacts', 'user_agent')) {
                $table->text('user_agent')->nullable()->after('ip_address');
            }
            if (!Schema::hasColumn('contacts', 'status')) {
                $table->string('status', 20)->default('pending')->after('user_agent')->index();
            }
            if (!Schema::hasColumn('contacts', 'spam_score')) {
                $table->unsignedSmallInteger('spam_score')->default(0)->after('status');
            }
            if (!Schema::hasColumn('contacts', 'spam_reason')) {
                $table->text('spam_reason')->nullable()->after('spam_score');
            }
            if (!Schema::hasColumn('contacts', 'submitted_at')) {
                $table->timestamp('submitted_at')->nullable()->after('spam_reason');
            }
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $columns = [
                'ip_address',
                'user_agent',
                'status',
                'spam_score',
                'spam_reason',
                'submitted_at',
            ];

            $existing = array_filter($columns, static fn ($column) => Schema::hasColumn('contacts', $column));
            if (!empty($existing)) {
                $table->dropColumn($existing);
            }
        });
    }
};

