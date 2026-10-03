<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseEvent extends Model
{
    protected $fillable = [
        'course_id',
        'title',
        'description',
        'start_datetime',
        'end_datetime',
        'event_type',
    ];

    protected function casts(): array
    {
        return [
            'start_datetime' => 'datetime',
            'end_datetime' => 'datetime',
        ];
    }

    /**
     * Kursus yang memiliki event ini.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Scope: hanya event yang akan datang.
     */
    public function scopeUpcoming($query)
    {
        return $query->where('start_datetime', '>=', now())
                     ->orderBy('start_datetime', 'asc');
    }
}
