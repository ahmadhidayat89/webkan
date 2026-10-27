<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lpk;
use App\Services\Lpk\LpkFileImporter;
use App\Services\Lpk\LpkImportSupport;
use App\Services\Lpk\LpkManualImporter;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LpkController extends Controller
{
    public function __construct(
        private LpkManualImporter $manualImporter,
        private LpkFileImporter $fileImporter,
    ) {}

    public function index(Request $request)
    {
        $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'type'   => ['nullable', 'string', 'max:191'],
            'tab'    => ['nullable', 'string', 'max:50'],
            'page'   => ['nullable', 'integer', 'min:1'],
        ]);

        // tab: semua | terakreditasi | dibekukan | dicabut
        $query = Lpk::query()->inTab($request->get('tab', 'semua'));

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
                    ->orWhereRaw('LOWER(scope) LIKE ?', [$s]);
            });
        }

        $data = $query->naturalOrder()
            ->paginate(max(1, min((int) $request->get('per_page', 10), 50)));
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules(), $this->messages());
        $lpk  = Lpk::create($this->normalizeStatus($data));

        return response()->json(['success' => true, 'message' => 'Data berhasil ditambahkan', 'data' => $lpk], 201);
    }

    public function update(Request $request, int|string $id)
    {
        $lpk  = Lpk::findOrFail($id);
        $data = $request->validate($this->rules((int) $id), $this->messages());

        // LPK yang sudah dicabut statusnya dikunci
        if ($lpk->status === 'revoked' && $data['status'] !== 'revoked') {
            return response()->json([
                'success' => false,
                'message' => 'Status LPK yang sudah dicabut tidak dapat diubah kembali. LPK harus didaftarkan sebagai LPK baru dengan nomor akreditasi baru.',
            ], 422);
        }

        $lpk->update($this->normalizeStatus($data));

        return response()->json(['success' => true, 'message' => 'Data berhasil diperbarui', 'data' => $lpk]);
    }

    public function destroy(int|string $id)
    {
        Lpk::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Data berhasil dihapus']);
    }

    public function importFile(Request $request)
    {
        $request->validate([
            'status_choice' => ['required', Rule::in(['from_file', 'active', 'suspended_full', 'suspended_partial', 'revoked'])],
            'type'          => ['required', 'string', 'max:191'],
            'file'          => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:1024'],
            'dry_run'       => ['nullable', 'boolean'],
        ]);

        // Status dibaca dari kolom STATUS di dalam file
        if ($request->status_choice === 'from_file') {
            return $this->fileImporter->import($request);
        }

        return $this->manualImporter->import($request);
    }

    // ------------------------------------------------------------------

    private function rules(?int $ignoreId = null): array
    {
        return [
            'type'               => ['required', 'string', 'max:191'],
            'certificate_number' => ['required', 'string', 'max:100', Rule::unique('lpks', 'certificate_number')->ignore($ignoreId)],
            'name'               => ['required', 'string', 'max:255'],
            'address'            => ['nullable', 'string'],
            'phone'              => ['nullable', 'string', 'max:255'],
            'email'              => ['nullable', 'string'],
            'scope'              => ['nullable', 'string'],
            'expiry_date'        => ['nullable', 'date'],
            'certificate_link'   => ['nullable', 'url:http,https', 'max:500'],
            'status'             => ['required', Rule::in(['active', 'suspended', 'revoked'])],
            'suspension_scope'   => ['required_if:status,suspended', 'nullable', Rule::in(['full', 'partial'])],
            'suspension_status'  => ['nullable', 'string'],
            'suspended_at'       => ['nullable', 'date'],
            'revoked_at'         => ['nullable', 'date'],
        ];
    }

    private function messages(): array
    {
        return [
            'certificate_number.unique'    => 'No. Akreditasi sudah terdaftar',
            'suspension_scope.required_if' => 'Pilih jenis pembekuan (seluruh RL atau sebagian RL)',
        ];
    }

    /** Bersihkan kolom yang tidak relevan dengan status yang dipilih. */
    private function normalizeStatus(array $data): array
    {
        if ($data['status'] === 'active') {
            $data['suspension_scope']  = null;
            $data['suspension_status'] = null;
            $data['suspended_at']      = null;
            $data['revoked_at']        = null;
        } elseif ($data['status'] === 'suspended') {
            $data['revoked_at'] = null;
            if ($data['suspension_scope'] === 'full') {
                $data['suspension_status'] = LpkImportSupport::FULL_SUSPENSION_STATUS;
            }
        } else { // revoked
            $data['suspension_scope']  = null;
            $data['suspension_status'] = null;
            $data['suspended_at']      = null;
            $data['revoked_at']      ??= now()->toDateString();
        }

        return $data;
    }
}
