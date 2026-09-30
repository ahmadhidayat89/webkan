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
use App\Http\Controllers\Api\Admin\AccreditedOrganizationController;
use App\Http\Controllers\Api\Admin\DocumentController as AdminDocumentController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\FaqController;
use App\Http\Controllers\Api\Admin\FaqController as AdminFaqController;

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
    Route::post('/login', [AuthController::class, 'login']);

    // Contact Form
    Route::post('/contact', [ContactController::class, 'submit']);

    // FAQ (public)
    Route::get('/faqs', [FaqController::class, 'index']);

    // Auto-translate plain UI text for EN toggle
    Route::post('/translate/texts', [TranslateController::class, 'texts']);

    // News (public)
    Route::get('/news', [PublicNewsController::class, 'index']);
    Route::get('/news/{slug}', [PublicNewsController::class, 'show']);

    // Direktori LPK (public)
    Route::get('/directory/{segment}', [DirectoryController::class, 'index']);

    // Page Content (public - untuk DynamicPage frontend)
    Route::get('/page-content/{pageId}', [PageContentController::class, 'getByPageId'])
        ->where('pageId', '.*');

    // Daftar tahun Survei Kepuasan Pelanggan (public)
    Route::get('/survey-years', [PageContentController::class, 'surveyYears']);

    // Daftar sub-halaman Laboratorium (public)
    Route::get('/layanan-services/{category}', [PageContentController::class, 'subPages']);

    // Daftar sub-halaman Laboratorium (public)
    Route::get('/lab-subpages', [PageContentController::class, 'labSubPages']);

    // Documents (public)
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::get('/documents/{slug}', [DocumentController::class, 'show']);

    // Sitemap & Robots
    Route::get('/sitemap.xml', [SitemapController::class, 'index']);
    Route::get('/robots.txt', [SitemapController::class, 'robots']);
});

// Protected routes (Admin)
Route::prefix('v1/admin')->middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Sliders
    Route::apiResource('sliders', AdminSliderController::class);
    Route::post('sliders/reorder', [AdminSliderController::class, 'reorder']);

    // News Management
    Route::apiResource('news', NewsController::class);
    Route::post('news/bulk-delete', [NewsController::class, 'bulkDelete']);
    Route::post('news/{id}/toggle-publish', [NewsController::class, 'togglePublish']);

    // Partners Management
    Route::apiResource('partners', PartnerController::class);
    Route::post('partners/reorder', [PartnerController::class, 'reorder']);
    Route::post('partners/{id}/toggle-active', [PartnerController::class, 'toggleActive']);

    // FAQ Management
    Route::apiResource('faqs', AdminFaqController::class);
    Route::post('faqs/reorder', [AdminFaqController::class, 'reorder']);

    // Pages Management
    Route::apiResource('pages', PageController::class);
    Route::post('pages/{id}/toggle-publish', [PageController::class, 'togglePublish']);

    // Page Contents Management
    Route::get('page-contents', [PageContentController::class, 'index']);
    Route::get('page-contents/{pageId}', [PageContentController::class, 'getByPageId'])
        ->where('pageId', '.*');
    Route::post('page-contents', [PageContentController::class, 'store']);
    Route::delete('page-contents/{pageId}', [PageContentController::class, 'destroy'])
        ->where('pageId', '.*');

    // Direktori LPK Management
    Route::apiResource('directory', AccreditedOrganizationController::class);
    Route::get('directory-types', [AccreditedOrganizationController::class, 'types']);

    // Documents Management
    Route::apiResource('documents', AdminDocumentController::class);

    // Settings Management
    Route::get('settings', [AdminSettingController::class, 'index']);
    Route::get('settings/group/{group}', [AdminSettingController::class, 'getByGroup']);
    Route::get('settings/groups', [AdminSettingController::class, 'groups']);
    Route::post('settings/upsert', [AdminSettingController::class, 'upsert']);
    Route::post('settings/bulk-update', [AdminSettingController::class, 'bulkUpdate']);
    Route::post('settings/upload-image', [AdminSettingController::class, 'uploadImage']);
    Route::delete('settings/{key}', [AdminSettingController::class, 'destroy']);
});