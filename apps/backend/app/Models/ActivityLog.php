<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

class ActivityLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id', 'user_name', 'user_email',
        'action', 'resource_type', 'resource_id', 'resource_label',
        'old_values', 'new_values', 'ip_address', 'user_agent',
        'created_at',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
    ];

    // Field yang tidak boleh dicatat
    private const HIDDEN_FIELDS = ['password', 'remember_token'];

    /**
     * Catat aktivitas terkait Eloquent model (created/updated/deleted).
     */
    public static function recordModel(
        string $action,
        Model $model,
        string $resourceType,
        ?string $label,
        array $oldValues = []
    ): void {
        $user = auth()->user();

        $newValues = $action !== 'deleted'
            ? collect($model->getAttributes())
                ->except(self::HIDDEN_FIELDS)
                ->toArray()
            : null;

        $filteredOld = $oldValues
            ? collect($oldValues)->except(self::HIDDEN_FIELDS)->toArray()
            : null;

        self::create([
            'user_id'        => $user?->id,
            'user_name'      => $user?->name ?? 'system',
            'user_email'     => $user?->email ?? '',
            'action'         => $action,
            'resource_type'  => $resourceType,
            'resource_id'    => $model->getKey(),
            'resource_label' => $label,
            'old_values'     => $filteredOld,
            'new_values'     => $newValues,
            'ip_address'     => Request::ip(),
            'user_agent'     => Request::userAgent(),
            'created_at'     => now(),
        ]);
    }

    /**
     * Catat aksi sederhana tanpa model (login, logout, dll).
     */
    public static function recordAction(string $action, ?string $resourceType = null): void
    {
        $user = auth()->user();

        self::create([
            'user_id'       => $user?->id,
            'user_name'     => $user?->name ?? 'unknown',
            'user_email'    => $user?->email ?? '',
            'action'        => $action,
            'resource_type' => $resourceType,
            'ip_address'    => Request::ip(),
            'user_agent'    => Request::userAgent(),
            'created_at'    => now(),
        ]);
    }
}
