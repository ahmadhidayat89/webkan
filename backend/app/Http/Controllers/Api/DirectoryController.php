<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AccreditedOrganization;
use Illuminate\Http\Request;

class DirectoryController extends Controller
{
    /**
     * Map route segment ke status di DB.
     * terakreditasi  → active
     * akreditasi-dibekukan → suspended
     * akreditasi-dicabut   → revoked
     */
    private array $statusMap = [
        'terakreditasi'        => 'active',
        'akreditasi-dibekukan' => 'suspended',
        'akreditasi-dicabut'   => 'revoked',
        'semua'                => null, // null = all statuses
    ];

    public function index(Request $request, string $segment)
    {
        if (!array_key_exists($segment, $this->statusMap)) {
            return response()->json(['success' => false, 'message' => 'Segmen direktori tidak valid'], 404);
        }

        $status = $this->statusMap[$segment];
        $query = AccreditedOrganization::query();

        if ($status !== null) {
            $query->where('status', $status);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('search')) {
            $s = strtolower($request->search);
            $query->where(function ($q) use ($s) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%$s%"])
                  ->orWhereRaw('LOWER(certificate_number) LIKE ?', ["%$s%"]);
            });
        }

        $query->orderBy('name');
        $perPage = $request->get('per_page', 20);
        $data = $query->paginate($perPage);

        // Available types for filter
        $typesQuery = AccreditedOrganization::select('type')->distinct()->orderBy('type');
        if ($status !== null) {
            $typesQuery->where('status', $status);
        }
        $types = $typesQuery->pluck('type');

        return response()->json([
            'success' => true,
            'status'  => $status,
            'data'    => $data,
            'types'   => $types,
        ]);
    }
}
