<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PageContent extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_id',
        'content_id',
        'image',
    ];

    /**
     * Halaman yang memiliki konten ini (join via slug).
     */
    public function page()
    {
        return $this->belongsTo(Page::class, 'page_id', 'slug');
    }
}