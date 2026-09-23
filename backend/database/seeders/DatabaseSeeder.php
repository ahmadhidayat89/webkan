<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Setting;
use App\Models\Slider;
use App\Models\QuickLink;
use App\Models\Partner;
use App\Models\News;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user
        User::create([
            'name' => 'Admin KAN',
            'email' => 'admin@kan.go.id',
            'password' => Hash::make('password'),
            'role' => 'super_admin',
        ]);

        // Create settings
        $settings = [
            ['key' => 'site_name_id', 'value_id' => 'Komite Akreditasi Nasional', 'value_en' => 'National Accreditation Committee', 'type' => 'text', 'group' => 'general'],
            ['key' => 'site_logo', 'value_id' => null, 'value_en' => null, 'type' => 'image', 'group' => 'general'],
            ['key' => 'vision_id', 'value_id' => 'Menjadi lembaga akreditasi nasional yang terpercaya dan diakui secara internasional.', 'value_en' => 'To become a trusted and internationally recognized national accreditation body.', 'type' => 'text', 'group' => 'about'],
            ['key' => 'mission_id', 'value_id' => 'Memberikan layanan akreditasi yang profesional, transparan, dan akuntabel untuk mendukung daya saing nasional.', 'value_en' => 'Providing professional, transparent, and accountable accreditation services to support national competitiveness.', 'type' => 'text', 'group' => 'about'],
            ['key' => 'history_id', 'value_id' => 'Komite Akreditasi Nasional (KAN) didirikan untuk mengembangkan dan mengawasi sistem akreditasi nasional yang kredibel.', 'value_en' => 'The National Accreditation Committee (KAN) was established to develop and oversee a credible national accreditation system.', 'type' => 'text', 'group' => 'about'],
            ['key' => 'contact_address', 'value_id' => 'Jl. Kuningan Barat Raya, No. 01A, Kuningan, Mampang Prapatan, Jakarta Selatan, DKI Jakarta 12710 - INDONESIA', 'value_en' => 'Jl. Kuningan Barat Raya, No. 01A, Kuningan, Mampang Prapatan, South Jakarta, DKI Jakarta 12710 - INDONESIA', 'type' => 'text', 'group' => 'contact'],
            ['key' => 'contact_phone', 'value_id' => '081388636959', 'value_en' => '081388636959', 'type' => 'text', 'group' => 'contact'],
            ['key' => 'contact_email', 'value_id' => 'laboratorium@bsn.go.id', 'value_en' => 'laboratorium@bsn.go.id', 'type' => 'text', 'group' => 'contact'],
            ['key' => 'social_facebook', 'value_id' => 'https://facebook.com', 'value_en' => 'https://facebook.com', 'type' => 'text', 'group' => 'social'],
            ['key' => 'social_twitter', 'value_id' => 'https://twitter.com', 'value_en' => 'https://twitter.com', 'type' => 'text', 'group' => 'social'],
            ['key' => 'social_instagram', 'value_id' => 'https://instagram.com/kan_akreditasi', 'value_en' => 'https://instagram.com/kan_akreditasi', 'type' => 'text', 'group' => 'social'],
            ['key' => 'social_youtube', 'value_id' => 'https://youtube.com', 'value_en' => 'https://youtube.com', 'type' => 'text', 'group' => 'social'],
        ];

        foreach ($settings as $setting) {
            Setting::create($setting);
        }

        // Create dummy sliders
        Slider::create([
            'title_id' => 'Kedeputian Bidang Akreditasi Menuju Wilayah Bebas dari Korupsi',
            'title_en' => 'Accreditation Deputy Towards Corruption-Free Zone',
            'subtitle_id' => 'Komitmen kami untuk menciptakan lingkungan kerja yang bersih dan profesional',
            'subtitle_en' => 'Our commitment to creating a clean and professional work environment',
            'image' => 'sliders/default1.jpg',
            'link' => null,
            'order' => 1,
            'is_active' => true,
        ]);

        Slider::create([
            'title_id' => 'Standarisasi dan Akreditasi untuk Daya Saing Bangsa',
            'title_en' => 'Standardization and Accreditation for National Competitiveness',
            'subtitle_id' => 'Mendukung industri nasional melalui sistem akreditasi yang terpercaya',
            'subtitle_en' => 'Supporting national industry through a trusted accreditation system',
            'image' => 'sliders/default2.jpg',
            'link' => null,
            'order' => 2,
            'is_active' => true,
        ]);

        // Create quick links
        $quickLinks = [
            [
                'title_id' => 'Anggota KAN',
                'title_en' => 'KAN Members',
                'description_id' => 'Informasi tentang anggota Komite Akreditasi Nasional',
                'description_en' => 'Information about National Accreditation Committee members',
                'icon' => null,
                'link' => '/anggota-kan',
                'order' => 1,
                'is_active' => true,
            ],
            [
                'title_id' => 'Dokumentasi Mutu KAN',
                'title_en' => 'KAN Quality Documentation',
                'description_id' => 'Dokumen standar dan prosedur akreditasi',
                'description_en' => 'Accreditation standards and procedure documents',
                'icon' => null,
                'link' => '/dokumentasi',
                'order' => 2,
                'is_active' => true,
            ],
            [
                'title_id' => 'Proses Akreditasi KAN',
                'title_en' => 'KAN Accreditation Process',
                'description_id' => 'Tahapan proses akreditasi dari awal hingga akhir',
                'description_en' => 'Accreditation process stages from start to finish',
                'icon' => null,
                'link' => '/proses-akreditasi',
                'order' => 3,
                'is_active' => true,
            ],
        ];

        foreach ($quickLinks as $link) {
            QuickLink::create($link);
        }

        // Create partners
        $partners = [
            ['name' => 'IAF', 'logo' => 'partners/iaf.png', 'url' => 'https://iaf.nu', 'order' => 1, 'is_active' => true],
            ['name' => 'ILAC-MRA', 'logo' => 'partners/ilac.png', 'url' => 'https://ilac.org', 'order' => 2, 'is_active' => true],
            ['name' => 'APAC', 'logo' => 'partners/apac.png', 'url' => 'https://apac-accreditation.org', 'order' => 3, 'is_active' => true],
        ];

        foreach ($partners as $partner) {
            Partner::create($partner);
        }

        // Create sample news
        News::create([
            'title_id' => 'BSN – KTR Bahas Implementasi Kerja Sama Teknis Standardisasi dan Verifikasi Gas Rumah Kaca',
            'title_en' => 'BSN – KTR Discuss Implementation of Technical Cooperation on Standardization and Greenhouse Gas Verification',
            'slug' => 'bsn-ktr-bahas-implementasi',
            'content_id' => 'Badan Standardisasi Nasional (BSN) bersama Korea Testing and Research Institute (KTR) menggelar Rapat Pembahasan Tindak Lanjut Program Kerja Sama Teknis (PKT)...',
            'content_en' => 'The National Standardization Agency (BSN) together with the Korea Testing and Research Institute (KTR) held a Follow-up Discussion Meeting...',
            'excerpt_id' => 'BSN dan KTR membahas kerja sama teknis untuk standardisasi dan verifikasi gas rumah kaca',
            'excerpt_en' => 'BSN and KTR discuss technical cooperation for greenhouse gas standardization and verification',
            'image' => null,
            'category' => 'news',
            'is_published' => true,
            'published_at' => now(),
            'created_by' => 1,
        ]);

        // Seed page contents
        $this->call(PageContentSeeder::class);

        $this->command->info('Database seeded successfully!');
    }
}