<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Course;
use App\Models\Category;

class CourseCatalogController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // Get courses
        $query = Course::with(['instructor', 'category'])
            ->withCount('enrollments')
            ->where('status', 'published');
            
        if ($user->role === 'pelajar') {
            // Only show courses the student is enrolled in
            $query->whereHas('enrollments', function($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }
        
        $courses = $query->get()
            ->map(function ($course) use ($user) {
                $enrolled = $course->enrollments()->where('user_id', $user->id)->first();
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'description' => $course->description,
                    'short_description' => $course->short_description,
                    'category_name' => $course->category ? $course->category->name : 'Umum',
                    'category_slug' => $course->category ? $course->category->slug : 'umum',
                    'thumbnail' => $course->thumbnail ? \Illuminate\Support\Facades\Storage::url($course->thumbnail) : null,
                    'instructor_name' => $course->instructor ? $course->instructor->name : 'Instruktur',
                    'level' => $course->level,
                    'duration' => $course->duration_hours . ' Jam',
                    'progress' => $enrolled ? $enrolled->progress_percent : 0,
                    'enrolled_students' => $course->enrollments_count,
                    'rating' => 0, // Dummy
                    'is_featured' => $course->is_featured,
                ];
            });

        $categories = Category::withCount('courses')
            ->get()
            ->map(function ($cat) {
                return [
                    'name' => $cat->name,
                    'slug' => $cat->slug,
                    'count' => $cat->courses_count,
                ];
            });

        return Inertia::render('CourseCatalog', [
            'courses' => $courses,
            'categories' => $categories,
        ]);
    }
}
