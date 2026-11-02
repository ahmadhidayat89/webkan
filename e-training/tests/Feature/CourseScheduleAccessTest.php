<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Quiz;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CourseScheduleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_bypass_module_schedule_while_participants_keep_schedule_and_sequence_restrictions(): void
    {
        $this->withoutVite();
        $admin = User::factory()->create(['role' => 'admin']);
        $teacher = User::factory()->create(['role' => 'pengajar']);
        $student = User::factory()->create(['role' => 'peserta']);
        $course = Course::create(['title' => 'Jadwal', 'slug' => 'jadwal', 'status' => 'published', 'instructor_id' => $admin->id]);
        $course->teachers()->attach($teacher);
        $course->enrollments()->create(['user_id' => $student->id, 'enrolled_at' => now()]);
        $module = $course->modules()->create(['title' => 'Belum dibuka', 'start_at' => now()->addDay(), 'requires_completion' => true]);
        $pretest = $module->lessons()->create(['title' => 'Pretes', 'type' => 'quiz', 'sort_order' => 1]);
        $document = $module->lessons()->create(['title' => 'Dokumen', 'type' => 'document', 'sort_order' => 2]);
        $quiz = Quiz::create(['lesson_id' => $pretest->id, 'start_at' => now()->addDay()]);
        $question = $quiz->questions()->create(['question' => 'Jelaskan', 'type' => 'essay', 'points' => 1]);

        foreach ([$admin, $teacher] as $staff) {
            $this->withSession(['password_hash_web' => $staff->getAuthPassword()])->actingAs($staff);
            $this->get(route('course.player', $course))->assertOk()->assertInertia(fn (Assert $page) => $page
                ->where('courseData.can_bypass_schedule', true)
                ->where('courseData.modules.0.locked_reason', null)
                ->where('courseData.modules.0.lessons.1.locked_reason', null));
            $this->post(route('course.lesson.complete', [$course, $document]))->assertSessionHasNoErrors();
            $this->post(route('courses.quizzes.submit', [$course, $quiz]), ['answers' => [$question->id => 'Preview']])->assertSessionHasNoErrors();
        }

        $this->withSession(['password_hash_web' => $student->getAuthPassword()])->actingAs($student);
        $this->get(route('course.player', $course))->assertInertia(fn (Assert $page) => $page
            ->where('courseData.can_bypass_schedule', false)->missing('courseData.modules.0.lessons.1.description'));
        $this->postJson(route('course.lesson.complete', [$course, $document]))->assertForbidden();
        $this->postJson(route('courses.quizzes.submit', [$course, $quiz]), ['answers' => [$question->id => 'Terlalu awal']])->assertForbidden();
        $module->update(['start_at' => null]);
        $this->postJson(route('course.lesson.complete', [$course, $document]))->assertForbidden();
        $module->update(['requires_completion' => false, 'end_at' => now()->subDay()]);
        $this->post(route('course.lesson.complete', [$course, $document]))->assertSessionHasErrors('message');
        $this->withSession(['password_hash_web' => $teacher->getAuthPassword()])->actingAs($teacher)
            ->post(route('course.lesson.complete', [$course, $document]))->assertSessionHasNoErrors();
        $course->teachers()->detach();
        $this->getJson(route('course.player', $course))->assertForbidden();
    }
}
