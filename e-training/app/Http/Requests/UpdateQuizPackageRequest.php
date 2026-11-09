<?php

namespace App\Http\Requests;

use App\Models\BankQuizPackage;
use Illuminate\Foundation\Http\FormRequest;

class UpdateQuizPackageRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (! $this->has('payload')) {
            return;
        }
        $data = is_string($this->input('payload')) ? json_decode($this->input('payload'), true) : null;
        if (! is_array($data)) {
            return;
        }
        foreach (is_array($data['questions'] ?? null) ? $data['questions'] : [] as $index => $question) {
            if (is_array($question)) {
                $data['questions'][$index]['image'] = $this->file("question_images.$index");
            }
        }
        $this->merge($data);
    }

    public function authorize(): bool
    {
        $package = $this->route('package');

        return $package instanceof BankQuizPackage && $this->user()->canManageCourse($package->course);
    }

    public function rules(): array
    {
        return [
            'revision' => 'required|integer|min:1',
            'title' => 'required|string|max:255', 'description' => 'nullable|string|max:2000',
            'lesson_description' => 'nullable|string|max:10000',
            'settings' => 'required|array',
            'settings.duration_minutes' => 'nullable|integer|min:1|max:10080',
            'settings.passing_score' => 'required|integer|min:0|max:100',
            'settings.max_attempts' => 'required|integer|min:1|max:1000',
            'settings.quiz_mode' => 'required|in:custom,multiple_choice,true_false,essay,short_answer',
            'settings.shuffle_questions' => 'required|boolean',
            'settings.show_correct_answers' => 'required|boolean',
            'settings.review_mode' => 'required|in:off,review,with_answers',
            'groups' => 'present|array|max:100', 'groups.*.key' => 'required|string|max:80|distinct',
            'groups.*.label' => 'required|string|max:120', 'groups.*.draw_count' => 'required|integer|min:1|max:500',
            'questions' => 'required|array|min:1|max:500',
            'questions.*.question' => 'required|string|max:50000',
            'questions.*.type' => 'required|in:multiple_choice,true_false,essay,short_answer',
            'questions.*.points' => 'required|integer|min:1|max:1000',
            'questions.*.explanation' => 'nullable|string|max:10000',
            'questions.*.group_key' => 'nullable|string|max:80',
            'questions.*.source_index' => 'nullable|integer|min:0|max:499',
            'questions.*.remove_image' => 'sometimes|boolean',
            'questions.*.image' => 'nullable|image|max:5120',
            'questions.*.options' => 'present|array|max:8',
            'questions.*.options.*.option_text' => 'required|string|max:2000',
            'questions.*.options.*.is_correct' => 'required|boolean',
        ];
    }
}
