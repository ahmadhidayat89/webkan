<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    /**
     * Display all settings.
     */
    public function index(Request $request)
    {
        $query = Setting::query();

        // Filter by group
        if ($request->has('group')) {
            $query->where('group', $request->group);
        }

        $settings = $query->orderBy('group')->orderBy('key')->get();

        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    /**
     * Get settings by group.
     */
    public function getByGroup($group)
    {
        $settings = Setting::where('group', $group)->get();

        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    /**
     * Update or create a setting.
     */
    public function upsert(Request $request)
    {
        $validated = $request->validate([
            'key'   => 'required|string|max:255',
            'value_id' => 'required|string',
            'group' => 'required|string|max:100',
            'type'  => 'nullable|in:text,textarea,image,file,boolean',
        ]);

        $setting = Setting::updateOrCreate(
            ['key' => $validated['key']],
            $validated
        );

        // Clear cache
        cache()->forget('settings');

        ActivityLog::recordAction('updated', 'setting');

        return response()->json([
            'success' => true,
            'message' => 'Setting saved successfully',
            'data' => $setting
        ]);
    }

    /**
     * Bulk update settings.
     */
    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value_id' => 'nullable|string',
        ]);

        foreach ($validated['settings'] as $item) {
            $existing = Setting::where('key', $item['key'])->first();

            $group = $existing?->group;
            $type = $existing?->type;

            if (! $group) {
                $group = str_starts_with($item['key'], 'mail_') ? 'mail' : 'general';
            }

            if (! $type) {
                $type = 'text';
            }

            Setting::updateOrCreate(
                ['key' => $item['key']],
                [
                    'value_id' => $item['value_id'],
                    'group' => $group,
                    'type' => $type,
                ]
            );
        }

        // Clear cache
        cache()->forget('settings');

        ActivityLog::recordAction('updated', 'setting');

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully'
        ]);
    }

    /**
     * Upload image for settings.
     */
    public function uploadImage(Request $request)
    {
        $validated = $request->validate([
            'key' => 'required|string',
            'image' => 'required|image|mimes:jpeg,png,jpg,svg,webp|max:2048',
        ]);

        $setting = Setting::where('key', $validated['key'])->first();

        // Delete old image if exists
        if ($setting && $setting->value_id) {
            Storage::disk('public')->delete($setting->value_id);
        }

        // Upload new image
        $imagePath = $request->file('image')->store('settings', 'public');

        // Update setting
        Setting::updateOrCreate(
            ['key' => $validated['key']],
            [
                'value_id' => $imagePath,
                'type' => 'image',
                'group' => $request->get('group', 'general')
            ]
        );

        // Clear cache
        cache()->forget('settings');

        ActivityLog::recordAction('updated', 'setting');

        return response()->json([
            'success' => true,
            'message' => 'Image uploaded successfully',
            'data' => [
                'path' => $imagePath,
                'url' => Storage::url($imagePath)
            ]
        ]);
    }

    /**
     * Get social media settings only.
     */
    public function getSosmed()
    {
        $keys = ['social_facebook', 'social_twitter', 'social_instagram', 'social_youtube', 'social_tiktok', 'social_linkedin'];
        $settings = Setting::whereIn('key', $keys)->get()->keyBy('key');

        $result = [];
        foreach ($keys as $key) {
            $result[$key] = $settings[$key]->value_id ?? '';
        }

        return response()->json(['success' => true, 'data' => $result]);
    }

    /**
     * Save social media settings only.
     */
    public function saveSosmed(Request $request)
    {
        $allowed = ['social_facebook', 'social_twitter', 'social_instagram', 'social_youtube', 'social_tiktok', 'social_linkedin'];

        $request->validate([
            'settings'       => 'required|array',
            'settings.*.key' => 'required|string|in:' . implode(',', $allowed),
            'settings.*.value_id' => 'nullable|string|max:500',
        ]);

        foreach ($request->settings as $item) {
            Setting::updateOrCreate(
                ['key' => $item['key']],
                ['value_id' => $item['value_id'] ?? '', 'group' => 'social', 'type' => 'text']
            );
        }

        cache()->forget('settings');

        return response()->json(['success' => true, 'message' => 'Pengaturan sosmed berhasil disimpan']);
    }

    /**
     * Delete a setting.
     */
    public function destroy($key)
    {
        $setting = Setting::where('key', $key)->firstOrFail();

        // Delete file if type is image/file
        if (in_array($setting->type, ['image', 'file']) && $setting->value_id) {
            Storage::disk('public')->delete($setting->value_id);
        }

        $setting->delete();

        // Clear cache
        cache()->forget('settings');

        return response()->json([
            'success' => true,
            'message' => 'Setting deleted successfully'
        ]);
    }

    /**
     * Get all setting groups.
     */
    public function groups()
    {
        $groups = Setting::select('group')
            ->distinct()
            ->pluck('group');

        return response()->json([
            'success' => true,
            'data' => $groups
        ]);
    }

}
