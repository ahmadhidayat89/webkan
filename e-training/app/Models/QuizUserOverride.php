<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizUserOverride extends Model
{
    protected $fillable = [
        'quiz_id',
        'user_id',
        'extra_attempts',
        'open_until',
        'granted_by',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'open_until' => 'datetime',
        ];
    }

    /**
     * Apakah tenggat khusus ini masih berlaku (melewati jadwal kuis dan modul).
     */
    public function bypassesSchedule(): bool
    {
        return $this->open_until !== null && now()->lessThanOrEqualTo($this->open_until);
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function grantedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'granted_by');
    }
}
