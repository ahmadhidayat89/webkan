<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReadinessAssessment extends Model
{
    protected $fillable = ['draft', 'published', 'published_at'];

    protected $casts = [
        'draft' => 'array',
        'published' => 'array',
        'published_at' => 'datetime',
    ];

    public function responses(): HasMany
    {
        return $this->hasMany(ReadinessAssessmentResponse::class, 'readiness_assessment_id');
    }
}
