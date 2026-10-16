import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  FaHome, FaChevronRight, FaSpinner, FaCalendarAlt,
  FaArrowLeft, FaTimes, FaSearchPlus, FaSearchMinus,
  FaChevronLeft, FaExpand, FaPlay, FaImage
} from 'react-icons/fa';

const SURVEY_BASE = 'survey-kepuasan-pelanggan';
const SURVEY_LIST = 'hasil-survei';

// ─── Konfigurasi "hub" layanan yang punya sub-halaman ──────────────────────
// Tambah/ubah di sini saja kalau suatu saat ada layanan lain yang butuh
// pola sub-halaman yang sama (halaman induk + daftar + halaman per item).
const SUBPAGE_HUBS = [
  {
    base: 'layanan/laboratorium',
    list: 'daftar-laboratorium',
    parentLabel: 'Laboratorium',
    listHeading: 'Daftar Laboratorium',
    listTitle: 'Pilih Laboratorium',
    listDesc: 'Jenis laboratorium yang dapat diakreditasi oleh KAN',
    emptyIcon: '🧪',
    emptyTitle: 'Belum Ada Laboratorium',
    emptyDesc: 'Daftar jenis laboratorium akan ditampilkan di sini.',
  },
  {
    base: 'layanan/lembaga-verifikasi-validasi-grk',
    list: 'daftar-layanan/lembaga-verifikasi-validasi-grk',
    parentLabel: 'Lembaga Verifikasi dan/atau Validasi GRK',
    listHeading: 'Daftar Verifikasi & Validasi GRK',
    listTitle: 'Pilih Skema Verifikasi/Validasi GRK',
    listDesc: 'Skema verifikasi dan validasi gas rumah kaca yang dapat diakreditasi oleh KAN',
    emptyIcon: '🌿',
    emptyTitle: 'Belum Ada Skema',
    emptyDesc: 'Daftar skema verifikasi/validasi GRK akan ditampilkan di sini.',
  },
  {
    base: 'layanan/sistem-manajemen',
    list: 'daftar-layanan/sistem-manajemen',
    parentLabel: 'Sistem Manajemen',
    listHeading: 'Daftar Sistem Manajemen',
    listTitle: 'Pilih Skema Sistem Manajemen',
    listDesc: 'Skema sertifikasi sistem manajemen yang dapat diakreditasi oleh KAN',
    emptyIcon: '📋',
    emptyTitle: 'Belum Ada Skema',
    emptyDesc: 'Daftar skema sistem manajemen akan ditampilkan di sini.',
  },
  {
    base: 'layanan/sertifikasi-sni-iso-iec-17065',
    list: 'daftar-layanan/sertifikasi-sni-iso-iec-17065',
    parentLabel: 'Sertifikasi Berdasarkan SNI ISO/IEC 17065',
    listHeading: 'Daftar Sertifikasi SNI ISO/IEC 17065',
    listTitle: 'Pilih Skema Sertifikasi',
    listDesc: 'Skema sertifikasi produk, proses, dan jasa berdasarkan SNI ISO/IEC 17065',
    emptyIcon: '📜',
    emptyTitle: 'Belum Ada Skema',
    emptyDesc: 'Daftar skema sertifikasi akan ditampilkan di sini.',
  },
  {
    base: 'layanan/sertifikasi-pembangunan-berkelanjutan',
    list: 'daftar-layanan/sertifikasi-pembangunan-berkelanjutan',
    parentLabel: 'Sertifikasi Pembangunan Berkelanjutan',
    listHeading: 'Daftar Sertifikasi Pembangunan Berkelanjutan',
    listTitle: 'Pilih Skema Pembangunan Berkelanjutan',
    listDesc: 'Skema sertifikasi yang berkaitan dengan pembangunan berkelanjutan',
    emptyIcon: '🌱',
    emptyTitle: 'Belum Ada Skema',
    emptyDesc: 'Daftar skema akan ditampilkan di sini.',
  },
];

const humanizeSlug = (slug) =>
  slug.replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// ─── Lightbox Component ───────────────────────────────────────────────────────
