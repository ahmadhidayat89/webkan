import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import QuillTableBetter from 'quill-table-better';
import 'quill-table-better/dist/quill-table-better.css';
import {
  FaEdit, FaSave, FaTimes, FaImage, FaTrash,
  FaFileAlt, FaCheckCircle, FaExclamationCircle,
  FaChevronRight, FaLayerGroup, FaClock,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';

const sections = [
  {
    key: 'tentang',
    label: 'Tentang KAN',
    color: 'blue',
    pages: [
      { id: 'sejarah-fungsi', name: 'Sejarah dan Fungsi KAN' },
      { id: 'struktur-organisasi', name: 'Struktur Organisasi' },
      { id: 'ketidakberpihakan', name: 'Ketidakberpihakan' },
      { id: 'pengakuan-internasional', name: 'Pengakuan Internasional' },
      { id: 'anggota-kan', name: 'Anggota KAN' },
      { id: 'maklumat-layanan', name: 'Maklumat Layanan' },
      { id: 'standar-layanan', name: 'Standar Layanan Akreditasi' },
    ],
  },
  {
    key: 'proses',
    label: 'Proses Akreditasi',
    color: 'emerald',
    pages: [
      { id: 'proses-akreditasi', name: 'Proses Akreditasi' },
      { id: 'tarif-akreditasi', name: 'Tarif Akreditasi' },
      { id: 'penanganan-komplain', name: 'Penanganan Komplain' },
      { id: 'penanganan-banding', name: 'Penanganan Banding' },
      { id: 'survey-kepuasan-pelanggan', name: 'Survey Kepuasan Pelanggan' },
    ],
  },
  {
    key: 'layanan',
    label: 'Layanan Akreditasi',
    color: 'violet',
    pages: [
      { id: 'layanan/laboratorium', name: 'Laboratorium' },
      { id: 'layanan/lembaga-inspeksi', name: 'Lembaga Inspeksi' },
      { id: 'layanan/lembaga-verifikasi-validasi-grk', name: 'Lembaga Verifikasi & Validasi GRK' },
      { id: 'layanan/penyelenggara-uji-profisiensi', name: 'Penyelenggara Uji Profisiensi' },
      { id: 'layanan/produsen-bahan-acuan', name: 'Produsen Bahan Acuan' },
      { id: 'layanan/sistem-manajemen', name: 'Sistem Manajemen' },
      { id: 'layanan/sertifikasi-person', name: 'Sertifikasi Person' },
      { id: 'layanan/sertifikasi-sni-iso-iec-17065', name: 'Sertifikasi SNI ISO/IEC 17065' },
      { id: 'layanan/sertifikasi-pembangunan-berkelanjutan', name: 'Sertifikasi Pembangunan Berkelanjutan' },
    ],
  },
  {
    key: 'direktori',
    label: 'Direktori LPK',
    color: 'amber',
    pages: [
      { id: 'direktori/terakreditasi', name: 'Terakreditasi' },
      { id: 'direktori/akreditasi-dibekukan', name: 'Akreditasi Dibekukan' },
      { id: 'direktori/akreditasi-dicabut', name: 'Akreditasi Dicabut' },
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | UNDuh - DINONAKTIFKAN
  |--------------------------------------------------------------------------
  | Pengelolaan dokumen Unduh sekarang dipisahkan ke:
  | - DocumentManagement.jsx untuk admin
  | - DocumentPage.jsx untuk halaman publik
  |
  | Kode lama tetap disimpan sebagai komentar agar tidak hilang.
  */

  /*
  {
    key: 'unduh',
    label: 'Unduh',
    color: 'rose',
    pages: [
      { id: 'unduh/dokumen-akreditasi', name: 'Dokumen Akreditasi' },
      { id: 'unduh/materi-kegiatan', name: 'Materi Kegiatan' },
      {
        id: 'unduh/artikel-penilaian-kesesuaian',
        name: 'Artikel Penilaian Kesesuaian'
      },
      {
        id: 'unduh/dokumen-internasional',
        name: 'Dokumen Internasional'
      },
    ],
  },
  */
];

const allPages = sections.flatMap(s =>
  s.pages.map(p => ({
    ...p,
    section: s.label,
    sectionKey: s.key,
    color: s.color
  }))
);

// ── Survei Kepuasan Pelanggan per tahun ──
const SURVEY_BASE = 'survey-kepuasan-pelanggan';

const surveyYearOf = (pageId) =>
  pageId && pageId.startsWith(`${SURVEY_BASE}/`)
    ? pageId.slice(SURVEY_BASE.length + 1)
    : null;

const buildSurveyPage = (year) => ({
  id: `${SURVEY_BASE}/${year}`,
  name: `Survei Kepuasan Pelanggan ${year}`,
  section: 'Proses Akreditasi',
  sectionKey: 'proses',
  color: 'emerald',
});

// ── Sub-halaman Layanan Akreditasi (nama bebas, per kategori) ──
const SUB_CATS = [
  { slug: 'laboratorium', name: 'Laboratorium' },
  { slug: 'lembaga-verifikasi-validasi-grk', name: 'Lembaga Verifikasi & Validasi GRK' },
  { slug: 'sistem-manajemen', name: 'Sistem Manajemen' },
  { slug: 'sertifikasi-sni-iso-iec-17065', name: 'Sertifikasi SNI ISO/IEC 17065' },
  { slug: 'sertifikasi-pembangunan-berkelanjutan', name: 'Sertifikasi Pembangunan Berkelanjutan' },
];

const slugify = (str) =>
  str.toString().trim().toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

// layanan/{kategori}/{slug} -> { cat, slug } (hanya untuk kategori di SUB_CATS)
const subOf = (pageId) => {
  if (!pageId) return null;

  const p = pageId.split('/');

  if (
    p[0] === 'layanan' &&
    p.length === 3 &&
    SUB_CATS.some((c) => c.slug === p[1])
  ) {
    return {
      cat: p[1],
      slug: p[2]
    };
  }

  return null;
};

const buildSubPage = (item) => ({
  id: `layanan/${item.cat}/${item.slug}`,
  cat: item.cat,
  name: item.title,
  section: 'Layanan Akreditasi',
  sectionKey: 'layanan',
  color: 'violet',
});

const colorMap = {
  blue: {
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
    active: 'bg-blue-50 border-blue-500 text-blue-700'
  },

  emerald: {
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    active: 'bg-emerald-50 border-emerald-500 text-emerald-700'
  },

  violet: {
    badge: 'bg-violet-100 text-violet-700',
    dot: 'bg-violet-500',
    active: 'bg-violet-50 border-violet-500 text-violet-700'
  },

  amber: {
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    active: 'bg-amber-50 border-amber-500 text-amber-700'
  },

  /*
  |--------------------------------------------------------------------------
  | Warna Unduh - DINONAKTIFKAN
  |--------------------------------------------------------------------------
  | Tetap disimpan sebagai komentar agar kode lama tidak hilang.
  */

  /*
  rose: {
    badge: 'bg-rose-100 text-rose-700',
    dot: 'bg-rose-500',
    active: 'bg-rose-50 border-rose-500 text-rose-700'
  },
  */
};

// ── Editor teks (Quill) + fitur tabel ──
// Didaftarkan ke SUBCLASS (TableQuill), bukan ke Quill global, supaya
// modul tabel ini tidak memengaruhi editor Quill lain di aplikasi
// (mis. editor FAQ) yang tidak membutuhkan fitur tabel.
class TableQuill extends Quill {}
TableQuill.register({ 'modules/table-better': QuillTableBetter }, true);

const quillModules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'link'],
    ['table-better'],
    ['clean'],
  ],

  table: false,

  'table-better': {
    toolbarTable: true,
  },

  keyboard: {
    bindings: QuillTableBetter.keyboardBindings,
  },
};

