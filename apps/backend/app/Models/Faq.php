<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Faq extends Model
{
    use HasFactory;

    protected $fillable = [
        'question',
        'answer',
        'order',
        'is_active',
        'show_on_home',
    ];

    protected $casts = [
        'order' => 'integer',
        'is_active' => 'boolean',
        'show_on_home' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('order')->orderBy('id');
    }

    public function scopeShowOnHome($query)
    {
        return $query->where('show_on_home', true);
    }
}
