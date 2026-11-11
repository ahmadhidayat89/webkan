<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReadinessAssessment extends Model
{
    protected $fillable = ['draft', 'published', 'published_at'];

    protected $casts = [
        'draft' => 'array',
        'published' => 'array',
        'published_at' => 'datetime',
    ];
}
