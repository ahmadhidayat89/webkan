<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\DownloadFile;

class DownloadFileObserver
{
    public function created(DownloadFile $model): void
    {
        ActivityLog::recordModel('created', $model, 'download_file', $model->title);
    }

    public function updated(DownloadFile $model): void
    {
        ActivityLog::recordModel('updated', $model, 'download_file', $model->title, $model->getOriginal());
    }

    public function deleted(DownloadFile $model): void
    {
        ActivityLog::recordModel('deleted', $model, 'download_file', $model->title);
    }
}
