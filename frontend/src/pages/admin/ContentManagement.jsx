import { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
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
  {
    key: 'unduh',
    label: 'Unduh',
    color: 'rose',
    pages: [
      { id: 'unduh/dokumen-akreditasi', name: 'Dokumen Akreditasi' },
      { id: 'unduh/materi-kegiatan', name: 'Materi Kegiatan' },
      { id: 'unduh/artikel-penilaian-kesesuaian', name: 'Artikel Penilaian Kesesuaian' },
      { id: 'unduh/dokumen-internasional', name: 'Dokumen Internasional' },
    ],
  },
];

const allPages = sections.flatMap(s => s.pages.map(p => ({ ...p, section: s.label, sectionKey: s.key, color: s.color })));

const colorMap = {
  blue:    { badge: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500',    active: 'bg-blue-50 border-blue-500 text-blue-700' },
  emerald: { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', active: 'bg-emerald-50 border-emerald-500 text-emerald-700' },
  violet:  { badge: 'bg-violet-100 text-violet-700',  dot: 'bg-violet-500',  active: 'bg-violet-50 border-violet-500 text-violet-700' },
  amber:   { badge: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-500',   active: 'bg-amber-50 border-amber-500 text-amber-700' },
  rose:    { badge: 'bg-rose-100 text-rose-700',      dot: 'bg-rose-500',    active: 'bg-rose-50 border-rose-500 text-rose-700' },
};

const quillModules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'link'],
    ['clean'],
  ],
};

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'blockquote', 'link',
];

const hasMeaningfulContent = (html) => {
  if (!html) return false;
  if (/<(img|iframe|video|table|blockquote)\b/i.test(html)) return true;
  const textOnly = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
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
  if (imagePath.startsWith('storage/')) return `/${imagePath}`;
  return `/storage/${imagePath}`;
};

const QuillEditor = ({ value, onChange, placeholder }) => {
  const wrapperRef = useRef(null);
  const quillRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!wrapperRef.current || quillRef.current) return;

    const wrapper = wrapperRef.current;
    wrapper.innerHTML = '';
    const editorElement = document.createElement('div');
    wrapper.appendChild(editorElement);

    const quill = new Quill(editorElement, {
      theme: 'snow',
      placeholder,
      modules: quillModules,
      formats: quillFormats,
    });

    quillRef.current = quill;
    quill.on('text-change', () => {
      onChangeRef.current(quill.root.innerHTML);
    });

    return () => {
      wrapper.innerHTML = '';
      quillRef.current = null;
    };
  }, [placeholder]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const nextValue = value || '';
    const currentValue = quill.root.innerHTML;
    if (currentValue === nextValue || (currentValue === '<p><br></p>' && nextValue === '')) return;

    if (!nextValue) {
      quill.setText('', 'silent');
      return;
    }

    quill.clipboard.dangerouslyPasteHTML(nextValue, 'silent');
  }, [value]);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white [&_.ql-editor]:min-h-[320px] [&_.ql-editor]:text-sm">
      <div ref={wrapperRef} />
    </div>
  );
};

