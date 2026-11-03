<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BankQuestion extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['tags' => 'array', 'options' => 'array', 'archived_at' => 'datetime'];
    }

    public function scopeAccessibleTo(Builder $query, User $user): Builder
    {
        return $query->when(! $user->isAdmin(), fn ($query) => $query->whereHas('course.teachers', fn ($teachers) => $teachers->where('users.id', $user->id)));
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(QuestionBankCategory::class, 'category_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(BankQuestionVersion::class)->orderByDesc('version');
    }

    public function usages(): HasMany
    {
        return $this->hasMany(QuizQuestion::class);
    }
}
