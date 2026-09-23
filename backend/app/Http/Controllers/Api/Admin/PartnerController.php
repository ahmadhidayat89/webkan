<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PartnerController extends Controller
{
    /**
     * Display a listing of partners.
     */
    public function index(Request $request)
    {
        $query = Partner::query();

        // Filter by status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        // Sort by order
        $query->ordered();

        $partners = $query->get();

        return response()->json([
            'success' => true,
            'data' => $partners
        ]);
    }

    /**
     * Store a newly created partner.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,svg,webp|max:2048',
            'url' => 'nullable|url',
            'description' => 'nullable|string',
            'order' => 'nullable|integer',
            'is_active' => 'boolean'
        ]);

        // Handle logo upload
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('partners', 'public');
            $validated['logo'] = $logoPath;
        }

        // Auto-set order if not provided
        if (!isset($validated['order'])) {
            $maxOrder = Partner::max('order') ?? 0;
            $validated['order'] = $maxOrder + 1;
        }

        $partner = Partner::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Partner created successfully',
            'data' => $partner
        ], 201);
    }

    /**
     * Display the specified partner.
     */
    public function show($id)
    {
        $partner = Partner::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $partner
        ]);
    }

    /**
     * Update the specified partner.
     */
    public function update(Request $request, $id)
    {
        $partner = Partner::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,svg,webp|max:2048',
            'url' => 'nullable|url',
            'description' => 'nullable|string',
            'order' => 'nullable|integer',
            'is_active' => 'boolean'
        ]);

        // Handle logo upload
        if ($request->hasFile('logo')) {
            // Delete old logo
            if ($partner->logo) {
                Storage::disk('public')->delete($partner->logo);
            }
            
            $logoPath = $request->file('logo')->store('partners', 'public');
            $validated['logo'] = $logoPath;
        }

        $partner->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Partner updated successfully',
            'data' => $partner
        ]);
    }

    /**
     * Remove the specified partner.
     */
    public function destroy($id)
    {
        $partner = Partner::findOrFail($id);

        // Delete logo if exists
        if ($partner->logo) {
            Storage::disk('public')->delete($partner->logo);
        }

        $partner->delete();

        return response()->json([
            'success' => true,
            'message' => 'Partner deleted successfully'
        ]);
    }

    /**
     * Reorder partners.
     */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'orders' => 'required|array',
            'orders.*.id' => 'required|integer|exists:partners,id',
            'orders.*.order' => 'required|integer'
        ]);

        foreach ($validated['orders'] as $item) {
            Partner::where('id', $item['id'])->update(['order' => $item['order']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Partners reordered successfully'
        ]);
    }

    /**
     * Toggle partner active status.
     */
    public function toggleActive($id)
    {
        $partner = Partner::findOrFail($id);
        $partner->is_active = !$partner->is_active;
        $partner->save();

        return response()->json([
            'success' => true,
            'message' => 'Partner status updated successfully',
            'data' => $partner
        ]);
    }
}