const hasMeaningfulContent = (html) => {
  if (!html) return false;

  if (/<(img|iframe|video|table|blockquote)\b/i.test(html)) {
    return true;
  }

  const textOnly = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

  return textOnly.length > 0;
};

const parseApiJson = (rawText) => {
  if (!rawText) return null;

  try {
    return JSON.parse(rawText);
  } catch {
    // Handle noisy responses, e.g. warnings before JSON payload.
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');

    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(rawText.slice(start, end + 1));
      } catch {
        return null;
      }
    }

    return null;
  }
};

const toPreviewUrl = (imagePath) => {
  if (!imagePath) return null;

  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  if (imagePath.startsWith('/storage/')) return imagePath;

  if (imagePath.startsWith('storage/')) {
    return `/${imagePath}`;
  }

  return `/storage/${imagePath}`;
};

// Buang paragraf kosong di akhir supaya tidak bertambah setiap konten dibuka dan disimpan
const trimEmptyTail = (html) =>
  html.replace(/(?:\s*<p>(?:<br\s*\/?>)?<\/p>)+\s*$/i, '');

const QuillEditor = ({ value, onChange, placeholder }) => {
  const wrapperRef = useRef(null);
  const quillRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!wrapperRef.current || quillRef.current) return;

    const wrapper = wrapperRef.current;

    wrapper.innerHTML = '';

    const editorElement = document.createElement('div');

    wrapper.appendChild(editorElement);

    // Dipakai sebagai TableQuill (subclass), bukan Quill global,
    const quill = new TableQuill(editorElement, {
      theme: 'snow',
      placeholder,
      modules: quillModules,
    });

    quillRef.current = quill;

    // Muat konten lama dengan updateContents
    // (cara yang disarankan quill-table-better)
    const initial = initialValueRef.current;

    if (initial) {
      const delta = quill.clipboard.convert({
        html: initial,
        text: '\n'
      });

      quill.updateContents(delta, 'silent');
    }

    quill.on('text-change', () => {
      onChangeRef.current(
        trimEmptyTail(
          quill
            .getSemanticHTML()
            .replace(/&nbsp;/g, ' ')
        )
      );
    });

    return () => {
      wrapper.innerHTML = '';
      quillRef.current = null;
    };
  }, [placeholder]);

    return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden [&_.ql-toolbar]:!border-0 [&_.ql-toolbar]:!border-b [&_.ql-toolbar]:!border-gray-200 [&_.ql-container]:!border-0 [&_.ql-editor]:min-h-[320px] [&_.ql-editor]:text-sm">
      <div ref={wrapperRef} />
    </div>
  );
};

