<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LessonFile extends Model
{
    protected $fillable = [
        'lesson_id',
        'original_name',
        'file_path',
        'mime_type',
        'file_size_kb',
        'sort_order',
    ];

    /**
     * Lesson yang memiliki file ini.
     */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
