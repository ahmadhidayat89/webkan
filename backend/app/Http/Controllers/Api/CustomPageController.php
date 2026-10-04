<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Page;

class CustomPageController extends Controller
{
    public function show(string $slug)
    {
        $page = Page::published()->where('slug', $slug)->firstOrFail();

        return response()->json(['success' => true, 'data' => $page]);
    }
}
