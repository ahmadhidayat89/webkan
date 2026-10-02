<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class AccreditedOrganization extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'certificate_number',
        'accreditation_date',
        'expiry_date',
        'status',
        'address',
        'phone',
        'email',
        'website',
    ];

    protected $casts = [
        'accreditation_date' => 'date',
        'expiry_date' => 'date',
    ];

    /**
     * Scope untuk active organizations.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope untuk filter by type.
     */
    public function scopeType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Check if accreditation is expired.
     */
    public function isExpired(): bool
    {
        return $this->expiry_date < Carbon::now();
    }

    /**
     * Check if accreditation is about to expire (within 3 months).
     */
    public function isExpiringSoon(): bool
    {
        $threeMonthsFromNow = Carbon::now()->addMonths(3);
        return $this->expiry_date <= $threeMonthsFromNow && $this->expiry_date >= Carbon::now();
    }

    /**
     * Get days until expiry.
     */
    public function getDaysUntilExpiryAttribute()
    {
        return Carbon::now()->diffInDays($this->expiry_date, false);
    }
}