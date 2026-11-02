<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CourseTeacherController extends Controller
{
    public function update(Request $request, Course $course): RedirectResponse
    {
        $data = $request->validate([
            'teacher_ids' => ['present', 'array'],
            'teacher_ids.*' => ['integer', 'distinct', Rule::exists('users', 'id')->where('role', 'pengajar')],
        ]);
        $course->teachers()->sync($data['teacher_ids']);

        return back()->with('success', 'Akses pengajar pada kursus berhasil disimpan.');
    }
}
