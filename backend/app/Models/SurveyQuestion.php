<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SurveyQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'survey_id',
        'order',
        'text',
        'type',
        'is_required',
        'options',
        'image_url',
        'validation',
    ];

    protected $casts = [
        'order' => 'integer',
        'is_required' => 'boolean',
        'options' => 'array',
        'validation' => 'array',
    ];

    public function survey()
    {
        return $this->belongsTo(Survey::class);
    }

    public function answers()
    {
        return $this->hasMany(SurveyAnswer::class, 'question_id');
    }
}