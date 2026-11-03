<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Module;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ModuleAccessController extends Controller
{
    /**
     * Status pembatasan modul + daftar peserta kursus (untuk modal admin).
     */
    public function show(Module $module): JsonResponse
    {
        $course = $this->authorizedCourse($module);
        $allowed = $module->allowedUsers()->pluck('users.id')->all();

        $participants = Enrollment::with('user:id,name,email')
            ->where('course_id', $course->id)->get()
            ->filter(fn ($e) => $e->user)
            ->map(fn ($e) => [
                'id' => $e->user->id,
                'name' => $e->user->name,
                'email' => $e->user->email,
                'allowed' => in_array($e->user->id, $allowed),
            ])->values();

        return response()->json([
            'is_restricted' => (bool) $module->is_restricted,
            'participants' => $participants,
        ]);
    }

    /**
     * Simpan pembatasan dan daftar peserta yang diizinkan.
     */
    public function update(Request $request, Module $module): RedirectResponse
    {
        $course = $this->authorizedCourse($module);

        $data = $request->validate([
            'is_restricted' => 'required|boolean',
            'user_ids' => 'present|array|max:500',
            'user_ids.*' => 'integer|distinct',
        ]);

        $ids = $data['user_ids'];
        $enrolled = Enrollment::where('course_id', $course->id)
            ->whereIn('user_id', $ids)->count();
        if ($enrolled !== count($ids)) {
            return back()->withErrors(['user_ids' => 'Ada peserta yang tidak terdaftar di kursus ini.']);
        }

        DB::transaction(function () use ($module, $data, $ids) {
            $module->update(['is_restricted' => $data['is_restricted']]);
            $module->allowedUsers()->sync($ids);
        });

        return back()->with('success', 'Akses modul disimpan.');
    }

    private function authorizedCourse(Module $module): Course
    {
        $course = $module->course;
        abort_unless($course, 404);
        abort_unless(auth()->user()->canManageCourse($course), 403);

        return $course;
    }
}
