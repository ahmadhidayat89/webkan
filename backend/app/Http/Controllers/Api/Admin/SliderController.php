<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Slider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SliderController extends Controller
{
    /**
     * Display a listing of sliders.
     */
    public function index()
    {
        $sliders = Slider::orderBy('order')->get();

        return response()->json([
            'success' => true,
            'data' => $sliders,
        ]);
    }

    /**
     * Store a newly created slider.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title_id' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'subtitle_id' => 'nullable|string',
            'subtitle_en' => 'nullable|string',
            'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
            'link' => 'nullable|string|max:500',
            'order' => 'nullable|integer',
            'is_active' => 'nullable|in:0,1,true,false',
        ]);
        $validated['is_active'] = filter_var($request->input('is_active', true), FILTER_VALIDATE_BOOLEAN);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('sliders', 'public');
        }

        $slider = Slider::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Slider created successfully',
            'data' => $slider,
        ], 201);
    }

    /**
     * Display the specified slider.
     */
    public function show(Slider $slider)
    {
        return response()->json([
            'success' => true,
            'data' => $slider,
        ]);
    }

    /**
     * Update the specified slider.
     */
    public function update(Request $request, Slider $slider)
    {
        $validated = $request->validate([
            'title_id' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'subtitle_id' => 'nullable|string',
            'subtitle_en' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'link' => 'nullable|string|max:500',
            'order' => 'nullable|integer',
            'is_active' => 'nullable|in:0,1,true,false',
        ]);
        $validated['is_active'] = filter_var($request->input('is_active', true), FILTER_VALIDATE_BOOLEAN);

        if ($request->hasFile('image')) {
            // Delete old image
            if ($slider->image) {
                Storage::disk('public')->delete($slider->image);
            }
            $validated['image'] = $request->file('image')->store('sliders', 'public');
        } elseif ($request->input('remove_image')) {
            if ($slider->image) {
                Storage::disk('public')->delete($slider->image);
            }
            $validated['image'] = null;
        }

        $slider->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Slider updated successfully',
            'data' => $slider,
        ]);
    }

    /**
     * Remove the specified slider.
     */
    public function destroy(Slider $slider)
    {
        // Delete image
        if ($slider->image) {
            Storage::disk('public')->delete($slider->image);
        }

        $slider->delete();

        return response()->json([
            'success' => true,
            'message' => 'Slider deleted successfully',
        ]);
    }

    /**
     * Reorder sliders.
     */
    public function reorder(Request $request)
    {
        $request->validate([
            'sliders' => 'required|array',
            'sliders.*.id' => 'required|exists:sliders,id',
            'sliders.*.order' => 'required|integer',
        ]);

        foreach ($request->sliders as $item) {
            Slider::where('id', $item['id'])->update(['order' => $item['order']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Sliders reordered successfully',
        ]);
    }
}