<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Document extends Model
{
    protected $fillable = [
        'parent_id',
        'name',
        'slug',
        'description',
        'type',
        'file_type',
        'language',
        'link',
        'sort_order',
        'is_active',
    ];

    /**
     * Parent category/subcategory.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'parent_id');
    }

    /**
     * Child category/subcategory/document.
     */
    public function children(): HasMany
    {
        return $this->hasMany(Document::class, 'parent_id')
            ->orderBy('sort_order');
    }
}