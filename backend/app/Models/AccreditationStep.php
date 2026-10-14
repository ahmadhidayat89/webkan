<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccreditationStep extends Model
{
    protected $fillable = [
        'sort_order',
        'icon',
        'title',
        'tag',
        'description',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('id');
    }
}