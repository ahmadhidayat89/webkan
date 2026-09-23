  <?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PageContent;

class PageContentSeeder extends Seeder
{
    public function run(): void
    {
        $pages = [

            // =============================================
            // TENTANG KAN
            // =============================================
            [
                'page_id' => 'sejarah-fungsi',
                'content_id' => '<h2>Sejarah KAN</h2>
<p>Komite Akreditasi Nasional (KAN) dibentuk berdasarkan Keputusan Presiden Nomor 13 Tahun 1997 sebagai lembaga non-struktural yang independen dan tidak memihak. KAN bertugas memberikan akreditasi kepada lembaga penilaian kesesuaian yang memenuhi persyaratan kompetensi internasional.</p>

<h2>Fungsi KAN</h2>
<p>KAN menjalankan beberapa fungsi utama, antara lain:</p>
<ul>
  <li>Memberikan akreditasi kepada lembaga penilaian kesesuaian (LPK)</li>
  <li>Membangun kepercayaan terhadap kompetensi LPK di Indonesia</li>
  <li>Mendukung perdagangan nasional dan internasional</li>
  <li>Melindungi kepentingan masyarakat melalui jaminan kompetensi lembaga</li>
  <li>Memperkuat infrastruktur mutu nasional</li>
</ul>

<h2>Dasar Hukum</h2>
<p>KAN beroperasi berdasarkan:</p>
<ul>
  <li>Keputusan Presiden No. 13 Tahun 1997</li>
  <li>PP No. 34 Tahun 2018 tentang Sistem Standardisasi dan Penilaian Kesesuaian Nasional</li>
  <li>Peraturan BSN No. 1 Tahun 2018</li>
</ul>',
                'content_en' => '<h2>History of KAN</h2>
<p>The National Accreditation Committee (KAN) was established based on Presidential Decree No. 13 of 1997 as an independent and impartial non-structural institution. KAN is tasked with accrediting conformity assessment bodies that meet international competency requirements.</p>

<h2>Functions of KAN</h2>
<p>KAN performs several main functions, including:</p>
<ul>
  <li>Accrediting conformity assessment bodies (CABs)</li>
  <li>Building trust in the competence of CABs in Indonesia</li>
  <li>Supporting national and international trade</li>
  <li>Protecting public interests through assurance of institutional competence</li>
  <li>Strengthening the national quality infrastructure</li>
</ul>',
            ],
            [
                'page_id' => 'struktur-organisasi',
                'content_id' => '<h2>Struktur Organisasi KAN</h2>
<p>KAN dipimpin oleh seorang Ketua yang dibantu oleh Wakil Ketua dan Sekretaris. Dalam menjalankan tugasnya, KAN dibantu oleh beberapa komite teknis.</p>

<h2>Dewan Pengurus</h2>
<ul>
  <li><strong>Ketua KAN:</strong> Dijabat oleh pejabat yang ditunjuk oleh Presiden</li>
  <li><strong>Wakil Ketua:</strong> Membantu tugas Ketua dalam koordinasi teknis</li>
  <li><strong>Sekretaris Jenderal:</strong> Mengelola administrasi dan kesekretariatan</li>
</ul>

<h2>Komite Teknis</h2>
<p>KAN memiliki beberapa komite teknis yang bertanggung jawab terhadap skema akreditasi tertentu, antara lain:</p>
<ul>
  <li>Komite Teknis Laboratorium Pengujian dan Kalibrasi</li>
  <li>Komite Teknis Lembaga Inspeksi</li>
  <li>Komite Teknis Lembaga Sertifikasi</li>
  <li>Komite Teknis Lembaga Verifikasi GRK</li>
</ul>',
                'content_en' => '<h2>KAN Organizational Structure</h2>
<p>KAN is led by a Chairman assisted by a Vice Chairman and Secretary. In carrying out its duties, KAN is supported by several technical committees.</p>

<h2>Board of Directors</h2>
<ul>
  <li><strong>Chairman of KAN:</strong> Held by an official appointed by the President</li>
  <li><strong>Vice Chairman:</strong> Assists the Chairman in technical coordination</li>
  <li><strong>Secretary General:</strong> Manages administration and secretariat</li>
</ul>',
            ],
            [
                'page_id' => 'ketidakberpihakan',
                'content_id' => '<h2>Komitmen Ketidakberpihakan</h2>
<p>KAN berkomitmen penuh untuk menjaga ketidakberpihakan dalam seluruh kegiatan akreditasinya. Ketidakberpihakan merupakan prinsip fundamental yang menjamin kepercayaan publik terhadap sistem akreditasi Indonesia.</p>

<h2>Prinsip Ketidakberpihakan</h2>
<ul>
  <li>KAN tidak memiliki kepentingan komersial dalam hasil akreditasi</li>
  <li>Seluruh asesor diseleksi secara ketat dan bebas dari konflik kepentingan</li>
  <li>Keputusan akreditasi dibuat secara kolektif dan independen</li>
  <li>Transparansi dalam seluruh proses penilaian</li>
</ul>

<h2>Pengelolaan Risiko Ketidakberpihakan</h2>
<p>KAN memiliki prosedur khusus untuk mengidentifikasi, menganalisis, dan mengelola risiko ketidakberpihakan, termasuk mekanisme pelaporan dan penanganan keluhan yang efektif.</p>',
                'content_en' => '<h2>Impartiality Commitment</h2>
<p>KAN is fully committed to maintaining impartiality in all its accreditation activities. Impartiality is a fundamental principle that ensures public trust in Indonesia\'s accreditation system.</p>

<h2>Principles of Impartiality</h2>
<ul>
  <li>KAN has no commercial interest in accreditation outcomes</li>
  <li>All assessors are strictly selected and free from conflicts of interest</li>
  <li>Accreditation decisions are made collectively and independently</li>
  <li>Transparency in all assessment processes</li>
</ul>',
            ],
            [
                'page_id' => 'pengakuan-internasional',
                'content_id' => '<h2>Pengakuan Internasional KAN</h2>
<p>KAN telah mendapatkan pengakuan internasional dari berbagai organisasi akreditasi internasional, yang memungkinkan hasil pengujian, kalibrasi, inspeksi, dan sertifikasi dari LPK yang terakreditasi KAN dapat diterima secara global.</p>

<h2>Keanggotaan Internasional</h2>
<ul>
  <li><strong>ILAC</strong> – International Laboratory Accreditation Cooperation (MRA Penandatanganan)</li>
  <li><strong>IAF</strong> – International Accreditation Forum (MLA Penandatanganan)</li>
  <li><strong>APLAC</strong> – Asia Pacific Laboratory Accreditation Cooperation</li>
  <li><strong>PAC</strong> – Pacific Accreditation Cooperation</li>
</ul>

<h2>Manfaat Pengakuan Internasional</h2>
<p>Dengan pengakuan internasional, sertifikat dan laporan yang diterbitkan oleh LPK terakreditasi KAN diakui di lebih dari 100 negara, sehingga memperlancar perdagangan ekspor produk Indonesia.</p>',
                'content_en' => '<h2>KAN International Recognition</h2>
<p>KAN has received international recognition from various international accreditation organizations, allowing testing, calibration, inspection, and certification results from KAN-accredited CABs to be accepted globally.</p>

<h2>International Memberships</h2>
<ul>
  <li><strong>ILAC</strong> – International Laboratory Accreditation Cooperation (MRA Signatory)</li>
  <li><strong>IAF</strong> – International Accreditation Forum (MLA Signatory)</li>
  <li><strong>APLAC</strong> – Asia Pacific Laboratory Accreditation Cooperation</li>
  <li><strong>PAC</strong> – Pacific Accreditation Cooperation</li>
</ul>',
            ],
            [
                'page_id' => 'anggota-kan',
                'content_id' => '<h2>Anggota KAN</h2>
<p>KAN memiliki anggota yang terdiri dari berbagai pemangku kepentingan di bidang akreditasi dan penilaian kesesuaian di Indonesia.</p>

<h2>Komposisi Anggota</h2>
<ul>
  <li>Kementerian dan Lembaga Pemerintah terkait</li>
  <li>Asosiasi Industri dan Perdagangan</li>
  <li>Lembaga Konsumen</li>
  <li>Pakar dan Akademisi di bidang terkait</li>
</ul>

<h2>Peran Anggota</h2>
<p>Anggota KAN berperan dalam:</p>
<ul>
  <li>Merumuskan kebijakan akreditasi nasional</li>
  <li>Memberikan masukan terhadap perkembangan skema akreditasi</li>
  <li>Menjaga kepentingan berbagai pemangku kepentingan</li>
</ul>',
                'content_en' => '<h2>KAN Members</h2>
<p>KAN has members consisting of various stakeholders in the field of accreditation and conformity assessment in Indonesia.</p>',
            ],
            [
                'page_id' => 'maklumat-layanan',
                'content_id' => '<h2>Maklumat Layanan KAN</h2>
<p>KAN berkomitmen untuk memberikan pelayanan akreditasi yang berkualitas, transparan, dan dapat dipertanggungjawabkan kepada seluruh pemohon akreditasi.</p>

<h2>Standar Layanan yang Kami Janjikan</h2>
<ul>
  <li>Merespons permohonan akreditasi dalam waktu <strong>5 hari kerja</strong></li>
  <li>Menyelesaikan proses asesmen awal dalam waktu <strong>30 hari kerja</strong></li>
  <li>Memberikan keputusan akreditasi dalam waktu <strong>60 hari kerja</strong> setelah asesmen selesai</li>
  <li>Menanggapi keluhan dan banding dalam waktu <strong>10 hari kerja</strong></li>
</ul>

<h2>Hak Pemohon</h2>
<ul>
  <li>Mendapatkan informasi yang jelas dan lengkap mengenai persyaratan akreditasi</li>
  <li>Diperlakukan secara adil dan tidak diskriminatif</li>
  <li>Mengajukan keluhan dan banding atas keputusan akreditasi</li>
  <li>Mendapatkan kerahasiaan informasi yang bersifat rahasia</li>
</ul>',
                'content_en' => '<h2>KAN Service Charter</h2>
<p>KAN is committed to providing quality, transparent, and accountable accreditation services to all accreditation applicants.</p>',
            ],
            [
                'page_id' => 'standar-layanan',
                'content_id' => '<h2>Standar Layanan Akreditasi</h2>
<p>KAN menetapkan standar layanan akreditasi yang mengacu pada persyaratan internasional ISO/IEC 17011 dan kebijakan ILAC serta IAF.</p>

<h2>Tahapan Proses Akreditasi</h2>
<ol>
  <li><strong>Permohonan</strong> – Pemohon mengajukan permohonan melalui sistem online KAN</li>
  <li><strong>Tinjauan Permohonan</strong> – KAN meninjau kelengkapan dokumen permohonan</li>
  <li><strong>Asesmen Awal</strong> – Tim asesor melakukan evaluasi kecukupan dokumen</li>
  <li><strong>Asesmen Lapangan</strong> – Asesor melakukan kunjungan ke lokasi pemohon</li>
  <li><strong>Tinjauan Asesmen</strong> – Komite teknis meninjau hasil asesmen</li>
  <li><strong>Keputusan Akreditasi</strong> – KAN menerbitkan keputusan akreditasi</li>
  <li><strong>Surveilan</strong> – KAN melakukan pengawasan berkala terhadap LPK terakreditasi</li>
</ol>',
                'content_en' => '<h2>Accreditation Service Standards</h2>
<p>KAN establishes accreditation service standards referring to international requirements of ISO/IEC 17011 and ILAC and IAF policies.</p>',
            ],

            // =============================================
            // PROSES AKREDITASI
            // =============================================
            [
                'page_id' => 'proses-akreditasi',
                'content_id' => '<h2>Proses Akreditasi KAN</h2>
<p>Akreditasi adalah pengakuan formal oleh KAN bahwa suatu lembaga penilaian kesesuaian telah memenuhi persyaratan kompetensi yang ditetapkan berdasarkan standar internasional.</p>

<h2>Alur Proses Akreditasi</h2>
<ol>
  <li><strong>Persiapan Permohonan</strong> – Calon pemohon menyiapkan dokumen sistem manajemen</li>
  <li><strong>Pengajuan Permohonan</strong> – Permohonan diajukan melalui portal KAN</li>
  <li><strong>Tinjauan Awal</strong> – Tim KAN memeriksa kelengkapan dokumen</li>
  <li><strong>Penugasan Tim Asesor</strong> – KAN menunjuk tim asesor yang kompeten</li>
  <li><strong>Asesmen Dokumen</strong> – Evaluasi kecukupan dokumen sistem manajemen</li>
  <li><strong>Asesmen Lapangan</strong> – Kunjungan ke tempat pemohon untuk verifikasi</li>
  <li><strong>Laporan Asesmen</strong> – Tim asesor menyusun laporan hasil asesmen</li>
  <li><strong>Tinjauan dan Keputusan</strong> – Komite teknis meninjau dan memutuskan</li>
  <li><strong>Penerbitan Sertifikat</strong> – KAN menerbitkan sertifikat akreditasi</li>
</ol>

<h2>Jenis Akreditasi</h2>
<ul>
  <li>Akreditasi Baru</li>
  <li>Perluasan Ruang Lingkup</li>
  <li>Reakrediasi (Perpanjangan)</li>
  <li>Surveilans (Pengawasan)</li>
</ul>',
                'content_en' => '<h2>KAN Accreditation Process</h2>
<p>Accreditation is a formal recognition by KAN that a conformity assessment body has met the competency requirements established based on international standards.</p>',
            ],
            [
                'page_id' => 'tarif-akreditasi',
                'content_id' => '<h2>Tarif Layanan Akreditasi</h2>
<p>Tarif layanan akreditasi KAN ditetapkan berdasarkan Peraturan Pemerintah tentang Jenis dan Tarif atas Jenis Penerimaan Negara Bukan Pajak (PNBP) yang berlaku di lingkungan BSN.</p>

<h2>Komponen Biaya Akreditasi</h2>
<ul>
  <li><strong>Biaya Permohonan</strong> – Biaya administrasi pengajuan permohonan akreditasi</li>
  <li><strong>Biaya Asesmen</strong> – Biaya pelaksanaan asesmen dokumen dan lapangan</li>
  <li><strong>Biaya Perjalanan Asesor</strong> – Biaya transportasi dan akomodasi tim asesor</li>
  <li><strong>Biaya Sertifikasi</strong> – Biaya penerbitan sertifikat akreditasi</li>
</ul>

<h2>Informasi Tarif</h2>
<p>Untuk informasi tarif terkini, silakan hubungi Sekretariat KAN atau kunjungi portal resmi KAN. Tarif dapat berbeda tergantung pada jenis LPK, ruang lingkup akreditasi, dan lokasi asesmen.</p>

<p><strong>Kontak Sekretariat KAN:</strong><br/>
Telepon: (021) 574-7043<br/>
Email: kan@bsn.go.id</p>',
                'content_en' => '<h2>Accreditation Service Fees</h2>
<p>KAN accreditation service fees are determined based on Government Regulations on Types and Rates of Non-Tax State Revenue (PNBP) applicable within BSN.</p>',
            ],
            [
                'page_id' => 'penanganan-komplain',
                'content_id' => '<h2>Penanganan Komplain</h2>
<p>KAN menyediakan mekanisme penanganan komplain yang transparan dan adil bagi semua pihak yang berkepentingan, termasuk pemohon akreditasi, LPK terakreditasi, dan pengguna layanan LPK.</p>

<h2>Jenis Komplain yang Dapat Diajukan</h2>
<ul>
  <li>Komplain terhadap proses akreditasi yang dilakukan KAN</li>
  <li>Komplain terhadap perilaku atau kompetensi asesor KAN</li>
  <li>Komplain terhadap LPK yang terakreditasi KAN</li>
  <li>Komplain terhadap keputusan akreditasi</li>
</ul>

<h2>Prosedur Pengajuan Komplain</h2>
<ol>
  <li>Komplain diajukan secara tertulis kepada Sekretariat KAN</li>
  <li>KAN akan mengkonfirmasi penerimaan komplain dalam <strong>5 hari kerja</strong></li>
  <li>Tim khusus dibentuk untuk menginvestigasi komplain</li>
  <li>Tanggapan atas komplain diberikan dalam <strong>30 hari kerja</strong></li>
  <li>Hasil penanganan komplain dikomunikasikan kepada pengadu</li>
</ol>

<h2>Cara Mengajukan Komplain</h2>
<p>Komplain dapat diajukan melalui:</p>
<ul>
  <li>Email: komplain.kan@bsn.go.id</li>
  <li>Surat tertulis ke Sekretariat KAN</li>
  <li>Portal pengaduan resmi KAN</li>
</ul>',
                'content_en' => '<h2>Complaint Handling</h2>
<p>KAN provides a transparent and fair complaint handling mechanism for all interested parties, including accreditation applicants, accredited CABs, and CAB service users.</p>',
            ],
            [
                'page_id' => 'penanganan-banding',
                'content_id' => '<h2>Penanganan Banding</h2>
<p>Banding adalah mekanisme yang disediakan KAN bagi pemohon atau LPK yang tidak puas dengan keputusan akreditasi yang telah ditetapkan.</p>

<h2>Hak Mengajukan Banding</h2>
<p>Setiap pemohon atau LPK terakreditasi berhak mengajukan banding atas:</p>
<ul>
  <li>Penolakan permohonan akreditasi</li>
  <li>Penangguhan akreditasi</li>
  <li>Pencabutan akreditasi</li>
  <li>Penolakan perluasan ruang lingkup</li>
</ul>

<h2>Prosedur Pengajuan Banding</h2>
<ol>
  <li>Banding diajukan secara tertulis dalam waktu <strong>30 hari</strong> setelah keputusan diterima</li>
  <li>Banding harus disertai bukti dan alasan yang kuat</li>
  <li>KAN membentuk panel banding yang independen</li>
  <li>Panel banding meninjau seluruh dokumentasi dan bukti</li>
  <li>Keputusan banding bersifat final dan mengikat</li>
  <li>Proses banding diselesaikan dalam <strong>45 hari kerja</strong></li>
</ol>',
                'content_en' => '<h2>Appeal Handling</h2>
<p>An appeal is a mechanism provided by KAN for applicants or CABs who are dissatisfied with the accreditation decision that has been made.</p>',
            ],
            [
                'page_id' => 'survey-kepuasan-pelanggan',
                'content_id' => '<h2>Survey Kepuasan Pelanggan</h2>
<p>KAN secara rutin melaksanakan survey kepuasan pelanggan sebagai salah satu mekanisme untuk mengevaluasi dan meningkatkan kualitas layanan akreditasi.</p>

<h2>Tujuan Survey</h2>
<ul>
  <li>Mengukur tingkat kepuasan pelanggan terhadap layanan KAN</li>
  <li>Mengidentifikasi area yang perlu ditingkatkan</li>
  <li>Mendapatkan masukan untuk perbaikan berkelanjutan</li>
  <li>Memenuhi persyaratan ISO/IEC 17011</li>
</ul>

<h2>Periode Survey</h2>
<p>Survey dilaksanakan setiap tahun dan melibatkan seluruh LPK terakreditasi, pemohon akreditasi, serta pengguna layanan LPK terakreditasi KAN.</p>

<h2>Cara Berpartisipasi</h2>
<p>Kuesioner survey akan dikirimkan melalui email kepada seluruh pemangku kepentingan yang terdaftar. Partisipasi Anda sangat berharga untuk peningkatan layanan KAN.</p>',
                'content_en' => '<h2>Customer Satisfaction Survey</h2>
<p>KAN regularly conducts customer satisfaction surveys as one of the mechanisms to evaluate and improve the quality of accreditation services.</p>',
            ],

            // =============================================
            // LAYANAN AKREDITASI
            // =============================================
            [
                'page_id' => 'layanan/laboratorium',
                'content_id' => '<h2>Akreditasi Laboratorium</h2>
<p>KAN memberikan akreditasi kepada laboratorium pengujian dan kalibrasi berdasarkan standar <strong>SNI ISO/IEC 17025</strong> yang merupakan standar internasional untuk kompetensi laboratorium.</p>

<h2>Jenis Laboratorium yang Dapat Diakreditasi</h2>
<ul>
  <li>Laboratorium Pengujian (Testing Laboratory)</li>
  <li>Laboratorium Kalibrasi (Calibration Laboratory)</li>
  <li>Laboratorium Medis (Medical Laboratory) – berdasarkan ISO 15189</li>
</ul>

<h2>Persyaratan Akreditasi</h2>
<p>Laboratorium yang mengajukan akreditasi harus memenuhi persyaratan:</p>
<ul>
  <li>Memiliki sistem manajemen yang terdokumentasi sesuai ISO/IEC 17025</li>
  <li>Memiliki personel yang kompeten di bidangnya</li>
  <li>Menggunakan peralatan yang terkalibrasi dengan baik</li>
  <li>Memiliki fasilitas dan lingkungan yang sesuai</li>
  <li>Berpartisipasi dalam uji profisiensi secara reguler</li>
</ul>',
                'content_en' => '<h2>Laboratory Accreditation</h2>
<p>KAN provides accreditation to testing and calibration laboratories based on the <strong>SNI ISO/IEC 17025</strong> standard, which is the international standard for laboratory competence.</p>',
            ],
            [
                'page_id' => 'layanan/lembaga-inspeksi',
                'content_id' => '<h2>Akreditasi Lembaga Inspeksi</h2>
<p>KAN memberikan akreditasi kepada lembaga inspeksi berdasarkan standar <strong>SNI ISO/IEC 17020</strong> yang mencakup persyaratan untuk operasi berbagai jenis lembaga inspeksi.</p>

<h2>Tipe Lembaga Inspeksi</h2>
<ul>
  <li><strong>Tipe A</strong> – Lembaga Inspeksi Pihak Ketiga (independen)</li>
  <li><strong>Tipe B</strong> – Lembaga Inspeksi yang melayani perusahaan induknya</li>
  <li><strong>Tipe C</strong> – Lembaga Inspeksi yang melayani kliennya sendiri</li>
</ul>

<h2>Ruang Lingkup Inspeksi</h2>
<p>Akreditasi lembaga inspeksi mencakup berbagai bidang, antara lain:</p>
<ul>
  <li>Inspeksi minyak dan gas</li>
  <li>Inspeksi bangunan dan konstruksi</li>
  <li>Inspeksi lingkungan</li>
  <li>Inspeksi keselamatan</li>
  <li>Inspeksi produk</li>
</ul>',
                'content_en' => '<h2>Inspection Body Accreditation</h2>
<p>KAN provides accreditation to inspection bodies based on the <strong>SNI ISO/IEC 17020</strong> standard covering requirements for the operation of various types of inspection bodies.</p>',
            ],
            [
                'page_id' => 'layanan/lembaga-verifikasi-validasi-grk',
                'content_id' => '<h2>Akreditasi Lembaga Verifikasi dan/atau Validasi GRK</h2>
<p>KAN memberikan akreditasi kepada lembaga yang melakukan verifikasi dan/atau validasi gas rumah kaca (GRK) berdasarkan standar <strong>ISO 14065</strong> dan persyaratan terkait.</p>

<h2>Pengertian</h2>
<ul>
  <li><strong>Validasi GRK</strong> – Proses evaluasi terhadap pernyataan GRK berdasarkan rencana proyek yang belum dilaksanakan</li>
  <li><strong>Verifikasi GRK</strong> – Proses evaluasi terhadap pernyataan GRK berdasarkan data aktual yang telah tersedia</li>
</ul>

<h2>Persyaratan</h2>
<p>Lembaga yang mengajukan akreditasi harus memenuhi persyaratan ISO 14065 dan memiliki personel yang kompeten di bidang perubahan iklim dan metodologi kuantifikasi GRK.</p>',
                'content_en' => '<h2>GHG Verification and/or Validation Body Accreditation</h2>
<p>KAN provides accreditation to bodies performing greenhouse gas (GHG) verification and/or validation based on <strong>ISO 14065</strong> and related requirements.</p>',
            ],
            [
                'page_id' => 'layanan/penyelenggara-uji-profisiensi',
                'content_id' => '<h2>Akreditasi Penyelenggara Uji Profisiensi</h2>
<p>KAN memberikan akreditasi kepada penyelenggara uji profisiensi (PUP) berdasarkan standar <strong>SNI ISO/IEC 17043</strong>.</p>

<h2>Apa itu Uji Profisiensi?</h2>
<p>Uji profisiensi adalah evaluasi kinerja peserta terhadap kriteria yang telah ditetapkan sebelumnya melalui perbandingan antar laboratorium. Uji profisiensi penting untuk:</p>
<ul>
  <li>Memantau kinerja berkelanjutan laboratorium</li>
  <li>Mengidentifikasi masalah di laboratorium</li>
  <li>Menetapkan efektivitas metode pengujian</li>
  <li>Memberikan kepercayaan kepada pengguna layanan laboratorium</li>
</ul>',
                'content_en' => '<h2>Proficiency Testing Provider Accreditation</h2>
<p>KAN provides accreditation to proficiency testing providers based on the <strong>SNI ISO/IEC 17043</strong> standard.</p>',
            ],
            [
                'page_id' => 'layanan/produsen-bahan-acuan',
                'content_id' => '<h2>Akreditasi Produsen Bahan Acuan</h2>
<p>KAN memberikan akreditasi kepada produsen bahan acuan (PBA) berdasarkan standar <strong>ISO 17034</strong>.</p>

<h2>Apa itu Bahan Acuan?</h2>
<p>Bahan acuan adalah bahan yang memiliki satu atau lebih nilai properti yang cukup homogen dan stabil, yang telah ditetapkan agar sesuai untuk penggunaan yang dimaksudkan dalam pengukuran atau pemeriksaan sifat nominal.</p>

<h2>Manfaat Akreditasi PBA</h2>
<ul>
  <li>Jaminan kompetensi dan kualitas bahan acuan yang diproduksi</li>
  <li>Kepercayaan dari laboratorium pengguna</li>
  <li>Pengakuan internasional melalui ILAC MRA</li>
</ul>',
                'content_en' => '<h2>Reference Material Producer Accreditation</h2>
<p>KAN provides accreditation to reference material producers based on the <strong>ISO 17034</strong> standard.</p>',
            ],
            [
                'page_id' => 'layanan/sistem-manajemen',
                'content_id' => '<h2>Akreditasi Lembaga Sertifikasi Sistem Manajemen</h2>
<p>KAN memberikan akreditasi kepada lembaga sertifikasi sistem manajemen berdasarkan standar <strong>SNI ISO/IEC 17021-1</strong>.</p>

<h2>Skema Sertifikasi Sistem Manajemen</h2>
<ul>
  <li><strong>ISO 9001</strong> – Sistem Manajemen Mutu</li>
  <li><strong>ISO 14001</strong> – Sistem Manajemen Lingkungan</li>
  <li><strong>ISO 45001</strong> – Sistem Manajemen K3</li>
  <li><strong>ISO 27001</strong> – Sistem Manajemen Keamanan Informasi</li>
  <li><strong>ISO 22000</strong> – Sistem Manajemen Keamanan Pangan</li>
  <li><strong>IATF 16949</strong> – Sistem Manajemen Mutu Otomotif</li>
</ul>',
                'content_en' => '<h2>Management System Certification Body Accreditation</h2>
<p>KAN provides accreditation to management system certification bodies based on the <strong>SNI ISO/IEC 17021-1</strong> standard.</p>',
            ],
            [
                'page_id' => 'layanan/sertifikasi-person',
                'content_id' => '<h2>Akreditasi Lembaga Sertifikasi Person</h2>
<p>KAN memberikan akreditasi kepada lembaga sertifikasi person (LSP) berdasarkan standar <strong>SNI ISO/IEC 17024</strong>.</p>

<h2>Apa itu Sertifikasi Person?</h2>
<p>Sertifikasi person adalah proses penilaian dan sertifikasi terhadap kompetensi individu di bidang tertentu. LSP yang terakreditasi KAN memberikan jaminan bahwa personel yang disertifikasi memiliki kompetensi yang diakui secara nasional dan internasional.</p>

<h2>Manfaat Sertifikasi Person</h2>
<ul>
  <li>Pengakuan kompetensi profesional yang objektif</li>
  <li>Meningkatkan daya saing tenaga kerja Indonesia</li>
  <li>Mendukung program sertifikasi kompetensi nasional</li>
</ul>',
                'content_en' => '<h2>Personnel Certification Body Accreditation</h2>
<p>KAN provides accreditation to personnel certification bodies based on the <strong>SNI ISO/IEC 17024</strong> standard.</p>',
            ],
            [
                'page_id' => 'layanan/sertifikasi-sni-iso-iec-17065',
                'content_id' => '<h2>Akreditasi Lembaga Sertifikasi Produk</h2>
<p>KAN memberikan akreditasi kepada lembaga sertifikasi produk, proses, dan jasa berdasarkan standar <strong>SNI ISO/IEC 17065</strong>.</p>

<h2>Ruang Lingkup</h2>
<p>Akreditasi mencakup lembaga yang melakukan sertifikasi terhadap:</p>
<ul>
  <li>Produk (barang)</li>
  <li>Proses produksi</li>
  <li>Jasa/layanan</li>
</ul>

<h2>Skema Sertifikasi Produk</h2>
<ul>
  <li>Sertifikasi SNI (Standar Nasional Indonesia)</li>
  <li>Sertifikasi Halal</li>
  <li>Sertifikasi produk elektronik dan kelistrikan</li>
  <li>Sertifikasi produk pangan</li>
</ul>',
                'content_en' => '<h2>Product Certification Body Accreditation (ISO/IEC 17065)</h2>
<p>KAN provides accreditation to bodies certifying products, processes, and services based on the <strong>SNI ISO/IEC 17065</strong> standard.</p>',
            ],
            [
                'page_id' => 'layanan/sertifikasi-pembangunan-berkelanjutan',
                'content_id' => '<h2>Akreditasi Lembaga Sertifikasi Pembangunan Berkelanjutan</h2>
<p>KAN memberikan akreditasi kepada lembaga yang melakukan sertifikasi di bidang pembangunan berkelanjutan, termasuk sertifikasi lingkungan dan sosial.</p>

<h2>Skema Sertifikasi</h2>
<ul>
  <li>Sertifikasi Pengelolaan Hutan Berkelanjutan</li>
  <li>Sertifikasi Sustainable Palm Oil (RSPO, ISPO)</li>
  <li>Sertifikasi Bangunan Hijau</li>
  <li>Sertifikasi Carbon Footprint</li>
</ul>

<h2>Mengapa Penting?</h2>
<p>Sertifikasi pembangunan berkelanjutan semakin penting dalam perdagangan internasional modern, karena banyak negara tujuan ekspor mensyaratkan bukti praktik bisnis yang bertanggung jawab terhadap lingkungan dan sosial.</p>',
                'content_en' => '<h2>Sustainable Development Certification Body Accreditation</h2>
<p>KAN provides accreditation to bodies conducting certification in the field of sustainable development, including environmental and social certification.</p>',
            ],

            // =============================================
            // DIREKTORI LPK
            // =============================================
            [
                'page_id' => 'direktori/terakreditasi',
                'content_id' => '<h2>Direktori LPK Terakreditasi</h2>
<p>Berikut adalah informasi mengenai Lembaga Penilaian Kesesuaian (LPK) yang saat ini aktif terakreditasi oleh KAN.</p>

<h2>Cara Menggunakan Direktori</h2>
<p>Anda dapat mencari LPK terakreditasi berdasarkan:</p>
<ul>
  <li>Jenis LPK (Laboratorium, Lembaga Inspeksi, Lembaga Sertifikasi, dll)</li>
  <li>Ruang lingkup akreditasi</li>
  <li>Lokasi (provinsi/kota)</li>
  <li>Nomor sertifikat akreditasi</li>
</ul>

<h2>Validitas Sertifikat</h2>
<p>Sertifikat akreditasi berlaku selama <strong>4 tahun</strong> dengan surveilan tahunan. Pastikan LPK yang Anda pilih masih dalam masa berlaku akreditasi dan tidak sedang dalam status dibekukan.</p>

<p><em>Untuk mengakses database direktori lengkap, silakan kunjungi portal resmi KAN.</em></p>',
                'content_en' => '<h2>Accredited CAB Directory</h2>
<p>Here is information about Conformity Assessment Bodies (CABs) currently actively accredited by KAN.</p>',
            ],
            [
                'page_id' => 'direktori/akreditasi-dibekukan',
                'content_id' => '<h2>Direktori LPK dengan Akreditasi Dibekukan</h2>
<p>Berikut adalah daftar Lembaga Penilaian Kesesuaian (LPK) yang akreditasinya sedang dalam status dibekukan (suspended).</p>

<h2>Pengertian Pembekuan Akreditasi</h2>
<p>Pembekuan akreditasi dilakukan apabila LPK:</p>
<ul>
  <li>Tidak dapat memenuhi persyaratan akreditasi sementara waktu</li>
  <li>Gagal menindaklanjuti ketidaksesuaian dalam batas waktu yang ditetapkan</li>
  <li>Mengajukan permintaan pembekuan sukarela</li>
</ul>

<h2>Status Selama Pembekuan</h2>
<p>Selama masa pembekuan, LPK <strong>tidak diizinkan</strong> menggunakan simbol akreditasi KAN dan tidak boleh menerbitkan laporan/sertifikat baru dengan klaim akreditasi KAN.</p>',
                'content_en' => '<h2>Directory of CABs with Suspended Accreditation</h2>
<p>Here is the list of Conformity Assessment Bodies (CABs) whose accreditation is currently in suspended status.</p>',
            ],
            [
                'page_id' => 'direktori/akreditasi-dicabut',
                'content_id' => '<h2>Direktori LPK dengan Akreditasi Dicabut</h2>
<p>Berikut adalah daftar Lembaga Penilaian Kesesuaian (LPK) yang akreditasinya telah dicabut oleh KAN.</p>

<h2>Alasan Pencabutan Akreditasi</h2>
<p>Pencabutan akreditasi dapat terjadi karena:</p>
<ul>
  <li>LPK tidak mampu memenuhi kembali persyaratan setelah masa pembekuan</li>
  <li>Pelanggaran serius terhadap persyaratan akreditasi</li>
  <li>Permintaan sukarela dari LPK untuk mencabut akreditasi</li>
  <li>LPK tidak lagi beroperasi</li>
</ul>

<h2>Konsekuensi Pencabutan</h2>
<p>LPK yang akreditasinya dicabut tidak diperbolehkan mengklaim terakreditasi KAN dan harus mengajukan permohonan baru jika ingin mendapatkan akreditasi kembali.</p>',
                'content_en' => '<h2>Directory of CABs with Withdrawn Accreditation</h2>
<p>Here is the list of Conformity Assessment Bodies (CABs) whose accreditation has been withdrawn by KAN.</p>',
            ],

            // =============================================
            // UNDUH
            // =============================================
            [
                'page_id' => 'unduh/dokumen-akreditasi',
                'content_id' => '<h2>Dokumen Akreditasi</h2>
<p>Halaman ini menyediakan berbagai dokumen resmi KAN yang berkaitan dengan pelaksanaan akreditasi, termasuk formulir, panduan, dan kebijakan akreditasi.</p>

<h2>Kategori Dokumen</h2>
<ul>
  <li><strong>Formulir Permohonan</strong> – Formulir pengajuan akreditasi untuk setiap skema</li>
  <li><strong>Panduan Akreditasi</strong> – Panduan umum dan teknis pelaksanaan akreditasi</li>
  <li><strong>Kebijakan KAN</strong> – Kebijakan dan prosedur resmi KAN</li>
  <li><strong>Kriteria Akreditasi</strong> – Dokumen persyaratan teknis per skema akreditasi</li>
  <li><strong>Contoh Dokumen</strong> – Template dan contoh dokumen sistem manajemen</li>
</ul>

<p><em>Untuk mengunduh dokumen, silakan login ke portal KAN atau hubungi Sekretariat KAN.</em></p>',
                'content_en' => '<h2>Accreditation Documents</h2>
<p>This page provides various official KAN documents related to the implementation of accreditation, including forms, guidelines, and accreditation policies.</p>',
            ],
            [
                'page_id' => 'unduh/materi-kegiatan',
                'content_id' => '<h2>Materi Kegiatan</h2>
<p>Halaman ini menyediakan materi dari berbagai kegiatan yang diselenggarakan oleh KAN, termasuk seminar, workshop, pelatihan, dan sosialisasi.</p>

<h2>Jenis Materi yang Tersedia</h2>
<ul>
  <li>Presentasi seminar dan workshop akreditasi</li>
  <li>Materi pelatihan asesor</li>
  <li>Materi sosialisasi persyaratan akreditasi baru</li>
  <li>Rekaman webinar</li>
  <li>Prosiding konferensi</li>
</ul>

<h2>Kegiatan Terkini</h2>
<p>KAN secara rutin menyelenggarakan berbagai kegiatan untuk meningkatkan kapasitas pemangku kepentingan di bidang akreditasi dan penilaian kesesuaian.</p>',
                'content_en' => '<h2>Activity Materials</h2>
<p>This page provides materials from various activities organized by KAN, including seminars, workshops, training, and socialization events.</p>',
            ],
            [
                'page_id' => 'unduh/artikel-penilaian-kesesuaian',
                'content_id' => '<h2>Artikel Penilaian Kesesuaian</h2>
<p>Kumpulan artikel ilmiah, jurnal, dan publikasi teknis mengenai penilaian kesesuaian yang diterbitkan oleh KAN dan mitra internasional.</p>

<h2>Topik Artikel</h2>
<ul>
  <li>Perkembangan standar akreditasi internasional</li>
  <li>Implementasi ISO/IEC 17011 terbaru</li>
  <li>Teknik dan metodologi penilaian kesesuaian</li>
  <li>Infrastruktur mutu nasional</li>
  <li>Dampak akreditasi terhadap perdagangan</li>
  <li>Artikel tentang uji profisiensi dan bahan acuan</li>
</ul>',
                'content_en' => '<h2>Conformity Assessment Articles</h2>
<p>A collection of scientific articles, journals, and technical publications on conformity assessment published by KAN and international partners.</p>',
            ],
            [
                'page_id' => 'unduh/dokumen-internasional',
                'content_id' => '<h2>Dokumen Internasional</h2>
<p>Kumpulan dokumen internasional yang relevan dengan kegiatan akreditasi dan penilaian kesesuaian, termasuk dokumen dari ILAC, IAF, APLAC, dan PAC.</p>

<h2>Sumber Dokumen</h2>
<ul>
  <li><strong>ILAC</strong> – Dokumen kebijakan dan panduan Laboratory Accreditation</li>
  <li><strong>IAF</strong> – Dokumen kebijakan dan panduan Certification Accreditation</li>
  <li><strong>ISO/CASCO</strong> – Standar internasional penilaian kesesuaian</li>
  <li><strong>OIML</strong> – Dokumen metrologi internasional</li>
</ul>

<h2>Catatan</h2>
<p>Beberapa dokumen internasional memerlukan izin dari organisasi penerbit untuk disebarluaskan. Silakan hubungi Sekretariat KAN untuk informasi ketersediaan dokumen tertentu.</p>',
                'content_en' => '<h2>International Documents</h2>
<p>A collection of international documents relevant to accreditation and conformity assessment activities, including documents from ILAC, IAF, APLAC, and PAC.</p>',
            ],
        ];

        foreach ($pages as $page) {
            PageContent::updateOrCreate(
                ['page_id' => $page['page_id']],
                [
                    'content_id' => $page['content_id'],
                    'content_en' => $page['content_en'] ?? null,
                    'image'      => null,
                ]
            );
        }

        $this->command->info('✓ ' . count($pages) . ' halaman berhasil di-seed.');
    }
}
