<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faq;

class FaqController extends Controller
{
    /**
     * Daftar FAQ untuk ditampilkan di halaman depan (public)
     */
    public function index()
    {
        $faqs = Faq::orderBy('order')->orderBy('id')->get(['id', 'question', 'answer']);

        return response()->json([
            'success' => true,
            'data' => $faqs,
        ]);
    }
}