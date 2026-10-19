<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HomeController;
use App\Http\Controllers\Api\NewsController as PublicNewsController;
use App\Http\Controllers\Api\DirectoryController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\TranslateController;
use App\Http\Controllers\Api\Admin\SliderController as AdminSliderController;
use App\Http\Controllers\Api\Admin\NewsController;
use App\Http\Controllers\Api\Admin\PartnerController;
use App\Http\Controllers\Api\Admin\PageController;
use App\Http\Controllers\Api\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Api\Admin\PageContentController;
use App\Http\Controllers\Api\Admin\ContactController;
use App\Http\Controllers\Api\Admin\SitemapController;
use App\Http\Controllers\Api\Admin\LpkController;
use App\Http\Controllers\Api\Admin\DocumentController as AdminDocumentController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\FaqController;
use App\Http\Controllers\Api\Admin\FaqController as AdminFaqController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Admin\AccreditationStepController;
use App\Http\Controllers\Api\Admin\MenuController as AdminMenuController;
use App\Http\Controllers\Api\Admin\ContactSubmissionController;
use App\Http\Controllers\Api\CustomPageController;
use App\Http\Controllers\Api\Admin\SurveyController as AdminSurveyController;
use App\Http\Controllers\Api\SurveyController as PublicSurveyController;
use App\Http\Controllers\Api\Admin\LpkTypeController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::prefix('v1')->group(function () {
    // Homepage
    Route::get('/home', [HomeController::class, 'index']);

    // Settings
    Route::get('/settings', [SettingController::class, 'index']);
    Route::get('/settings/{key}', [SettingController::class, 'show']);

    // Auth
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1');

    // Contact Form
    Route::post('/contact', [ContactController::class, 'submit'])
        ->middleware('throttle:5,15');

    // FAQ (public)
    Route::get('/faqs', [FaqController::class, 'index']);

    // Accreditation Steps (public)
    Route::get('/accreditation-steps', [AccreditationStepController::class, 'publicIndex']);

    // Menu (public)
    Route::get('/menus', [AdminMenuController::class, 'publicIndex']);

    // Custom Pages
    Route::get('/pages/{slug}', [CustomPageController::class, 'show']);

    // Auto-translate plain UI text for EN toggle
    Route::post('/translate/texts', [TranslateController::class, 'texts'])
        ->middleware('throttle:30,1');

    // News (public)
    Route::get('/news', [PublicNewsController::class, 'index']);
    Route::get('/news/{slug}', [PublicNewsController::class, 'show']);

    // Direktori LPK (public): terakreditasi, akreditasi-dibekukan, akreditasi-dicabut
    Route::get('/directory/{segment}', [DirectoryController::class, 'index']);

    // Page Content (public - untuk DynamicPage frontend)
    Route::get('/page-content/{pageId}', [PageContentController::class, 'getByPageId'])
        ->where('pageId', '.*');

    // Daftar tahun Survei Kepuasan Pelanggan (public)
    Route::get('/survey-years', [PageContentController::class, 'surveyYears']);

    // Daftar sub-halaman per kategori Layanan Akreditasi (Laboratorium, GRK, Sistem Manajemen, dll)
    Route::get('/layanan-services/{category}', [PageContentController::class, 'subPages']);

    // Documents (public)
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::get('/documents/{slug}', [DocumentController::class, 'show']);

    // Pencarian (public)
    Route::get('/search', [SearchController::class, 'index']);

    // Surveys (public)
    Route::get('/surveys/{code}', [PublicSurveyController::class, 'show']);
    Route::post('/surveys/{code}/upload', [PublicSurveyController::class, 'upload'])
        ->middleware('throttle:10,1');
    Route::post('/surveys/{code}/submit', [PublicSurveyController::class, 'submit'])
        ->middleware('throttle:10,1');
        
    // Sitemap & Robots
    Route::get('/sitemap.xml', [SitemapController::class, 'index']);
    Route::get('/robots.txt', [SitemapController::class, 'robots']);
});

