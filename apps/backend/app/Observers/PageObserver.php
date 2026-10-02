<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Page;

class PageObserver
{
    public function created(Page $model): void
    {
        ActivityLog::recordModel('created', $model, 'page', $model->title_id);
    }

    public function updated(Page $model): void
    {
        ActivityLog::recordModel('updated', $model, 'page', $model->title_id, $model->getOriginal());
    }

    public function deleted(Page $model): void
    {
        ActivityLog::recordModel('deleted', $model, 'page', $model->title_id);
    }
}
