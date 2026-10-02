<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\User;

class UserObserver
{
    public function created(User $model): void
    {
        ActivityLog::recordModel('created', $model, 'user', $model->name);
    }

    public function updated(User $model): void
    {
        // password & remember_token di-exclude otomatis oleh ActivityLog::recordModel
        ActivityLog::recordModel('updated', $model, 'user', $model->name, $model->getOriginal());
    }

    public function deleted(User $model): void
    {
        ActivityLog::recordModel('deleted', $model, 'user', $model->name);
    }
}
