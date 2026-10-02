<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value_id',
        'type',
        'group',
    ];

    public static function get(string $key, $default = null)
    {
        $setting = Cache::remember("setting_{$key}", 3600, function () use ($key) {
            return static::where('key', $key)->first();
        });

        return $setting?->value_id ?? $default;
    }

    public static function set(string $key, $valueId, string $type = 'text', string $group = 'general')
    {
        $setting = static::updateOrCreate(
            ['key' => $key],
            ['value_id' => $valueId, 'type' => $type, 'group' => $group]
        );

        Cache::forget("setting_{$key}");

        return $setting;
    }

    /**
     * Get all settings by group.
     */
    public static function getByGroup(string $group)
    {
        return Cache::remember("settings_group_{$group}", 3600, function () use ($group) {
            return static::where('group', $group)->get();
        });
    }

    /**
     * Clear settings cache.
     */
    public static function clearCache()
    {
        Cache::flush();
    }
}