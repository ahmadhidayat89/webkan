<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    /**
     * Daftar FAQ untuk website (public)
     * - /faqs         : semua FAQ aktif (halaman FAQ)
     * - /faqs?home=1  : hanya yang aktif DAN tampil di beranda
     */
    public function index(Request $request)
    {
        $faqs = Faq::query()
            ->where('is_active', true)
            ->when($request->boolean('home'), fn ($q) => $q->where('show_on_home', true))
            ->orderBy('order')
            ->orderBy('id')
            ->get(['id', 'question', 'answer']);

        return response()->json([
            'success' => true,
            'data' => $faqs,
        ]);
    }
}