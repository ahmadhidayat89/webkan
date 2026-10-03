<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quiz extends Model
{
    protected $fillable = [
        'lesson_id',
        'duration_minutes',
        'passing_score',
        'max_attempts',
        'shuffle_questions',
        'show_correct_answers',
        'deadline_at',
        'quiz_mode',
    ];

    protected function casts(): array
    {
        return [
            'shuffle_questions'    => 'boolean',
            'show_correct_answers' => 'boolean',
            'deadline_at'          => 'datetime',
        ];
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
