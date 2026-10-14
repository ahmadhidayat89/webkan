<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enrollment extends Model
{
    protected $fillable = [
        'user_id',
        'course_id',
        'status',
        'progress_percent',
        'enrolled_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'enrolled_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * Peserta yang mendaftar.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Kursus yang didaftarkan.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