const ContentManagement = () => {
  const [dbContents, setDbContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({ content_id: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [activeSection, setActiveSection] = useState('tentang');
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => { fetchContents(); }, []);

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
      if (data.success) setDbContents(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getContent = (pageId) => dbContents.find(p => p.page_id === pageId);
  const hasContent = (pageId) => {
    const c = getContent(pageId);
    return c && (c.content_id || '').trim().length > 0;
  };

  const filledCount = allPages.filter(p => hasContent(p.id)).length;

  const handleSelect = (pageId) => {
    setSelectedId(pageId);
    setSaveMsg(null);
    setRemoveImage(false);
    const c = getContent(pageId);
    if (c) {
      setFormData({ content_id: c.content_id || '' });
      setImagePreview(toPreviewUrl(c.image));
    } else {
      setFormData({ content_id: '' });
      setImagePreview(null);
    }
    setImageFile(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2048000) { alert('Ukuran gambar maksimal 2MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!selectedId) return;
    try {
      setSaving(true);
      setSaveMsg(null);
      const fd = new FormData();
      fd.append('page_id', selectedId);
      fd.append('content_id', formData.content_id);
      if (imageFile) fd.append('image', imageFile);
      if (removeImage && !imageFile) fd.append('remove_image', '1');

      const res = await fetch('/api/v1/admin/page-contents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
        body: fd,
      });
      const raw = await res.text();
      const rawTrimmed = raw.trim();
      const data = parseApiJson(raw);

      if (res.ok && data?.success) {
        setSaveMsg({ type: 'success', text: 'Konten berhasil disimpan!' });
        await fetchContents();
        setImageFile(null);
        setRemoveImage(false);
      } else {
        const isHtmlResponse = rawTrimmed.startsWith('<!DOCTYPE') || rawTrimmed.startsWith('<html');
        const hasSuccessPattern = /"success"\s*:\s*true/i.test(rawTrimmed);
        const firstError = data?.errors
          ? Object.values(data.errors).flat()?.[0]
          : null;
        if (res.ok && hasSuccessPattern) {
          setSaveMsg({ type: 'success', text: 'Konten berhasil disimpan!' });
          await fetchContents();
          setImageFile(null);
          setRemoveImage(false);
        } else {
          setSaveMsg({
            type: 'error',
            text: isHtmlResponse
              ? 'Sesi login tidak valid/expired. Silakan login ulang.'
              : (firstError || data?.message || `Gagal menyimpan konten (HTTP ${res.status})`),
          });
        }
      }
    } catch (e) {
      setSaveMsg({ type: 'error', text: 'Terjadi kesalahan, coba lagi' });
    } finally {
      setSaving(false);
    }
  };

  const selectedPage = allPages.find(p => p.id === selectedId);
  const selectedContent = selectedId ? getContent(selectedId) : null;
  const canSave = hasMeaningfulContent(formData.content_id) && !saving;

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 rounded-2xl p-7 text-white shadow-xl overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/5 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
                <FaLayerGroup className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Kelola Konten Halaman</h2>
                <p className="text-white/70 text-sm mt-0.5">Edit konten untuk setiap halaman website KAN</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-center px-5 py-3 bg-white/15 rounded-xl border border-white/20">
                <div className="text-2xl font-black">{filledCount}</div>
                <div className="text-white/70 text-xs font-semibold">Terisi</div>
              </div>
              <div className="text-center px-5 py-3 bg-white/15 rounded-xl border border-white/20">
                <div className="text-2xl font-black">{allPages.length - filledCount}</div>
                <div className="text-white/70 text-xs font-semibold">Kosong</div>
              </div>
              <div className="text-center px-5 py-3 bg-white/10 rounded-xl border border-white/20">
                <div className="text-2xl font-black">{allPages.length}</div>
                <div className="text-white/70 text-xs font-semibold">Total</div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex gap-6 items-start">

            {/* Sidebar */}
            <div className="w-72 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
              {/* Section Tabs */}
              <div className="p-3 border-b border-gray-100 space-y-1">
                {sections.map(s => {
                  const sectionFilled = s.pages.filter(p => hasContent(p.id)).length;
                  const isActive = activeSection === s.key;
                  const c = colorMap[s.color];
                  return (
                    <button
                      key={s.key}
                      onClick={() => setActiveSection(s.key)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                        isActive ? `${c.active} border-l-4 font-bold` : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'
                      }`}
                    >
                      <span className="text-sm truncate">{s.label}</span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        sectionFilled === s.pages.length ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {sectionFilled}/{s.pages.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Pages in Active Section */}
              <div className="p-2">
                {sections.find(s => s.key === activeSection)?.pages.map(page => {
                  const filled = hasContent(page.id);
                  const isSelected = selectedId === page.id;
                  return (
                    <button
                      key={page.id}
                      onClick={() => handleSelect(page.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all group mb-1 ${
                        isSelected
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {filled
                        ? <FaCheckCircle className={`flex-shrink-0 text-sm ${isSelected ? 'text-green-300' : 'text-emerald-500'}`} />
                        : <FaExclamationCircle className={`flex-shrink-0 text-sm ${isSelected ? 'text-yellow-300' : 'text-amber-400'}`} />
                      }
                      <span className="text-sm font-semibold truncate flex-1">{page.name}</span>
                      <FaChevronRight className={`flex-shrink-0 text-xs transition-transform ${
                        isSelected ? 'text-white/60' : 'text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5'
                      }`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editor Panel */}
            <div className="flex-1 min-w-0">
              {!selectedId ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <FaFileAlt className="text-gray-400 text-3xl" />
                  </div>
                  <h3 className="text-lg font-black text-gray-800 mb-2">Pilih Halaman</h3>
                  <p className="text-gray-500 text-sm max-w-xs">
                    Pilih salah satu halaman dari daftar di sebelah kiri untuk mulai mengedit kontennya.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

                  {/* Editor Header */}
                  <div className="px-7 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorMap[selectedPage?.color]?.badge}`}>
                            {selectedPage?.section}
                          </span>
                          {selectedContent?.updated_at && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <FaClock className="text-xs" />
                              {new Date(selectedContent.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-black text-gray-900">{selectedPage?.name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">/{selectedId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasContent(selectedId)
                          ? <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                              <FaCheckCircle /> Konten Tersedia
                            </span>
                          : <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                              <FaExclamationCircle /> Belum Ada Konten
                            </span>
                        }
                      </div>
                    </div>
                  </div>

                  {/* Editor Form */}
                  <div className="p-7 space-y-6">

                    {/* Save Message */}
                    {saveMsg && (
                      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${
                        saveMsg.type === 'success'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {saveMsg.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                        {saveMsg.text}
                      </div>
                    )}

                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">
                        Gambar Header <span className="text-gray-400 font-normal">(Opsional)</span>
                      </label>
                      {imagePreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-gray-200 group w-full max-w-lg">
                          <img src={imagePreview} alt="Preview" className="w-full h-44 object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => { setImageFile(null); setImagePreview(null); setRemoveImage(true); }}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700"
                            >
                              <FaTrash /> Hapus Gambar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full max-w-lg h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all group">
                          <FaImage className="text-3xl text-gray-300 group-hover:text-primary-400 mb-2 transition-colors" />
                          <span className="text-sm text-gray-500 font-semibold group-hover:text-primary-600">Klik untuk upload gambar</span>
                          <span className="text-xs text-gray-400 mt-1">JPG, PNG — Maks. 2MB</span>
                          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                      )}
                    </div>

                    {/* Content ID */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-bold text-gray-800">
                          Konten Bahasa Indonesia <span className="text-red-500">*</span>
                        </label>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md font-mono">HTML</span>
                      </div>
                      <QuillEditor
                        value={formData.content_id}
                        onChange={(value) => setFormData((prev) => ({ ...prev, content_id: value }))}
                        placeholder="Tulis konten bahasa Indonesia..."
                      />
                      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                        Mendukung tag HTML: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;a&gt;, dll.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                      <button
                        onClick={handleSave}
                        disabled={!canSave}
                        className="flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-bold hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaSave />
                        {saving ? 'Menyimpan...' : 'Simpan Konten'}
                      </button>
                      <button
                        onClick={() => { setSelectedId(null); setSaveMsg(null); }}
                        className="flex items-center gap-2 px-5 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all"
                      >
                        <FaTimes />
                        Tutup
                      </button>
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
