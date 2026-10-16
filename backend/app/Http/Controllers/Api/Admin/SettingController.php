<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    public function socialIndex()
    {
        return response()->json([
            'success' => true,
            'data' => Setting::where('group', 'social')->orderBy('key')->get(),
        ]);
    }

    public function socialBulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array|min:1',
            'settings.*.key' => ['required', 'string', 'max:255', 'regex:/^social_[a-z0-9_]+$/'],
            'settings.*.value_id' => 'nullable|string|max:2048',
            'settings.*.value_en' => 'nullable|string|max:2048',
        ]);

        foreach ($validated['settings'] as $item) {
            // updateOrCreate: platform baru (TikTok, LinkedIn) otomatis dibuat saat pertama disimpan
            $setting = Setting::updateOrCreate(
                ['key' => $item['key']],
                [
                    'group' => 'social',
                    'type' => 'text',
                    'value_id' => $item['value_id'] ?? null,
                    'value_en' => $item['value_en'] ?? null,
                ]
            );
            cache()->forget("setting_{$setting->key}");
        }

        // Clear cache
        cache()->forget('settings');

        return response()->json(['success' => true, 'message' => 'Social media settings updated successfully.']);
    }

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
            'key' => 'required|string|max:255',
            'value_id' => 'required|string',
            'value_en' => 'nullable|string',
            'group' => 'required|string|max:100',
            'type' => 'nullable|in:text,textarea,image,file,boolean',
        ]);

        $setting = Setting::updateOrCreate(
            ['key' => $validated['key']],
            $validated
        );
        cache()->forget("setting_{$setting->key}");

        // Clear cache
        cache()->forget('settings');

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
            'settings.*.key' => 'required|string|max:255',
            'settings.*.value_id' => 'nullable|string',
            'settings.*.value_en' => 'nullable|string',
            'settings.*.group' => 'nullable|string|max:100',
        ]);

        foreach ($validated['settings'] as $item) {
            $setting = Setting::firstOrNew(['key' => $item['key']]);

            $setting->value_id = $item['value_id'] ?? null;
            $setting->value_en = $item['value_en'] ?? null;

            // group & type hanya diisi saat key baru dibuat
            if (!$setting->exists) {
                $setting->group = $item['group'] ?? 'general';
                $setting->type = 'text';
            }

            $setting->save();
            cache()->forget("setting_{$item['key']}");
        }

        cache()->forget('settings');

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
     * Delete a setting.
     */
    public function destroy($key)
    {
        $setting = Setting::where('key', $key)->firstOrFail();

        // Delete file if type is image/file
        if (in_array($setting->type, ['image', 'file']) && $setting->value) {
            Storage::disk('public')->delete($setting->value);
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

    /**
     * Get page content by page ID
     */
    public function getPageContent($pageId)
    {
        $contentId = Setting::where('key', "page_{$pageId}_content_id")->first();
        $contentEn = Setting::where('key', "page_{$pageId}_content_en")->first();
        $image = Setting::where('key', "page_{$pageId}_image")->first();

        return response()->json([
            'success' => true,
            'data' => [
                'page_id' => $pageId,
                'content_id' => $contentId?->value ?? '',
                'content_en' => $contentEn?->value ?? '',
                'image' => $image?->value ?? '',
                'updated_at' => $contentId?->updated_at ?? now(),
            ]
        ]);
    }

    /**
     * Save page content
     */
    public function savePageContent(Request $request)
    {
        $validated = $request->validate([
            'page_id' => 'required|string|max:100',
            'content_id' => 'required|string',
            'content_en' => 'nullable|string',
        ]);

        $pageId = $validated['page_id'];

        // Save content Indonesian
        Setting::updateOrCreate(
            ['key' => "page_{$pageId}_content_id"],
            [
                'value' => $validated['content_id'],
                'group' => 'page_content'
            ]
        );

        // Save content English
        Setting::updateOrCreate(
            ['key' => "page_{$pageId}_content_en"],
            [
                'value' => $validated['content_en'] ?? '',
                'group' => 'page_content'
            ]
        );

        // Handle image upload if present
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('pages', 'public');
            Setting::updateOrCreate(
                ['key' => "page_{$pageId}_image"],
                [
                    'value' => $path,
                    'group' => 'page_content'
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Page content saved successfully',
            'data' => [
                'page_id' => $pageId,
                'updated_at' => now(),
            ]
        ]);
    }

    /**
     * Get all page contents (for listing)
     */
    public function getAllPageContents()
    {
        $pages = [
            'sejarah-fungsi',
            'struktur-organisasi',
            'ketidakberpihakan',
            'pengakuan-internasional',
            'anggota-kan',
            'maklumat-layanan',
            'standar-layanan',
        ];

        $contents = [];
        foreach ($pages as $pageId) {
            $contentId = Setting::where('key', "page_{$pageId}_content_id")->first();
            $contents[] = [
                'page_id' => $pageId,
                'has_content' => $contentId && !empty($contentId->value),
                'updated_at' => $contentId?->updated_at ?? null,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $contents
        ]);
    }
}
