<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BankQuizPackage extends Model
{
    protected $guarded = ['id'];

    protected $attributes = ['revision' => 1];

    protected $hidden = ['snapshot'];

    protected function casts(): array
    {
        return ['revision' => 'integer', 'snapshot' => 'array', 'archived_at' => 'datetime'];
    }

    public function scopeAccessibleTo(Builder $query, User $user): Builder
    {
        return $query->when(! $user->isAdmin(), fn ($query) => $query->whereHas('course.teachers', fn ($teachers) => $teachers->where('users.id', $user->id)));
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function usages(): HasMany
    {
        return $this->hasMany(Quiz::class);
    }
}
