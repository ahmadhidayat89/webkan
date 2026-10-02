<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'subject',
        'message',
        'is_read',
        'ip_address',
        'user_agent',
        'status',
        'spam_score',
        'spam_reason',
        'submitted_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'submitted_at' => 'datetime',
        'spam_score' => 'integer',
    ];
}
