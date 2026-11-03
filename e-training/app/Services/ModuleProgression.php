<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Module;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ModuleProgression
{
    public function authorizeCourse(Course $course, User $user): void
    {
        if ($user->canManageCourse($course)) {
            return;
        }
        abort_unless($user->role === 'peserta' && $course->status === 'published'
            && $course->enrollments()->where('user_id', $user->id)->exists(), 403);
    }

    /**
     * ID modul terbatas yang TIDAK boleh diakses peserta ini.
     * Admin dan pengajar selalu mendapat daftar kosong.
     */
    public function hiddenModuleIds(Course $course, User $user): array
    {
        if ($user->role !== 'peserta') {
            return [];
        }
        $course->loadMissing('modules');
        $restricted = $course->modules->where('is_restricted', true)->pluck('id');
        if ($restricted->isEmpty()) {
            return [];
        }
        $allowed = DB::table('module_user_access')
            ->where('user_id', $user->id)
            ->whereIn('module_id', $restricted)
            ->pluck('module_id');

        return $restricted->diff($allowed)->map(fn ($id) => (int) $id)->values()->all();
    }

    public function lockedModules(Course $course, User $user): array
    {
        if ($user->role !== 'peserta') {
            return [];
        }
        $course->loadMissing('modules.lessons');
        $hidden = $this->hiddenModuleIds($course, $user);
        $locks = [];
        foreach ($course->modules as $module) {
            $reason = in_array($module->id, $hidden, true)
                ? 'Modul ini tidak tersedia untuk Anda.'
                : $this->reasonFor($module);
            if ($reason !== null) {
                $locks[$module->id] = $reason;
            }
        }

        return $locks;
    }

    public function authorizeLesson(Lesson $lesson, User $user): void
    {
        $course = $lesson->module->course;
        abort_unless($course, 403);
        $this->authorizeCourse($course, $user);
        $reason = $this->lockedModules($course, $user)[$lesson->module_id]
            ?? $this->lockedLessons($course, $user)[$lesson->id] ?? null;
        abort_if($reason !== null, 403, $reason ?? 'Modul terkunci.');
        abort_if($user->role === 'peserta' && ! $lesson->is_published, 403);
    }

    public function lockedLessons(Course $course, User $user): array
    {
        if ($user->role !== 'peserta') {
            return [];
        }
        $course->loadMissing('modules.lessons');
        $completedIds = LessonProgress::where('user_id', $user->id)->where('is_completed', true)
            ->whereIn('lesson_id', $course->modules->flatMap->lessons->pluck('id'))->pluck('lesson_id');
        $locks = [];
        foreach ($course->modules->where('requires_completion', true) as $module) {
            $locks += $this->locksWithinModule($module, $completedIds);
        }

        return $locks;
    }

    private function locksWithinModule(Module $module, Collection $completedIds): array
    {
        $locks = [];
        $blocker = null;
        foreach ($module->lessons->where('is_published', true)->sortBy([['sort_order', 'asc'], ['id', 'asc']]) as $lesson) {
            if ($blocker !== null) {
                $locks[$lesson->id] = 'Selesaikan "'.$blocker->title.'" terlebih dahulu untuk membuka materi ini.';
            }
            if ($blocker === null && ! $completedIds->contains($lesson->id)) {
                $blocker = $lesson;
            }
        }

        return $locks;
    }

    private function reasonFor(Module $module): ?string
    {
        if (! $module->is_published) {
            return 'Modul belum dipublikasikan.';
        }
        if (! $module->hasStarted()) {
            return 'Modul dibuka pada '.$module->start_at->format('d M Y H:i').'.';
        }

        return null;
    }
}
