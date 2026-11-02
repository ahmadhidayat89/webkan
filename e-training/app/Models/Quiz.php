<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quiz extends Model
{
    // Toleransi (detik) untuk jawaban yang dikirim otomatis tepat saat tenggat (jeda jaringan)
    public const SUBMIT_GRACE_SECONDS = 30;

    protected $fillable = [
        'lesson_id',
        'duration_minutes',
        'passing_score',
        'max_attempts',
        'shuffle_questions',
        'show_correct_answers',
        'start_at',
        'deadline_at',
        'quiz_mode',
    ];

    protected function casts(): array
    {
        return [
            'shuffle_questions'    => 'boolean',
            'show_correct_answers' => 'boolean',
            'start_at'             => 'datetime',
            'deadline_at'          => 'datetime',
        ];
    }

    /**
     * Apakah kuis sudah dibuka (tanpa start_at berarti langsung dibuka).
     */
    public function hasStarted(): bool
    {
        return $this->start_at === null || now()->greaterThanOrEqualTo($this->start_at);
    }

    /**
     * Apakah jawaban masih boleh diterima: sebelum tenggat, ditambah toleransi singkat.
     */
    public function acceptsSubmission(): bool
    {
        if ($this->deadline_at === null) {
            return true;
        }

        return now()->lessThanOrEqualTo(
            $this->deadline_at->copy()->addSeconds(self::SUBMIT_GRACE_SECONDS)
        );
    }

    /**
     * Alasan jawaban ditolak karena jendela waktu, atau null kalau boleh dikirim.
     */
    public function submissionBlockedReason(): ?string
    {
        if (! $this->hasStarted()) {
            return 'Kuis ini belum dibuka.';
        }

        if (! $this->acceptsSubmission()) {
            return 'Waktu pengerjaan kuis telah berakhir.';
        }

        return null;
    }

    /**
     * Lesson yang memiliki kuis ini.
     */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    /**
     * Pertanyaan-pertanyaan dalam kuis.
     */
    public function questions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class)->orderBy('sort_order');
    }

    /**
     * Percobaan kuis oleh user.
     */
    public function attempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }
}
