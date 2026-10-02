<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'username', 'email', 'password', 'role', 'avatar', 'phone', 'organization', 'bio', 'last_seen_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Role yang tersedia: 'pelajar', 'admin'
     * - pelajar : peserta pelatihan
     * - admin   : pengelola platform (membuat kursus, mengelola user)
     */

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'last_seen_at'      => 'datetime',
        ];
    }

    /**
     * Cek apakah user sedang online (aktif dalam 5 menit terakhir).
     */
    public function isOnline(): bool
    {
        return $this->last_seen_at && $this->last_seen_at->gt(now()->subMinutes(5));
    }

    /**
     * Cek apakah user adalah pelajar (peserta pelatihan).
     */
    public function isPelajar(): bool
    {
        return $this->role === 'pelajar';
    }

    /**
     * Cek apakah user adalah admin (pengelola platform).
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Kursus yang dibuat oleh user sebagai pembelajar/instruktur.
     */
    public function createdCourses(): HasMany
    {
        return $this->hasMany(Course::class, 'instructor_id');
    }

    /**
     * Pendaftaran kursus user sebagai pelajar.
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * Progress pelajaran user.
     */
    public function lessonProgress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }

    /**
     * Percobaan kuis user.
     */
    public function quizAttempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    /**
     * Sertifikat yang dimiliki user.
     */
    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }
}
