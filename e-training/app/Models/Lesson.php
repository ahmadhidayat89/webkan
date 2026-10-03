<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Lesson extends Model
{
    protected $fillable = [
        'module_id',
        'title',
        'type',
        'description',
        'file_path',
        'video_url',
        'duration_minutes',
        'sort_order',
        'is_published',
        'is_preview',
        'start_datetime',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'is_preview' => 'boolean',
            'start_datetime' => 'datetime',
        ];
    }

    /**
     * Modul yang memiliki pelajaran ini.
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    /**
     * Kuis (jika tipe lesson adalah 'quiz').
     */
    public function quiz(): HasOne
    {
        return $this->hasOne(Quiz::class);
    }

    /**
     * Progress user untuk pelajaran ini.
     */
    public function progress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }

    /**
     * File lampiran (jika tipe lesson adalah 'document' atau lainnya).
     */
    public function files(): HasMany
    {
        return $this->hasMany(LessonFile::class);
    }

    /**
     * Diskusi per sesi/lesson ini.
     */
    public function discussions(): HasMany
    {
        return $this->hasMany(Discussion::class)->orderBy('created_at');
    }
}
