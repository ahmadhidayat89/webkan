<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Certificate extends Model
{
    protected $fillable = [
        'user_id',
        'course_id',
        'certificate_number',
        'verification_code',
        'issued_at',
        'expired_at',
        'file_path',
        'template_path',
    ];

    protected function casts(): array
    {
        return [
            'issued_at' => 'datetime',
            'expired_at' => 'datetime',
        ];
    }

    /**
     * URL publik untuk verifikasi QR Code.
     */
    public function getVerifyUrlAttribute(): string
    {
        return url('/verify/' . $this->verification_code);
    }

    /**
     * Pelajar pemilik sertifikat.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Kursus yang disertifikasi.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
