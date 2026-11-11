<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveReadinessAssessment;
use App\Models\ReadinessAssessment;
use Illuminate\Validation\ValidationException;

class ReadinessAssessmentController extends Controller
{
    public function index()
    {
        $assessments = ReadinessAssessment::query()->latest('id')->get()->map(fn ($assessment) => [
            'id' => $assessment->id,
            'title' => $assessment->draft['title'],
            'standard' => $assessment->draft['standard'],
            'subtitle' => $assessment->draft['subtitle'],
            'question_count' => count($assessment->draft['questions']),
            'clause_count' => count($assessment->draft['clauses']),
            'published_at' => $assessment->published_at,
        ]);

        return response()->json(['data' => $assessments]);
    }

    public function template()
    {
        $path = resource_path('readiness/lsp-17024.json');

        return response()->json(['data' => json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR)]);
    }

    public function store(SaveReadinessAssessment $request)
    {
        $assessment = ReadinessAssessment::create($request->validated());

        return response()->json(['data' => $this->editorData($assessment)], 201);
    }

    public function show(ReadinessAssessment $readinessAssessment)
    {
        return response()->json(['data' => $this->editorData($readinessAssessment)]);
    }

    public function update(SaveReadinessAssessment $request, ReadinessAssessment $readinessAssessment)
    {
        $readinessAssessment->update($request->validated());

        return $this->show($readinessAssessment);
    }

    public function destroy(ReadinessAssessment $readinessAssessment)
    {
        $readinessAssessment->delete();

        return response()->noContent();
    }

    public function publish(ReadinessAssessment $readinessAssessment)
    {
        $draft = $readinessAssessment->draft;

        if ($draft['questions'] === []) {
            throw ValidationException::withMessages([
                'draft.questions' => 'Tambahkan minimal satu butir penilaian sebelum menerbitkan asesmen.',
            ]);
        }

        $readinessAssessment->update(['published' => $draft, 'published_at' => now()]);

        return $this->show($readinessAssessment);
    }

    public function unpublish(ReadinessAssessment $readinessAssessment)
    {
        $readinessAssessment->update(['published' => null, 'published_at' => null]);

        return $this->show($readinessAssessment);
    }

    private function editorData(ReadinessAssessment $assessment): array
    {
        return $assessment->only('id', 'draft', 'published_at', 'updated_at');
    }
}
