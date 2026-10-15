import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import QuillTableBetter from 'quill-table-better';
import 'quill-table-better/dist/quill-table-better.css';
import {
  FaSave, FaTimes, FaImage, FaTrash,
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

// FIX: pengganti regex /-+$/ (backtracking super-linear)
const trimTrailingHyphens = (str) => {
  let end = str.length;
  while (end > 0 && str[end - 1] === '-') end -= 1;
  return str.slice(0, end);
};

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

// FIX: regex /<[^>]*>/g dan /<(img|...)\b/i diganti DOMParser (tanpa backtracking)
const hasMeaningfulContent = (html) => {
  if (!html) return false;

  const doc = new DOMParser().parseFromString(html, 'text/html');

  if (doc.body.querySelector('img, iframe, video, table, blockquote')) {
    return true;
  }

  // &nbsp; menjadi \u00a0 setelah di-parse, dan trim() ikut membuangnya
  return doc.body.textContent.trim().length > 0;
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

const buildContentFormData = ({ selectedId, formData, isSub, imageFile, removeImage }) => {
  const form = new FormData();
  form.append('page_id', selectedId);
  form.append('content_id', formData.content_id);
  if (isSub) form.append('title', formData.title.trim());
  if (imageFile) form.append('image', imageFile);
  if (removeImage && !imageFile) form.append('remove_image', '1');
  return form;
};

const getContentSaveError = (response, raw, data) => {
  const rawTrimmed = raw.trim();
  if ((response.ok && data?.success) || (response.ok && /"success"\s*:\s*true/i.test(rawTrimmed))) return null;
  const isHtmlResponse = rawTrimmed.startsWith('<!DOCTYPE') || rawTrimmed.startsWith('<html');
  const firstError = data?.errors ? Object.values(data.errors).flat()?.[0] : null;
  return isHtmlResponse
    ? 'Sesi login tidak valid/expired. Silakan login ulang.'
    : (firstError || data?.message || `Gagal menyimpan konten (HTTP ${response.status})`);
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

// FIX: regex dengan nested quantifier diganti loop endsWith (tanpa backtracking)
const EMPTY_TAILS = ['<p><br></p>', '<p><br/></p>', '<p><br /></p>', '<p></p>'];

// Buang paragraf kosong di akhir supaya tidak bertambah setiap konten dibuka dan disimpan
const trimEmptyTail = (html) => {
  let out = html.trimEnd();
  let changed = true;

  while (changed) {
    changed = false;

    for (const tail of EMPTY_TAILS) {
      if (out.endsWith(tail)) {
        out = out.slice(0, -tail.length).trimEnd();
        changed = true;
      }
    }
  }

  return out;
};

/*
 * =========================================================
 * HELPER (di luar komponen supaya Cognitive Complexity
 * komponen utama tetap rendah)
 * =========================================================
 */

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  Accept: 'application/json',
});

const resolveSection = (requestedSection) =>
  sections.some((section) => section.key === requestedSection) ? requestedSection : 'tentang';

const loadPageContents = async () => {
  try {
    const res = await fetch('/api/v1/admin/page-contents', { headers: authHeaders() });
    const data = parseApiJson(await res.text());

    return data?.success ? data.data : null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

const requestDeletePage = async (pageId) => {
  try {
    const res = await fetch(`/api/v1/admin/page-contents/${pageId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = parseApiJson(await res.text());

    if (res.ok && data?.success) return { ok: true };

    return { ok: false, message: data?.message || `Gagal menghapus (HTTP ${res.status})` };
  } catch {
    return { ok: false, message: 'Terjadi kesalahan, coba lagi' };
  }
};

// Mengembalikan pesan error (string) atau null jika berhasil
const savePageContent = async ({ selectedId, formData, imageFile, removeImage }) => {
  const isSub = Boolean(subOf(selectedId));

  if (isSub && !formData.title.trim()) return 'Judul halaman tidak boleh kosong';

  try {
    const res = await fetch('/api/v1/admin/page-contents', {
      method: 'POST',
      headers: authHeaders(),
      body: buildContentFormData({ selectedId, formData, isSub, imageFile, removeImage }),
    });
    const raw = await res.text();

    return getContentSaveError(res, raw, parseApiJson(raw));
  } catch {
    return 'Terjadi kesalahan, coba lagi';
  }
};

const getSurveyYears = (dbContents, draftYears) =>
  Array.from(
    new Set([
      ...dbContents.map((c) => surveyYearOf(c.page_id)).filter(Boolean),
      ...draftYears,
    ])
  ).sort((a, b) => b.localeCompare(a));

// Sub-halaman dari database (pakai title tersimpan) + yang baru ditambah (belum disimpan)
const getSubItems = (dbContents, draftSubs) => {
  const dbSubs = dbContents
    .map((c) => ({ c, r: subOf(c.page_id) }))
    .filter(({ r }) => r)
    .map(({ c, r }) => ({
      cat: r.cat,
      slug: r.slug,
      title: c.title || r.slug,
    }));

  return [
    ...dbSubs,
    ...draftSubs.filter(
      (d) => !dbSubs.some((s) => s.cat === d.cat && s.slug === d.slug)
    ),
  ].sort((a, b) => a.title.localeCompare(b.title));
};

// Kategori aktif (dari halaman yang dipilih)
const getActiveCat = (selectedId) => {
  const r = subOf(selectedId);

  if (r) return r.cat;

  const m = selectedId && selectedId.match(/^layanan\/([^/]+)$/);

  return m && SUB_CATS.some((c) => c.slug === m[1]) ? m[1] : null;
};

const buildFormState = (pageId, content, subItems, draftSubs) => {
  const sub = subOf(pageId);

  const findTitle = (list) =>
    sub ? (list.find((l) => l.cat === sub.cat && l.slug === sub.slug)?.title || '') : '';

  if (content) {
    return {
      formData: {
        content_id: content.content_id || '',
        title: content.title || findTitle(subItems),
      },
      imagePreview: toPreviewUrl(content.image),
    };
  }

  return {
    formData: { content_id: '', title: findTitle(draftSubs) },
    imagePreview: null,
  };
};

const validateSurveyYear = (year, existingYears) => {
  if (!/^(19|20)\d{2}$/.test(year)) return 'Masukkan tahun 4 digit, contoh: 2019';
  if (existingYears.includes(year)) return `Survei ${year} sudah ada`;

  return '';
};

// Mengembalikan { error } atau { id, item }
const buildSubDraft = (name, activeCat, subItems) => {
  if (!name) return { error: 'Masukkan nama sub-halaman' };

  if (name.length > 150) return { error: 'Nama maksimal 150 karakter' };

  const baseSlug = slugify(name);

  if (!baseSlug) return { error: 'Nama tidak valid, gunakan huruf atau angka' };

  // Alamat dibatasi 100 karakter di backend, jadi slug dipotong otomatis.
  // Nama yang tampil (title) tetap utuh.
  const prefix = `layanan/${activeCat}/`;
  const maxSlug = 100 - prefix.length - 4;
  const truncatedBase = trimTrailingHyphens(baseSlug.slice(0, maxSlug));

  let slug = truncatedBase;

  // Kalau alamat bentrok (nama berbeda tapi hasil potongan sama), beri nomor
  let n = 2;

  while (subItems.some((l) => l.cat === activeCat && l.slug === slug)) {
    if (slug === baseSlug || (n === 2 && baseSlug.length <= maxSlug)) {
      return { error: 'Sub-halaman dengan nama ini sudah ada' };
    }

    slug = `${truncatedBase}-${n}`;
    n += 1;
  }

  return {
    id: `${prefix}${slug}`,
    item: { cat: activeCat, slug, title: name },
  };
};

const getDeleteConfirmText = (pageId, subItems) => {
  const year = surveyYearOf(pageId);

  if (year) {
    return `Hapus Survei Kepuasan Pelanggan ${year}? Tindakan ini tidak bisa dibatalkan.`;
  }

  const sub = subOf(pageId);

  if (!sub) return null;

  const name =
    subItems.find((l) => l.cat === sub.cat && l.slug === sub.slug)?.title || sub.slug;

  return `Hapus sub-halaman "${name}"? Tindakan ini tidak bisa dibatalkan.`;
};

const confirmDelete = (pageId, subItems) => {
  const text = getDeleteConfirmText(pageId, subItems);

  return Boolean(text) && window.confirm(text);
};

/*
 * =========================================================
 * HOOK
 * =========================================================
 */

const usePageContents = () => {
  const [dbContents, setDbContents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchContents = useCallback(async () => {
    const list = await loadPageContents();

    if (list) setDbContents(list);

    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchContents();
  }, [fetchContents]);

  const getContent = (pageId) => dbContents.find((p) => p.page_id === pageId);

  const hasContent = (pageId) => {
    const c = getContent(pageId);

    return Boolean(c) && (c.content_id || '').trim().length > 0;
  };

  return { dbContents, loading, fetchContents, getContent, hasContent };
};

/*
 * =========================================================
 * KOMPONEN
 * =========================================================
 */

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

const PageStatusIcon = ({ filled, isSelected }) => {
  if (filled) {
    return (
      <FaCheckCircle
        className={`flex-shrink-0 text-sm ${isSelected ? 'text-green-300' : 'text-emerald-500'}`}
      />
    );
  }

  return (
    <FaExclamationCircle
      className={`flex-shrink-0 text-sm ${isSelected ? 'text-yellow-300' : 'text-amber-400'}`}
    />
  );
};

const PageButton = ({ page, filled, isSelected, onSelect, withChevron = false }) => (
  <button
    onClick={() => onSelect(page.id)}
    className={`w-full flex items-center gap-3 px-3 rounded-xl text-left transition-all mb-1 ${
      withChevron ? 'py-3 group' : 'py-2.5'
    } ${
      isSelected
        ? 'bg-primary-600 text-white shadow-md'
        : 'hover:bg-gray-50 text-gray-700'
    }`}
  >
    <PageStatusIcon filled={filled} isSelected={isSelected} />

    <span className="flex-1 text-sm font-semibold truncate">
      {page.name}
    </span>

    {withChevron && (
      <FaChevronRight
        className={`flex-shrink-0 text-xs transition-transform ${
          isSelected
            ? 'text-white/60'
            : 'text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5'
        }`}
      />
    )}
  </button>
);

const SectionTab = ({ section, filledCount, isActive, onClick }) => {
  const c = colorMap[section.color];

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
        isActive
          ? `${c.active} border-l-4 font-bold`
          : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'
      }`}
    >
      <span className="text-sm truncate">
        {section.label}
      </span>

      <span
        className={`text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
          filledCount === section.pages.length
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-gray-100 text-gray-500'
        }`}
      >
        {filledCount}/{section.pages.length}
      </span>
    </button>
  );
};

// Daftar halaman dinamis (survei per tahun / sub-halaman) + form tambah
const DynamicPageGroup = ({ title, pages, selectedId, hasContent, onSelect, input }) => (
  <div className="px-1 pt-3 mt-3 border-t border-gray-100">
    <p className="px-2 mb-2 text-xs font-bold tracking-wide text-gray-400 uppercase">
      {title}
    </p>

    {pages.map((page) => (
      <PageButton
        key={page.id}
        page={page}
        filled={hasContent(page.id)}
        isSelected={selectedId === page.id}
        onSelect={onSelect}
      />
    ))}

    <div className="mt-2">
      <div className="flex gap-2">
        <input
          type="text"
          {...input.inputProps}
          aria-label={input.placeholder}
          value={input.value}
          onChange={(e) => input.onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && input.onAdd()}
          placeholder={input.placeholder}
          className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
        />

        <button
          onClick={input.onAdd}
          className="px-3 py-2 text-sm font-bold text-white rounded-lg bg-primary-600 hover:bg-primary-700"
        >
          + Tambah
        </button>
      </div>

      {input.error && (
        <p className="mt-1 text-xs text-red-600">
          {input.error}
        </p>
      )}
    </div>
  </div>
);

const ContentSidebar = ({
  activeSection,
  onSectionChange,
  selectedId,
  onSelect,
  hasContent,
  survey,
  sub,
}) => {
  const currentSection = sections.find((s) => s.key === activeSection);

  return (
    <div className="sticky flex-shrink-0 overflow-hidden bg-white border border-gray-200 shadow-sm w-72 rounded-2xl top-6">
      {/* Section Tabs */}
      <div className="p-3 space-y-1 border-b border-gray-100">
        {sections.map((s) => (
          <SectionTab
            key={s.key}
            section={s}
            filledCount={s.pages.filter((p) => hasContent(p.id)).length}
            isActive={activeSection === s.key}
            onClick={() => onSectionChange(s.key)}
          />
        ))}
      </div>

      {/* Pages in Active Section */}
      <div className="p-2">
        {currentSection?.pages.map((page) => (
          <PageButton
            key={page.id}
            page={page}
            filled={hasContent(page.id)}
            isSelected={selectedId === page.id}
            onSelect={onSelect}
            withChevron
          />
        ))}

        {/* Survei per Tahun (hanya di menu Proses Akreditasi) */}
        {activeSection === 'proses' && (
          <DynamicPageGroup
            title="Survei per Tahun"
            pages={survey.pages}
            selectedId={selectedId}
            hasContent={hasContent}
            onSelect={onSelect}
            input={survey.input}
          />
        )}

        {/* Sub-halaman */}
        {activeSection === 'layanan' && sub.info && (
          <DynamicPageGroup
            title={`${sub.info.name} (Sub-halaman)`}
            pages={sub.pages}
            selectedId={selectedId}
            hasContent={hasContent}
            onSelect={onSelect}
            input={sub.input}
          />
        )}
      </div>
    </div>
  );
};

const ContentHeader = ({ filledCount, totalCount }) => (
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
