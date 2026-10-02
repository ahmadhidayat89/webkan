<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;

class MenuController extends Controller
{
    public function index()
    {
        $menus = Menu::active()
            ->parentOnly()
            ->with(['children' => fn($q) => $q->active()->ordered()])
            ->ordered()
            ->get()
            ->map(fn($m) => [
                'id'       => $m->id,
                'title_id' => $m->title_id,
                'url'      => $m->url,
                'order'    => $m->order,
                'children' => $m->children->map(fn($c) => [
                    'id'       => $c->id,
                    'title_id' => $c->title_id,
                    'url'      => $c->url,
                    'order'    => $c->order,
                ]),
            ]);

        return response()->json(['success' => true, 'data' => $menus]);
    }
}
