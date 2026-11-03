<?php

namespace App\Services;

use App\Models\BankQuestion;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuestionBankService
{
    public function assertQuizEditable(Quiz $quiz): void
    {
        if ($quiz->attempts()->exists() || DB::table('quiz_bank_draws')->where('quiz_id', $quiz->id)->exists()) {
            throw ValidationException::withMessages(['questions' => 'Kuis sudah mulai dikerjakan. Buat kuis baru untuk mengubah susunan atau isi soal.']);
        }
    }

    public function save(array $data, User $user, ?BankQuestion $question = null): BankQuestion
    {
        return DB::transaction(function () use ($data, $user, $question) {
            if ($question) {
                $question = BankQuestion::lockForUpdate()->findOrFail($question->id);
            }
            $question ??= new BankQuestion(['created_by' => $user->id]);
            $question->fill($data);
            $question->updated_by = $user->id;
            $question->version = $question->exists ? $question->getOriginal('version') + 1 : 1;
            $question->save();
            $question->versions()->create([
                'version' => $question->version,
                'created_by' => $user->id,
                'snapshot' => $question->only(['title', 'question', 'type', 'points', 'status', 'tags', 'options', 'explanation', 'image_path', 'category_id']),
            ]);

            return $question;
        });
    }

    public function copyToQuiz(BankQuestion $source, Quiz $quiz, ?int $groupId = null): QuizQuestion
    {
        $question = $quiz->questions()->create([
            'question' => $source->question, 'type' => $source->type, 'points' => $source->points,
            'explanation' => $source->explanation, 'image_path' => $source->image_path,
            'bank_question_id' => $source->id, 'bank_version' => $source->version,
            'random_group_id' => $groupId, 'sort_order' => ($quiz->questions()->max('sort_order') ?? 0) + 1,
        ]);
        foreach ($source->options ?? [] as $index => $option) {
            $question->options()->create([...$option, 'sort_order' => $index]);
        }

        return $question;
    }

    /** Draws are persisted at start, reused on reload, and selected again for the next attempt. */
    public function questionsFor(Quiz $quiz, User $user, bool $start = false, bool $requireDraw = false): Collection
    {
        $quiz->loadMissing('questions.options');
        $groups = DB::table('quiz_random_groups')->where('quiz_id', $quiz->id)->orderBy('id')->get();
        if ($groups->isEmpty()) {
            return $quiz->questions;
        }

        $attemptNumber = $quiz->attempts()->where('user_id', $user->id)->count() + 1;
        $draw = DB::table('quiz_bank_draws')->where('quiz_id', $quiz->id)->where('user_id', $user->id)->where('attempt_number', $attemptNumber)->first();
        if ($draw) {
            $ids = json_decode($draw->question_ids, true, flags: JSON_THROW_ON_ERROR);

            return $quiz->questions->whereIn('id', $ids)->sortBy(fn ($question) => array_search($question->id, $ids, true))->values();
        }
        if ($requireDraw) {
            throw ValidationException::withMessages(['message' => 'Mulai kuis terlebih dahulu agar paket soal dapat diverifikasi.']);
        }

        $selected = $quiz->questions->whereNull('random_group_id')->values();
        foreach ($groups as $group) {
            $pool = $quiz->questions->where('random_group_id', $group->id)->values();
            if ($pool->count() < $group->draw_count) {
                throw ValidationException::withMessages(['message' => 'Jumlah soal pada kelompok acak tidak mencukupi. Hubungi pengajar.']);
            }
            $selected = $selected->concat($start ? $pool->shuffle()->take($group->draw_count) : $pool->take($group->draw_count));
        }
        if ($start) {
            DB::table('quiz_bank_draws')->insert([
                'quiz_id' => $quiz->id, 'user_id' => $user->id, 'attempt_number' => $attemptNumber,
                'question_ids' => json_encode($selected->pluck('id')->all()), 'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        return $selected->values();
    }
}
