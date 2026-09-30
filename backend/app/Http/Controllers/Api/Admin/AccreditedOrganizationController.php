<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccreditedOrganization;
use Illuminate\Http\Request;

class AccreditedOrganizationController extends Controller
{
    public function index(Request $request)
    {
        $query = AccreditedOrganization::query();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%$s%")
                  ->orWhere('certificate_number', 'like', "%$s%")
                  ->orWhere('address', 'like', "%$s%");
            });
        }

        $query->orderBy('name');
        $perPage = $request->get('per_page', 20);
        $data = $query->paginate($perPage);

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'               => 'required|string|max:255',
            'type'               => 'required|string|max:100',
            'certificate_number' => 'required|string|max:100|unique:accredited_organizations',
            'accreditation_date' => 'required|date',
            'expiry_date'        => 'required|date|after:accreditation_date',
            'status'             => 'required|in:active,suspended,revoked',
            'address'            => 'nullable|string',
            'phone'              => 'nullable|string|max:50',
            'email'              => 'nullable|email|max:255',
            'website'            => 'nullable|url|max:255',
            'certificate_link'   => 'nullable|url|max:255',
        ]);

        $org = AccreditedOrganization::create($validated);

        return response()->json(['success' => true, 'message' => 'Data berhasil ditambahkan', 'data' => $org], 201);
    }

    public function show($id)
    {
        $org = AccreditedOrganization::findOrFail($id);
        return response()->json(['success' => true, 'data' => $org]);
    }

    public function update(Request $request, $id)
    {
        $org = AccreditedOrganization::findOrFail($id);

        $validated = $request->validate([
            'name'               => 'sometimes|required|string|max:255',
            'type'               => 'sometimes|required|string|max:100',
            'certificate_number' => 'sometimes|required|string|max:100|unique:accredited_organizations,certificate_number,' . $id,
            'accreditation_date' => 'sometimes|required|date',
            'expiry_date'        => 'sometimes|required|date',
            'status'             => 'sometimes|required|in:active,suspended,revoked',
            'address'            => 'nullable|string',
            'phone'              => 'nullable|string|max:50',
            'email'              => 'nullable|email|max:255',
            'website'            => 'nullable|url|max:255',
            'certificate_link'   => 'nullable|url|max:255',
        ]);

        $org->update($validated);

        return response()->json(['success' => true, 'message' => 'Data berhasil diperbarui', 'data' => $org]);
    }

    public function destroy($id)
    {
        AccreditedOrganization::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Data berhasil dihapus']);
    }

    public function types()
    {
        $types = AccreditedOrganization::select('type')->distinct()->orderBy('type')->pluck('type');
        return response()->json(['success' => true, 'data' => $types]);
    }
}