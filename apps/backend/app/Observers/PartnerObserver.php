<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Partner;

class PartnerObserver
{
    public function created(Partner $model): void
    {
        ActivityLog::recordModel('created', $model, 'partner', $model->name);
    }

    public function updated(Partner $model): void
    {
        ActivityLog::recordModel('updated', $model, 'partner', $model->name, $model->getOriginal());
    }

    public function deleted(Partner $model): void
    {
        ActivityLog::recordModel('deleted', $model, 'partner', $model->name);
    }
}
