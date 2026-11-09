<?php

namespace App\Services;

use App\Models\BankQuizPackage;
use App\Models\Module;
use App\Models\Quiz;
use App\Models\User;
use App\Support\QuestionHtml;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class QuizPackageService
{
    private const SETTINGS = ['duration_minutes', 'passing_score', 'max_attempts', 'shuffle_questions', 'show_correct_answers', 'review_mode', 'quiz_mode'];

    public function deleteArchived(BankQuizPackage $package, int $revision): void
    {
        DB::transaction(function () use ($package, $revision) {
            $package = BankQuizPackage::lockForUpdate()->findOrFail($package->id);
            if (! $package->archived_at) {
                throw ValidationException::withMessages(['package' => 'Arsipkan paket sebelum menghapus permanen.']);
            }
            if ($package->revision !== $revision) {
                throw ValidationException::withMessages(['package' => 'Paket sudah berubah. Muat ulang daftar sebelum menghapus.']);
            }
            $images = collect($package->snapshot['questions'])->pluck('image_path')->filter()->unique()->values()->all();
            $package->delete();
            DB::afterCommit(function () use ($images) {
                try {
                    Storage::disk('public')->delete($images);
                } catch (Throwable $exception) {
                    report($exception);
                }
            });
        });
    }

    public function save(Quiz $quiz, User $user, string $title, ?string $description): BankQuizPackage
    {
        $files = [];
        try {
            return DB::transaction(function () use ($quiz, $user, $title, $description, &$files) {
                $quiz = Quiz::lockForUpdate()->with('questions.options', 'lesson')->findOrFail($quiz->id);
                if ($quiz->questions->isEmpty() || $quiz->questions->count() > 500) {
                    throw ValidationException::withMessages(['title' => 'Paket harus berisi 1–500 pertanyaan.']);
                }
                $groups = DB::table('quiz_random_groups')->where('quiz_id', $quiz->id)->orderBy('id')->get()->map(fn ($group) => [
                    'key' => $group->id, 'label' => $group->label, 'draw_count' => $group->draw_count,
                ])->all();
                $questions = $quiz->questions->map(function ($question) use (&$files) {
                    return [
                        'question' => QuestionHtml::clean($question->question), 'type' => $question->type,
                        'points' => $question->points, 'explanation' => $question->explanation,
                        'image_path' => $this->copyImage($question->image_path, $files),
                        'group_key' => $question->random_group_id,
                        'options' => $question->options->map->only(['option_text', 'is_correct'])->values()->all(),
                    ];
                })->all();

                return BankQuizPackage::create([
                    'course_id' => $quiz->lesson->module->course_id, 'source_quiz_id' => $quiz->id,
                    'created_by' => $user->id, 'title' => $title, 'description' => $description,
                    'questions_count' => count($questions),
                    'effective_questions_count' => $quiz->questions->whereNull('random_group_id')->count() + array_sum(array_column($groups, 'draw_count')),
                    'snapshot' => [
                        'settings' => $quiz->only(self::SETTINGS), 'lesson_description' => $quiz->lesson->description,
                        'groups' => $groups, 'questions' => $questions,
                    ],
                ]);
            });
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($files);
            throw $exception;
        }
    }

    public function update(BankQuizPackage $package, array $data): void
    {
        $files = [];
        try {
            DB::transaction(function () use ($package, $data, &$files) {
                $package = BankQuizPackage::lockForUpdate()->findOrFail($package->id);
                if ($package->archived_at) {
                    throw ValidationException::withMessages(['package' => 'Pulihkan paket dari arsip sebelum mengedit.']);
                }
                if ((int) $data['revision'] !== (int) $package->revision) {
                    throw ValidationException::withMessages(['revision' => 'Paket sudah berubah. Tutup editor dan buka kembali untuk memuat data terbaru.']);
                }
                $groups = array_map(fn ($group) => ['key' => $group['key'], 'label' => $group['label'], 'draw_count' => (int) $group['draw_count']], $data['groups']);
                $keys = array_column($groups, 'key');
                $questions = [];
                foreach ($data['questions'] as $index => $source) {
                    $text = QuestionHtml::clean($source['question']);
                    if (trim(strip_tags($text)) === '') {
                        throw ValidationException::withMessages(["questions.$index.question" => 'Teks pertanyaan tidak boleh kosong.']);
                    }
                    $groupKey = $source['group_key'] ?? null;
                    if ($groupKey !== null && ! in_array($groupKey, $keys, true)) {
                        throw ValidationException::withMessages(["questions.$index.group_key" => 'Kelompok soal tidak ditemukan.']);
                    }
                    if ($data['settings']['quiz_mode'] !== 'custom' && $data['settings']['quiz_mode'] !== $source['type']) {
                        throw ValidationException::withMessages(['settings.quiz_mode' => 'Gunakan mode Campuran untuk paket dengan beberapa tipe soal.']);
                    }
                    $options = [];
                    if (in_array($source['type'], ['multiple_choice', 'true_false'], true)) {
                        if (count($source['options']) < 2 || collect($source['options'])->where('is_correct', true)->count() !== 1) {
                            throw ValidationException::withMessages(["questions.$index.options" => 'Gunakan minimal dua pilihan dengan tepat satu jawaban benar.']);
                        }
                        if ($source['type'] === 'true_false' && count($source['options']) !== 2) {
                            throw ValidationException::withMessages(["questions.$index.options" => 'Benar/Salah harus memiliki dua pilihan.']);
                        }
                        foreach ($source['options'] as $position => $option) {
                            $options[] = ['option_text' => $source['type'] === 'true_false' ? ($position === 0 ? 'Benar' : 'Salah') : $option['option_text'], 'is_correct' => (bool) $option['is_correct']];
                        }
                    }
                    $imagePath = null;
                    if (isset($source['source_index'])) {
                        if (! array_key_exists($source['source_index'], $package->snapshot['questions'])) {
                            throw ValidationException::withMessages(["questions.$index.source_index" => 'Referensi gambar soal tidak valid. Muat ulang editor.']);
                        }
                        $imagePath = $package->snapshot['questions'][$source['source_index']]['image_path'];
                    }
                    if (! empty($source['remove_image'])) {
                        $imagePath = null;
                    }
                    if (! empty($source['image'])) {
                        $imagePath = $source['image']->store('quiz-package-images', 'public');
                        $files[] = $imagePath;
                    }
                    $questions[] = [
                        'question' => $text, 'type' => $source['type'], 'points' => (int) $source['points'],
                        'explanation' => $source['explanation'] ?? null, 'group_key' => $groupKey,
                        'image_path' => $imagePath, 'options' => $options,
                    ];
                }
                foreach ($groups as $index => $group) {
                    $members = count(array_filter($questions, fn ($question) => $question['group_key'] === $group['key']));
                    if ($group['draw_count'] > $members) {
                        throw ValidationException::withMessages(["groups.$index.draw_count" => 'Jumlah pengambilan melebihi pertanyaan pada kelompok '.$group['label'].'.']);
                    }
                }
                $package->update([
                    'title' => $data['title'], 'description' => $data['description'] ?? null,
                    'revision' => $package->revision + 1, 'questions_count' => count($questions),
                    'effective_questions_count' => count(array_filter($questions, fn ($question) => $question['group_key'] === null)) + array_sum(array_column($groups, 'draw_count')),
                    'snapshot' => [
                        'settings' => array_intersect_key($data['settings'], array_flip(self::SETTINGS)),
                        'lesson_description' => $data['lesson_description'] ?? null,
                        'groups' => $groups, 'questions' => $questions,
                    ],
                ]);
            });
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($files);
            throw $exception;
        }
    }

    public function createQuiz(BankQuizPackage $package, Module $module, string $title): Quiz
    {
        $files = [];
        try {
            return DB::transaction(function () use ($package, $module, $title, &$files) {
                $package = BankQuizPackage::lockForUpdate()->findOrFail($package->id);
                if ($package->archived_at) {
                    throw ValidationException::withMessages(['package' => 'Paket sudah diarsipkan. Pulihkan sebelum digunakan.']);
                }
                $module = Module::lockForUpdate()->findOrFail($module->id);
                $snapshot = $package->snapshot;
                $lesson = $module->lessons()->create([
                    'title' => $title, 'type' => 'quiz', 'description' => $snapshot['lesson_description'],
                    'sort_order' => ($module->lessons()->max('sort_order') ?? 0) + 1,
                ]);
                $quiz = Quiz::create([
                    ...array_intersect_key($snapshot['settings'], array_flip(self::SETTINGS)),
                    'lesson_id' => $lesson->id, 'bank_quiz_package_id' => $package->id,
                    'start_at' => null, 'deadline_at' => null,
                ]);
                $groupIds = [];
                foreach ($snapshot['groups'] as $group) {
                    $groupIds[$group['key']] = DB::table('quiz_random_groups')->insertGetId([
                        'quiz_id' => $quiz->id, 'label' => $group['label'], 'draw_count' => $group['draw_count'],
                        'created_at' => now(), 'updated_at' => now(),
                    ]);
                }
                foreach ($snapshot['questions'] as $index => $source) {
                    $question = $quiz->questions()->create([
                        'question' => $source['question'], 'type' => $source['type'], 'points' => $source['points'],
                        'explanation' => $source['explanation'], 'sort_order' => $index + 1,
                        'image_path' => $this->copyImage($source['image_path'], $files),
                        'random_group_id' => $source['group_key'] === null ? null : $groupIds[$source['group_key']],
                    ]);
                    foreach ($source['options'] as $position => $option) {
                        $question->options()->create([...$option, 'sort_order' => $position]);
                    }
                }

                return $quiz;
            });
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($files);
            throw $exception;
        }
    }

    private function copyImage(?string $source, array &$files): ?string
    {
        if (! $source) {
            return null;
        }
        $disk = Storage::disk('public');
        if (! $disk->exists($source)) {
            throw ValidationException::withMessages(['image' => 'Gambar salah satu soal tidak ditemukan. Perbaiki gambar sebelum menyalin kuis.']);
        }
        $path = 'quiz-package-images/'.Str::uuid().'.'.pathinfo($source, PATHINFO_EXTENSION);
        if (! $disk->copy($source, $path)) {
            throw ValidationException::withMessages(['image' => 'Gambar soal gagal disalin. Silakan coba lagi.']);
        }
        $files[] = $path;

        return $path;
    }
}
