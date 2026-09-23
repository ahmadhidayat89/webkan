<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Get all settings.
     */
    public function index(Request $request)
    {
        $lang = $request->get('lang', 'id');
        $group = $request->get('group');

        $query = Setting::query();

        if ($group) {
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
     * Get setting by key.
     */
    public function show(Request $request, $key)
    {
        $lang = $request->get('lang', 'id');
        $value = Setting::get($key, $lang);

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