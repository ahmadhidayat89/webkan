<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Hanya group ini yang boleh dibaca publik.
     * Group baru (misalnya untuk email/SMTP) tidak akan ikut terbuka
     * kecuali sengaja ditambahkan di sini.
     */
    private const PUBLIC_GROUPS = ['about', 'contact', 'general', 'social'];

    /**
     * Key di dalam group publik yang tetap disembunyikan.
     */
    private const HIDDEN_KEYS = ['contact_inbox_email'];

    /**
     * Get all public settings.
     */
    public function index(Request $request)
    {
        $lang = $request->query('lang', 'id');
        $group = $request->query('group');

        $query = Setting::query()
            ->whereIn('group', self::PUBLIC_GROUPS)
            ->whereNotIn('key', self::HIDDEN_KEYS);

        if (is_string($group) && $group !== '') {
            $query->where('group', $group);
        }

        $settings = $query->get()->mapWithKeys(function ($setting) use ($lang) {
            $value = $lang === 'en' && $setting->value_en
                ? $setting->value_en
                : $setting->value_id;

            if ($setting->type === 'image' && $value) {
                $value = asset('storage/' . $value);
            }

            return [$setting->key => $value];
        });

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    /**
     * Get a public setting by key.
     */
    public function show(Request $request, $key)
    {
        $lang = $request->query('lang', 'id');

        $isPublic = !in_array($key, self::HIDDEN_KEYS, true)
            && Setting::where('key', $key)
                ->whereIn('group', self::PUBLIC_GROUPS)
                ->exists();

        $value = $isPublic ? Setting::get($key, $lang) : null;

        if ($value === null) {
            return response()->json([
                'success' => false,
                'message' => 'Setting not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'key' => $key,
                'value' => $value,
            ],
        ]);
    }
}
