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
    private const SETTINGS = ['duration_minutes', 'passing_score', 'max_attempts', 'shuffle_questions', 'show_correct_answers', 'review_mode', 'quiz_mode', 'exam_type'];
    private const CHOICE_TYPES = ['multiple_choice', 'true_false'];

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
                $groups = DB::table('quiz_random_groups')->where('quiz_id', $quiz->id)->orderBy('id')->get()->map(fn($group) => [
                    'key' => $group->id,
                    'label' => $group->label,
                    'draw_count' => $group->draw_count,
                ])->all();
                $questions = $quiz->questions->map(function ($question) use (&$files) {
                    return [
                        'question' => QuestionHtml::clean($question->question),
                        'type' => $question->type,
                        'points' => $question->points,
                        'explanation' => $question->explanation,
                        'image_path' => $this->copyImage($question->image_path, $files),
                        'group_key' => $question->random_group_id,
                        'options' => $question->options->map->only(['option_text', 'is_correct'])->values()->all(),
                    ];
                })->all();

                return BankQuizPackage::create([
                    'course_id' => $quiz->lesson->module->course_id,
                    'source_quiz_id' => $quiz->id,
                    'created_by' => $user->id,
                    'title' => $title,
                    'description' => $description,
                    'questions_count' => count($questions),
                    'effective_questions_count' => $quiz->questions->whereNull('random_group_id')->count() + array_sum(array_column($groups, 'draw_count')),
                    'snapshot' => [
                        'settings' => $quiz->only(self::SETTINGS),
                        'lesson_description' => $quiz->lesson->description,
                        'groups' => $groups,
                        'questions' => $questions,
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
                $this->assertEditable($package, (int) $data['revision']);

                $groups = $this->normalizeGroups($data['groups']);
                $questions = $this->buildQuestions($package, $data, $groups, $files);
                $this->assertDrawCounts($groups, $questions);

                $package->update([
                    'title' => $data['title'],
                    'description' => $data['description'] ?? null,
                    'revision' => $package->revision + 1,
                    'questions_count' => count($questions),
                    'effective_questions_count' => $this->effectiveCount($groups, $questions),
                    'snapshot' => [
                        'settings' => array_intersect_key($data['settings'], array_flip(self::SETTINGS)),
                        'lesson_description' => $data['lesson_description'] ?? null,
                        'groups' => $groups,
                        'questions' => $questions,
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
                    'title' => $title,
                    'type' => 'quiz',
                    'description' => $snapshot['lesson_description'],
                    'sort_order' => ($module->lessons()->max('sort_order') ?? 0) + 1,
                ]);
                $quiz = Quiz::create([
                    ...array_intersect_key($snapshot['settings'], array_flip(self::SETTINGS)),
                    'lesson_id' => $lesson->id,
                    'bank_quiz_package_id' => $package->id,
                    'start_at' => null,
                    'deadline_at' => null,
                ]);
                $groupIds = [];
                foreach ($snapshot['groups'] as $group) {
                    $groupIds[$group['key']] = DB::table('quiz_random_groups')->insertGetId([
                        'quiz_id' => $quiz->id,
                        'label' => $group['label'],
                        'draw_count' => $group['draw_count'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
                foreach ($snapshot['questions'] as $index => $source) {
                    $question = $quiz->questions()->create([
                        'question' => $source['question'],
                        'type' => $source['type'],
                        'points' => $source['points'],
                        'explanation' => $source['explanation'],
                        'sort_order' => $index + 1,
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

    private function assertEditable(BankQuizPackage $package, int $revision): void
    {
        if ($package->archived_at) {
            throw ValidationException::withMessages(['package' => 'Pulihkan paket dari arsip sebelum mengedit.']);
        }
        if ($revision !== (int) $package->revision) {
            throw ValidationException::withMessages(['revision' => 'Paket sudah berubah. Tutup editor dan buka kembali untuk memuat data terbaru.']);
        }
    }

    private function normalizeGroups(array $groups): array
    {
        return array_map(fn($group) => [
            'key' => $group['key'],
            'label' => $group['label'],
            'draw_count' => (int) $group['draw_count'],
        ], $groups);
    }

    private function buildQuestions(BankQuizPackage $package, array $data, array $groups, array &$files): array
    {
        $groupKeys = array_column($groups, 'key');
        $quizMode = $data['settings']['quiz_mode'];
        $questions = [];
        foreach ($data['questions'] as $index => $source) {
            $questions[] = $this->buildQuestion($package, $source, $index, $groupKeys, $quizMode, $files);
        }

        return $questions;
    }

    private function buildQuestion(BankQuizPackage $package, array $source, int $index, array $groupKeys, string $quizMode, array &$files): array
    {
        $text = QuestionHtml::clean($source['question']);
        if (trim(strip_tags($text)) === '') {
            throw ValidationException::withMessages(["questions.$index.question" => 'Teks pertanyaan tidak boleh kosong.']);
        }
        $groupKey = $source['group_key'] ?? null;
        $this->assertGroupExists($groupKey, $groupKeys, $index);
        $this->assertQuizMode($quizMode, $source['type']);
        $options = $this->buildOptions($source, $index);

        return [
            'question' => $text,
            'type' => $source['type'],
            'points' => (int) $source['points'],
            'explanation' => $source['explanation'] ?? null,
            'group_key' => $groupKey,
            'image_path' => $this->resolveImagePath($package, $source, $index, $files),
            'options' => $options,
        ];
    }

    private function assertGroupExists(mixed $groupKey, array $groupKeys, int $index): void
    {
        if ($groupKey !== null && ! in_array($groupKey, $groupKeys, true)) {
            throw ValidationException::withMessages(["questions.$index.group_key" => 'Kelompok soal tidak ditemukan.']);
        }
    }

    private function assertQuizMode(string $quizMode, string $type): void
    {
        if ($quizMode !== 'custom' && $quizMode !== $type) {
            throw ValidationException::withMessages(['settings.quiz_mode' => 'Gunakan mode Campuran untuk paket dengan beberapa tipe soal.']);
        }
    }

    private function buildOptions(array $source, int $index): array
    {
        if (! in_array($source['type'], self::CHOICE_TYPES, true)) {
            return [];
        }
        $this->assertChoiceOptions($source, $index);

        $options = [];
        foreach ($source['options'] as $position => $option) {
            $options[] = [
                'option_text' => $this->optionText($source['type'], $position, $option),
                'is_correct' => (bool) $option['is_correct'],
            ];
        }

        return $options;
    }

    private function optionText(string $type, int $position, array $option): string
    {
        if ($type !== 'true_false') {
            return $option['option_text'];
        }

        return $position === 0 ? 'Benar' : 'Salah';
    }

    private function assertChoiceOptions(array $source, int $index): void
    {
        $options = $source['options'];
        if (count($options) < 2 || collect($options)->where('is_correct', true)->count() !== 1) {
            throw ValidationException::withMessages(["questions.$index.options" => 'Gunakan minimal dua pilihan dengan tepat satu jawaban benar.']);
        }
        if ($source['type'] === 'true_false' && count($options) !== 2) {
            throw ValidationException::withMessages(["questions.$index.options" => 'Benar/Salah harus memiliki dua pilihan.']);
        }
    }

    private function resolveImagePath(BankQuizPackage $package, array $source, int $index, array &$files): ?string
    {
        if (! empty($source['image'])) {
            $path = $source['image']->store('quiz-package-images', 'public');
            $files[] = $path;

            return $path;
        }
        if (! empty($source['remove_image'])) {
            return null;
        }

        return $this->existingImagePath($package, $source, $index);
    }

    private function existingImagePath(BankQuizPackage $package, array $source, int $index): ?string
    {
        if (! isset($source['source_index'])) {
            return null;
        }
        $existing = $package->snapshot['questions'];
        if (! array_key_exists($source['source_index'], $existing)) {
            throw ValidationException::withMessages(["questions.$index.source_index" => 'Referensi gambar soal tidak valid. Muat ulang editor.']);
        }

        return $existing[$source['source_index']]['image_path'];
    }

    private function assertDrawCounts(array $groups, array $questions): void
    {
        foreach ($groups as $index => $group) {
            $members = count(array_filter($questions, fn($question) => $question['group_key'] === $group['key']));
            if ($group['draw_count'] > $members) {
                throw ValidationException::withMessages(["groups.$index.draw_count" => 'Jumlah pengambilan melebihi pertanyaan pada kelompok ' . $group['label'] . '.']);
            }
        }
    }

    private function effectiveCount(array $groups, array $questions): int
    {
        $ungrouped = count(array_filter($questions, fn($question) => $question['group_key'] === null));

        return $ungrouped + array_sum(array_column($groups, 'draw_count'));
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
        $path = 'quiz-package-images/' . Str::uuid() . '.' . pathinfo($source, PATHINFO_EXTENSION);
        if (! $disk->copy($source, $path)) {
            throw ValidationException::withMessages(['image' => 'Gambar soal gagal disalin. Silakan coba lagi.']);
        }
        $files[] = $path;

        return $path;
    }
}
