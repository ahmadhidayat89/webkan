import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sanitizeHtml } from '../utils/sanitizeHtml';
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
  slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// ─── Lightbox Component ───────────────────────────────────────────────────────
const Lightbox = ({ images, initialIndex, onClose }) => {
  const [current, setCurrent] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef(null);

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

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (dragging && dragStart) {
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setDragging(false);

  const img = images[current];

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.97)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Top Bar */}
      <div className="z-10 flex items-center justify-between flex-shrink-0 px-6 py-4"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
        <div className="flex items-center gap-3">
          <FaImage className="text-sm text-white/60" />
          <span className="text-sm font-medium text-white/80">
            {current + 1} / {images.length}
          </span>
          {img.caption && (
            <span className="hidden text-sm text-white/50 md:inline">— {img.caption}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Zoom controls */}
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.5, 1))}
            className="p-2 text-white transition-all rounded-full bg-white/10 hover:bg-white/20"
            title="Zoom out (-)"
          >
            <FaSearchMinus className="text-sm" />
          </button>
          <span className="w-10 text-xs text-center text-white/60">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.5, 4))}
            className="p-2 text-white transition-all rounded-full bg-white/10 hover:bg-white/20"
            title="Zoom in (+)"
          >
            <FaSearchPlus className="text-sm" />
          </button>
          <div className="w-px h-5 mx-1 bg-white/20" />
          <button
            onClick={onClose}
            className="p-2 text-white transition-all rounded-full bg-white/10 hover:bg-red-500/80"
            title="Tutup (Esc)"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div
        className="relative flex items-center justify-center flex-1 overflow-hidden select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <FaSpinner className="text-3xl text-white/40 animate-spin" />
          </div>
        )}

        <img
          ref={imgRef}
          src={img.src}
          alt={img.caption || ''}
          onLoad={() => setIsLoading(false)}
          className="object-contain max-w-full max-h-full transition-transform duration-200"
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
              className="absolute p-3 text-white transition-all -translate-y-1/2 border rounded-full left-4 top-1/2 bg-white/10 hover:bg-white/25 backdrop-blur-sm border-white/10"
            >
              <FaChevronLeft className="text-lg" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute p-3 text-white transition-all -translate-y-1/2 border rounded-full right-4 top-1/2 bg-white/10 hover:bg-white/25 backdrop-blur-sm border-white/10"
            >
              <FaChevronRight className="text-lg" />
            </button>
          </>
        )}
      </div>

      {/* Bottom: Thumbnails */}
      {images.length > 1 && (
        <div
          className="flex items-center justify-center flex-shrink-0 gap-2 px-6 py-4 overflow-x-auto"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}
        >
          {images.map((im, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); setZoom(1); setOffset({ x: 0, y: 0 }); setIsLoading(true); }}
              className={`flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === current ? 'border-white scale-110' : 'border-white/20 opacity-50 hover:opacity-80'
                }`}
            >
              <img src={im.src} alt="" className="object-cover w-full h-full" />
            </button>
          ))}
        </div>
      )}

      {/* Caption bottom */}
      {img.caption && (
        <div className="flex-shrink-0 px-6 pb-4 text-center">
          <p className="text-sm italic text-white/50">{img.caption}</p>
        </div>
      )}
    </div>
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
    <div className="relative w-full my-6 overflow-hidden bg-black shadow-2xl rounded-2xl group"
      style={{ aspectRatio: '16/9' }}>
      {!playing && thumbnail ? (
        <div className="absolute inset-0 cursor-pointer" onClick={() => setPlaying(true)}>
          <img src={thumbnail} alt={title || 'Video'} className="object-cover w-full h-full" />
          {/* Dark overlay */}
          <div className="absolute inset-0 transition-colors bg-black/40 group-hover:bg-black/30" />
          {/* Play button */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="flex items-center justify-center w-20 h-20 transition-transform border-2 rounded-full shadow-2xl bg-white/20 backdrop-blur-sm border-white/40 group-hover:scale-110">
              <FaPlay className="ml-1 text-2xl text-white" />
            </div>
            {title && (
              <div className="max-w-xs text-center">
                <span className="text-white text-sm font-medium bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-sm">
                  {title}
                </span>
              </div>
            )}
          </div>
        </div>
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

// ─── Main Page ─────────────────────────────────────────────────────────────
const DynamicPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [pageContent, setPageContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setNotFound] = useState(false);
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });
  const [surveyYears, setSurveyYears] = useState([]);
  const [surveyLoading, setSurveyLoading] = useState(true);
  const [subpagesByHub, setSubpagesByHub] = useState({});
  const [subpagesLoading, setSubpagesLoading] = useState(false);
  const contentRef = useRef(null);

  const pageId = location.pathname.substring(1);

  // Halaman survei per tahun, contoh: survey-kepuasan-pelanggan/2019
  const surveyYear = pageId.startsWith(`${SURVEY_BASE}/`) ? pageId.slice(SURVEY_BASE.length + 1) : null;
  // Halaman daftar tahun: /hasil-survei
  const isSurveyList = pageId === SURVEY_LIST;

  // Hub layanan (Laboratorium / GRK / Sistem Manajemen) yang sedang dibuka,
  // baik itu halaman itemnya (contoh: layanan/laboratorium/kalibrasi)
  // maupun halaman daftarnya (contoh: daftar-laboratorium).
  const matchedHub = SUBPAGE_HUBS.find((h) => pageId.startsWith(`${h.base}/`));
  const listHub = SUBPAGE_HUBS.find((h) => pageId === h.list);
  const currentHub = matchedHub || listHub || null;
  const hubSlug = matchedHub ? pageId.slice(matchedHub.base.length + 1) : null;
  const isHubList = !!listHub;

  // id menu sidebar yang harus menyala (halaman turunan menyalakan menu induknya)
  const activeId = (surveyYear || isSurveyList)
    ? SURVEY_BASE
    : currentHub
      ? currentHub.base
      : pageId;

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

  useEffect(() => {
    fetchPageContent();
  }, [pageId]);

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

  // Ambil daftar tahun survei (halaman daftar /hasil-survei & halaman tahun untuk tombol prev/next)
  useEffect(() => {
    if (!isSurveyList && !surveyYear) return;
    if (surveyYear && surveyYears.length > 0) return; // sudah pernah dimuat
    setSurveyLoading(true);
    fetch('/api/v1/survey-years')
      .then((r) => r.json())
      .then((d) => { if (d.success) setSurveyYears(d.data); })
      .catch(() => { })
      .finally(() => setSurveyLoading(false));
  }, [isSurveyList, surveyYear]);

  // Ambil daftar sub-halaman untuk hub yang sedang aktif (Laboratorium / GRK /
  // Sistem Manajemen / SNI 17065 / Pembangunan Berkelanjutan) lewat endpoint
  // generik di backend: /api/v1/layanan-services/{category}
  useEffect(() => {
    if (!currentHub) return;
    if (subpagesByHub[currentHub.base]?.length > 0) return; // sudah pernah dimuat
    setSubpagesLoading(true);
    const category = currentHub.base.split('/')[1]; // 'layanan/laboratorium' → 'laboratorium'
    fetch(`/api/v1/layanan-services/${category}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setSubpagesByHub((prev) => ({ ...prev, [currentHub.base]: d.data }));
        }
      })
      .catch(() => { })
      .finally(() => setSubpagesLoading(false));
  }, [currentHub?.base]);

  const fetchPageContent = async () => {
    // Halaman dengan konten statis (ditulis langsung di kode, bukan lewat admin)
    if (staticPages[pageId]) {
      setLoading(true);
      setNotFound(false);
      setPageContent({ content_id: staticPages[pageId], image: null, updated_at: null });
      setLoading(false);
      return;
    }

    // Halaman daftar (survei per tahun / daftar sub-halaman) tidak punya konten sendiri
    if (isSurveyList || isHubList) {
      setPageContent(null);
      setNotFound(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setNotFound(false);
      setPageContent(null);
      const response = await fetch(`/api/v1/page-content/${pageId}?lang=id`);
      const data = await response.json();
      if (data.success && data.data) {
        setPageContent(data.data);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching page content:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const currentHubItems = currentHub ? (subpagesByHub[currentHub.base] || []) : [];
  const currentSubpage = hubSlug ? currentHubItems.find((s) => s.slug === hubSlug) : null;

  const meta = surveyYear
    ? { label: `Survei Kepuasan Pelanggan ${surveyYear}`, section: 'Proses Akreditasi' }
    : isSurveyList
      ? { label: 'Hasil Survei per Tahun', section: 'Proses Akreditasi' }
      : hubSlug
        ? { label: currentSubpage?.title || pageContent?.title || humanizeSlug(hubSlug), section: 'Layanan Akreditasi' }
        : isHubList
          ? { label: currentHub.listHeading, section: 'Layanan Akreditasi' }
          : pageMeta[pageId];
  const title = meta ? meta.label : pageId;
  const sectionKey = meta?.section || null;
  const siblings = sectionKey ? (sectionPages[sectionKey] || []) : [];

  // Tahun sebelumnya / berikutnya untuk navigasi di halaman survei per tahun
  const sortedYears = [...surveyYears].sort((a, b) => Number(a.year) - Number(b.year));
  const yearIndex = surveyYear
    ? sortedYears.findIndex((s) => String(s.year) === String(surveyYear))
    : -1;
  const prevYear = yearIndex > 0 ? sortedYears[yearIndex - 1] : null;
  const nextYear = yearIndex >= 0 && yearIndex < sortedYears.length - 1 ? sortedYears[yearIndex + 1] : null;

  const content = pageContent ? pageContent.content_id : '';

  const updatedAt = pageContent?.updated_at
    ? new Date(pageContent.updated_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  // ── Enhance rendered content: lightbox + responsive video + tabel ──
  useEffect(() => {
    if (!contentRef.current || !content) return;

    const container = contentRef.current;

    // ── Images: collect all, add click → lightbox ──
    const imgs = Array.from(container.querySelectorAll('img'));
    const imageList = imgs.map((img) => ({
      src: img.src,
      caption: img.alt || img.closest('figure')?.querySelector('figcaption')?.textContent || '',
    }));

    imgs.forEach((img, idx) => {
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
      img.addEventListener('click', () => {
        setLightbox({ open: true, images: imageList, index: idx });
      });

      // Add zoom icon overlay hint on first image
      const parent = img.parentElement;
      if (parent && !parent.querySelector('.lb-hint')) {
        const hint = document.createElement('div');
        hint.className = 'lb-hint';
        hint.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:14px;height:14px"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>Klik untuk perbesar';
        Object.assign(hint.style, {
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
        });
        if (getComputedStyle(parent).position === 'static') {
          parent.style.position = 'relative';
        }
        parent.appendChild(hint);
        parent.addEventListener('mouseenter', () => { hint.style.opacity = '1'; });
        parent.addEventListener('mouseleave', () => { hint.style.opacity = '0'; });
      }
    });

    // ── iframes: wrap in responsive 16:9 container ──
    const iframes = Array.from(container.querySelectorAll('iframe'));
    iframes.forEach((iframe) => {
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
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        border: 'none',
      });
    });

    // ── tables: bungkus supaya bisa digeser ke samping di layar kecil ──
    container.querySelectorAll('table').forEach((table) => {
      if (table.parentElement?.classList.contains('table-wrapper')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'table-wrapper';
      Object.assign(wrapper.style, { overflowX: 'auto', margin: '24px 0' });
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });

    // ── Auto-detect consecutive images → gallery grid ──
    // Find groups of consecutive <p> tags each containing only 1 img
    const paragraphs = Array.from(container.querySelectorAll('p'));
    let group = [];
    const processGroup = () => {
      if (group.length >= 2) {
        const galleryWrapper = document.createElement('div');
        galleryWrapper.className = 'auto-gallery';
        Object.assign(galleryWrapper.style, {
          display: 'grid',
          gridTemplateColumns: group.length >= 3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
          gap: '12px',
          margin: '24px 0',
        });
        group[0].parentNode.insertBefore(galleryWrapper, group[0]);
        group.forEach((p) => {
          const img = p.querySelector('img');
          if (img) {
            const cell = document.createElement('div');
            Object.assign(cell.style, {
              borderRadius: '12px',
              overflow: 'hidden',
              aspectRatio: '4/3',
              background: '#f3f4f6',
            });
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            cell.appendChild(img);
            galleryWrapper.appendChild(cell);
          }
          p.remove();
        });
      }
      group = [];
    };

    paragraphs.forEach((p) => {
      const children = Array.from(p.childNodes).filter(
        (n) => !(n.nodeType === 3 && n.textContent.trim() === '')
      );
      if (children.length === 1 && children[0].tagName === 'IMG') {
        group.push(p);
      } else {
        processGroup();
      }
    });
    processGroup();

  }, [content]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <FaSpinner className="mx-auto mb-4 text-5xl text-primary-600 animate-spin" />
          <p className="font-semibold text-gray-500">Memuat halaman...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      {/* Lightbox */}
      {lightbox.open && (
        <Lightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox({ open: false, images: [], index: 0 })}
        />
      )}

      {/* Dark Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute rounded-full -top-20 -right-20 w-96 h-96 bg-primary-600/20 blur-3xl" />
          <div className="absolute bottom-0 w-64 h-64 rounded-full left-1/4 bg-white/5 blur-3xl" />
          <div className="absolute w-32 h-32 rounded-full top-1/2 right-1/3 bg-primary-400/10 blur-2xl" />
        </div>

        <div className="container relative z-10 px-6 mx-auto">
          {/* Breadcrumb */}
          <div className="pt-32 pb-4 border-b lg:pt-40 border-white/10">
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors font-medium"
              >
                <FaHome className="text-xs" />
                <span>Beranda</span>
              </button>
              {sectionKey && (
                <>
                  <FaChevronRight className="text-xs text-white/30" />
                  <span className="text-white/50">{sectionKey}</span>
                </>
              )}
              {(surveyYear || isSurveyList) && (
                <>
                  <FaChevronRight className="text-xs text-white/30" />
                  <button
                    onClick={() => navigate(`/${SURVEY_BASE}`)}
                    className="transition-colors text-white/50 hover:text-white/80"
                  >
                    Survey Kepuasan Pelanggan
                  </button>
                </>
              )}
              {surveyYear && (
                <>
                  <FaChevronRight className="text-xs text-white/30" />
                  <button
                    onClick={() => navigate(`/${SURVEY_LIST}`)}
                    className="transition-colors text-white/50 hover:text-white/80"
                  >
                    Hasil Survei per Tahun
                  </button>
                </>
              )}
              {(hubSlug || isHubList) && currentHub && (
                <>
                  <FaChevronRight className="text-xs text-white/30" />
                  <button
                    onClick={() => navigate(`/${currentHub.base}`)}
                    className="transition-colors text-white/50 hover:text-white/80"
                  >
                    {currentHub.parentLabel}
                  </button>
                </>
              )}
              {hubSlug && currentHub && (
                <>
                  <FaChevronRight className="text-xs text-white/30" />
                  <button
                    onClick={() => navigate(`/${currentHub.list}`)}
                    className="transition-colors text-white/50 hover:text-white/80"
                  >
                    {currentHub.listHeading}
                  </button>
                </>
              )}
              <FaChevronRight className="text-xs text-white/30" />
              <span className="font-semibold text-white/80">{title}</span>
            </nav>
          </div>

          {/* Title */}
          <div className="py-10">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h1 className="mb-3 text-4xl font-black leading-tight text-white md:text-5xl">
                  {title}
                </h1>
                <div className="w-16 h-1 rounded-full bg-primary-400" />
                {updatedAt && (
                  <div className="flex items-center gap-2 mt-4 text-sm text-white/40">
                    <FaCalendarAlt className="text-xs" />
                    <span>{`Diperbarui: ${updatedAt}`}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <main className="py-12">
        <div className="container px-6 mx-auto">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-start gap-8">

              {/* Sidebar */}
              <aside className="flex-shrink-0 hidden lg:block w-72">
                <div className="sticky space-y-4 top-28">
                  <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-sm font-semibold transition-colors text-primary-600 hover:text-primary-700"
                  >
                    <FaArrowLeft className="text-xs" />
                    <span>Kembali ke Beranda</span>
                  </button>

                  {siblings.length > 0 && (
                    <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
                      <nav className="p-2">
                        {siblings.map((page) => {
                          const isActive = page.id === activeId;
                          return (
                            <button
                              key={page.id}
                              onClick={() => navigate(`/${page.id}`)}
                              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${isActive
                                ? 'bg-primary-50 text-primary-700 font-bold border-l-4 border-primary-600 pl-3'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                                }`}
                            >
                              <span>{page.label}</span>
                            </button>
                          );
                        })}
                      </nav>
                    </div>
                  )}
                </div>
              </aside>

              {/* Main Content */}
              <div className="flex-1 min-w-0">

                {/* Tombol kembali (halaman daftar tahun survei / daftar sub-halaman) */}
                {(isSurveyList || isHubList) && (
                  <button
                    onClick={() => navigate(isSurveyList ? `/${SURVEY_BASE}` : `/${currentHub.base}`)}
                    className="inline-flex items-center gap-2 px-5 py-3 mb-6 text-sm font-bold text-gray-700 transition-colors border border-gray-200 bg-gray-50 hover:bg-gray-200 rounded-xl"
                  >
                    <FaArrowLeft className="text-xs" />
                    <span>Kembali</span>
                  </button>
                )}

                {isSurveyList ? (
                  /* ── Halaman daftar tahun survei ── */
                  <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
                    <div className="px-8 py-6 border-b border-gray-100 md:px-12">
                      <h2 className="text-xl font-black text-gray-900">Pilih Tahun Survei</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Hasil Survei Kepuasan Pelanggan KAN dari tahun ke tahun
                      </p>
                    </div>

                    {surveyLoading ? (
                      <div className="flex justify-center py-16">
                        <FaSpinner className="text-3xl text-primary-600 animate-spin" />
                      </div>
                    ) : surveyYears.length > 0 ? (
                      <div className="flex flex-col gap-3 p-4 md:p-6">
                        {[...surveyYears]
                          .sort((a, b) => Number(a.year) - Number(b.year))
                          .map((s) => (
                            <button
                              key={s.page_id}
                              onClick={() => navigate(`/${s.page_id}`)}
                              className="flex items-center justify-between gap-3 px-5 py-4 text-left transition-all border border-gray-200 group rounded-xl hover:border-primary-400 hover:bg-primary-50"
                            >
                              <span className="font-bold text-gray-800 group-hover:text-primary-700">
                                Survei Kepuasan Pelanggan {s.year}
                              </span>
                              <FaChevronRight className="flex-shrink-0 text-xs text-gray-300 group-hover:text-primary-600" />
                            </button>
                          ))}
                      </div>
                    ) : (
                      <div className="px-8 py-16 text-center">
                        <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full">
                          <span className="text-3xl">📄</span>
                        </div>
                        <h3 className="mb-3 text-2xl font-black text-gray-800">
                          Belum Ada Hasil Survei
                        </h3>
                        <p className="max-w-md mx-auto text-gray-500">
                          Hasil survei per tahun akan ditampilkan di sini.
                        </p>
                      </div>
                    )}
                  </div>
                ) : isHubList && currentHub ? (
                  /* ── Halaman daftar sub-halaman (Laboratorium / GRK / Sistem Manajemen) ── */
                  <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
                    <div className="px-8 py-6 border-b border-gray-100 md:px-12">
                      <h2 className="text-xl font-black text-gray-900">{currentHub.listTitle}</h2>
                      <p className="mt-1 text-sm text-gray-500">{currentHub.listDesc}</p>
                    </div>

                    {subpagesLoading ? (
                      <div className="flex justify-center py-16">
                        <FaSpinner className="text-3xl text-primary-600 animate-spin" />
                      </div>
                    ) : currentHubItems.length > 0 ? (
                      <div className="flex flex-col gap-3 p-4 md:p-6">
                        {currentHubItems.map((item) => (
                          <button
                            key={item.page_id}
                            onClick={() => navigate(`/${item.page_id}`)}
                            className="flex items-center justify-between gap-3 px-5 py-4 text-left transition-all border border-gray-200 group rounded-xl hover:border-primary-400 hover:bg-primary-50"
                          >
                            <span className="font-bold text-gray-800 group-hover:text-primary-700">
                              {item.title}
                            </span>
                            <FaChevronRight className="flex-shrink-0 text-xs text-gray-300 group-hover:text-primary-600" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-8 py-16 text-center">
                        <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full">
                          <span className="text-3xl">{currentHub.emptyIcon}</span>
                        </div>
                        <h3 className="mb-3 text-2xl font-black text-gray-800">
                          {currentHub.emptyTitle}
                        </h3>
                        <p className="max-w-md mx-auto text-gray-500">
                          {currentHub.emptyDesc}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Tombol kembali (halaman survei per tahun / halaman item sub-halaman) */}
                    {(surveyYear || hubSlug) && (
                      <button
                        onClick={() => navigate(surveyYear ? `/${SURVEY_LIST}` : `/${currentHub.list}`)}
                        className="inline-flex items-center gap-2 px-5 py-3 mb-6 text-sm font-bold text-gray-700 transition-colors border border-gray-200 bg-gray-50 hover:bg-gray-200 rounded-xl"
                      >
                        <FaArrowLeft className="text-xs" />
                        <span>Kembali</span>
                      </button>
                    )}

                    {/* ── Featured Image Hero ── */}
                    {pageContent?.image && (
                      <div
                        className={`relative mb-8 rounded-2xl overflow-hidden group cursor-zoom-in ${(surveyYear || hubSlug) ? 'bg-white border border-gray-200' : 'shadow-2xl'
                          }`}
                        style={{ maxHeight: '480px' }}
                        onClick={() =>
                          setLightbox({
                            open: true,
                            images: [{ src: `/storage/${pageContent.image}`, caption: title }],
                            index: 0,
                          })
                        }
                      >
                        <img
                          src={`/storage/${pageContent.image}`}
                          alt={title}
                          className="object-cover w-full transition-transform duration-700 group-hover:scale-105"
                          style={{ maxHeight: '480px' }}
                        />
                        {/* Gradient overlay bottom (tidak dipakai di halaman survei/sub-halaman) */}
                        {!(surveyYear || hubSlug) && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        )}
                        {/* Zoom hint */}
                        <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <FaExpand className="text-xs" />
                          <span>Perbesar</span>
                        </div>
                        {/* Title overlay (tidak dipakai di halaman survei/sub-halaman) */}
                        {!(surveyYear || hubSlug) && (
                          <div className="absolute bottom-0 left-0 right-0 p-6">
                            <p className="text-sm font-medium text-white/80">{title}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Content Card ── */}
                    <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
                      {content ? (
                        <div className="p-8 md:p-12">
                          <div
                            ref={contentRef}
                            className="
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
                            "
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHtml(content).replace(/&nbsp;/g, ' '),
                            }}
                          />
                        </div>
                      ) : (
                        <div className="px-8 py-16 text-center">
                          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full">
                            <span className="text-3xl">📄</span>
                          </div>
                          <h3 className="mb-3 text-2xl font-black text-gray-800">
                            Konten Belum Tersedia
                          </h3>
                          <p className="max-w-md mx-auto mb-6 text-gray-500">
                            Konten untuk halaman ini sedang dalam proses pengembangan.
                          </p>
                          <button
                            onClick={() => navigate('/')}
                            className="inline-flex items-center gap-2 px-6 py-3 font-bold text-white transition-colors bg-primary-600 rounded-xl hover:bg-primary-700"
                          >
                            <FaHome />
                            <span>Kembali ke Beranda</span>
                          </button>
                        </div>
                      )}

                      {updatedAt && content && (
                        <div className="flex items-center justify-between px-8 py-4 border-t border-gray-100 md:px-12 bg-gray-50">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <FaCalendarAlt className="text-xs" />
                            <span>{`Terakhir diperbarui: ${updatedAt}`}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tombol Sebelumnya / Berikutnya antar tahun survei */}
                    {surveyYear && (prevYear || nextYear) && (
                      <div className="flex items-stretch justify-between gap-4 mt-6">
                        {prevYear ? (
                          <button
                            onClick={() => navigate(`/${prevYear.page_id}`)}
                            className="flex items-center gap-3 px-5 py-3 text-left transition-all shadow-sm group bg-primary-600 hover:bg-primary-700 rounded-xl hover:shadow-md"
                          >
                            <FaChevronLeft className="text-xs transition-all text-white/70 group-hover:text-white group-hover:-translate-x-1" />
                            <span className="flex flex-col">
                              <span className="text-xs font-medium text-white/70">Sebelumnya</span>
                              <span className="text-sm font-bold text-white">
                                Survei {prevYear.year}
                              </span>
                            </span>
                          </button>
                        ) : (
                          <div />
                        )}

                        {nextYear ? (
                          <button
                            onClick={() => navigate(`/${nextYear.page_id}`)}
                            className="flex items-center gap-3 px-5 py-3 text-right transition-all shadow-sm group bg-primary-600 hover:bg-primary-700 rounded-xl hover:shadow-md"
                          >
                            <span className="flex flex-col">
                              <span className="text-xs font-medium text-white/70">Berikutnya</span>
                              <span className="text-sm font-bold text-white">
                                Survei {nextYear.year}
                              </span>
                            </span>
                            <FaChevronRight className="text-xs transition-all text-white/70 group-hover:text-white group-hover:translate-x-1" />
                          </button>
                        ) : (
                          <div />
                        )}
                      </div>
                    )}

                    {/* Tombol menuju daftar Hasil Survei per Tahun */}
                    {pageId === SURVEY_BASE && (
                      <button
                        onClick={() => navigate(`/${SURVEY_LIST}`)}
                        className="flex items-center justify-between w-full gap-4 px-8 py-6 mt-6 text-left transition-all shadow-sm group bg-primary-600 hover:bg-primary-700 rounded-2xl hover:shadow-md md:px-12"
                      >
                        <div>
                          <h2 className="text-xl font-black text-white">
                            Hasil Survei per Tahun
                          </h2>
                          <p className="mt-1 text-sm text-white/70">
                            Lihat hasil survei kepuasan pelanggan dari tahun ke tahun
                          </p>
                        </div>
                        <FaChevronRight className="flex-shrink-0 transition-all text-white/70 group-hover:text-white group-hover:translate-x-1" />
                      </button>
                    )}

                    {/* Tombol menuju daftar sub-halaman (Laboratorium / GRK / Sistem Manajemen) */}
                    {SUBPAGE_HUBS.map((hub) =>
                      pageId === hub.base ? (
                        <button
                          key={hub.base}
                          onClick={() => navigate(`/${hub.list}`)}
                          className="flex items-center justify-between w-full gap-4 px-8 py-6 mt-6 text-left transition-all shadow-sm group bg-primary-600 hover:bg-primary-700 rounded-2xl hover:shadow-md md:px-12"
                        >
                          <div>
                            <h2 className="text-xl font-black text-white">
                              {hub.listHeading}
                            </h2>
                            <p className="mt-1 text-sm text-white/70">
                              {hub.listDesc}
                            </p>
                          </div>
                          <FaChevronRight className="flex-shrink-0 transition-all text-white/70 group-hover:text-white group-hover:translate-x-1" />
                        </button>
                      ) : null
                    )}
                  </>
                )}

                {/* Mobile Section Nav */}
                {siblings.length > 0 && (
                  <div className="mt-6 overflow-hidden bg-white border border-gray-200 shadow-sm lg:hidden rounded-2xl">
                    <div className="px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700">
                      <h3 className="text-sm font-black tracking-wide text-white uppercase">{sectionKey}</h3>
                    </div>
                    <nav className="grid grid-cols-2 gap-1 p-2">
                      {siblings.map((page) => {
                        const isActive = page.id === activeId;
                        return (
                          <button
                            key={page.id}
                            onClick={() => navigate(`/${page.id}`)}
                            className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${isActive
                              ? 'bg-primary-50 text-primary-700 font-bold'
                              : 'text-gray-600 hover:bg-gray-50'
                              }`}
                          >
                            {page.label}
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                )}
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