// Protected routes (Admin)
Route::prefix('v1/admin')->middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Content available to all three admin roles.
    Route::middleware('admin.role:super_admin,admin,adminsosmed')->group(function () {
        Route::apiResource('sliders', AdminSliderController::class);
        Route::post('sliders/reorder', [AdminSliderController::class, 'reorder']);

        Route::apiResource('news', NewsController::class);
        Route::post('news/bulk-delete', [NewsController::class, 'bulkDelete']);
        Route::post('news/{id}/toggle-publish', [NewsController::class, 'togglePublish']);

        Route::get('page-contents', [PageContentController::class, 'index']);
        Route::get('page-contents/{pageId}', [PageContentController::class, 'getByPageId'])
            ->where('pageId', '.*');
        Route::post('page-contents', [PageContentController::class, 'store']);
        Route::delete('page-contents/{pageId}', [PageContentController::class, 'destroy'])
            ->where('pageId', '.*');
    });

    // Content and media available to admins and the super admin.
    Route::middleware('admin.role:super_admin,admin')->group(function () {
        Route::apiResource('menus', AdminMenuController::class)->except(['show']);

        Route::apiResource('pages', PageController::class);
        Route::post('pages/{id}/toggle-publish', [PageController::class, 'togglePublish']);

        Route::apiResource('partners', PartnerController::class);
        Route::post('partners/reorder', [PartnerController::class, 'reorder']);
        Route::post('partners/{id}/toggle-active', [PartnerController::class, 'toggleActive']);

        Route::apiResource('faqs', AdminFaqController::class);
        Route::post('faqs/reorder', [AdminFaqController::class, 'reorder']);
        Route::post('faqs/{id}/toggle-active', [AdminFaqController::class, 'toggleActive']);
        Route::post('faqs/{id}/toggle-show-home', [AdminFaqController::class, 'toggleShowHome']);

        // Accreditation Steps Management
        Route::get('accreditation-steps', [AccreditationStepController::class, 'index']);
        Route::post('accreditation-steps', [AccreditationStepController::class, 'store']);
        Route::put('accreditation-steps/{id}', [AccreditationStepController::class, 'update']);
        Route::delete('accreditation-steps/{id}', [AccreditationStepController::class, 'destroy']);
        Route::post('accreditation-steps/{id}/move-up', [AccreditationStepController::class, 'moveUp']);
        Route::post('accreditation-steps/{id}/move-down', [AccreditationStepController::class, 'moveDown']);

        // Direktori LPK (admin), per status: terakreditasi | akreditasi-dibekukan | akreditasi-dicabut
        Route::post('directory/import', [LpkController::class, 'importFile']);
        Route::get('directory', [LpkController::class, 'index']);
        Route::post('directory', [LpkController::class, 'store']);
        Route::put('directory/{id}', [LpkController::class, 'update']);
        Route::delete('directory/{id}', [LpkController::class, 'destroy']);

        Route::get('directory-types', [LpkTypeController::class, 'index']);
        Route::post('directory-types', [LpkTypeController::class, 'store']);


        Route::apiResource('contact-submissions', ContactSubmissionController::class)
            ->only(['index', 'update', 'destroy']);

        Route::apiResource('users', UserController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        // Surveys Management
        Route::apiResource('surveys', AdminSurveyController::class);
        Route::post('surveys/upload-image', [AdminSurveyController::class, 'uploadImage']);
        Route::post('surveys/{id}/publish', [AdminSurveyController::class, 'publish']);
        Route::post('surveys/{id}/toggle-active', [AdminSurveyController::class, 'toggleActive']);
        Route::get('surveys/{id}/export-csv', [AdminSurveyController::class, 'exportCsv']);
    });

    // Social media settings are shared with adminsosmed;
    // website settings remain super-admin only.
    Route::middleware('admin.role:super_admin,adminsosmed')->group(function () {
        Route::get('social-settings', [AdminSettingController::class, 'socialIndex']);
        Route::post('social-settings/bulk-update', [AdminSettingController::class, 'socialBulkUpdate']);
    });

    Route::middleware('admin.role:super_admin')->group(function () {
        Route::apiResource('documents', AdminDocumentController::class);

        Route::get('settings', [AdminSettingController::class, 'index']);
        Route::get('settings/group/{group}', [AdminSettingController::class, 'getByGroup']);
        Route::get('settings/groups', [AdminSettingController::class, 'groups']);
        Route::post('settings/upsert', [AdminSettingController::class, 'upsert']);
        Route::post('settings/bulk-update', [AdminSettingController::class, 'bulkUpdate']);
        Route::post('settings/upload-image', [AdminSettingController::class, 'uploadImage']);
        Route::delete('settings/{key}', [AdminSettingController::class, 'destroy']);
    });
});
