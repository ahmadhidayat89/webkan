<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HomeController;
use App\Http\Controllers\Api\NewsController as PublicNewsController;
use App\Http\Controllers\Api\DirectoryController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\FaqController as PublicFaqController;
use App\Http\Controllers\Api\Admin\SliderController as AdminSliderController;
use App\Http\Controllers\Api\Admin\NewsController;
use App\Http\Controllers\Api\Admin\PartnerController;
use App\Http\Controllers\Api\Admin\FaqController as AdminFaqController;
use App\Http\Controllers\Api\Admin\PageController;
use App\Http\Controllers\Api\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Api\Admin\PageContentController;
use App\Http\Controllers\Api\Admin\ContactController;
use App\Http\Controllers\Api\Admin\SitemapController;
use App\Http\Controllers\Api\Admin\AccreditedOrganizationController;
use App\Http\Controllers\Api\Admin\DownloadFileController;
use App\Http\Controllers\Api\MenuController as PublicMenuController;
use App\Http\Controllers\Api\Admin\MenuController as AdminMenuController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Admin\AccreditationStepController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes

Route::prefix('v1')->group(function () {
    // Homepage
    Route::get('/home', [HomeController::class, 'index']);
    Route::get('/faqs', [PublicFaqController::class, 'index']);
    Route::get('/accreditation-steps', [AccreditationStepController::class, 'publicIndex']);

    // Settings
    Route::get('/settings', [SettingController::class, 'index']);
    Route::get('/settings/{key}', [SettingController::class, 'show']);

    // Auth
    Route::post('/login', [AuthController::class, 'login']);

    // Contact Form (limiter berlapis: IP + kombinasi email+IP)
    Route::post('/contact', [ContactController::class, 'submit'])->middleware('throttle:contact');

    // News (public)
    Route::get('/news', [PublicNewsController::class, 'index']);
    Route::get('/news/{slug}', [PublicNewsController::class, 'show']);

    // Direktori LPK (public)
    Route::get('/directory/{segment}', [DirectoryController::class, 'index']);

    // Page Content (public - untuk DynamicPage frontend)
    // where('.+') agar bisa menangkap pageId dengan slash, misal: layanan/laboratorium
    Route::get('/page-content/{pageId}', [PageContentController::class, 'getByPageId'])
        ->where('pageId', '.+');

    // Global Search
    Route::get('/search', [SearchController::class, 'index']);

    // Menu publik (untuk navbar)
    Route::get('/menus', [PublicMenuController::class, 'index']);

    // Download Files (public)
    Route::get('/download-files', function (\Illuminate\Http\Request $request) {
        $files = \App\Models\DownloadFile::where('page_id', $request->query('page_id'))
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn ($f) => [
                'id'        => $f->id,
                'title'     => $f->title,
                'file_url'  => '/storage/' . $f->file_path,
                'file_size' => $f->file_size,
                'file_ext'  => $f->file_ext,
            ]);
        return response()->json(['success' => true, 'data' => $files]);
    });

    // Sitemap & Robots
    Route::get('/sitemap.xml', [SitemapController::class, 'index']);
    Route::get('/robots.txt', [SitemapController::class, 'robots']);
});

