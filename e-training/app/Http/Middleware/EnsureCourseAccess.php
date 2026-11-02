<?php

namespace App\Http\Middleware;

use App\Models\Certificate;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonFile;
use App\Models\Module;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use App\Models\QuizQuestion;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCourseAccess
{
    private const RESOURCE_PATHS = [
        Module::class => 'course',
        Lesson::class => 'module.course',
        LessonFile::class => 'lesson.module.course',
        Quiz::class => 'lesson.module.course',
        QuizQuestion::class => 'quiz.lesson.module.course',
        QuizAttempt::class => 'quiz.lesson.module.course',
        QuizAttemptAnswer::class => 'attempt.quiz.lesson.module.course',
        Certificate::class => 'course',
    ];

    private const REORDER_MODELS = [
        'admin.modules.reorder' => ['modules', Module::class, 'course_id'],
        'admin.lessons.reorder' => ['lessons', Lesson::class, 'module_id'],
        'admin.quizzes.questions.reorder' => ['questions', QuizQuestion::class, 'quiz_id'],
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()->isAdmin() || $request->routeIs('admin.courses.index')) {
            return $next($request);
        }
        $reorder = self::REORDER_MODELS[$request->route()->getName()] ?? null;
        if ($reorder !== null) {
            $this->authorizeReorder($request, $reorder);

            return $next($request);
        }
        $resource = collect($request->route()->parameters())->first(fn ($value) => $value instanceof Model);
        $this->authorizeResource($request, $resource);

        return $next($request);
    }

    private function authorizeResource(Request $request, ?Model $resource): void
    {
        $course = $resource instanceof Course ? $resource : data_get($resource, self::RESOURCE_PATHS[$resource?->getMorphClass()] ?? '');
        abort_unless($course instanceof Course && $request->user()->canManageCourse($course), 403, 'Anda tidak memiliki akses ke kursus ini.');
    }

    private function authorizeReorder(Request $request, array $configuration): void
    {
        [$key, $model, $parentKey] = $configuration;
        $data = $request->validate([
            $key => ['required', 'array', 'min:1', 'max:500'],
            "$key.*.id" => ['required', 'integer', 'distinct'],
            "$key.*.sort_order" => ['required', 'integer', 'min:0'],
        ]);
        $parents = [];
        // Authorize the complete batch before the controller changes any order.
        foreach ($data[$key] as $item) {
            $resource = $model::findOrFail($item['id']);
            $this->authorizeResource($request, $resource);
            $parents[] = $resource->getAttribute($parentKey);
        }
        abort_unless(count(array_unique($parents)) === 1, 422, 'Urutan harus berada dalam induk yang sama.');
    }
}
