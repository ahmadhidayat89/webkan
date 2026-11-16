<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReadinessAssessmentResponse extends Model
{
    protected $fillable = [
        'readiness_assessment_id',
        'submission_token',
        'scope',
        'selected_clauses',
        'identity',
        'responses',
        'status',
        'percentage',
        'yes_count',
        'partial_count',
        'no_count',
        'na_count',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'selected_clauses' => 'array',
        'identity' => 'array',
        'responses' => 'array',
        'percentage' => 'integer',
        'yes_count' => 'integer',
        'partial_count' => 'integer',
        'no_count' => 'integer',
        'na_count' => 'integer',
    ];

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(ReadinessAssessment::class, 'readiness_assessment_id');
    }
}
