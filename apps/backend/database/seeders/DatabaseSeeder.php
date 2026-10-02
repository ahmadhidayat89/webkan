<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Setting;
use App\Models\Slider;
use App\Models\QuickLink;
use App\Models\Partner;
use App\Models\News;
use App\Models\Faq;
use App\Models\AccreditationStep;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@kan.go.id'],
            [
                'name'     => 'Admin KAN',
                'password' => Hash::make('@dm1nKAN'),
                'role'     => 'super_admin',
            ]
        );

        // Settings
        $settings = [
            ['key' => 'site_name_id',    'value_id' => 'Komite Akreditasi Nasional',                                                                                               'type' => 'text',  'group' => 'general'],
            ['key' => 'site_logo',        'value_id' => null,                                                                                                                        'type' => 'image', 'group' => 'general'],
            ['key' => 'vision_id',        'value_id' => 'Menjadi lembaga akreditasi nasional yang terpercaya dan diakui secara internasional.',                                       'type' => 'text',  'group' => 'about'],
            ['key' => 'mission_id',       'value_id' => 'Memberikan layanan akreditasi yang profesional, transparan, dan akuntabel untuk mendukung daya saing nasional.',             'type' => 'text',  'group' => 'about'],
            ['key' => 'history_id',       'value_id' => 'Komite Akreditasi Nasional (KAN) didirikan untuk mengembangkan dan mengawasi sistem akreditasi nasional yang kredibel.',    'type' => 'text',  'group' => 'about'],
            ['key' => 'contact_address',  'value_id' => 'Jl. Kuningan Barat Raya, No. 01A, Kuningan, Mampang Prapatan, Jakarta Selatan, DKI Jakarta 12710 - INDONESIA',             'type' => 'text',  'group' => 'contact'],
            ['key' => 'contact_phone',    'value_id' => '081388636959',                                                                                                              'type' => 'text',  'group' => 'contact'],
            ['key' => 'contact_email',    'value_id' => 'laboratorium@bsn.go.id',                                                                                                   'type' => 'text',  'group' => 'contact'],
            ['key' => 'whatsapp_number',  'value_id' => '081388636959',                                                                                                             'type' => 'text',     'group' => 'contact'],
            ['key' => 'maps_embed',       'value_id' => 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.666!2d106.822889!3d-6.176104!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f42b33e1b4c3%3A0x1!2sGedung%20BPPT%20I!5e0!3m2!1sen!2sid', 'type' => 'textarea', 'group' => 'contact'],
            ['key' => 'social_facebook',  'value_id' => 'https://facebook.com',                                                                                                     'type' => 'text',     'group' => 'contact'],
            ['key' => 'social_twitter',   'value_id' => 'https://twitter.com',                                                                                                      'type' => 'text',     'group' => 'contact'],
            ['key' => 'social_instagram', 'value_id' => 'https://instagram.com/kan_akreditasi',                                                                                     'type' => 'text',     'group' => 'contact'],
            ['key' => 'social_youtube',   'value_id' => 'https://youtube.com',                                                                                                      'type' => 'text',     'group' => 'contact'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(['key' => $setting['key']], $setting);
        }

        // Sliders
        Slider::create([
            'title_id'    => 'Kedeputian Bidang Akreditasi Menuju Wilayah Bebas dari Korupsi',
            'subtitle_id' => 'Komitmen kami untuk menciptakan lingkungan kerja yang bersih dan profesional',
            'image'       => 'sliders/default1.jpg',
            'link'        => null,
            'order'       => 1,
            'is_active'   => true,
        ]);

        Slider::create([
            'title_id'    => 'Standarisasi dan Akreditasi untuk Daya Saing Bangsa',
            'subtitle_id' => 'Mendukung industri nasional melalui sistem akreditasi yang terpercaya',
            'image'       => 'sliders/default2.jpg',
            'link'        => null,
            'order'       => 2,
            'is_active'   => true,
        ]);

        // Quick links
        $quickLinks = [
            [
                'title_id'       => 'Anggota KAN',
                'description_id' => 'Informasi tentang anggota Komite Akreditasi Nasional',
                'icon'           => null,
                'link'           => '/anggota-kan',
                'order'          => 1,
                'is_active'      => true,
            ],
            [
                'title_id'       => 'Dokumentasi Mutu KAN',
                'description_id' => 'Dokumen standar dan prosedur akreditasi',
                'icon'           => null,
                'link'           => '/dokumentasi',
                'order'          => 2,
                'is_active'      => true,
            ],
            [
                'title_id'       => 'Proses Akreditasi KAN',
                'description_id' => 'Tahapan proses akreditasi dari awal hingga akhir',
                'icon'           => null,
                'link'           => '/proses-akreditasi',
                'order'          => 3,
                'is_active'      => true,
            ],
        ];

        foreach ($quickLinks as $link) {
            QuickLink::create($link);
        }

        // Partners
        $partners = [
            ['name' => 'IAF',      'logo' => 'partners/iaf.png',  'url' => 'https://iaf.nu',                    'order' => 1, 'is_active' => true],
            ['name' => 'ILAC-MRA', 'logo' => 'partners/ilac.png', 'url' => 'https://ilac.org',                  'order' => 2, 'is_active' => true],
            ['name' => 'APAC',     'logo' => 'partners/apac.png', 'url' => 'https://apac-accreditation.org',    'order' => 3, 'is_active' => true],
        ];

        foreach ($partners as $partner) {
            Partner::create($partner);
        }

        // Sample news
        News::updateOrCreate(
            ['slug' => 'bsn-ktr-bahas-implementasi'],
            [
                'title_id'     => 'BSN â€“ KTR Bahas Implementasi Kerja Sama Teknis Standardisasi dan Verifikasi Gas Rumah Kaca',
                'content_id'   => 'Badan Standardisasi Nasional (BSN) bersama Korea Testing and Research Institute (KTR) menggelar Rapat Pembahasan Tindak Lanjut Program Kerja Sama Teknis (PKT)...',
                'excerpt_id'   => 'BSN dan KTR membahas kerja sama teknis untuk standardisasi dan verifikasi gas rumah kaca',
                'image'        => null,
                'category'     => 'news',
                'is_published' => true,
                'published_at' => now(),
                'created_by'   => $adminUser->id,
            ]
        );

        $this->call(MenuSeeder::class);
        $this->call(FaqSeeder::class);
        $this->call(PageContentSeeder::class);
        $this->call(PageSeeder::class);
        $this->call(AccreditationStepSeeder::class);

        $this->command->info('Database seeded successfully!');
    }
}
