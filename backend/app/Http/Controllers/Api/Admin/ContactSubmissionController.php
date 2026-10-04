<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactSubmission;
use Illuminate\Http\Request;

class ContactSubmissionController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => ContactSubmission::query()
                ->latest()
                ->paginate(25),
        ]);
    }

    public function update(Request $request, ContactSubmission $contactSubmission)
    {
        $validated = $request->validate([
            'is_read' => 'required|boolean',
        ]);

        $contactSubmission->read_at = $validated['is_read'] ? now() : null;
        $contactSubmission->save();

        return response()->json(['success' => true]);
    }

    public function destroy(ContactSubmission $contactSubmission)
    {
        $contactSubmission->delete();

        return response()->json(['success' => true]);
    }
}