// Protected routes (Admin)
Route::prefix('v1/admin')->middleware(['auth:sanctum', 'throttle:admin'])->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Sliders — accessible by super_admin, admin, sosmed_admin
    Route::middleware('role:super_admin,admin,sosmed_admin')->group(function () {
        Route::apiResource('sliders', AdminSliderController::class);
        Route::post('sliders/reorder', [AdminSliderController::class, 'reorder']);
    });

    // News Management — accessible by super_admin, admin, sosmed_admin
    Route::middleware('role:super_admin,admin,sosmed_admin')->group(function () {
        Route::apiResource('news', NewsController::class);
        Route::post('news/bulk-delete', [NewsController::class, 'bulkDelete']);
        Route::post('news/{id}/toggle-publish', [NewsController::class, 'togglePublish']);
    });

    // Partners Management — super_admin, admin only
    Route::middleware('role:super_admin,admin')->group(function () {
        Route::apiResource('partners', PartnerController::class);
        Route::post('partners/reorder', [PartnerController::class, 'reorder']);
        Route::post('partners/{id}/toggle-active', [PartnerController::class, 'toggleActive']);
    });

    // FAQ Management — super_admin, admin only
    Route::middleware('role:super_admin,admin')->group(function () {
        Route::apiResource('faqs', AdminFaqController::class);
        Route::post('faqs/{id}/toggle-active', [AdminFaqController::class, 'toggleActive']);
        Route::post('faqs/{id}/toggle-show-home', [AdminFaqController::class, 'toggleShowOnHome']);
    });

    // Accreditation Steps Management — super_admin, admin only
    Route::middleware('role:super_admin,admin')->group(function () {
        Route::get('accreditation-steps', [AccreditationStepController::class, 'index']);
        Route::post('accreditation-steps', [AccreditationStepController::class, 'store']);
        Route::put('accreditation-steps/{id}', [AccreditationStepController::class, 'update']);
        Route::delete('accreditation-steps/{id}', [AccreditationStepController::class, 'destroy']);
        Route::post('accreditation-steps/{id}/move-up', [AccreditationStepController::class, 'moveUp']);
        Route::post('accreditation-steps/{id}/move-down', [AccreditationStepController::class, 'moveDown']);
    });

    // Pages Management — super_admin, admin only
    Route::middleware('role:super_admin,admin')->group(function () {
        Route::apiResource('pages', PageController::class);
        Route::post('pages/{id}/toggle-publish', [PageController::class, 'togglePublish']);
    });

    // Page Contents Management — accessible by super_admin, admin, sosmed_admin
    Route::middleware('role:super_admin,admin,sosmed_admin')->group(function () {
        Route::get('page-contents', [PageContentController::class, 'index']);
        Route::get('page-contents/{pageId}', [PageContentController::class, 'getByPageId']);
        Route::post('page-contents', [PageContentController::class, 'store']);
    });

    // Download Files Management — super_admin, admin only
    Route::middleware('role:super_admin,admin')->group(function () {
        Route::get('download-files', [DownloadFileController::class, 'index']);
        Route::post('download-files', [DownloadFileController::class, 'store']);
        Route::delete('download-files/{id}', [DownloadFileController::class, 'destroy']);
        Route::patch('download-files/{id}/rename', [DownloadFileController::class, 'rename']);
    });

    // Direktori LPK Management — super_admin, admin only
    Route::middleware('role:super_admin,admin')->group(function () {
        Route::apiResource('directory', AccreditedOrganizationController::class);
        Route::get('directory-types', [AccreditedOrganizationController::class, 'types']);
    });

    // Contacts Management — super_admin, admin only
    Route::middleware('role:super_admin,admin')->group(function () {
        Route::get('contacts', [ContactController::class, 'index']);
        Route::get('contacts/{id}', [ContactController::class, 'show']);
        Route::post('contacts/{id}/toggle-read', [ContactController::class, 'toggleRead']);
        Route::post('contacts/{id}/reply',       [ContactController::class, 'reply']);
        Route::delete('contacts/{id}', [ContactController::class, 'destroy']);
    });

    // Settings Management — super_admin only
    Route::middleware('role:super_admin')->group(function () {
        Route::get('settings', [AdminSettingController::class, 'index']);
        Route::get('settings/group/{group}', [AdminSettingController::class, 'getByGroup']);
        Route::get('settings/groups', [AdminSettingController::class, 'groups']);
        Route::post('settings/upsert', [AdminSettingController::class, 'upsert']);
        Route::post('settings/bulk-update', [AdminSettingController::class, 'bulkUpdate']);
        Route::post('settings/upload-image', [AdminSettingController::class, 'uploadImage']);
        Route::delete('settings/{key}', [AdminSettingController::class, 'destroy']);
    });

    // Sosmed Settings — accessible by super_admin AND sosmed_admin
    Route::middleware('role:super_admin,sosmed_admin')->group(function () {
        Route::get('sosmed', [AdminSettingController::class, 'getSosmed']);
        Route::post('sosmed', [AdminSettingController::class, 'saveSosmed']);
    });

    // User Management — accessible by super_admin AND admin
    Route::middleware('role:super_admin,admin')->group(function () {
        Route::get('users', [UserController::class, 'index']);
        Route::post('users', [UserController::class, 'store']);
        Route::put('users/{id}', [UserController::class, 'update']);
        Route::delete('users/{id}', [UserController::class, 'destroy']);
    });

    // Menu Management — super_admin, admin only
    Route::middleware('role:super_admin,admin')->group(function () {
        Route::get('menus', [AdminMenuController::class, 'index']);
        Route::post('menus', [AdminMenuController::class, 'store']);
        Route::put('menus/{id}', [AdminMenuController::class, 'update']);
        Route::delete('menus/{id}', [AdminMenuController::class, 'destroy']);
        Route::post('menus/{id}/toggle-active', [AdminMenuController::class, 'toggleActive']);
        Route::patch('menus/{id}/reorder', [AdminMenuController::class, 'reorder']);
    });
});
