<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Module extends Model
{
    protected $fillable = [
        'course_id',
        'title',
        'description',
        'sort_order',
        'is_published',
        'requires_completion',
        'start_at',
        'end_at',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'requires_completion' => 'boolean',
            'start_at'     => 'datetime',
            'end_at'       => 'datetime',
        ];
    }

    /**
     * Apakah modul sudah dibuka (tanpa start_at berarti langsung dibuka).
     */
    public function hasStarted(): bool
    {
        return $this->start_at === null || now()->greaterThanOrEqualTo($this->start_at);
    }

    /**
     * Apakah modul sudah ditutup (tanpa end_at berarti tidak pernah ditutup).
     */
    public function isClosed(): bool
    {
        return $this->end_at !== null && now()->greaterThan($this->end_at);
    }

    /**
     * Apakah modul sedang dalam jendela akses.
     */
    public function isOpen(): bool
    {
        return $this->hasStarted() && ! $this->isClosed();
    }

    /**
     * Apakah jawaban kuis masih diterima: sebelum akhir modul, plus toleransi
     * singkat untuk jawaban otomatis yang dikirim tepat saat modul ditutup.
     */
    public function acceptsSubmission(): bool
    {
        if ($this->end_at === null) {
            return true;
        }

        return now()->lessThanOrEqualTo(
            $this->end_at->copy()->addSeconds(Quiz::SUBMIT_GRACE_SECONDS)
        );
    }

    /**
     * Kursus yang memiliki modul ini.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Pelajaran-pelajaran dalam modul ini.
     */
    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * Diskusi dalam modul ini.
     */
    public function discussions(): HasMany
    {
        return $this->hasMany(Discussion::class)->orderBy('created_at');
    }
}
