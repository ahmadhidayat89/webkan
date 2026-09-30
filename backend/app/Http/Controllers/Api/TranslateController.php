<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\HtmlAutoTranslator;
use Illuminate\Http\Request;

class TranslateController extends Controller
{
    public function __construct(private readonly HtmlAutoTranslator $translator)
    {
    }

    public function texts(Request $request)
    {
        $validated = $request->validate([
            'texts' => 'required|array|max:200',
            'texts.*' => 'required|string|max:1000',
            'from' => 'nullable|string|size:2',
            'to' => 'nullable|string|size:2',
        ]);

        $from = strtolower($validated['from'] ?? 'id');
        $to = strtolower($validated['to'] ?? 'en');
        $texts = $validated['texts'];

        $translated = $this->translator->translateTexts($texts, $from, $to);

        return response()->json([
            'success' => true,
            'data' => [
                'from' => $from,
                'to' => $to,
                'items' => array_map(
                    static fn ($src, $dst) => ['source' => $src, 'translated' => $dst],
                    $texts,
                    $translated
                ),
            ],
        ]);
    }
}