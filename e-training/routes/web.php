<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CourseEventController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\QuizAdminController;
use App\Http\Controllers\GradingController;
use App\Http\Controllers\CertificateAdminController;
use App\Http\Controllers\CourseEnrollmentController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::redirect('/', '/login');

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\CourseCatalogController;

// Publik — Verifikasi sertifikat via QR Code (tanpa auth)
Route::get('/verify/{code}', [\App\Http\Controllers\CertificateVerifyController::class, 'show'])
    ->name('certificate.verify');

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/courses', [CourseCatalogController::class, 'index'])
    ->middleware(['auth'])->name('courses.list');

use App\Http\Controllers\CoursePlayerController;

Route::get('/course/{id}', [CoursePlayerController::class, 'show'])
    ->middleware(['auth'])->name('course.player');

Route::post('/course/{course}/quizzes/{quiz}/submit', [CoursePlayerController::class, 'submitQuiz'])
    ->middleware(['auth'])->name('courses.quizzes.submit');

Route::post('/course/{course}/lessons/{lesson}/complete', [CoursePlayerController::class, 'markLessonComplete'])
    ->middleware(['auth'])->name('course.lesson.complete');

// Diskusi per lesson/sesi (bisa diakses semua user yang login)
use App\Http\Controllers\DiscussionController;
Route::middleware(['auth'])->prefix('lessons/{lesson}/discussions')->name('discussions.')->group(function () {
    Route::get('/',              [DiscussionController::class, 'index'])  ->name('index');
    Route::post('/',             [DiscussionController::class, 'store'])  ->name('store');
    Route::delete('/{discussion}',[DiscussionController::class, 'destroy'])->name('destroy');
});

// Pelajar: self-enroll via referral code
Route::post('/courses/join', [CourseEnrollmentController::class, 'joinByReferral'])
    ->middleware(['auth'])->name('courses.join');

// Pelajar: Sertifikat
Route::get('/certificates', [\App\Http\Controllers\CertificateController::class, 'index'])
    ->middleware(['auth'])->name('certificates.index');
Route::get('/certificates/{id}/download', [\App\Http\Controllers\CertificateController::class, 'download'])
    ->middleware(['auth'])->name('student.certificates.download');

// API endpoint untuk fetch kalender per bulan (AJAX)
Route::get('/api/calendar-events', [CourseEventController::class, 'getCalendarEvents'])
    ->middleware(['auth'])->name('api.calendar.events');

// Profil user
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

use App\Http\Controllers\ActivityLogController;

// ─── Panel Admin ───────────────────────────────────────────────────────────────
Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {

    // Manajemen user (admin + pelajar)
    Route::get('/audit-logs', [\App\Http\Controllers\Admin\AuditLogController::class, 'index'])->name('audit-logs.index');
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::patch('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    // Log Aktivitas
    Route::get('/activity-log', [ActivityLogController::class, 'index'])->name('activity-log');

    // Studio Konten — CRUD Kursus
    Route::get('/courses', [CourseController::class, 'index'])->name('courses.index');
    Route::post('/courses', [CourseController::class, 'store'])->name('courses.store');
    Route::get('/courses/{course}/edit', [CourseController::class, 'edit'])->name('courses.edit');
    Route::patch('/courses/{course}', [CourseController::class, 'update'])->name('courses.update');
    Route::delete('/courses/{course}', [CourseController::class, 'destroy'])->name('courses.destroy');
    Route::post('/courses/{course}/referral', [CourseController::class, 'regenerateReferral'])
        ->name('courses.referral.regenerate');

    // Thumbnail upload (separate endpoint to handle multipart)
    Route::post('/courses/{course}/thumbnail', [CourseController::class, 'uploadThumbnail'])
        ->name('courses.thumbnail');

    // Modul
    Route::post('/courses/{course}/modules', [ModuleController::class, 'store'])->name('modules.store');
    Route::patch('/modules/{module}', [ModuleController::class, 'update'])->name('modules.update');
    Route::delete('/modules/{module}', [ModuleController::class, 'destroy'])->name('modules.destroy');
    Route::post('/modules/reorder', [ModuleController::class, 'reorder'])->name('modules.reorder');

    // Lesson / Materi
    Route::post('/modules/{module}/lessons', [LessonController::class, 'store'])->name('lessons.store');
    Route::patch('/lessons/{lesson}', [LessonController::class, 'update'])->name('lessons.update');
    Route::delete('/lessons/{lesson}', [LessonController::class, 'destroy'])->name('lessons.destroy');
    Route::post('/lessons/{lesson}/files', [LessonController::class, 'uploadFile'])->name('lessons.files.upload');
    Route::delete('/lesson-files/{file}', [LessonController::class, 'deleteFile'])->name('lessons.files.delete');

    // Kuis (admin)
    Route::patch('/quizzes/{quiz}/settings', [QuizAdminController::class, 'updateSettings'])->name('quizzes.settings');
    Route::post('/quizzes/{quiz}/questions', [QuizAdminController::class, 'addQuestion'])->name('quizzes.questions.store');
    Route::patch('/questions/{question}', [QuizAdminController::class, 'updateQuestion'])->name('quizzes.questions.update');
    Route::delete('/questions/{question}', [QuizAdminController::class, 'deleteQuestion'])->name('quizzes.questions.delete');
    Route::post('/questions/{question}/image', [QuizAdminController::class, 'uploadQuestionImage'])->name('quizzes.questions.image');
    Route::post('/questions/reorder', [QuizAdminController::class, 'reorderQuestions'])->name('quizzes.questions.reorder');

    // Penilaian (Grading)
    Route::get('/quizzes/{quiz}/attempts', [GradingController::class, 'listAttempts'])->name('grading.attempts');
    Route::post('/attempts/{attempt}/batch-grade', [GradingController::class, 'batchGrade'])->name('grading.batch');
    Route::patch('/answers/{answer}/grade', [GradingController::class, 'gradeEssay'])->name('grading.essay');

    // Sertifikat (admin)
    Route::post('/courses/{course}/certificates/generate', [CertificateAdminController::class, 'generate'])
        ->name('certificates.generate');
    Route::get('/certificates/{certificate}/download', [CertificateAdminController::class, 'download'])
        ->name('certificates.download');
    Route::get('/certificates/{certificate}/preview', [CertificateAdminController::class, 'preview'])
        ->name('certificates.preview');
    Route::get('/courses/{course}/certificate-preview', [CertificateAdminController::class, 'previewTemplate'])
        ->name('certificates.preview.template');
    Route::post('/courses/{course}/certificate-template', [CertificateAdminController::class, 'uploadTemplate'])
        ->name('certificates.template');
    Route::post('/courses/{course}/certificate-signature', [CertificateAdminController::class, 'uploadSignature'])
        ->name('certificates.signature');

    // Enrollment
    Route::post('/courses/{course}/enroll', [CourseEnrollmentController::class, 'enroll'])
        ->name('courses.enroll');
    Route::delete('/courses/{course}/unenroll/{user}', [CourseEnrollmentController::class, 'unenroll'])
        ->name('courses.unenroll');
    Route::patch('/courses/{course}/referral-code', [CourseEnrollmentController::class, 'updateReferralCode'])
        ->name('courses.referral.update');
});

require __DIR__.'/auth.php';
