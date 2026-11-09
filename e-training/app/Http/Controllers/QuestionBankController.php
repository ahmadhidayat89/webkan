<?php

namespace App\Http\Controllers;

use App\Models\BankQuestion;
use App\Models\Course;
use App\Models\QuestionBankCategory;
use App\Models\Quiz;
use App\Services\QuestionBankService;
use App\Support\QuestionHtml;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class QuestionBankController extends Controller
{
    public function index(Request $request)
    {
        if (! $request->wantsJson() && $request->query('view') !== 'questions') {
            return redirect()->route('admin.question-bank.packages.index', $request->only('course_id'));
        }
        $filters = $request->validate([
            'search' => 'nullable|string|max:200', 'course_id' => 'nullable|integer',
            'category_id' => 'nullable|integer', 'status' => 'nullable|in:draft,ready,archived',
            'type' => 'nullable|in:multiple_choice,true_false,essay,short_answer',
            'tag' => 'nullable|string|max:50',
        ]);
        $courses = Course::query()->when(! $request->user()->isAdmin(), fn ($q) => $q->whereHas('teachers', fn ($q) => $q->where('users.id', $request->user()->id)))->orderBy('title')->get(['id', 'title']);
        $query = BankQuestion::accessibleTo($request->user());
        $query->when(($filters['status'] ?? '') === 'archived', fn ($q) => $q->whereNotNull('archived_at'), fn ($q) => $q->whereNull('archived_at'));
        foreach (['course_id', 'type'] as $field) {
            if (! empty($filters[$field])) {
                $query->where($field, $filters[$field]);
            }
        }
        if (! empty($filters['category_id'])) {
            $query->whereIn('category_id', $this->categoryIds((int) $filters['category_id']));
        }
        if (in_array($filters['status'] ?? '', ['draft', 'ready'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['tag'])) {
            $query->whereJsonContains('tags', $filters['tag']);
        }
        if (! empty($filters['search'])) {
            $term = '%'.$filters['search'].'%';
            $query->where(fn ($q) => $q->where('title', 'like', $term)->orWhere('question', 'like', $term));
        }
        $questions = $query->with(['category:id,name', 'course:id,title', 'author:id,name'])->withCount('usages')->latest('updated_at')->paginate(15)->withQueryString();
        $categories = QuestionBankCategory::whereIn('course_id', $courses->pluck('id'))->orderBy('name')->get();
        $stats = BankQuestion::accessibleTo($request->user())->whereNull('archived_at')->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');
        $props = compact('questions', 'courses', 'categories', 'filters', 'stats');

        return $request->wantsJson() ? response()->json($props) : Inertia::render('Admin/QuestionBank/Index', $props);
    }

    public function store(Request $request, QuestionBankService $service)
    {
        $data = $this->validatedQuestion($request->all());
        $this->authorizeCourse($request, (int) $data['course_id']);
        $data = $this->withImage($request, $data);
        $service->save($data, $request->user());

        return back()->with('success', 'Soal ditambahkan ke bank.');
    }

    public function update(Request $request, BankQuestion $bankQuestion, QuestionBankService $service)
    {
        $this->authorizeQuestion($request, $bankQuestion);
        abort_if($bankQuestion->archived_at, 422, 'Pulihkan soal sebelum mengedit.');
        $data = $this->validatedQuestion([...$request->all(), 'course_id' => $bankQuestion->course_id]);
        $data = $this->withImage($request, $data);
        $service->save($data, $request->user(), $bankQuestion);

        return back()->with('success', 'Versi baru soal disimpan. Salinan pada kuis tetap memakai versi sebelumnya.');
    }

    public function duplicate(Request $request, BankQuestion $bankQuestion, QuestionBankService $service)
    {
        $this->authorizeQuestion($request, $bankQuestion);
        $data = $bankQuestion->only(['course_id', 'category_id', 'title', 'question', 'type', 'points', 'tags', 'options', 'explanation', 'image_path']);
        $data['title'] = mb_substr($data['title'], 0, 235).' (Salinan)';
        $data['status'] = 'draft';
        $service->save($data, $request->user());

        return back()->with('success', 'Salinan soal dibuat sebagai Draft.');
    }

    public function archive(Request $request, BankQuestion $bankQuestion)
    {
        $this->authorizeQuestion($request, $bankQuestion);
        $bankQuestion->update(['archived_at' => $bankQuestion->archived_at ? null : now()]);

        return back()->with('success', 'Status arsip soal diperbarui.');
    }

    public function history(Request $request, BankQuestion $bankQuestion)
    {
        $this->authorizeQuestion($request, $bankQuestion);

        return response()->json($bankQuestion->versions()->get(['version', 'snapshot', 'created_at', 'created_by']));
    }

    public function storeCategory(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:120', 'course_id' => 'required|integer|exists:courses,id', 'parent_id' => 'nullable|integer|exists:question_bank_categories,id']);
        $this->authorizeCourse($request, (int) $data['course_id']);
        if (! empty($data['parent_id'])) {
            abort_unless(QuestionBankCategory::whereKey($data['parent_id'])->where('course_id', $data['course_id'])->exists(), 422);
        }
        QuestionBankCategory::firstOrCreate($data);

        return back()->with('success', 'Kategori ditambahkan.');
    }

    public function addToQuiz(Request $request, Quiz $quiz, QuestionBankService $service)
    {
        $this->authorizeCourse($request, $quiz->lesson->module->course_id);
        $data = $request->validate([
            'question_ids' => 'required|array|min:1|max:100', 'question_ids.*' => 'required|integer|distinct',
            'mode' => 'required|in:fixed,random', 'draw_count' => 'required_if:mode,random|nullable|integer|min:1|max:100',
            'label' => 'nullable|string|max:120',
        ]);
        DB::transaction(function () use ($data, $request, $quiz, $service) {
            $quiz = Quiz::lockForUpdate()->findOrFail($quiz->id);
            $service->assertQuizEditable($quiz);
            $sources = BankQuestion::accessibleTo($request->user())->whereIn('id', $data['question_ids'])->where('status', 'ready')->whereNull('archived_at')->get();
            if ($sources->count() !== count($data['question_ids'])) {
                throw ValidationException::withMessages(['question_ids' => 'Pilih soal Ready yang dapat Anda akses.']);
            }
            if ($quiz->questions()->whereIn('bank_question_id', $sources->pluck('id'))->exists()) {
                throw ValidationException::withMessages(['question_ids' => 'Sebagian soal sudah ada di kuis ini. Pilih soal lain.']);
            }
            if ($quiz->quiz_mode !== 'custom' && $sources->contains(fn ($q) => $q->type !== $quiz->quiz_mode)) {
                throw ValidationException::withMessages(['question_ids' => 'Tipe soal harus sesuai mode kuis. Gunakan mode Campuran untuk beberapa tipe.']);
            }
            $groupId = null;
            if ($data['mode'] === 'random') {
                if ($data['draw_count'] > $sources->count()) {
                    throw ValidationException::withMessages(['draw_count' => 'Jumlah yang diambil melebihi soal yang dipilih.']);
                }
                $groupId = DB::table('quiz_random_groups')->insertGetId([
                    'quiz_id' => $quiz->id, 'label' => $data['label'] ?? 'Soal acak', 'draw_count' => $data['draw_count'],
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            }
            foreach ($sources as $source) {
                $service->copyToQuiz($source, $quiz, $groupId);
            }
        });

        return back()->with('success', 'Soal bank ditambahkan ke kuis.');
    }

    public function removeGroup(Request $request, Quiz $quiz, int $group, QuestionBankService $service)
    {
        $this->authorizeCourse($request, $quiz->lesson->module->course_id);
        DB::transaction(function () use ($quiz, $group, $service) {
            $quiz = Quiz::lockForUpdate()->findOrFail($quiz->id);
            $service->assertQuizEditable($quiz);
            abort_unless(DB::table('quiz_random_groups')->where('id', $group)->where('quiz_id', $quiz->id)->exists(), 404);
            $quiz->questions()->where('random_group_id', $group)->delete();
            DB::table('quiz_random_groups')->where('id', $group)->delete();
        });

        return back()->with('success', 'Kelompok soal acak dihapus dari kuis.');
    }

    public function collectQuiz(Request $request, Quiz $quiz, QuestionBankService $service)
    {
        $this->authorizeCourse($request, $quiz->lesson->module->course_id);
        $data = $request->validate(['category_id' => 'nullable|integer', 'status' => 'required|in:draft,ready']);
        $courseId = $quiz->lesson->module->course_id;
        $categoryId = $data['category_id'] ?? null;
        if ($categoryId) {
            abort_unless(QuestionBankCategory::whereKey($categoryId)->where('course_id', $courseId)->exists(), 422);
        }
        DB::transaction(function () use ($request, $quiz, $service, $courseId, $categoryId, $data) {
            Quiz::lockForUpdate()->findOrFail($quiz->id);
            foreach ($quiz->questions()->with('options')->whereNull('bank_question_id')->lockForUpdate()->get() as $index => $question) {
                $payload = $this->validatedQuestion([
                    'course_id' => $courseId, 'category_id' => $categoryId,
                    'title' => mb_substr(strip_tags($question->question), 0, 180) ?: 'Soal '.($index + 1),
                    'question' => $question->question, 'type' => $question->type, 'points' => $question->points,
                    'status' => $data['status'], 'tags' => [], 'explanation' => $question->explanation,
                    'options' => $question->options->map->only(['option_text', 'is_correct'])->all(),
                ]);
                $payload['image_path'] = $question->image_path;
                $bank = $service->save($payload, $request->user());
                $question->update(['bank_question_id' => $bank->id, 'bank_version' => $bank->version]);
            }
        });

        return back()->with('success', 'Soal kuis disalin ke bank tanpa mengubah jawaban atau nilai peserta.');
    }

    public function export(Request $request)
    {
        $query = BankQuestion::accessibleTo($request->user())->whereNull('archived_at');
        if ($request->filled('course_id')) {
            $query->where('course_id', $request->integer('course_id'));
        }
        if ($request->filled('category_id')) {
            $query->whereIn('category_id', $this->categoryIds($request->integer('category_id')));
        }
        $questions = $query->with('category')->get()->map(fn ($q) => [
            ...$q->only(['title', 'question', 'type', 'points', 'status', 'tags', 'options', 'explanation']),
            'category' => $q->category?->name,
        ]);

        return response()->streamDownload(fn () => print json_encode(['format' => 'etraining-question-bank', 'version' => 1, 'questions' => $questions], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), 'bank-soal.json', ['Content-Type' => 'application/json']);
    }

    public function import(Request $request, QuestionBankService $service)
    {
        $data = $request->validate(['course_id' => 'required|integer|exists:courses,id', 'category_id' => 'nullable|integer', 'file' => 'required|file|max:5120']);
        $this->authorizeCourse($request, (int) $data['course_id']);
        $decoded = json_decode(file_get_contents($request->file('file')->getRealPath()), true);
        if (! is_array($decoded) || ($decoded['format'] ?? '') !== 'etraining-question-bank' || ($decoded['version'] ?? null) !== 1) {
            throw ValidationException::withMessages(['file' => 'Gunakan file JSON Bank Soal E-Training versi 1.']);
        }
        $rows = $decoded['questions'] ?? null;
        Validator::make(['questions' => $rows], ['questions' => 'required|array|min:1|max:500'])->validate();
        $validated = [];
        foreach ($rows as $index => $row) {
            if (! is_array($row)) {
                throw ValidationException::withMessages(['file' => 'Format soal ke-'.($index + 1).' tidak valid.']);
            }
            try {
                $validated[] = $this->validatedQuestion([...$row, 'course_id' => $data['course_id'], 'category_id' => $data['category_id'] ?? null, 'status' => 'draft']);
            } catch (ValidationException $exception) {
                throw ValidationException::withMessages(['file' => 'Soal ke-'.($index + 1).': '.collect($exception->errors())->flatten()->implode(' ')]);
            }
        }
        DB::transaction(function () use ($validated, $request, $service) {
            foreach ($validated as $row) {
                $service->save($row, $request->user());
            }
        });

        return back()->with('success', count($validated).' soal diimpor sebagai Draft untuk diperiksa.');
    }

    private function categoryIds(int $rootId): array
    {
        $root = QuestionBankCategory::find($rootId);
        if (! $root) {
            return [];
        }
        $categories = QuestionBankCategory::where('course_id', $root->course_id)->get(['id', 'parent_id']);
        $ids = [$rootId];
        do {
            $children = $categories->whereIn('parent_id', $ids)->pluck('id')->diff($ids)->all();
            $ids = array_merge($ids, $children);
        } while ($children);

        return $ids;
    }

    private function withImage(Request $request, array $data): array
    {
        $request->validate(['image' => 'nullable|image|max:5120']);
        if ($request->hasFile('image')) {
            // Keep old files: earlier question versions and quiz copies may still reference them.
            $data['image_path'] = $request->file('image')->store('question-bank-images', 'public');
        }

        return $data;
    }

    private function authorizeCourse(Request $request, int $courseId): void
    {
        abort_unless($request->user()->canManageCourse(Course::findOrFail($courseId)), 403);
    }

    private function authorizeQuestion(Request $request, BankQuestion $question): void
    {
        $this->authorizeCourse($request, $question->course_id);
    }

    private function validatedQuestion(array $input): array
    {
        $data = Validator::make($input, [
            'course_id' => 'required|integer|exists:courses,id',
            'category_id' => ['nullable', 'integer', Rule::exists('question_bank_categories', 'id')->where('course_id', $input['course_id'] ?? 0)],
            'title' => 'required|string|max:255', 'question' => 'required|string|max:50000',
            'type' => 'required|in:multiple_choice,true_false,essay,short_answer',
            'points' => 'required|integer|min:1|max:1000', 'status' => 'required|in:draft,ready',
            'tags' => 'present|array|max:15', 'tags.*' => 'required|string|max:50|distinct',
            'explanation' => 'nullable|string|max:10000', 'options' => 'present|array|max:8',
            'options.*.option_text' => 'required|string|max:2000', 'options.*.is_correct' => 'required|boolean',
        ])->validate();
        $data['question'] = QuestionHtml::clean($data['question']);
        if (trim(strip_tags($data['question'])) === '') {
            throw ValidationException::withMessages(['question' => 'Teks soal tidak boleh kosong.']);
        }
        $usesOptions = in_array($data['type'], ['multiple_choice', 'true_false'], true);
        if ($usesOptions && (count($data['options']) < 2 || collect($data['options'])->where('is_correct', true)->count() !== 1)) {
            throw ValidationException::withMessages(['options' => 'Gunakan minimal dua pilihan dengan tepat satu jawaban benar.']);
        }
        if ($data['type'] === 'true_false') {
            if (count($data['options']) !== 2) {
                throw ValidationException::withMessages(['options' => 'Benar/Salah harus memiliki dua pilihan.']);
            }
            $data['options'][0]['option_text'] = 'Benar';
            $data['options'][1]['option_text'] = 'Salah';
        }
        $data['options'] = $usesOptions ? array_map(fn ($option) => ['option_text' => $option['option_text'], 'is_correct' => (bool) $option['is_correct']], $data['options']) : [];

        return $data;
    }
}
