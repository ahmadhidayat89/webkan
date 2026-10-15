<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lpk;
use App\Services\LpkImport\LpkFileStatusImporter;
use App\Services\LpkImport\LpkImportColumns;
use App\Services\LpkImport\LpkManualImporter;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LpkController extends Controller
{
    public function __construct(
        private LpkManualImporter $manualImporter,
        private LpkFileStatusImporter $fileImporter,
    ) {
    }

    public function index(Request $request)
    {
        // tab: semua | terakreditasi | dibekukan | dicabut
        $query = Lpk::query()->inTab($request->get('tab', 'semua'));

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $s = '%' . strtolower($request->search) . '%';
            $query->where(function ($q) use ($s) {
                $q->whereRaw('LOWER(name) LIKE ?', [$s])
                    ->orWhereRaw('LOWER(certificate_number) LIKE ?', [$s])
                    ->orWhereRaw('LOWER(address) LIKE ?', [$s])
                    ->orWhereRaw('LOWER(scope) LIKE ?', [$s]);
            });
        }

        $data = $query->naturalOrder()
            ->paginate(min((int) $request->get('per_page', 10), 50));

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

    /**
     * Import data LPK dari file Excel/CSV.
     * Logika import ada di App\Services\LpkImport.
     */
    public function importFile(Request $request)
    {
        $request->validate([
            'status_choice' => ['required', Rule::in(['from_file', 'active', 'suspended_full', 'suspended_partial', 'revoked'])],
            'type'          => ['required', 'string', 'max:191'],
            'file'          => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:1024'],
            'dry_run'       => ['nullable', 'boolean'],
        ]);

        $file   = $request->file('file');
        $dryRun = $request->boolean('dry_run');

        // from_file: status dibaca dari kolom STATUS di dalam file
        $result = $request->status_choice === 'from_file'
            ? $this->fileImporter->import($file, $request->type, $dryRun)
            : $this->manualImporter->import($file, $request->status_choice, $request->type, $dryRun);

        return response()->json($result['body'], $result['status']);
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
            'certificate_link'   => ['nullable', 'string', 'max:500'],

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
                $data['suspension_status'] = LpkImportColumns::FULL_SUSPENSION_STATUS;
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
