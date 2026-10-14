<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\LpkType;
use Illuminate\Http\Request;

class LpkTypeController extends Controller
{
    // Daftar semua jenis LPK (untuk dropdown form, import, dan filter di admin)
    public function index()
    {
        return response()->json([
            'success' => true,
            'data'    => LpkType::orderBy('sort_order')->orderBy('name')->pluck('name'),
        ]);
    }

    // Tombol "Tambah Jenis LPK"
    public function store(Request $request)
    {
        // Rapikan spasi ganda dan spasi di pinggir
        $name = preg_replace('/\s+/', ' ', trim((string) $request->input('name')));
        $request->merge(['name' => $name]);

        $request->validate([
            'name' => ['required', 'string', 'min:3', 'max:191'],
        ], [
            'name.required' => 'Nama jenis LPK wajib diisi',
            'name.min'      => 'Nama jenis LPK minimal 3 karakter',
            'name.max'      => 'Nama jenis LPK maksimal 191 karakter',
        ]);

        // Cek duplikat tanpa peduli huruf besar-kecil
        $exists = LpkType::whereRaw('LOWER(name) = ?', [mb_strtolower($name)])->exists();
        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Jenis LPK "' . $name . '" sudah ada',
            ], 422);
        }

        $type = LpkType::create([
            'name'       => $name,
            'sort_order' => (int) LpkType::max('sort_order') + 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Jenis LPK berhasil ditambahkan',
            'data'    => $type->name,
        ], 201);
    }
}