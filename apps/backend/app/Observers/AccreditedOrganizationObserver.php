<?php

namespace App\Observers;

use App\Models\AccreditedOrganization;
use App\Models\ActivityLog;

class AccreditedOrganizationObserver
{
    public function created(AccreditedOrganization $model): void
    {
        ActivityLog::recordModel('created', $model, 'directory', $model->name);
    }

    public function updated(AccreditedOrganization $model): void
    {
        ActivityLog::recordModel('updated', $model, 'directory', $model->name, $model->getOriginal());
    }

    public function deleted(AccreditedOrganization $model): void
    {
        ActivityLog::recordModel('deleted', $model, 'directory', $model->name);
    }
}
