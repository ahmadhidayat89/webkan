<?php

namespace App\Http\Controllers;

use App\Models\Discussion;
use App\Models\LessonFile;
use App\Services\ModuleProgression;
use Illuminate\Support\Facades\Storage;

class LearningFileController extends Controller
{
    public function lesson(LessonFile $file)
    {
        app(ModuleProgression::class)->authorizeLesson($file->lesson, auth()->user());

        return Storage::disk('local')->response($file->file_path, $file->original_name);
    }

    public function discussion(Discussion $discussion)
    {
        app(ModuleProgression::class)->authorizeLesson($discussion->lesson, auth()->user());
        abort_unless($discussion->file_path, 404);

        return Storage::disk('local')->response($discussion->file_path, $discussion->file_name);
    }
}
