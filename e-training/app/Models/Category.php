<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'sort_order',
    ];

    /**
     * Kursus yang termasuk dalam kategori ini.
     */
    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }
}
