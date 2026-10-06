<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Course extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'instructor_id',
        'category_id',
        'title',
        'slug',
        'description',
        'short_description',
        'thumbnail',
        'level',
        'duration_hours',
        'status',
        'is_featured',
        'referral_code',
        'published_at',
        'certificate_template',
        'certificate_signature',
        'deadline_at',
    ];

    protected function casts(): array
    {
        return [
            'is_featured' => 'boolean',
            'published_at' => 'datetime',
            'deadline_at' => 'datetime',
        ];
    }

    /**
     * Instruktur/Pembelajar yang membuat kursus ini.
     */
    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    /**
     * Kategori kursus.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Modul-modul dalam kursus ini.
     */
    public function modules(): HasMany
    {
        return $this->hasMany(Module::class)->orderBy('sort_order');
    }

    /**
     * Pendaftaran pelajar ke kursus ini.
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * Sertifikat yang dikeluarkan untuk kursus ini.
     */
    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }

    /**
     * Event-event kursus (deadline, live session, assessment).
     */
    public function events(): HasMany
    {
        return $this->hasMany(CourseEvent::class)->orderBy('start_datetime');
    }

    /**
     * Cek apakah kursus sudah dipublish.
     */
    public function isPublished(): bool
    {
        return $this->status === 'published';
    }
    
    /**
     * Cek apakah deadline kursus sudah lewat.
     */
    public function isExpired(): bool
    {
        return $this->deadline_at !== null && now()->greaterThan($this->deadline_at);
    }
}
