<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Menu;

class MenuObserver
{
    public function created(Menu $model): void
    {
        ActivityLog::recordModel('created', $model, 'menu', $model->title);
    }

    public function updated(Menu $model): void
    {
        ActivityLog::recordModel('updated', $model, 'menu', $model->title, $model->getOriginal());
    }

    public function deleted(Menu $model): void
    {
        ActivityLog::recordModel('deleted', $model, 'menu', $model->title);
    }
}
