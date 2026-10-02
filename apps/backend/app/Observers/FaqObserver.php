<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Faq;

class FaqObserver
{
    public function created(Faq $model): void
    {
        ActivityLog::recordModel('created', $model, 'faq', substr($model->question, 0, 50));
    }

    public function updated(Faq $model): void
    {
        ActivityLog::recordModel('updated', $model, 'faq', substr($model->question, 0, 50), $model->getOriginal());
    }

    public function deleted(Faq $model): void
    {
        ActivityLog::recordModel('deleted', $model, 'faq', substr($model->question, 0, 50));
    }
}
