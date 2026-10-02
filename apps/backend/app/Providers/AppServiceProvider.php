<?php

namespace App\Providers;

use App\Models\AccreditedOrganization;
use App\Models\DownloadFile;
use App\Models\Faq;
use App\Models\Menu;
use App\Models\News;
use App\Models\Page;
use App\Models\Partner;
use App\Models\Slider;
use App\Models\User;
use App\Observers\AccreditedOrganizationObserver;
use App\Observers\DownloadFileObserver;
use App\Observers\FaqObserver;
use App\Observers\MenuObserver;
use App\Observers\NewsObserver;
use App\Observers\PageObserver;
use App\Observers\PartnerObserver;
use App\Observers\SliderObserver;
use App\Observers\UserObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        News::observe(NewsObserver::class);
        Slider::observe(SliderObserver::class);
        Partner::observe(PartnerObserver::class);
        Faq::observe(FaqObserver::class);
        Page::observe(PageObserver::class);
        User::observe(UserObserver::class);
        Menu::observe(MenuObserver::class);
        AccreditedOrganization::observe(AccreditedOrganizationObserver::class);
        DownloadFile::observe(DownloadFileObserver::class);

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('admin', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('contact', function (Request $request) {
            $email = strtolower((string) $request->input('email'));
            $ip = (string) $request->ip();

            return [
                Limit::perMinute(5)->by("contact:ip:{$ip}"),
                Limit::perHour(12)->by('contact:email-ip:' . sha1($ip . '|' . $email)),
            ];
        });
    }
}
