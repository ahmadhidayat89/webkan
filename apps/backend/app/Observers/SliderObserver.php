<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Slider;

class SliderObserver
{
    public function created(Slider $model): void
    {
        ActivityLog::recordModel('created', $model, 'slider', $model->title_id);
    }

    public function updated(Slider $model): void
    {
        ActivityLog::recordModel('updated', $model, 'slider', $model->title_id, $model->getOriginal());
    }

    public function deleted(Slider $model): void
    {
        ActivityLog::recordModel('deleted', $model, 'slider', $model->title_id);
    }
}
