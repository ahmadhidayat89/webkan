<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizAttemptAnswer extends Model
{
    public function scopePendingManualGrading(Builder $query): Builder
    {
        return $query->whereNull('manual_score')
            ->whereNotNull('essay_answer')
            ->whereRaw('TRIM(essay_answer) <> ?', [''])
            ->whereHas('question', fn ($questions) => $questions->whereIn('type', ['essay', 'short_answer']));
    }

    protected $fillable = [
        'attempt_id',
        'question_id',
        'selected_option_id',
        'is_correct',
        'essay_answer',
        'manual_score',
        'admin_feedback',
    ];

    protected function casts(): array
    {
        return [
            'is_correct' => 'boolean',
        ];
    }

    /**
     * Percobaan kuis.
     */
    public function attempt(): BelongsTo
    {
        return $this->belongsTo(QuizAttempt::class, 'attempt_id');
    }

    /**
     * Pertanyaan yang dijawab.
     */
    public function question(): BelongsTo
    {
        return $this->belongsTo(QuizQuestion::class, 'question_id');
    }

    /**
     * Opsi yang dipilih.
     */
    public function selectedOption(): BelongsTo
    {
        return $this->belongsTo(QuizOption::class, 'selected_option_id');
    }
}