const Lightbox = ({ images, initialIndex, onClose }) => {
  const [current, setCurrent] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef(null);
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  const goNext = useCallback(() => {
    setCurrent((c) => (c + 1) % images.length);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setIsLoading(true);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrent((c) => (c - 1 + images.length) % images.length);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setIsLoading(true);
  }, [images.length]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === '+') setZoom((z) => Math.min(z + 0.5, 4));
      if (e.key === '-') setZoom((z) => Math.max(z - 0.5, 1));
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goNext, goPrev]);

  // Geser gambar saat di-zoom: mousedown di gambar, mousemove/mouseup di window
  useEffect(() => {
    const imgEl = imgRef.current;
    if (!imgEl || zoom <= 1) return;

    let start = null;

    const handleMove = (e) => {
      setOffset({ x: e.clientX - start.x, y: e.clientY - start.y });
    };

    const handleUp = () => {
      start = null;
      setDragging(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    const handleDown = (e) => {
      e.preventDefault();
      start = {
        x: e.clientX - offsetRef.current.x,
        y: e.clientY - offsetRef.current.y,
      };
      setDragging(true);
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    };

    imgEl.addEventListener('mousedown', handleDown);
    return () => {
      imgEl.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [zoom]);

  const img = images[current];

  let cursor = 'default';
  if (zoom > 1) cursor = dragging ? 'grabbing' : 'grab';

  return (
    <dialog
      open
      aria-modal="true"
      aria-label="Pratinjau gambar"
      tabIndex={-1}
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.97)' }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 z-10 flex-shrink-0"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
        <div className="flex items-center gap-3">
          <FaImage className="text-white/60 text-sm" />
          <span className="text-white/80 text-sm font-medium">
            {current + 1} / {images.length}
          </span>
          {img.caption && (
            <span className="text-white/50 text-sm hidden md:inline">— {img.caption}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Zoom controls */}
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.5, 1))}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            title="Zoom out (-)"
          >
            <FaSearchMinus className="text-sm" />
          </button>
          <span className="text-white/60 text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.5, 4))}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            title="Zoom in (+)"
          >
            <FaSearchPlus className="text-sm" />
          </button>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-red-500/80 text-white transition-all"
            title="Tutup (Esc)"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden select-none"
        style={{ cursor }}
      >
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <FaSpinner className="text-white/40 text-3xl animate-spin" />
          </div>
        )}

        <img
          ref={imgRef}
          src={img.src}
          alt={img.caption || ''}
          onLoad={() => setIsLoading(false)}
          className="max-h-full max-w-full object-contain transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
            opacity: isLoading ? 0 : 1,
            transition: dragging ? 'none' : 'transform 0.2s ease, opacity 0.3s ease',
          }}
          draggable={false}
        />

        {/* Prev/Next arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all backdrop-blur-sm border border-white/10"
            >
              <FaChevronLeft className="text-lg" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all backdrop-blur-sm border border-white/10"
            >
              <FaChevronRight className="text-lg" />
            </button>
          </>
        )}
      </div>

      {/* Bottom: Thumbnails */}
      {images.length > 1 && (
        <div
          className="flex-shrink-0 px-6 py-4 flex items-center justify-center gap-2 overflow-x-auto"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}
        >
          {images.map((im, i) => (
            <button
              key={im.src}
              onClick={() => { setCurrent(i); setZoom(1); setOffset({ x: 0, y: 0 }); setIsLoading(true); }}
              className={`flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                i === current ? 'border-white scale-110' : 'border-white/20 opacity-50 hover:opacity-80'
              }`}
            >
              <img src={im.src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Caption bottom */}
      {img.caption && (
        <div className="flex-shrink-0 text-center pb-4 px-6">
          <p className="text-white/50 text-sm italic">{img.caption}</p>
        </div>
      )}
    </dialog>
  );
};

// ─── Video Embed Component ────────────────────────────────────────────────────
const VideoEmbed = ({ src, title }) => {
  const [playing, setPlaying] = useState(false);

  const getThumbnail = (url) => {
    const ytMatch = url.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([^?&"'>]+)/);
    if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
    return null;
  };

  const thumbnail = getThumbnail(src);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-black group my-6"
      style={{ aspectRatio: '16/9' }}>
      {!playing && thumbnail ? (
        <button type="button" aria-label={`Putar video ${title || ''}`} className="absolute inset-0 cursor-pointer border-0 bg-transparent p-0 text-left" onClick={() => setPlaying(true)}>
          <img src={thumbnail} alt={title || 'Video'} className="w-full h-full object-cover" />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
          {/* Play button */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
              <FaPlay className="text-white text-2xl ml-1" />
            </div>
            {title && (
              <div className="max-w-xs text-center">
                <span className="text-white text-sm font-medium bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-sm">
                  {title}
                </span>
              </div>
            )}
          </div>
        </button>
      ) : (
        <iframe
          src={playing ? `${src}?autoplay=1` : src}
          title={title || 'Video'}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
};

// ─── Data statis (dipindah dari dalam komponen, isi tidak diubah) ─────────────
const sectionPages = {
  'Tentang KAN': [
    { id: 'tentang-kan', label: 'Profil KAN' },
    { id: 'sejarah-fungsi', label: 'Sejarah dan Fungsi KAN' },
    { id: 'struktur-organisasi', label: 'Struktur Organisasi' },
    { id: 'ketidakberpihakan', label: 'Ketidakberpihakan' },
    { id: 'pengakuan-internasional', label: 'Pengakuan Internasional' },
    { id: 'anggota-kan', label: 'Anggota KAN' },
    { id: 'maklumat-layanan', label: 'Maklumat Layanan' },
    { id: 'standar-layanan', label: 'Standar Layanan Akreditasi' },
  ],
  'Proses Akreditasi': [
    { id: 'proses-akreditasi', label: 'Proses Akreditasi' },
    { id: 'tarif-akreditasi', label: 'Tarif Akreditasi' },
    { id: 'penanganan-komplain', label: 'Penanganan Komplain' },
    { id: 'penanganan-banding', label: 'Penanganan Banding' },
    { id: 'survey-kepuasan-pelanggan', label: 'Survey Kepuasan Pelanggan' },
  ],
  'Layanan Akreditasi': [
    { id: 'layanan-akreditasi', label: 'Layanan Akreditasi' },
    { id: 'layanan/laboratorium', label: 'Laboratorium' },
    { id: 'layanan/lembaga-inspeksi', label: 'Lembaga Inspeksi' },
    { id: 'layanan/lembaga-verifikasi-validasi-grk', label: 'Lembaga Verifikasi GRK' },
    { id: 'layanan/penyelenggara-uji-profisiensi', label: 'Penyelenggara Uji Profisiensi' },
    { id: 'layanan/produsen-bahan-acuan', label: 'Produsen Bahan Acuan' },
    { id: 'layanan/sistem-manajemen', label: 'Sistem Manajemen' },
    { id: 'layanan/sertifikasi-person', label: 'Sertifikasi Person' },
    { id: 'layanan/sertifikasi-sni-iso-iec-17065', label: 'Sertifikasi SNI ISO/IEC 17065' },
    { id: 'layanan/sertifikasi-pembangunan-berkelanjutan', label: 'Sertifikasi Pembangunan Berkelanjutan' },
  ],
  'Direktori LPK': [
    { id: 'direktori/terakreditasi', label: 'Terakreditasi' },
    { id: 'direktori/akreditasi-dibekukan', label: 'Akreditasi Dibekukan' },
    { id: 'direktori/akreditasi-dicabut', label: 'Akreditasi Dicabut' },
  ],
  'Unduh': [
    { id: 'unduh/dokumen-akreditasi', label: 'Dokumen Akreditasi' },
    { id: 'unduh/materi-kegiatan', label: 'Materi Kegiatan' },
    { id: 'unduh/artikel-penilaian-kesesuaian', label: 'Artikel Penilaian Kesesuaian' },
    { id: 'unduh/dokumen-internasional', label: 'Dokumen Internasional' },
  ],
};

const pageMeta = {
  'tentang-kan': { label: 'Profil KAN', section: 'Tentang KAN' },
  'sejarah-fungsi': { label: 'Sejarah dan Fungsi KAN', section: 'Tentang KAN' },
  'struktur-organisasi': { label: 'Struktur Organisasi', section: 'Tentang KAN' },
  'ketidakberpihakan': { label: 'Ketidakberpihakan', section: 'Tentang KAN' },
  'pengakuan-internasional': { label: 'Pengakuan Internasional', section: 'Tentang KAN' },
  'anggota-kan': { label: 'Anggota KAN', section: 'Tentang KAN' },
  'maklumat-layanan': { label: 'Maklumat Layanan', section: 'Tentang KAN' },
  'standar-layanan': { label: 'Standar Layanan Akreditasi', section: 'Tentang KAN' },
  'proses-akreditasi': { label: 'Proses Akreditasi', section: 'Proses Akreditasi' },
  'tarif-akreditasi': { label: 'Tarif Akreditasi', section: 'Proses Akreditasi' },
  'penanganan-komplain': { label: 'Penanganan Komplain', section: 'Proses Akreditasi' },
  'penanganan-banding': { label: 'Penanganan Banding', section: 'Proses Akreditasi' },
  'survey-kepuasan-pelanggan': { label: 'Survey Kepuasan Pelanggan', section: 'Proses Akreditasi' },
  'layanan-akreditasi': { label: 'Layanan Akreditasi', section: 'Layanan Akreditasi' },
  'layanan/laboratorium': { label: 'Laboratorium', section: 'Layanan Akreditasi' },
  'layanan/lembaga-inspeksi': { label: 'Lembaga Inspeksi', section: 'Layanan Akreditasi' },
  'layanan/lembaga-verifikasi-validasi-grk': { label: 'Lembaga Verifikasi dan/atau Validasi Gas Rumah Kaca', section: 'Layanan Akreditasi' },
  'layanan/penyelenggara-uji-profisiensi': { label: 'Penyelenggara Uji Profisiensi', section: 'Layanan Akreditasi' },
  'layanan/produsen-bahan-acuan': { label: 'Produsen Bahan Acuan', section: 'Layanan Akreditasi' },
  'layanan/sistem-manajemen': { label: 'Sistem Manajemen', section: 'Layanan Akreditasi' },
  'layanan/sertifikasi-person': { label: 'Sertifikasi Person', section: 'Layanan Akreditasi' },
  'layanan/sertifikasi-sni-iso-iec-17065': { label: 'Sertifikasi Berdasarkan SNI ISO/IEC 17065', section: 'Layanan Akreditasi' },
  'layanan/sertifikasi-pembangunan-berkelanjutan': { label: 'Sertifikasi Pembangunan Berkelanjutan', section: 'Layanan Akreditasi' },
  'direktori/terakreditasi': { label: 'Terakreditasi', section: 'Direktori LPK' },
  'direktori/akreditasi-dibekukan': { label: 'Akreditasi Dibekukan', section: 'Direktori LPK' },
  'direktori/akreditasi-dicabut': { label: 'Akreditasi Dicabut', section: 'Direktori LPK' },
  'unduh/dokumen-akreditasi': { label: 'Dokumen Akreditasi', section: 'Unduh' },
  'unduh/materi-kegiatan': { label: 'Materi Kegiatan', section: 'Unduh' },
  'unduh/artikel-penilaian-kesesuaian': { label: 'Artikel Penilaian Kesesuaian', section: 'Unduh' },
  'unduh/dokumen-internasional': { label: 'Dokumen Internasional', section: 'Unduh' },
};

// Konten tetap, ditulis langsung di kode (tidak lewat admin)
const staticPages = {
  'layanan-akreditasi': `
    <p>KAN menyediakan berbagai layanan akreditasi untuk lembaga penilaian kesesuaian sesuai dengan standar internasional ISO/IEC 17000 series.</p>

    <h2>Jenis Layanan Akreditasi</h2>
    <div class="not-prose grid sm:grid-cols-2 gap-4 mb-8">
      <a href="/layanan/laboratorium" class="flex gap-4 p-4 rounded-xl border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all">
        <div class="w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/></svg></div>
        <div>
          <p class="font-bold text-gray-900 mb-1">Laboratorium Pengujian</p>
          <p class="text-sm text-gray-500">Akreditasi untuk laboratorium yang melakukan pengujian (ISO/IEC 17025)</p>
        </div>
      </a>
      <a href="/layanan/sertifikasi-sni-iso-iec-17065" class="flex gap-4 p-4 rounded-xl border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all">
        <div class="w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></svg></div>
        <div>
          <p class="font-bold text-gray-900 mb-1">Lembaga Sertifikasi</p>
          <p class="text-sm text-gray-500">Akreditasi lembaga sertifikasi produk, personel, dan sistem manajemen</p>
        </div>
      </a>
      <a href="/layanan/lembaga-inspeksi" class="flex gap-4 p-4 rounded-xl border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all">
        <div class="w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.123.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"/></svg></div>
        <div>
          <p class="font-bold text-gray-900 mb-1">Lembaga Inspeksi</p>
          <p class="text-sm text-gray-500">Akreditasi untuk lembaga inspeksi (ISO/IEC 17020)</p>
        </div>
      </a>
      <a href="/layanan/produsen-bahan-acuan" class="flex gap-4 p-4 rounded-xl border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all">
        <div class="w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m-4.5 0h4.5m6-16.5h3.75a1.5 1.5 0 0 1 1.5 1.5v15a1.5 1.5 0 0 1-1.5 1.5h-3.75m0-18v18m0-18h-3.75a1.5 1.5 0 0 0-1.5 1.5v15a1.5 1.5 0 0 0 1.5 1.5h3.75"/></svg></div>
        <div>
          <p class="font-bold text-gray-900 mb-1">Produser Bahan Acuan</p>
          <p class="text-sm text-gray-500">Akreditasi produser bahan acuan (ISO 17034)</p>
        </div>
      </a>
      <a href="/layanan/lembaga-verifikasi-validasi-grk" class="flex gap-4 p-4 rounded-xl border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all sm:col-span-2">
        <div class="w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21c-4.97 0-9-4.03-9-9 0-4.97 7-12 9-12s9 7.03 9 12c0 4.97-4.03 9-9 9Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 21V9"/></svg></div>
        <div>
          <p class="font-bold text-gray-900 mb-1">Verifikasi &amp; Validasi GRK</p>
          <p class="text-sm text-gray-500">Akreditasi verifikasi dan validasi gas rumah kaca (ISO 14065)</p>
        </div>
      </a>
    </div>

    <h2>Proses Akreditasi</h2>
    <div class="not-prose grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="p-4 rounded-xl border-2 border-primary-100">
        <p class="text-3xl font-black text-primary-200 mb-1">01</p>
        <p class="font-bold text-gray-900 mb-1">Pengajuan</p>
        <p class="text-sm text-gray-500">Mengisi formulir dan dokumen persyaratan</p>
      </div>
      <div class="p-4 rounded-xl border-2 border-primary-100">
        <p class="text-3xl font-black text-primary-200 mb-1">02</p>
        <p class="font-bold text-gray-900 mb-1">Evaluasi</p>
        <p class="text-sm text-gray-500">Tinjauan dokumen dan asesmen lapangan</p>
      </div>
      <div class="p-4 rounded-xl border-2 border-primary-100">
        <p class="text-3xl font-black text-primary-200 mb-1">03</p>
        <p class="font-bold text-gray-900 mb-1">Keputusan</p>
        <p class="text-sm text-gray-500">Komite akreditasi membuat keputusan</p>
      </div>
      <div class="p-4 rounded-xl border-2 border-primary-100">
        <p class="text-3xl font-black text-primary-200 mb-1">04</p>
        <p class="font-bold text-gray-900 mb-1">Sertifikat</p>
        <p class="text-sm text-gray-500">Penerbitan sertifikat akreditasi</p>
      </div>
    </div>

    <h2>Manfaat Akreditasi</h2>
    <div class="not-prose grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div class="flex items-center gap-3 p-3 rounded-xl bg-primary-50">
        <span class="w-8 h-8 flex-shrink-0 rounded-lg bg-primary-600 text-white flex items-center justify-center text-sm">✓</span>
        <span class="font-semibold text-gray-800">Pengakuan Internasional</span>
      </div>
      <div class="flex items-center gap-3 p-3 rounded-xl bg-primary-50">
        <span class="w-8 h-8 flex-shrink-0 rounded-lg bg-primary-600 text-white flex items-center justify-center text-sm">✓</span>
        <span class="font-semibold text-gray-800">Meningkatkan Kredibilitas</span>
      </div>
      <div class="flex items-center gap-3 p-3 rounded-xl bg-primary-50">
        <span class="w-8 h-8 flex-shrink-0 rounded-lg bg-primary-600 text-white flex items-center justify-center text-sm">✓</span>
        <span class="font-semibold text-gray-800">Akses Pasar Global</span>
      </div>
      <div class="flex items-center gap-3 p-3 rounded-xl bg-primary-50">
        <span class="w-8 h-8 flex-shrink-0 rounded-lg bg-primary-600 text-white flex items-center justify-center text-sm">✓</span>
        <span class="font-semibold text-gray-800">Peningkatan Kompetensi</span>
      </div>
      <div class="flex items-center gap-3 p-3 rounded-xl bg-primary-50">
        <span class="w-8 h-8 flex-shrink-0 rounded-lg bg-primary-600 text-white flex items-center justify-center text-sm">✓</span>
        <span class="font-semibold text-gray-800">Jaminan Kualitas</span>
      </div>
      <div class="flex items-center gap-3 p-3 rounded-xl bg-primary-50">
        <span class="w-8 h-8 flex-shrink-0 rounded-lg bg-primary-600 text-white flex items-center justify-center text-sm">✓</span>
        <span class="font-semibold text-gray-800">Kepercayaan Stakeholder</span>
      </div>
    </div>
  `,
};

const CLOSED_LIGHTBOX = { open: false, images: [], index: 0 };

const PROSE_CLASS = `
  prose prose-lg max-w-none
  prose-headings:font-black prose-headings:text-gray-900
  prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-3 prose-h2:border-b prose-h2:border-gray-100
  prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-primary-800
  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
  prose-a:text-primary-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
  prose-strong:text-gray-900 prose-strong:font-bold
  prose-ul:space-y-2 prose-ol:space-y-2
  prose-li:text-gray-700 prose-li:leading-relaxed
  prose-img:rounded-xl prose-img:shadow-md prose-img:w-full prose-img:my-6
  prose-figure:my-6 prose-figcaption:text-center prose-figcaption:text-sm prose-figcaption:text-gray-500 prose-figcaption:italic prose-figcaption:mt-2
  prose-table:border prose-table:border-gray-200
  prose-td:border prose-td:border-gray-200 prose-td:p-3
  prose-th:border prose-th:border-gray-200 prose-th:p-3 prose-th:bg-gray-50
  prose-blockquote:border-l-4 prose-blockquote:border-primary-400 prose-blockquote:bg-primary-50 prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:rounded-r-xl prose-blockquote:not-italic
  [&_h2]:first:mt-0
  [&_ul]:list-disc [&_ul]:pl-6
  [&_ol]:list-decimal [&_ol]:pl-6
  [&_.video-wrapper]:my-6
  [&_.auto-gallery]:my-6
  [&_table]:m-0
  [&_td_p]:m-0
  [&_th_p]:m-0
  [&_.ql-align-center]:text-center
  [&_.ql-align-right]:text-right
  [&_.ql-align-justify]:text-justify
`;

const SURVEY_EMPTY = {
  icon: '📄',
  title: 'Belum Ada Hasil Survei',
  desc: 'Hasil survei per tahun akan ditampilkan di sini.',
};

/* ───────────────────────── Helper murni ───────────────────────── */

async function fetchApiData(url) {
  try {
    const response = await fetch(url);
    const json = await response.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

function getStaticContent(pageId) {
  if (!staticPages[pageId]) return null;
  return { content_id: staticPages[pageId], image: null, updated_at: null };
}

function getActiveId(pageId, { surveyYear, isSurveyList, currentHub }) {
  if (surveyYear || isSurveyList) return SURVEY_BASE;
  if (currentHub) return currentHub.base;
  return pageId;
}

function resolveRoute(pageId) {
  // Halaman survei per tahun, contoh: survey-kepuasan-pelanggan/2019
  const surveyYear = pageId.startsWith(`${SURVEY_BASE}/`) ? pageId.slice(SURVEY_BASE.length + 1) : null;
  const isSurveyList = pageId === SURVEY_LIST;

  // Hub layanan: halaman item (layanan/laboratorium/kalibrasi) atau halaman daftar (daftar-laboratorium)
  const matchedHub = SUBPAGE_HUBS.find((h) => pageId.startsWith(`${h.base}/`));
  const listHub = SUBPAGE_HUBS.find((h) => pageId === h.list);
  const currentHub = matchedHub || listHub || null;
  const hubSlug = matchedHub ? pageId.slice(matchedHub.base.length + 1) : null;

  const route = { surveyYear, isSurveyList, currentHub, hubSlug, isHubList: !!listHub };
  return { ...route, activeId: getActiveId(pageId, route) };
}

function resolveMeta(pageId, route, hubItemTitle) {
  const { surveyYear, isSurveyList, hubSlug, isHubList, currentHub } = route;
  if (surveyYear) return { label: `Survei Kepuasan Pelanggan ${surveyYear}`, section: 'Proses Akreditasi' };
  if (isSurveyList) return { label: 'Hasil Survei per Tahun', section: 'Proses Akreditasi' };
  if (hubSlug) return { label: hubItemTitle || humanizeSlug(hubSlug), section: 'Layanan Akreditasi' };
  if (isHubList) return { label: currentHub.listHeading, section: 'Layanan Akreditasi' };
  return pageMeta[pageId];
}

function buildCrumbs(sectionKey, { surveyYear, isSurveyList, currentHub, hubSlug }) {
  const crumbs = [];
  if (sectionKey) crumbs.push({ label: sectionKey });
  if (surveyYear || isSurveyList) crumbs.push({ label: 'Survey Kepuasan Pelanggan', to: SURVEY_BASE });
  if (surveyYear) crumbs.push({ label: 'Hasil Survei per Tahun', to: SURVEY_LIST });
  if (currentHub) crumbs.push({ label: currentHub.parentLabel, to: currentHub.base });
  if (hubSlug) crumbs.push({ label: currentHub.listHeading, to: currentHub.list });
  return crumbs;
}

const sortYears = (years) => [...years].sort((a, b) => Number(a.year) - Number(b.year));

function getYearNav(surveyYears, surveyYear) {
  if (!surveyYear) return { prevYear: null, nextYear: null };
  const sorted = sortYears(surveyYears);
  const index = sorted.findIndex((s) => String(s.year) === String(surveyYear));
  return {
    prevYear: index > 0 ? sorted[index - 1] : null,
    nextYear: index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : null,
  };
}

const toSurveyItems = (years) =>
  sortYears(years).map((s) => ({ key: s.page_id, label: `Survei Kepuasan Pelanggan ${s.year}`, to: s.page_id }));

const toHubItems = (items) =>
  items.map((item) => ({ key: item.page_id, label: item.title, to: item.page_id }));

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

const sanitizeContent = (content) =>
  DOMPurify.sanitize(content, { FORBID_TAGS: ['iframe'] }).replaceAll('&nbsp;', ' ');

/* ───────────────── Penyempurnaan DOM konten (lightbox, video, tabel, galeri) ───────────────── */

const HINT_HTML =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:14px;height:14px"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>Klik untuk perbesar';

const HINT_STYLE = {
  position: 'absolute',
  bottom: '8px',
  right: '8px',
  background: 'rgba(0,0,0,0.65)',
  color: 'white',
  fontSize: '11px',
  padding: '4px 8px',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  pointerEvents: 'none',
  opacity: '0',
  transition: 'opacity 0.2s',
  backdropFilter: 'blur(4px)',
};

const getImageCaption = (img) =>
  img.alt || img.closest('figure')?.querySelector('figcaption')?.textContent || '';

function styleZoomableImage(img) {
  img.style.cursor = 'zoom-in';
  img.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
  img.title = 'Klik untuk memperbesar';
  img.addEventListener('mouseenter', () => {
    img.style.transform = 'scale(1.01)';
    img.style.boxShadow = '0 20px 60px rgba(0,0,0,0.25)';
  });
  img.addEventListener('mouseleave', () => {
    img.style.transform = 'scale(1)';
    img.style.boxShadow = '';
  });
}

function addImageHint(img) {
  const parent = img.parentElement;
  if (!parent || parent.querySelector('.lb-hint')) return;

  const hint = document.createElement('div');
  hint.className = 'lb-hint';
  hint.innerHTML = HINT_HTML;
  Object.assign(hint.style, HINT_STYLE);

  if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
  parent.appendChild(hint);
  parent.addEventListener('mouseenter', () => { hint.style.opacity = '1'; });
  parent.addEventListener('mouseleave', () => { hint.style.opacity = '0'; });
}

function enhanceImages(container, openLightbox) {
  const imgs = Array.from(container.querySelectorAll('img'));
  const imageList = imgs.map((img) => ({ src: img.src, caption: getImageCaption(img) }));

  imgs.forEach((img, idx) => {
    styleZoomableImage(img);
    img.addEventListener('click', () => openLightbox(imageList, idx));
    addImageHint(img);
  });
}

function wrapIframes(container) {
  container.querySelectorAll('iframe').forEach((iframe) => {
    if (iframe.closest('.video-wrapper')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'video-wrapper';
    Object.assign(wrapper.style, {
      position: 'relative',
      width: '100%',
      paddingBottom: '56.25%',
      height: '0',
      borderRadius: '16px',
      overflow: 'hidden',
      margin: '24px 0',
      boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
    });
    iframe.parentNode.insertBefore(wrapper, iframe);
    wrapper.appendChild(iframe);
    Object.assign(iframe.style, {
      position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', border: 'none',
    });
  });
}

// Bungkus tabel supaya bisa digeser ke samping di layar kecil
function wrapTables(container) {
  container.querySelectorAll('table').forEach((table) => {
    if (table.parentElement?.classList.contains('table-wrapper')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';
    Object.assign(wrapper.style, { overflowX: 'auto', margin: '24px 0' });
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
}

function isImageOnlyParagraph(p) {
  const children = Array.from(p.childNodes).filter(
    (n) => !(n.nodeType === 3 && n.textContent.trim() === '')
  );
  return children.length === 1 && children[0].tagName === 'IMG';
}

function createGalleryCell(img) {
  const cell = document.createElement('div');
  Object.assign(cell.style, {
    borderRadius: '12px', overflow: 'hidden', aspectRatio: '4/3', background: '#f3f4f6',
  });
  Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'cover' });
  cell.appendChild(img);
  return cell;
}

function buildGallery(group) {
  if (group.length < 2) return;

  const gallery = document.createElement('div');
  gallery.className = 'auto-gallery';
  Object.assign(gallery.style, {
    display: 'grid',
    gridTemplateColumns: group.length >= 3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
    gap: '12px',
    margin: '24px 0',
  });
  group[0].parentNode.insertBefore(gallery, group[0]);

  group.forEach((p) => {
    const img = p.querySelector('img');
    if (img) gallery.appendChild(createGalleryCell(img));
    p.remove();
  });
}

// Paragraf berisi satu gambar yang berurutan → grid galeri
function buildImageGalleries(container) {
  let group = [];
  const flush = () => {
    buildGallery(group);
    group = [];
  };

  container.querySelectorAll('p').forEach((p) => {
    if (isImageOnlyParagraph(p)) group.push(p);
    else flush();
  });
  flush();
}

/* ───────────────────────── Hooks ───────────────────────── */

function usePageContent(pageId, isListPage) {
  const [pageContent, setPageContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const staticContent = getStaticContent(pageId);

    // Halaman statis & halaman daftar tidak diambil dari API
    if (staticContent || isListPage) {
      setPageContent(staticContent);
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageContent(null);
    fetchApiData(`/api/v1/page-content/${pageId}?lang=id`)
      .then((data) => setPageContent(data || null))
      .catch((error) => {
        console.error('Gagal mengambil konten halaman:', error);
        setPageContent(null);
      })
      .finally(() => setLoading(false));
  }, [pageId]);

  return { pageContent, loading };
}

function useSurveyYears(isSurveyList, surveyYear) {
  const [surveyYears, setSurveyYears] = useState([]);
  const [surveyLoading, setSurveyLoading] = useState(true);

  useEffect(() => {
    if (!isSurveyList && !surveyYear) return;
    if (surveyYear && surveyYears.length > 0) return; // sudah pernah dimuat

    setSurveyLoading(true);
    fetchApiData('/api/v1/survey-years')
      .then((data) => {   
        if (data) setSurveyYears(data);
      })
      .catch((error) => {
        console.error('Gagal mengambil daftar tahun survei:', error);
      })
      .finally(() => setSurveyLoading(false));
  }, [isSurveyList, surveyYear]);

  return { surveyYears, surveyLoading };
}

function useHubSubpages(currentHub) {
  const [subpagesByHub, setSubpagesByHub] = useState({});
  const [subpagesLoading, setSubpagesLoading] = useState(false);
  const base = currentHub?.base;

  useEffect(() => {
    if (!base) return;
    if (subpagesByHub[base]?.length > 0) return; // sudah pernah dimuat

    setSubpagesLoading(true);
    const category = base.split('/')[1]; // 'layanan/laboratorium' → 'laboratorium'
    fetchApiData(`/api/v1/layanan-services/${category}`)
      .then((data) => {
        if (data) setSubpagesByHub((prev) => ({ ...prev, [base]: data }));
      })
      .catch((error) => {
        console.error('Gagal mengambil sub-halaman layanan:', error);
      })
      .finally(() => setSubpagesLoading(false));
  }, [base]);

  return { hubItems: base ? subpagesByHub[base] || [] : [], subpagesLoading };
}

function useContentEnhancer(contentRef, content, openLightbox) {
  useEffect(() => {
    const container = contentRef.current;
    if (!container || !content) return;

    enhanceImages(container, openLightbox);
    wrapIframes(container);
    wrapTables(container);
    buildImageGalleries(container);
  }, [content]);
}

/* ───────────────────────── Komponen tampilan ───────────────────────── */

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <FaSpinner className="text-5xl text-primary-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-semibold">Memuat halaman...</p>
      </div>
    </div>
  );
}

function Breadcrumb({ crumbs, title, navigate }) {
  return (
    <nav className="flex items-center gap-2 text-sm flex-wrap">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors font-medium"
      >
        <FaHome className="text-xs" />
        <span>Beranda</span>
      </button>
      {crumbs.map((crumb) => (
        <Fragment key={crumb.label}>
          <FaChevronRight className="text-xs text-white/30" />
          {crumb.to ? (
            <button
              onClick={() => navigate(`/${crumb.to}`)}
              className="text-white/50 hover:text-white/80 transition-colors"
            >
              {crumb.label}
            </button>
          ) : (
            <span className="text-white/50">{crumb.label}</span>
          )}
        </Fragment>
      ))}
      <FaChevronRight className="text-xs text-white/30" />
      <span className="text-white/80 font-semibold">{title}</span>
    </nav>
  );
}

function PageBanner({ crumbs, title, updatedAt, navigate }) {
  return (
    <div className="relative bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-primary-400/10 rounded-full blur-2xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="pt-32 lg:pt-40 pb-4 border-b border-white/10">
          <Breadcrumb crumbs={crumbs} title={title} navigate={navigate} />
        </div>

        <div className="py-10">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-3">{title}</h1>
              <div className="w-16 h-1 bg-primary-400 rounded-full" />
              {updatedAt && (
                <div className="flex items-center gap-2 mt-4 text-white/40 text-sm">
                  <FaCalendarAlt className="text-xs" />
                  <span>{`Diperbarui: ${updatedAt}`}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarLink({ page, active, onClick }) {
  const stateClass = active
    ? 'bg-primary-50 text-primary-700 font-bold border-l-4 border-primary-600 pl-3'
    : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600';
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${stateClass}`}
    >
      <span>{page.label}</span>
    </button>
  );
}

function Sidebar({ siblings, activeId, navigate }) {
  return (
    <aside className="hidden lg:block w-72 flex-shrink-0">
      <div className="sticky top-28 space-y-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors"
        >
          <FaArrowLeft className="text-xs" />
          <span>Kembali ke Beranda</span>
        </button>

        {siblings.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <nav className="p-2">
              {siblings.map((page) => (
                <SidebarLink
                  key={page.id}
                  page={page}
                  active={page.id === activeId}
                  onClick={() => navigate(`/${page.id}`)}
                />
              ))}
            </nav>
          </div>
        )}
      </div>
    </aside>
  );
}

function MobileSectionNav({ sectionKey, siblings, activeId, navigate }) {
  if (siblings.length === 0) return null;

  return (
    <div className="lg:hidden mt-6 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-3">
        <h3 className="text-white font-black text-sm tracking-wide uppercase">{sectionKey}</h3>
      </div>
      <nav className="p-2 grid grid-cols-2 gap-1">
        {siblings.map((page) => (
          <button
            key={page.id}
            onClick={() => navigate(`/${page.id}`)}
            className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              page.id === activeId ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {page.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 mb-6 px-5 py-3 bg-gray-50 hover:bg-gray-200 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 transition-colors"
    >
      <FaArrowLeft className="text-xs" />
      <span>Kembali</span>
    </button>
  );
}

function ListCardBody({ loading, items, empty, onSelect }) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <FaSpinner className="text-3xl text-primary-600 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 px-8">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">{empty.icon}</span>
        </div>
        <h3 className="text-2xl font-black text-gray-800 mb-3">{empty.title}</h3>
        <p className="text-gray-500 max-w-md mx-auto">{empty.desc}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-3">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onSelect(item.to)}
          className="group flex items-center justify-between gap-3 px-5 py-4 rounded-xl border border-gray-200 text-left hover:border-primary-400 hover:bg-primary-50 transition-all"
        >
          <span className="font-bold text-gray-800 group-hover:text-primary-700">{item.label}</span>
          <FaChevronRight className="text-xs text-gray-300 group-hover:text-primary-600 flex-shrink-0" />
        </button>
      ))}
    </div>
  );
}

// Dipakai bersama oleh daftar tahun survei dan daftar sub-halaman hub
function ListPage({ backTo, navigate, heading, description, loading, items, empty }) {
  return (
    <>
      <BackButton onClick={() => navigate(`/${backTo}`)} />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 md:px-12 py-6 border-b border-gray-100">
          <h2 className="text-xl font-black text-gray-900">{heading}</h2>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <ListCardBody loading={loading} items={items} empty={empty} onSelect={(to) => navigate(`/${to}`)} />
      </div>
    </>
  );
}

function CtaButton({ title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group mt-6 w-full flex items-center justify-between gap-4 bg-primary-600 hover:bg-primary-700 rounded-2xl shadow-sm hover:shadow-md px-8 md:px-12 py-6 text-left transition-all"
    >
      <div>
        <h2 className="text-xl font-black text-white">{title}</h2>
        <p className="text-sm text-white/70 mt-1">{description}</p>
      </div>
      <FaChevronRight className="text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0" />
    </button>
  );
}

function YearButton({ year, direction, onClick }) {
  const isPrev = direction === 'prev';
  const arrowBase = 'text-xs text-white/70 group-hover:text-white transition-all';
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 px-5 py-3 bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm hover:shadow-md transition-all ${
        isPrev ? 'text-left' : 'text-right'
      }`}
    >
      {isPrev && <FaChevronLeft className={`${arrowBase} group-hover:-translate-x-1`} />}
      <span className="flex flex-col">
        <span className="text-xs font-medium text-white/70">{isPrev ? 'Sebelumnya' : 'Berikutnya'}</span>
        <span className="text-sm font-bold text-white">Survei {year}</span>
      </span>
      {!isPrev && <FaChevronRight className={`${arrowBase} group-hover:translate-x-1`} />}
    </button>
  );
}

function YearNav({ prevYear, nextYear, navigate }) {
  if (!prevYear && !nextYear) return null;

  return (
    <div className="mt-6 flex items-stretch justify-between gap-4">
      {prevYear ? (
        <YearButton year={prevYear.year} direction="prev" onClick={() => navigate(`/${prevYear.page_id}`)} />
      ) : (
        <div />
      )}
      {nextYear ? (
        <YearButton year={nextYear.year} direction="next" onClick={() => navigate(`/${nextYear.page_id}`)} />
      ) : (
        <div />
      )}
    </div>
  );
}

function FeaturedImage({ image, title, plain, onOpen }) {
  const src = `/storage/${image}`;
  return (
    <button
      type="button"
      aria-label={`Perbesar gambar ${title}`}
      className={`relative mb-8 rounded-2xl overflow-hidden group cursor-zoom-in ${
        plain ? 'bg-white border border-gray-200' : 'shadow-2xl'
      }`}
      style={{ maxHeight: '480px' }}
      onClick={() => onOpen([{ src, caption: title }], 0)}
    >
      <img
        src={src}
        alt={title}
        className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
        style={{ maxHeight: '480px' }}
      />
      {!plain && <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
        <FaExpand className="text-xs" />
        <span>Perbesar</span>
      </div>
      {!plain && (
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="text-white/80 text-sm font-medium">{title}</p>
        </div>
      )}
    </button>
  );
}

function EmptyContent({ navigate }) {
  return (
    <div className="text-center py-16 px-8">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl">📄</span>
      </div>
      <h3 className="text-2xl font-black text-gray-800 mb-3">Konten Belum Tersedia</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        Konten untuk halaman ini sedang dalam proses pengembangan.
      </p>
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors"
      >
        <FaHome />
        <span>Kembali ke Beranda</span>
      </button>
    </div>
  );
}

function ContentCard({ content, contentRef, updatedAt, navigate }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {content ? (
        <div className="p-8 md:p-12">
          <div
            ref={contentRef}
            className={PROSE_CLASS}
            dangerouslySetInnerHTML={{ __html: sanitizeContent(content) }}
          />
        </div>
      ) : (
        <EmptyContent navigate={navigate} />
      )}

      {updatedAt && content && (
        <div className="px-8 md:px-12 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <FaCalendarAlt className="text-xs" />
            <span>{`Terakhir diperbarui: ${updatedAt}`}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemPageView({
  pageId, route, pageContent, content, contentRef, title, updatedAt,
  prevYear, nextYear, onOpenImage, navigate,
}) {
  const { surveyYear, hubSlug, currentHub } = route;
  const isSubItem = !!(surveyYear || hubSlug);
  const hubCta = SUBPAGE_HUBS.find((h) => h.base === pageId);

  return (
    <>
      {isSubItem && (
        <BackButton onClick={() => navigate(`/${surveyYear ? SURVEY_LIST : currentHub.list}`)} />
      )}

      {pageContent?.image && (
        <FeaturedImage image={pageContent.image} title={title} plain={isSubItem} onOpen={onOpenImage} />
      )}

      <ContentCard content={content} contentRef={contentRef} updatedAt={updatedAt} navigate={navigate} />

      {surveyYear && <YearNav prevYear={prevYear} nextYear={nextYear} navigate={navigate} />}

      {pageId === SURVEY_BASE && (
        <CtaButton
          title="Hasil Survei per Tahun"
          description="Lihat hasil survei kepuasan pelanggan dari tahun ke tahun"
          onClick={() => navigate(`/${SURVEY_LIST}`)}
        />
      )}

      {hubCta && (
        <CtaButton
          title={hubCta.listHeading}
          description={hubCta.listDesc}
          onClick={() => navigate(`/${hubCta.list}`)}
        />
      )}
    </>
  );
}

function PageBody({ route, lists, navigate, itemProps }) {
  const { isSurveyList, isHubList, currentHub } = route;

  if (isSurveyList) {
    return (
      <ListPage
        backTo={SURVEY_BASE}
        navigate={navigate}
        heading="Pilih Tahun Survei"
        description="Hasil Survei Kepuasan Pelanggan KAN dari tahun ke tahun"
        loading={lists.surveyLoading}
        items={toSurveyItems(lists.surveyYears)}
        empty={SURVEY_EMPTY}
      />
    );
  }

  if (isHubList && currentHub) {
    return (
      <ListPage
        backTo={currentHub.base}
        navigate={navigate}
        heading={currentHub.listTitle}
        description={currentHub.listDesc}
        loading={lists.subpagesLoading}
        items={toHubItems(lists.hubItems)}
        empty={{ icon: currentHub.emptyIcon, title: currentHub.emptyTitle, desc: currentHub.emptyDesc }}
      />
    );
  }

  return <ItemPageView {...itemProps} navigate={navigate} />;
}

/* ───────────────────────── Halaman utama ───────────────────────── */

const DynamicPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [lightbox, setLightbox] = useState(CLOSED_LIGHTBOX);
  const contentRef = useRef(null);

  const pageId = location.pathname.substring(1);
  const route = resolveRoute(pageId);
  const { surveyYear, isSurveyList, currentHub, hubSlug, isHubList, activeId } = route;

  const { pageContent, loading } = usePageContent(pageId, isSurveyList || isHubList);
  const { surveyYears, surveyLoading } = useSurveyYears(isSurveyList, surveyYear);
  const { hubItems, subpagesLoading } = useHubSubpages(currentHub);

  const currentSubpage = hubSlug ? hubItems.find((s) => s.slug === hubSlug) : null;
  const meta = resolveMeta(pageId, route, currentSubpage?.title || pageContent?.title);
  const title = meta ? meta.label : pageId;
  const sectionKey = meta?.section || null;
  const siblings = sectionKey ? sectionPages[sectionKey] || [] : [];
  const { prevYear, nextYear } = getYearNav(surveyYears, surveyYear);

  const content = pageContent?.content_id || '';
  const updatedAt = formatDate(pageContent?.updated_at);

  const openLightbox = (images, index) => setLightbox({ open: true, images, index });
  useContentEnhancer(contentRef, content, openLightbox);

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      {lightbox.open && (
        <Lightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(CLOSED_LIGHTBOX)}
        />
      )}

      <PageBanner
        crumbs={buildCrumbs(sectionKey, route)}
        title={title}
        updatedAt={updatedAt}
        navigate={navigate}
      />

      <main className="py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-8 items-start">
              <Sidebar siblings={siblings} activeId={activeId} navigate={navigate} />

              <div className="flex-1 min-w-0">
                <PageBody
                  route={route}
                  navigate={navigate}
                  lists={{ surveyYears, surveyLoading, hubItems, subpagesLoading }}
                  itemProps={{
                    pageId, route, pageContent, content, contentRef, title, updatedAt,
                    prevYear, nextYear, onOpenImage: openLightbox,
                  }}
                />
                <MobileSectionNav
                  sectionKey={sectionKey}
                  siblings={siblings}
                  activeId={activeId}
                  navigate={navigate}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DynamicPage;
