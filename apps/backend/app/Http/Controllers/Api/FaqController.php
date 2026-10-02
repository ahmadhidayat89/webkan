<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faq;

class FaqController extends Controller
{
    /**
     * Get list of active FAQs for public pages.
     */
    public function index()
    {
        $faqs = Faq::active()
            ->ordered()
            ->get()
            ->map(fn (Faq $faq) => [
                'id' => $faq->id,
                'question' => $faq->question,
                'answer' => $faq->answer,
            ]);

        return response()->json([
            'success' => true,
            'data' => $faqs,
        ]);
    }
}
