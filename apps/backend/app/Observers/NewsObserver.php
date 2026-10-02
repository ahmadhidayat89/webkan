<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\News;

class NewsObserver
{
    public function created(News $model): void
    {
        ActivityLog::recordModel('created', $model, 'news', $model->title_id);
    }

    public function updated(News $model): void
    {
        ActivityLog::recordModel('updated', $model, 'news', $model->title_id, $model->getOriginal());
    }

    public function deleted(News $model): void
    {
        ActivityLog::recordModel('deleted', $model, 'news', $model->title_id);
    }
}
