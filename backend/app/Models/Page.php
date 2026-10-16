<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Page extends Model
{
    use HasFactory;

    protected $fillable = [
        'title_id',
        'title_en',
        'slug',
        'content_id',
        'content_en',
        'meta_title_id',
        'meta_title_en',
        'meta_description_id',
        'meta_description_en',
        'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($page) {
            if (empty($page->slug)) {
                $page->slug = Str::slug($page->title_id);
            }
        });
    }

    /**
     * Scope untuk published pages.
     */
    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }
}
