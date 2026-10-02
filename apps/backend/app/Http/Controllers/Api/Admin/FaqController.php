<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    /**
     * Display a listing of FAQs.
     */
    public function index(Request $request)
    {
        $query = Faq::query();

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($subQuery) use ($search) {
                $subQuery->where('question', 'like', "%{$search}%")
                    ->orWhere('answer', 'like', "%{$search}%");
            });
        }

        $faqs = $query->ordered()->get();

        return response()->json([
            'success' => true,
            'data' => $faqs,
        ]);
    }

    /**
     * Store a newly created FAQ.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'question' => 'required|string|max:255',
            'answer' => 'required|string',
            'order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'show_on_home' => 'nullable|boolean',
        ]);

        if (!array_key_exists('order', $validated)) {
            $validated['order'] = (Faq::max('order') ?? 0) + 1;
        }

        if (!array_key_exists('is_active', $validated)) {
            $validated['is_active'] = true;
        }

        if (!array_key_exists('show_on_home', $validated)) {
            $validated['show_on_home'] = true;
        }

        $faq = Faq::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'FAQ created successfully',
            'data' => $faq,
        ], 201);
    }

    /**
     * Display the specified FAQ.
     */
    public function show($id)
    {
        $faq = Faq::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $faq,
        ]);
    }

    /**
     * Update the specified FAQ.
     */
    public function update(Request $request, $id)
    {
        $faq = Faq::findOrFail($id);

        $validated = $request->validate([
            'question' => 'sometimes|required|string|max:255',
            'answer' => 'sometimes|required|string',
            'order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'show_on_home' => 'nullable|boolean',
        ]);

        $faq->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'FAQ updated successfully',
            'data' => $faq,
        ]);
    }

    /**
     * Remove the specified FAQ.
     */
    public function destroy($id)
    {
        $faq = Faq::findOrFail($id);
        $faq->delete();

        return response()->json([
            'success' => true,
            'message' => 'FAQ deleted successfully',
        ]);
    }

    /**
     * Toggle FAQ active status.
     */
    public function toggleActive($id)
    {
        $faq = Faq::findOrFail($id);
        $faq->is_active = !$faq->is_active;
        $faq->save();

        return response()->json([
            'success' => true,
            'message' => 'FAQ status updated successfully',
            'data' => $faq,
        ]);
    }

    /**
     * Toggle FAQ visibility on home page.
     */
    public function toggleShowOnHome($id)
    {
        $faq = Faq::findOrFail($id);
        $faq->show_on_home = !$faq->show_on_home;
        $faq->save();

        return response()->json([
            'success' => true,
            'message' => 'FAQ home visibility updated successfully',
            'data' => $faq,
        ]);
    }
}
