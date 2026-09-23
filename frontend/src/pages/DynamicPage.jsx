import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  FaHome, FaChevronRight, FaSpinner, FaCalendarAlt, FaLink,
  FaArrowLeft, FaTimes, FaSearchPlus, FaSearchMinus,
  FaChevronLeft, FaExpand, FaPlay, FaImage
} from 'react-icons/fa';

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
            title="Zoom out (−)"
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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
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
              key={i}
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
    <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-black group my-6"
      style={{ aspectRatio: '16/9' }}>
      {!playing && thumbnail ? (
        <div className="absolute inset-0 cursor-pointer" onClick={() => setPlaying(true)}>
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
  const contentRef = useRef(null);

  const pageId = location.pathname.substring(1);

  const sectionPages = {
    'Tentang KAN': [
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

  const fetchPageContent = async () => {
    try {
      setLoading(true);
      setNotFound(false);
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

  const meta = pageMeta[pageId];
  const title = meta ? meta.label : pageId;
  const sectionKey = meta?.section || null;
  const siblings = sectionKey ? (sectionPages[sectionKey] || []) : [];

  const content = pageContent ? pageContent.content_id : '';

  const updatedAt = pageContent?.updated_at
    ? new Date(pageContent.updated_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  // ── Enhance rendered content: lightbox + responsive video ──
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-5xl text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">Memuat halaman...</p>
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
      <div className="relative bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-primary-400/10 rounded-full blur-2xl" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          {/* Breadcrumb */}
          <div className="pt-32 lg:pt-40 pb-4 border-b border-white/10">
            <nav className="flex items-center gap-2 text-sm flex-wrap">
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
              <FaChevronRight className="text-xs text-white/30" />
              <span className="text-white/80 font-semibold">{title}</span>
            </nav>
          </div>

          {/* Title */}
          <div className="py-10">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                {sectionKey && (
                  <span className="inline-block px-3 py-1 bg-white/10 text-white/70 text-xs font-bold rounded-full uppercase tracking-wider mb-4 border border-white/20">
                    {sectionKey}
                  </span>
                )}
                <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-3">
                  {title}
                </h1>
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

      {/* Content Area */}
      <main className="py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-8 items-start">

              {/* Sidebar */}
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
                      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-4">
                        <h3 className="text-white font-black text-sm tracking-wide uppercase">
                          {sectionKey}
                        </h3>
                      </div>
                      <nav className="p-2">
                        {siblings.map((page) => {
                          const isActive = page.id === pageId;
                          return (
                            <button
                              key={page.id}
                              onClick={() => navigate(`/${page.id}`)}
                              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                                isActive
                                  ? 'bg-primary-50 text-primary-700 font-bold border-l-4 border-primary-600 pl-3'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                              }`}
                            >
                              {isActive && (
                                <div className="w-1.5 h-1.5 bg-primary-600 rounded-full flex-shrink-0" />
                              )}
                              <span>{page.label}</span>
                            </button>
                          );
                        })}
                      </nav>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl border border-primary-100 p-5">
                    <h4 className="text-sm font-black text-primary-900 mb-3 flex items-center gap-2">
                      <FaLink className="text-primary-600 text-xs" />
                      <span>Tautan Cepat</span>
                    </h4>
                    <div className="space-y-2">
                      {[
                        { label: 'Tentang KAN', path: '/tentang-kan' },
                        { label: 'Proses Akreditasi', path: '/proses-akreditasi' },
                        { label: 'Hubungi Kami', path: '/kontak' },
                      ].map((link) => (
                        <button
                          key={link.path}
                          onClick={() => navigate(link.path)}
                          className="block w-full text-left text-xs text-primary-700 hover:text-primary-900 font-medium py-1.5 border-b border-primary-100 last:border-0 transition-colors"
                        >
                          {link.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <div className="flex-1 min-w-0">

                {/* ── Featured Image Hero ── */}
                {pageContent?.image && (
                  <div
                    className="relative mb-8 rounded-2xl overflow-hidden shadow-2xl group cursor-zoom-in"
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
                      className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      style={{ maxHeight: '480px' }}
                    />
                    {/* Gradient overlay bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    {/* Zoom hint */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <FaExpand className="text-xs" />
                      <span>Perbesar</span>
                    </div>
                    {/* Title overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="text-white/80 text-sm font-medium">{title}</p>
                    </div>
                  </div>
                )}

                {/* ── Content Card ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
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
                        "
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content, { ADD_TAGS: ['iframe'], ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'] }) }}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-16 px-8">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl">📄</span>
                      </div>
                      <h3 className="text-2xl font-black text-gray-800 mb-3">
                        Konten Belum Tersedia
                      </h3>
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

                {/* Mobile Section Nav */}
                {siblings.length > 0 && (
                  <div className="lg:hidden mt-6 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-3">
                      <h3 className="text-white font-black text-sm tracking-wide uppercase">{sectionKey}</h3>
                    </div>
                    <nav className="p-2 grid grid-cols-2 gap-1">
                      {siblings.map((page) => {
                        const isActive = page.id === pageId;
                        return (
                          <button
                            key={page.id}
                            onClick={() => navigate(`/${page.id}`)}
                            className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                              isActive
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
