<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LpkType extends Model
{
    protected $table = 'lpk_types';

    protected $fillable = ['name', 'sort_order'];
}