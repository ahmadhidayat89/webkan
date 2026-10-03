<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CourseEnrollmentController extends Controller
{
    /**
     * Admin mendaftarkan pelajar ke kursus.
     */
    public function enroll(Request $request, Course $course): RedirectResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = User::findOrFail($request->user_id);

        if ($user->role !== 'pelajar') {
            return back()->with('error', 'Hanya user dengan role pelajar yang bisa didaftarkan.');
        }

        $already = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->exists();

        if ($already) {
            return back()->with('error', "{$user->name} sudah terdaftar di kursus ini.");
        }

        Enrollment::create([
            'user_id'   => $user->id,
            'course_id' => $course->id,
            'status'    => 'active',
        ]);

        return back()->with('success', "{$user->name} berhasil didaftarkan.");
    }

    /**
     * Pelajar enroll mandiri via kode referral.
     * Route: POST /courses/join
     */
    public function joinByReferral(Request $request): RedirectResponse
    {
        $request->validate([
            'referral_code' => 'required|string',
        ]);

        $course = Course::where('referral_code', strtoupper($request->referral_code))
            ->where('status', 'published')
            ->first();

        if (!$course) {
            return back()->with('error', 'Kode referral tidak valid atau kursus belum dipublikasikan.');
        }

        $userId  = auth()->id();
        $already = Enrollment::where('user_id', $userId)
            ->where('course_id', $course->id)
            ->exists();

        if ($already) {
            return back()->with('error', 'Anda sudah terdaftar di kursus ini.');
        }

        Enrollment::create([
            'user_id'   => $userId,
            'course_id' => $course->id,
            'status'    => 'active',
        ]);

        return redirect()->route('course.player', $course->id)
            ->with('success', "Berhasil bergabung ke kursus: {$course->title}");
    }

    /**
     * Keluarkan pelajar dari kursus.
     */
    public function unenroll(Course $course, User $user): RedirectResponse
    {
        Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->delete();

        return back()->with('success', "{$user->name} berhasil dikeluarkan dari kursus.");
    }

    /**
     * Update referral code kursus.
     */
    public function updateReferralCode(Request $request, Course $course): RedirectResponse
    {
        $request->validate([
            'referral_code' => [
                'required',
                'string',
                'max:12',
                'alpha_num',
                \Illuminate\Validation\Rule::unique('courses', 'referral_code')->ignore($course->id),
            ],
        ]);

        $course->update(['referral_code' => strtoupper($request->referral_code)]);

        return back()->with('success', 'Kode referral berhasil diperbarui.');
    }
}
