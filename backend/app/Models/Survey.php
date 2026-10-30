<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Survey extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'title',
        'description',
        'is_published',
        'is_active',
        'created_by',
        'settings',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'is_active' => 'boolean',
        'settings' => 'array',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function questions()
    {
        return $this->hasMany(SurveyQuestion::class)->orderBy('order', 'asc');
    }

    public function responses()
    {
        return $this->hasMany(SurveyResponse::class);
    }
}
