<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CourseEvent;
use Carbon\Carbon;

class CourseEventSeeder extends Seeder
{
    /**
     * Seed data event kursus untuk demo.
     */
    public function run(): void
    {
        $now = Carbon::now();

        $events = [
            // Events untuk ISO 17025 (course_id: 1)
            [
                'course_id' => 1,
                'title' => 'Batas Pengumpulan Tugas Modul 1',
                'description' => 'Deadline pengumpulan tugas praktik Modul 1: Pendahuluan & Ruang Lingkup.',
                'start_datetime' => $now->copy()->addDays(2)->setHour(23)->setMinute(59),
                'end_datetime' => null,
                'event_type' => 'deadline',
            ],
            [
                'course_id' => 1,
                'title' => 'Live Session: Tanya Jawab ISO 17025',
                'description' => 'Sesi tanya jawab langsung bersama Dr. Ahmad Ridwan tentang penerapan ISO 17025.',
                'start_datetime' => $now->copy()->addDays(3)->setHour(10)->setMinute(0),
                'end_datetime' => $now->copy()->addDays(3)->setHour(12)->setMinute(0),
                'event_type' => 'live_session',
            ],
            [
                'course_id' => 1,
                'title' => 'Ujian Tengah Kursus',
                'description' => 'Assessment komprehensif mencakup Modul 1 dan Modul 2.',
                'start_datetime' => $now->copy()->addDays(7)->setHour(9)->setMinute(0),
                'end_datetime' => $now->copy()->addDays(7)->setHour(11)->setMinute(0),
                'event_type' => 'assessment',
            ],

            // Events untuk ISO 17021 (course_id: 2)
            [
                'course_id' => 2,
                'title' => 'Workshop Audit Sistem Manajemen',
                'description' => 'Live workshop praktik audit sistem manajemen mutu bersama instruktur.',
                'start_datetime' => $now->copy()->addDays(5)->setHour(13)->setMinute(0),
                'end_datetime' => $now->copy()->addDays(5)->setHour(16)->setMinute(0),
                'event_type' => 'live_session',
            ],
            [
                'course_id' => 2,
                'title' => 'Deadline Laporan Audit',
                'description' => 'Batas pengumpulan laporan audit praktik Modul 3.',
                'start_datetime' => $now->copy()->addDays(10)->setHour(23)->setMinute(59),
                'end_datetime' => null,
                'event_type' => 'deadline',
            ],

            // Events untuk ISO 17065 (course_id: 3)
            [
                'course_id' => 3,
                'title' => 'Ujian Akhir ISO 17065',
                'description' => 'Ujian akhir komprehensif untuk sertifikasi ISO 17065.',
                'start_datetime' => $now->copy()->addDays(14)->setHour(9)->setMinute(0),
                'end_datetime' => $now->copy()->addDays(14)->setHour(12)->setMinute(0),
                'event_type' => 'assessment',
            ],

            // Events untuk Pengenalan SNI (course_id: 4)
            [
                'course_id' => 4,
                'title' => 'Webinar: Peran SNI dalam Industri',
                'description' => 'Webinar publik tentang peran Standar Nasional Indonesia dalam dunia industri.',
                'start_datetime' => $now->copy()->addDays(4)->setHour(14)->setMinute(0),
                'end_datetime' => $now->copy()->addDays(4)->setHour(15)->setMinute(30),
                'event_type' => 'live_session',
            ],
            [
                'course_id' => 4,
                'title' => 'Kuis Pengenalan SNI',
                'description' => 'Assessment singkat untuk menguji pemahaman dasar tentang SNI.',
                'start_datetime' => $now->copy()->addDays(6)->setHour(8)->setMinute(0),
                'end_datetime' => $now->copy()->addDays(6)->setHour(9)->setMinute(0),
                'event_type' => 'assessment',
            ],

            // Event di bulan ini tapi sudah lewat (untuk testing kalender)
            [
                'course_id' => 1,
                'title' => 'Pembukaan Kursus ISO 17025',
                'description' => 'Sesi orientasi dan pembukaan kursus secara daring.',
                'start_datetime' => $now->copy()->subDays(5)->setHour(9)->setMinute(0),
                'end_datetime' => $now->copy()->subDays(5)->setHour(10)->setMinute(0),
                'event_type' => 'live_session',
            ],
            [
                'course_id' => 2,
                'title' => 'Deadline Registrasi Audit',
                'description' => 'Batas pendaftaran untuk sesi praktik audit.',
                'start_datetime' => $now->copy()->subDays(2)->setHour(17)->setMinute(0),
                'end_datetime' => null,
                'event_type' => 'deadline',
            ],
        ];

        foreach ($events as $event) {
            CourseEvent::create($event);
        }
    }
}
