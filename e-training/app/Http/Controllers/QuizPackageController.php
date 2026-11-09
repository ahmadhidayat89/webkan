<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateQuizPackageRequest;
use App\Models\BankQuizPackage;
use App\Models\Course;
use App\Models\Module;
use App\Models\Quiz;
use App\Services\QuizPackageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class QuizPackageController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate(['search' => 'nullable|string|max:200', 'course_id' => 'nullable|integer', 'archived' => 'nullable|boolean']);
        $courses = Course::query()->when(! $request->user()->isAdmin(), fn ($query) => $query->whereHas('teachers', fn ($teachers) => $teachers->where('users.id', $request->user()->id)))->with(['modules' => fn ($query) => $query->orderBy('sort_order')->select('id', 'course_id', 'title')])->orderBy('title')->get(['id', 'title']);
        $packages = BankQuizPackage::accessibleTo($request->user())
            ->when($request->boolean('archived'), fn ($query) => $query->whereNotNull('archived_at'), fn ($query) => $query->whereNull('archived_at'))
            ->when($request->filled('course_id'), fn ($query) => $query->where('course_id', $request->integer('course_id')))
            ->when($request->filled('search'), fn ($query) => $query->whereRaw('LOWER(title) LIKE ?', ['%'.mb_strtolower(trim($filters['search']), 'UTF-8').'%']))
            ->with('course:id,title', 'author:id,name')->withCount('usages')->latest()->paginate(12)->withQueryString();
        $filters['archived'] = $request->boolean('archived');
        $props = compact('packages', 'courses', 'filters');

        return $request->wantsJson() ? response()->json($props) : Inertia::render('Admin/QuestionBank/Packages', $props);
    }

    public function store(Request $request, Quiz $quiz, QuizPackageService $service)
    {
        abort_unless($request->user()->canManageCourse($quiz->lesson->module->course), 403);
        $data = $request->validate(['title' => 'required|string|max:255', 'description' => 'nullable|string|max:2000']);
        $service->save($quiz, $request->user(), $data['title'], $data['description'] ?? null);

        return back()->with('success', 'Paket kuis lengkap disimpan di Bank Soal.');
    }

    public function show(Request $request, BankQuizPackage $package)
    {
        abort_unless($request->user()->canManageCourse($package->course), 403);
        $snapshot = $package->snapshot;
        $snapshot['questions'] = array_map(function ($question) {
            $question['image_url'] = $question['image_path'] ? Storage::url($question['image_path']) : null;
            unset($question['image_path']);

            return $question;
        }, $snapshot['questions']);

        return response()->json([...$package->toArray(), 'snapshot' => $snapshot]);
    }

    public function import(Request $request, BankQuizPackage $package, QuizPackageService $service)
    {
        abort_unless($request->user()->canManageCourse($package->course), 403);
        $data = $request->validate(['module_id' => 'required|integer|exists:modules,id', 'title' => 'required|string|max:255']);
        $module = Module::with('course')->findOrFail($data['module_id']);
        abort_unless($request->user()->canManageCourse($module->course), 403);
        $quiz = $service->createQuiz($package, $module, $data['title']);

        return back()->with('success', 'Kuis "'.$quiz->lesson->title.'" dibuat di modul "'.$module->title.'".');
    }

    public function update(UpdateQuizPackageRequest $request, BankQuizPackage $package, QuizPackageService $service)
    {
        $service->update($package, $request->validated());

        return back()->with('success', 'Perubahan paket kuis disimpan. Kuis yang sudah diimpor tetap memakai salinannya sendiri.');
    }

    public function destroy(Request $request, BankQuizPackage $package, QuizPackageService $service)
    {
        abort_unless($request->user()->canManageCourse($package->course), 403);
        $data = $request->validate(['revision' => 'required|integer|min:1']);
        $service->deleteArchived($package, (int) $data['revision']);

        return back()->with('success', 'Paket kuis dihapus permanen. Kuis yang sudah dibuat dari paket tetap tersedia.');
    }

    public function archive(Request $request, BankQuizPackage $package)
    {
        abort_unless($request->user()->canManageCourse($package->course), 403);
        $request->validate(['archived' => 'sometimes|required|boolean']);
        $archived = DB::transaction(function () use ($request, $package) {
            $package = BankQuizPackage::lockForUpdate()->findOrFail($package->id);
            $target = $request->has('archived') ? $request->boolean('archived') : $package->archived_at === null;
            if ($target !== ($package->archived_at !== null)) {
                $package->update(['archived_at' => $target ? now() : null, 'revision' => $package->revision + 1]);
            }

            return $target;
        });

        return back()->with('success', $archived ? 'Paket kuis diarsipkan. Buka daftar Arsip untuk melihat atau memulihkannya.' : 'Paket kuis dipulihkan ke daftar Paket aktif.');
    }
}
