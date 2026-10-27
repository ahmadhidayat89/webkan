<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lpk;
use Illuminate\Http\Request;

class DirectoryController extends Controller
{
    // segment di URL => nama tab di model Lpk
    private array $tabMap = [
        'semua'                => 'semua',
        'terakreditasi'        => 'terakreditasi',
        'akreditasi-dibekukan' => 'dibekukan',
        'akreditasi-dicabut'   => 'dicabut',
    ];

    public function index(Request $request, string $segment)
    {
        $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'type'   => ['nullable', 'string', 'max:191'],
            'focus'  => ['nullable', 'string', 'max:100'],
            'page'   => ['nullable', 'integer', 'min:1'],
        ]);
        
        if (!isset($this->tabMap[$segment])) {
            return response()->json(['success' => false, 'message' => 'Segmen direktori tidak valid'], 404);
        }

        $tab     = $this->tabMap[$segment];
        $perPage = max(1, min((int) $request->get('per_page', 10), 50));
        // Daftar tipe yang tersedia di tab ini (untuk dropdown filter)
        $types = Lpk::inTab($tab)->select('type')->distinct()->orderBy('type')->pluck('type');

        $query = Lpk::query()->inTab($tab);

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $term = addcslashes(mb_strtolower($request->search), '%_\\');
            $s = "%{$term}%";

            $query->where(function ($q) use ($s) {
                $q->whereRaw('LOWER(name) LIKE ?', [$s])
                    ->orWhereRaw('LOWER(certificate_number) LIKE ?', [$s])
                    ->orWhereRaw('LOWER(address) LIKE ?', [$s])
                    ->orWhereRaw('LOWER(scope) LIKE ?', [$s])
                    ->orWhereRaw('LOWER(suspension_status) LIKE ?', [$s]);
            });
        }

        // Fitur klik pill: ?focus=NOMOR_AKREDITASI
        // Cari LPK itu ada di halaman berapa (sesuai urutan tabel), lalu buka halaman tersebut.
        $page    = max(1, (int) $request->get('page', 1));
        $focusId = null;

        if ($request->filled('focus')) {
            $targetId = (clone $query)->where('certificate_number', $request->focus)->value('id');

            if ($targetId) {
                $orderedIds = (clone $query)->naturalOrder()->pluck('id');
                $position   = $orderedIds->search($targetId);

                if ($position !== false) {
                    $page    = intdiv($position, $perPage) + 1;
                    $focusId = $targetId;
                }
            }
        }

        $data = $query->naturalOrder()->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'success'  => true,
            'data'     => $data,
            'types'    => $types,
            'focus_id' => $focusId,
        ]);
    }
}
