<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DownloadFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_id',
        'title',
        'file_path',
        'file_size',
        'file_ext',
        'sort_order',
    ];
}
