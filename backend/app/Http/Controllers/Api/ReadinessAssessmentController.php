<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReadinessAssessment;

class ReadinessAssessmentController extends Controller
{
    public function index()
    {
        $assessments = ReadinessAssessment::query()->whereNotNull('published_at')
            ->latest('published_at')->get(['id', 'published'])->map(fn ($assessment) => [
                'id' => $assessment->id,
                'title' => $assessment->published['title'],
                'standard' => $assessment->published['standard'],
                'subtitle' => $assessment->published['subtitle'],
            ]);

        return response()->json(['data' => $assessments]);
    }

    public function show(ReadinessAssessment $readinessAssessment)
    {
        abort_unless($readinessAssessment->published_at, 404);

        return response()->json(['data' => $readinessAssessment->published]);
    }
}
