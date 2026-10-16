<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lpk extends Model
{
    protected $table = 'lpks';

    protected $fillable = [
        'type',
        'certificate_number',
        'name',
        'address',
        'phone',
        'email',
        'scope',
        'expiry_date',
        'certificate_link',
        'status',
        'suspension_scope',
        'suspension_status',
        'suspended_at',
        'revoked_at',
    ];

    protected $casts = [
        'expiry_date'  => 'date:Y-m-d',
        'suspended_at' => 'date:Y-m-d',
        'revoked_at'   => 'date:Y-m-d',
    ];

    // Ikut dikirim ke frontend, dipakai untuk teks pill
    protected $appends = ['status_label'];

    public function getStatusLabelAttribute(): string
    {
        return match (true) {
            $this->status === 'revoked' => 'Dicabut',
            $this->status === 'suspended' && $this->suspension_scope === 'full' => 'Pembekuan Seluruh RL',
            $this->status === 'suspended' && $this->suspension_scope === 'partial' => 'Pembekuan Sebagian RL',
            $this->status === 'suspended' => 'Pembekuan',
            default => 'Terakreditasi',
        };
    }

    /**
     * Filter LPK sesuai tab:
     * semua         -> semua status
     * terakreditasi -> active + suspended (yang dibekukan tetap tampil)
     * dibekukan     -> suspended saja
     * dicabut       -> revoked saja
     */
    public function scopeInTab($query, string $tab)
    {
        return match ($tab) {
            'terakreditasi' => $query->whereIn('status', ['active', 'suspended']),
            'dibekukan'     => $query->where('status', 'suspended'),
            'dicabut'       => $query->where('status', 'revoked'),
            default         => $query,
        };
    }
    
    /**
     * Urutan natural nomor akreditasi:
     * awalan (LK-, LP-, LSPJK-, ...) berdasarkan abjad, lalu angkanya dibaca sebagai angka.
     * Contoh: LP-2 < LP-10 < LP-1169. Khusus PostgreSQL.
     */
    public function scopeNaturalOrder($query)
    {
        return $query
            ->orderByRaw("UPPER(regexp_replace(certificate_number, '[0-9].*$', '')) COLLATE \"C\"")
            ->orderByRaw("CAST(substring(certificate_number from '[0-9]+') AS NUMERIC) NULLS LAST")
            ->orderBy('name')
            ->orderBy('id');
    }
}