const ContentManagement = () => {
  const [searchParams] = useSearchParams();
  const requestedSection = searchParams.get('section');
  const [dbContents, setDbContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    content_id: '',
    title: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [activeSection, setActiveSection] = useState(
    sections.some((section) => section.key === requestedSection) ? requestedSection : 'tentang',
  );

  useEffect(() => {
    setActiveSection(
      sections.some((section) => section.key === requestedSection) ? requestedSection : 'tentang',
    );
    setSelectedId(null);
  }, [requestedSection]);
  const [removeImage, setRemoveImage] = useState(false);
  const [draftYears, setDraftYears] = useState([]);
  const [newYear, setNewYear] = useState('');
  const [yearError, setYearError] = useState('');
  const [draftSubs, setDraftSubs] = useState([]);
  const [newSubName, setNewSubName] = useState('');
  const [subError, setSubError] = useState('');

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      setLoading(true);

      const res = await fetch('/api/v1/admin/page-contents', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });

      const raw = await res.text();
      const data = parseApiJson(raw);

      if (data.success) {
        setDbContents(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getContent = (pageId) =>
    dbContents.find(p => p.page_id === pageId);

  const hasContent = (pageId) => {
    const c = getContent(pageId);

    return c && (c.content_id || '').trim().length > 0;
  };

  const filledCount = allPages.filter(
    p => hasContent(p.id)
  ).length;

  // Daftar tahun survei:
  // dari database + tahun yang baru ditambah (belum disimpan)
  const surveyYears = Array.from(
    new Set([
      ...dbContents
        .map((c) => surveyYearOf(c.page_id))
        .filter(Boolean),
      ...draftYears,
    ])
  ).sort((a, b) => b.localeCompare(a));

  const surveyPages = surveyYears.map(buildSurveyPage);

  // Sub-halaman:
  // dari database (pakai title tersimpan)
  // + yang baru ditambah (belum disimpan)
  const dbSubs = dbContents
    .map((c) => ({
      c,
      r: subOf(c.page_id)
    }))
    .filter(({ r }) => r)
    .map(({ c, r }) => ({
      cat: r.cat,
      slug: r.slug,
      title: c.title || r.slug
    }));

  const subItems = [
    ...dbSubs,
    ...draftSubs.filter(
      (d) =>
        !dbSubs.some(
          (s) =>
            s.cat === d.cat &&
            s.slug === d.slug
        )
    ),
  ].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  const subPages = subItems.map(buildSubPage);

  // Kategori aktif (dari halaman yang dipilih)
  const activeCat = (() => {
    const r = subOf(selectedId);

    if (r) return r.cat;

    const m =
      selectedId &&
      selectedId.match(/^layanan\/([^/]+)$/);

    return m &&
      SUB_CATS.some((c) => c.slug === m[1])
      ? m[1]
      : null;
  })();

  const activeCatInfo = SUB_CATS.find(
    (c) => c.slug === activeCat
  );

  const catSubPages = subPages.filter(
    (p) => p.cat === activeCat
  );

  const handleSelect = (pageId) => {
    setSelectedId(pageId);
    setSaveMsg(null);
    setRemoveImage(false);

    const c = getContent(pageId);
    const sub = subOf(pageId);

    const knownTitle = sub
      ? (
          subItems.find(
            (l) =>
              l.cat === sub.cat &&
              l.slug === sub.slug
          )?.title || ''
        )
      : '';

    if (c) {
      setFormData({
        content_id: c.content_id || '',
        title: c.title || knownTitle
      });

      setImagePreview(toPreviewUrl(c.image));
    } else {
      const draftTitle = sub
        ? (
            draftSubs.find(
              (l) =>
                l.cat === sub.cat &&
                l.slug === sub.slug
            )?.title || ''
          )
        : '';

      setFormData({
        content_id: '',
        title: draftTitle
      });

      setImagePreview(null);
    }

    setImageFile(null);
  };

  const handleAddSurvey = () => {
    const year = newYear.trim();

    if (!/^(19|20)\d{2}$/.test(year)) {
      setYearError(
        'Masukkan tahun 4 digit, contoh: 2019'
      );
      return;
    }

    if (surveyYears.includes(year)) {
      setYearError(`Survei ${year} sudah ada`);
      return;
    }

    setDraftYears((prev) => [...prev, year]);
    setNewYear('');
    setYearError('');

    handleSelect(`${SURVEY_BASE}/${year}`);
  };

  const handleAddSub = () => {
    const name = newSubName.trim();

    if (!name) {
      setSubError('Masukkan nama sub-halaman');
      return;
    }

    if (name.length > 150) {
      setSubError('Nama maksimal 150 karakter');
      return;
    }

    const baseSlug = slugify(name);

    if (!baseSlug) {
      setSubError(
        'Nama tidak valid, gunakan huruf atau angka'
      );
      return;
    }

    // Alamat dibatasi 100 karakter di backend,
    // jadi slug dipotong otomatis.
    // Nama yang tampil (title) tetap utuh.
    const prefix = `layanan/${activeCat}/`;

    const maxSlug =
      100 - prefix.length - 4;

    let slug = baseSlug
      .slice(0, maxSlug)
      .replace(/-+$/, '');

    // Kalau alamat bentrok
    // (nama berbeda tapi hasil potongan sama),
    // beri nomor
    let n = 2;

    while (
      subItems.some(
        (l) =>
          l.cat === activeCat &&
          l.slug === slug
      )
    ) {
      if (
        slug === baseSlug ||
        (n === 2 && baseSlug.length <= maxSlug)
      ) {
        setSubError(
          'Sub-halaman dengan nama ini sudah ada'
        );
        return;
      }

      slug = `${baseSlug
        .slice(0, maxSlug)
        .replace(/-+$/, '')}-${n}`;

      n += 1;
    }

    const id = `${prefix}${slug}`;

    setDraftSubs((prev) => [
      ...prev,
      {
        cat: activeCat,
        slug,
        title: name
      }
    ]);

    setNewSubName('');
    setSubError('');

    handleSelect(id);

    setFormData({
      content_id: '',
      title: name
    });
  };

  const handleDeleteSurvey = async () => {
    const year = surveyYearOf(selectedId);

    if (!year) return;

    if (
      !window.confirm(
        `Hapus Survei Kepuasan Pelanggan ${year}? Tindakan ini tidak bisa dibatalkan.`
      )
    ) {
      return;
    }

    await deleteDynamicPage(
      selectedId,
      () =>
        setDraftYears((prev) =>
          prev.filter((y) => y !== year)
        )
    );
  };

  const handleDeleteSub = async () => {
    const sub = subOf(selectedId);

    if (!sub) return;

    const name =
      subItems.find(
        (l) =>
          l.cat === sub.cat &&
          l.slug === sub.slug
      )?.title || sub.slug;

    if (
      !window.confirm(
        `Hapus sub-halaman "${name}"? Tindakan ini tidak bisa dibatalkan.`
      )
    ) {
      return;
    }

    const ok = await deleteDynamicPage(
      selectedId,
      () =>
        setDraftSubs((prev) =>
          prev.filter(
            (l) =>
              !(
                l.cat === sub.cat &&
                l.slug === sub.slug
              )
          )
        )
    );

    if (ok) {
      handleSelect(`layanan/${sub.cat}`);
    }
  };

  const deleteDynamicPage = async (
    pageId,
    onRemovedFromDraft
  ) => {
    try {
      setSaving(true);

      const res = await fetch(
        `/api/v1/admin/page-contents/${pageId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
          },
        }
      );

      const data = parseApiJson(
        await res.text()
      );

      if (res.ok && data?.success) {
        onRemovedFromDraft();

        setSelectedId(null);

        await fetchContents();

        return true;
      }

      setSaveMsg({
        type: 'error',
        text:
          data?.message ||
          `Gagal menghapus (HTTP ${res.status})`
      });

      return false;
    } catch (e) {
      setSaveMsg({
        type: 'error',
        text: 'Terjadi kesalahan, coba lagi'
      });

      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (file.size > 2048000) {
      alert('Ukuran gambar maksimal 2MB');
      return;
    }

    setImageFile(file);
    setImagePreview(
      URL.createObjectURL(file)
    );
  };

  const handleSave = async () => {
    if (!selectedId) return;

    const isSub = !!subOf(selectedId);

    if (
      isSub &&
      !formData.title.trim()
    ) {
      setSaveMsg({
        type: 'error',
        text: 'Judul halaman tidak boleh kosong'
      });

      return;
    }

    try {
      setSaving(true);
      setSaveMsg(null);

      const fd = new FormData();

      fd.append('page_id', selectedId);
      fd.append(
        'content_id',
        formData.content_id
      );

      if (isSub) {
        fd.append(
          'title',
          formData.title.trim()
        );
      }

      if (imageFile) {
        fd.append('image', imageFile);
      }

      if (
        removeImage &&
        !imageFile
      ) {
        fd.append(
          'remove_image',
          '1'
        );
      }

      const res = await fetch(
        '/api/v1/admin/page-contents',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
          },
          body: fd,
        }
      );

      const raw = await res.text();
      const rawTrimmed = raw.trim();
      const data = parseApiJson(raw);

      if (res.ok && data?.success) {
        setSaveMsg({
          type: 'success',
          text: 'Konten berhasil disimpan!'
        });

        await fetchContents();

        setImageFile(null);
        setRemoveImage(false);
      } else {
        const isHtmlResponse =
          rawTrimmed.startsWith('<!DOCTYPE') ||
          rawTrimmed.startsWith('<html');

        const hasSuccessPattern =
          /"success"\s*:\s*true/i.test(
            rawTrimmed
          );

        const firstError = data?.errors
          ? Object.values(data.errors)
              .flat()?.[0]
          : null;

        if (
          res.ok &&
          hasSuccessPattern
        ) {
          setSaveMsg({
            type: 'success',
            text: 'Konten berhasil disimpan!'
          });

          await fetchContents();

          setImageFile(null);
          setRemoveImage(false);
        } else {
          setSaveMsg({
            type: 'error',
            text: isHtmlResponse
              ? 'Sesi login tidak valid/expired. Silakan login ulang.'
              : (
                  firstError ||
                  data?.message ||
                  `Gagal menyimpan konten (HTTP ${res.status})`
                ),
          });
        }
      }
    } catch (e) {
      setSaveMsg({
        type: 'error',
        text: 'Terjadi kesalahan, coba lagi'
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedPage =
    allPages.find(
      p => p.id === selectedId
    )
    || surveyPages.find(
      p => p.id === selectedId
    )
    || subPages.find(
      p => p.id === selectedId
    );

  const selectedContent =
    selectedId
      ? getContent(selectedId)
      : null;

  const selectedLabSlug =
    subOf(selectedId)?.slug || null;

  const canSave =
    hasMeaningfulContent(
      formData.content_id
    ) &&
    !saving &&
    (
      !selectedLabSlug ||
      formData.title.trim().length > 0
    );

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden text-white shadow-xl bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 rounded-2xl p-7">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-56 h-56 rounded-full -top-10 -right-10 bg-white/5 blur-3xl"></div>
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-white/15 rounded-xl">
                <FaLayerGroup className="text-xl text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-black">
                  Kelola Konten Halaman
                </h2>

                <p className="text-white/70 text-sm mt-0.5">
                  Edit konten untuk setiap halaman website KAN
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="px-5 py-3 text-center border bg-white/15 rounded-xl border-white/20">
                <div className="text-2xl font-black">
                  {filledCount}
                </div>

                <div className="text-xs font-semibold text-white/70">
                  Terisi
                </div>
              </div>

              <div className="px-5 py-3 text-center border bg-white/15 rounded-xl border-white/20">
                <div className="text-2xl font-black">
                  {allPages.length - filledCount}
                </div>

                <div className="text-xs font-semibold text-white/70">
                  Kosong
                </div>
              </div>

              <div className="px-5 py-3 text-center border bg-white/10 rounded-xl border-white/20">
                <div className="text-2xl font-black">
                  {allPages.length}
                </div>

                <div className="text-xs font-semibold text-white/70">
                  Total
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 rounded-full border-primary-600 border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <div className="flex items-start gap-6">

            {/* Sidebar */}
            <div className="sticky flex-shrink-0 overflow-hidden bg-white border border-gray-200 shadow-sm w-72 rounded-2xl top-6">

              {/* Section Tabs */}
              <div className="p-3 space-y-1 border-b border-gray-100">
                {sections.map(s => {
                  const sectionFilled =
                    s.pages.filter(
                      p => hasContent(p.id)
                    ).length;

                  const isActive =
                    activeSection === s.key;

                  const c =
                    colorMap[s.color];

                  return (
                    <button
                      key={s.key}
                      onClick={() =>
                        setActiveSection(s.key)
                      }
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                        isActive
                          ? `${c.active} border-l-4 font-bold`
                          : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}
                    >
                      <span className="text-sm truncate">
                        {s.label}
                      </span>

                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          sectionFilled === s.pages.length
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {sectionFilled}/{s.pages.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Pages in Active Section */}
              <div className="p-2">
                {sections
                  .find(
                    s => s.key === activeSection
                  )
                  ?.pages.map(page => {
                    const filled =
                      hasContent(page.id);

                    const isSelected =
                      selectedId === page.id;

                    return (
                      <button
                        key={page.id}
                        onClick={() =>
                          handleSelect(page.id)
                        }
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all group mb-1 ${
                          isSelected
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {filled ? (
                          <FaCheckCircle
                            className={`flex-shrink-0 text-sm ${
                              isSelected
                                ? 'text-green-300'
                                : 'text-emerald-500'
                            }`}
                          />
                        ) : (
                          <FaExclamationCircle
                            className={`flex-shrink-0 text-sm ${
                              isSelected
                                ? 'text-yellow-300'
                                : 'text-amber-400'
                            }`}
                          />
                        )}

                        <span className="flex-1 text-sm font-semibold truncate">
                          {page.name}
                        </span>

                        <FaChevronRight
                          className={`flex-shrink-0 text-xs transition-transform ${
                            isSelected
                              ? 'text-white/60'
                              : 'text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5'
                          }`}
                        />
                      </button>
                    );
                  })}

                {/* Survei per Tahun (hanya di menu Proses Akreditasi) */}
                {activeSection === 'proses' && (
                  <div className="px-1 pt-3 mt-3 border-t border-gray-100">
                    <p className="px-2 mb-2 text-xs font-bold tracking-wide text-gray-400 uppercase">
                      Survei per Tahun
                    </p>

                    {surveyPages.map((page) => {
                      const filled =
                        hasContent(page.id);

                      const isSelected =
                        selectedId === page.id;

                      return (
                        <button
                          key={page.id}
                          onClick={() =>
                            handleSelect(page.id)
                          }
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all mb-1 ${
                            isSelected
                              ? 'bg-primary-600 text-white shadow-md'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {filled ? (
                            <FaCheckCircle
                              className={`flex-shrink-0 text-sm ${
                                isSelected
                                  ? 'text-green-300'
                                  : 'text-emerald-500'
                              }`}
                            />
                          ) : (
                            <FaExclamationCircle
                              className={`flex-shrink-0 text-sm ${
                                isSelected
                                  ? 'text-yellow-300'
                                  : 'text-amber-400'
                              }`}
                            />
                          )}

                          <span className="flex-1 text-sm font-semibold truncate">
                            {page.name}
                          </span>
                        </button>
                      );
                    })}

                    <div className="mt-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={150}
                          value={newYear}
                          onChange={(e) => {
                            setNewYear(
                              e.target.value
                            );
                            setYearError('');
                          }}
                          onKeyDown={(e) =>
                            e.key === 'Enter' &&
                            handleAddSurvey()
                          }
                          placeholder="Tahun, mis. 2019"
                          className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                        />

                        <button
                          onClick={handleAddSurvey}
                          className="px-3 py-2 text-sm font-bold text-white rounded-lg bg-primary-600 hover:bg-primary-700"
                        >
                          + Tambah
                        </button>
                      </div>

                      {yearError && (
                        <p className="mt-1 text-xs text-red-600">
                          {yearError}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-halaman */}
                {activeSection === 'layanan' &&
                  activeCatInfo && (
                    <div className="px-1 pt-3 mt-3 border-t border-gray-100">
                      <p className="px-2 mb-2 text-xs font-bold tracking-wide text-gray-400 uppercase">
                        {activeCatInfo.name} (Sub-halaman)
                      </p>

                      {catSubPages.map((page) => {
                        const filled =
                          hasContent(page.id);

                        const isSelected =
                          selectedId === page.id;

                        return (
                          <button
                            key={page.id}
                            onClick={() =>
                              handleSelect(page.id)
                            }
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all mb-1 ${
                              isSelected
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            {filled ? (
                              <FaCheckCircle
                                className={`flex-shrink-0 text-sm ${
                                  isSelected
                                    ? 'text-green-300'
                                    : 'text-emerald-500'
                                }`}
                              />
                            ) : (
                              <FaExclamationCircle
                                className={`flex-shrink-0 text-sm ${
                                  isSelected
                                    ? 'text-yellow-300'
                                    : 'text-amber-400'
                                }`}
                              />
                            )}

                            <span className="flex-1 text-sm font-semibold truncate">
                              {page.name}
                            </span>
                          </button>
                        );
                      })}

                      <div className="mt-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newSubName}
                            onChange={(e) => {
                              setNewSubName(
                                e.target.value
                              );
                              setSubError('');
                            }}
                            onKeyDown={(e) =>
                              e.key === 'Enter' &&
                              handleAddSub()
                            }
                            placeholder="Nama sub-halaman"
                            className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                          />

                          <button
                            onClick={handleAddSub}
                            className="px-3 py-2 text-sm font-bold text-white rounded-lg bg-primary-600 hover:bg-primary-700"
                          >
                            + Tambah
                          </button>
                        </div>

                        {subError && (
                          <p className="mt-1 text-xs text-red-600">
                            {subError}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Editor Panel */}
            <div className="flex-1 min-w-0">
              {!selectedId ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-gray-200 shadow-sm rounded-2xl">
                  <div className="flex items-center justify-center w-20 h-20 mb-4 bg-gray-100 rounded-2xl">
                    <FaFileAlt className="text-3xl text-gray-400" />
                  </div>

                  <h3 className="mb-2 text-lg font-black text-gray-800">
                    Pilih Halaman
                  </h3>

                  <p className="max-w-xs text-sm text-gray-500">
                    Pilih salah satu halaman dari daftar di sebelah kiri untuk mulai mengedit kontennya.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">

                  {/* Editor Header */}
                  <div className="py-5 border-b border-gray-100 px-7 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              colorMap[
                                selectedPage?.color
                              ]?.badge
                            }`}
                          >
                            {selectedPage?.section}
                          </span>

                          {selectedContent?.updated_at && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <FaClock className="text-xs" />

                              {new Date(
                                selectedContent.updated_at
                              ).toLocaleDateString(
                                'id-ID',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                }
                              )}
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-black text-gray-900">
                          {selectedPage?.name}
                        </h3>

                        <p className="text-xs text-gray-400 mt-0.5 font-mono">
                          /{selectedId}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasContent(selectedId) ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                            <FaCheckCircle />
                            Konten Tersedia
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                            <FaExclamationCircle />
                            Belum Ada Konten
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Editor Form */}
                  <div className="space-y-6 p-7">

                    {/* Save Message */}
                    {saveMsg && (
                      <div
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${
                          saveMsg.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {saveMsg.type === 'success' ? (
                          <FaCheckCircle />
                        ) : (
                          <FaExclamationCircle />
                        )}

                        {saveMsg.text}
                      </div>
                    )}

                    {/* Judul Halaman */}
                    {selectedLabSlug && (
                      <div>
                        <label className="block mb-2 text-sm font-bold text-gray-800">
                          Judul Halaman{' '}
                          <span className="text-red-500">
                            *
                          </span>
                        </label>

                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData(
                              (prev) => ({
                                ...prev,
                                title: e.target.value
                              })
                            )
                          }
                          placeholder="mis. Laboratorium Penguji"
                          className="w-full max-w-lg px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                        />

                        <p className="text-xs text-gray-400 mt-1.5">
                          Judul ini muncul di daftar sub-halaman dan judul halaman, terlepas dari alamat /{selectedId}
                        </p>
                      </div>
                    )}

                    {/* Image Upload */}
                    <div>
                      <label className="block mb-2 text-sm font-bold text-gray-800">
                        Gambar Header{' '}
                        <span className="font-normal text-gray-400">
                          (Opsional)
                        </span>
                      </label>

                      {imagePreview ? (
                        <div className="relative w-full max-w-lg overflow-hidden border border-gray-200 rounded-xl group">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="object-cover w-full h-44"
                          />

                          <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/40 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => {
                                setImageFile(null);
                                setImagePreview(null);
                                setRemoveImage(true);
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700"
                            >
                              <FaTrash />
                              Hapus Gambar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-40 max-w-lg transition-all border-2 border-gray-300 border-dashed cursor-pointer rounded-xl hover:border-primary-400 hover:bg-primary-50 group">
                          <FaImage className="mb-2 text-3xl text-gray-300 transition-colors group-hover:text-primary-400" />

                          <span className="text-sm font-semibold text-gray-500 group-hover:text-primary-600">
                            Klik untuk upload gambar
                          </span>

                          <span className="mt-1 text-xs text-gray-400">
                            JPG, PNG — Maks. 2MB
                          </span>

                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Content ID */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-bold text-gray-800">
                          Konten Bahasa Indonesia{' '}
                          <span className="text-red-500">
                            *
                          </span>
                        </label>

                        <span className="px-2 py-1 font-mono text-xs text-gray-400 bg-gray-100 rounded-md">
                          HTML
                        </span>
                      </div>

                      <QuillEditor
                        key={selectedId}
                        value={formData.content_id}
                        onChange={(value) =>
                          setFormData(
                            (prev) => ({
                              ...prev,
                              content_id: value
                            })
                          )
                        }
                        placeholder="Tulis konten bahasa Indonesia..."
                      />

                      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                        Mendukung tag HTML: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;a&gt;, &lt;table&gt;, dll.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                      <button
                        onClick={handleSave}
                        disabled={!canSave}
                        className="flex items-center gap-2 py-3 font-bold text-white transition-all shadow-md px-7 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:from-primary-700 hover:to-primary-800 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaSave />

                        {saving
                          ? 'Menyimpan...'
                          : 'Simpan Konten'}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedId(null);
                          setSaveMsg(null);
                        }}
                        className="flex items-center gap-2 px-5 py-3 font-bold text-gray-600 transition-all border border-gray-200 rounded-xl hover:bg-gray-50"
                      >
                        <FaTimes />
                        Tutup
                      </button>

                      {surveyYearOf(selectedId) && (
                        <button
                          onClick={handleDeleteSurvey}
                          disabled={saving}
                          className="flex items-center gap-2 px-5 py-3 ml-auto font-bold text-red-600 transition-all border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-50"
                        >
                          <FaTrash />
                          Hapus Survei
                        </button>
                      )}

                      {selectedLabSlug && (
                        <button
                          onClick={handleDeleteSub}
                          disabled={saving}
                          className="flex items-center gap-2 px-5 py-3 ml-auto font-bold text-red-600 transition-all border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-50"
                        >
                          <FaTrash />
                          Hapus Sub-halaman
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ContentManagement;