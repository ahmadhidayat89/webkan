<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DownloadFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DownloadFileController extends Controller
{
    /** GET /admin/download-files?page_id=unduh/dokumen-akreditasi */
    public function index(Request $request)
    {
        $files = DownloadFile::where('page_id', $request->query('page_id'))
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json(['success' => true, 'data' => $files]);
    }

    /** POST /admin/download-files */
    public function store(Request $request)
    {
        $request->validate([
            'page_id' => 'required|string|max:100',
            'title'   => 'required|string|max:255',
            'file'    => 'required|file|max:20480', // 20 MB
        ]);

        $file = $request->file('file');
        $ext  = strtolower($file->getClientOriginalExtension());
        $path = $file->store('download-files', 'public');

        $record = DownloadFile::create([
            'page_id'    => $request->input('page_id'),
            'title'      => $request->input('title'),
            'file_path'  => $path,
            'file_size'  => $file->getSize(),
            'file_ext'   => $ext,
            'sort_order' => DownloadFile::where('page_id', $request->input('page_id'))->max('sort_order') + 1,
        ]);

        return response()->json(['success' => true, 'data' => $record], 201);
    }

    /** DELETE /admin/download-files/{id} */
    public function destroy($id)
    {
        $record = DownloadFile::findOrFail($id);
        Storage::disk('public')->delete($record->file_path);
        $record->delete();

        return response()->json(['success' => true, 'message' => 'File dihapus']);
    }

    /** PATCH /admin/download-files/{id}/rename */
    public function rename(Request $request, $id)
    {
        $request->validate(['title' => 'required|string|max:255']);
        $record = DownloadFile::findOrFail($id);
        $record->update(['title' => $request->input('title')]);

        return response()->json(['success' => true, 'data' => $record]);
    }
}
