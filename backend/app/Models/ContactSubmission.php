<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactSubmission extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'subject',
        'message',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];
}
