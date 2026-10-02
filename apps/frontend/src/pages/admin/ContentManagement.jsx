import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSave, FaTimes, FaImage, FaTrash,
  FaFileAlt, FaCheckCircle, FaExclamationCircle,
  FaChevronRight, FaLayerGroup, FaClock,
  FaQuestionCircle, FaArrowRight,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import WordImportPanel from '../../components/admin/content/WordImportPanel';
import DownloadFilesPanel from '../../components/admin/content/DownloadFilesPanel';
import TentangKanForm from '../../components/admin/content/TentangKanForm';
import LayananForm from '../../components/admin/content/LayananForm';
import { MAX_IMAGE_SIZE } from '../../constants/upload';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { resolveMediaUrl } from '../../utils/mediaUrl';

// ─── Constants ───────────────────────────────────────────────────────────────

const SECTION_COLORS = ['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan', 'orange', 'pink'];

const STRUCTURED_PAGE_IDS = ['tentang-kan', 'layanan'];

const STRUCTURED_DEFAULTS = {
  'tentang-kan': {
    hero_desc: 'Lembaga non-struktural yang bertanggung jawab langsung kepada Presiden Republik Indonesia dalam bidang akreditasi.',
    stat_1_value: '1997', stat_1_label: 'Tahun Berdiri',
    stat_2_value: '500+', stat_2_label: 'LPK Terakreditasi',
    stat_3_value: '10+',  stat_3_label: 'Pengakuan Internasional',
    stat_4_value: '25+',  stat_4_label: 'Tahun Pengalaman',
    vision: 'Menjadi lembaga akreditasi yang diakui secara internasional dan terpercaya dalam memberikan jaminan kompetensi lembaga penilaian kesesuaian.',
    missions: [
      'Memberikan layanan akreditasi yang berkualitas tinggi dan dapat dipertanggungjawabkan',
      'Meningkatkan kompetensi lembaga penilaian kesesuaian di Indonesia',
      'Memperluas pengakuan internasional melalui kerjasama bilateral dan multilateral',
      'Mendukung daya saing produk dan jasa Indonesia di pasar global',
    ],
    values: [
      { label: 'Integritas',      desc: 'Menjunjung tinggi kejujuran dan transparansi dalam setiap tindakan' },
      { label: 'Profesionalisme', desc: 'Berkomitmen pada standar kompetensi tertinggi' },
      { label: 'Kolaborasi',      desc: 'Bekerja sama untuk kemajuan akreditasi nasional' },
      { label: 'Internasional',   desc: 'Diakui dan dipercaya di tingkat global' },
    ],
  },
  'layanan': {
    hero_desc: 'KAN menyediakan berbagai layanan akreditasi untuk lembaga penilaian kesesuaian sesuai standar internasional ISO/IEC 17000 series.',
    card_1_title: 'Laboratorium',                          card_1_desc: 'Akreditasi untuk laboratorium pengujian dan kalibrasi sesuai ISO/IEC 17025.',
    card_2_title: 'Lembaga Inspeksi',                      card_2_desc: 'Akreditasi lembaga inspeksi berdasarkan ISO/IEC 17020.',
    card_3_title: 'Verifikasi & Validasi GRK',             card_3_desc: 'Akreditasi lembaga verifikasi dan validasi gas rumah kaca (ISO 14065).',
    card_4_title: 'Penyelenggara Uji Profisiensi',         card_4_desc: 'Akreditasi penyelenggara uji profisiensi sesuai ISO/IEC 17043.',
    card_5_title: 'Produsen Bahan Acuan',                  card_5_desc: 'Akreditasi produsen bahan acuan berdasarkan ISO 17034.',
    card_6_title: 'Sistem Manajemen',                      card_6_desc: 'Akreditasi lembaga sertifikasi sistem manajemen (ISO/IEC 17021).',
    card_7_title: 'Sertifikasi Person',                    card_7_desc: 'Akreditasi lembaga sertifikasi personel sesuai ISO/IEC 17024.',
    card_8_title: 'Sertifikasi Produk (SNI ISO/IEC 17065)',card_8_desc: 'Akreditasi lembaga sertifikasi produk berdasarkan ISO/IEC 17065.',
    card_9_title: 'Sertifikasi Pembangunan Berkelanjutan', card_9_desc: 'Akreditasi lembaga sertifikasi untuk skema pembangunan berkelanjutan.',
    step_1_title: 'Pengajuan',  step_1_desc: 'Mengisi formulir permohonan dan melengkapi dokumen persyaratan akreditasi.',
    step_2_title: 'Evaluasi',   step_2_desc: 'Tinjauan dokumen dan asesmen lapangan oleh asesor KAN yang kompeten.',
    step_3_title: 'Keputusan',  step_3_desc: 'Komite akreditasi melakukan kajian dan membuat keputusan akreditasi.',
    step_4_title: 'Sertifikat', step_4_desc: 'Penerbitan sertifikat akreditasi beserta lampiran ruang lingkup.',
    benefit_1: 'Pengakuan Internasional', benefit_2: 'Meningkatkan Kredibilitas',
    benefit_3: 'Akses Pasar Global',      benefit_4: 'Peningkatan Kompetensi',
    benefit_5: 'Jaminan Kualitas',        benefit_6: 'Kepercayaan Stakeholder',
    cta_title: 'Siap Mendapatkan Akreditasi?',
    cta_desc:  'Hubungi kami untuk informasi lebih lanjut tentang proses dan persyaratan akreditasi.',
  },
};

const colorMap = {
  blue:    { badge: 'bg-blue-100 text-blue-700',    active: 'bg-blue-50 border-blue-500 text-blue-700' },
  emerald: { badge: 'bg-emerald-100 text-emerald-700', active: 'bg-emerald-50 border-emerald-500 text-emerald-700' },
  violet:  { badge: 'bg-violet-100 text-violet-700',  active: 'bg-violet-50 border-violet-500 text-violet-700' },
  amber:   { badge: 'bg-amber-100 text-amber-700',    active: 'bg-amber-50 border-amber-500 text-amber-700' },
  rose:    { badge: 'bg-rose-100 text-rose-700',      active: 'bg-rose-50 border-rose-500 text-rose-700' },
  cyan:    { badge: 'bg-cyan-100 text-cyan-700',      active: 'bg-cyan-50 border-cyan-500 text-cyan-700' },
  orange:  { badge: 'bg-orange-100 text-orange-700',  active: 'bg-orange-50 border-orange-500 text-orange-700' },
  pink:    { badge: 'bg-pink-100 text-pink-700',      active: 'bg-pink-50 border-pink-500 text-pink-700' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hasMeaningfulContent = (html) => {
  if (!html) return false;
  if (/<(img|iframe|video|table|blockquote)\b/i.test(html)) return true;
  const textOnly = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  return textOnly.length > 0;
};

const toPreviewUrl = (imagePath) => {
  return resolveMediaUrl(imagePath);
};

// ─── Component ────────────────────────────────────────────────────────────────

const ContentManagement = () => {
  const navigate = useNavigate();

  // Page structure
  const [sections, setSections]       = useState([]);
  const [allPages, setAllPages]       = useState([]);
  const [activeSection, setActiveSection] = useState(null);

  // Content data
  const [dbContents, setDbContents]   = useState([]);
  const [loading, setLoading]         = useState(true);

  // Editor state
  const [selectedId, setSelectedId]   = useState(null);
  const [formData, setFormData]       = useState({ content_id: '' });
  const [structuredData, setStructuredData] = useState({});
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  // Save state
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState(null);

  // Download files state
  const [downloadFiles, setDownloadFiles] = useState([]);

  useEffect(() => {
    fetchMenuSections();
    fetchContents();
  }, []);

  // ─── API calls ──────────────────────────────────────────────────────────────

  const fetchMenuSections = async () => {
    try {
      const res = await api.get('/menus?location=header');
      const data = res.data;
      if (data.success && Array.isArray(data.data)) {
        const built = data.data.map((menu, idx) => ({
          key: menu.url || menu.title_id,
          label: menu.title_id,
          color: SECTION_COLORS[idx % SECTION_COLORS.length],
          pages: (menu.children || []).map(child => ({
            id: child.url?.replace(/^\//, '') || child.title_id,
            name: child.title_id,
          })),
        })).filter(s => s.pages.length > 0);

        setSections(built);
        const ap = built.flatMap(s =>
          s.pages.map(p => ({ ...p, section: s.label, sectionKey: s.key, color: s.color }))
        );
        setAllPages(ap);
        if (built.length > 0) setActiveSection(built[0].key);
      }
    } catch (err) {
      console.error('fetchMenuSections error:', err);
    }
  };

  const fetchContents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/page-contents');
      if (res.data.success) setDbContents(res.data.data);
    } catch (err) {
      console.error('ContentManagement fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDownloadFiles = async (pageId) => {
    try {
      const res = await api.get(`/admin/download-files?page_id=${encodeURIComponent(pageId)}`);
      if (res.data.success) setDownloadFiles(res.data.data);
    } catch (err) {
      console.error('fetchDownloadFiles error:', err);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const getContent = (pageId) => dbContents.find(p => p.page_id === pageId);
  const hasContent = (pageId) => {
    const c = getContent(pageId);
    return c && (c.content_id || '').trim().length > 0;
  };

  const filledCount = allPages.filter(p => hasContent(p.id)).length;

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSelect = (pageId) => {
    setSelectedId(pageId);
    setSaveMsg(null);
    setRemoveImage(false);
    setDownloadFiles([]);

    const c = getContent(pageId);
    if (STRUCTURED_PAGE_IDS.includes(pageId)) {
      const defaults = STRUCTURED_DEFAULTS[pageId] || {};
      if (c && c.content_id) {
        try {
          const parsed = JSON.parse(c.content_id);
          setStructuredData({ ...defaults, ...parsed });
        } catch {
          setStructuredData({ ...defaults });
        }
      } else {
        setStructuredData({ ...defaults });
      }
      setFormData({ content_id: '' });
      setImagePreview(null);
    } else {
      setFormData({ content_id: c ? (c.content_id || '') : '' });
      setImagePreview(c ? toPreviewUrl(c.image) : null);
    }

    setImageFile(null);
    if (pageId?.startsWith('unduh/')) fetchDownloadFiles(pageId);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) { toast.error('Ukuran gambar maksimal 2MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!selectedId) return;
    try {
      setSaving(true);
      setSaveMsg(null);
      const isStructured = STRUCTURED_PAGE_IDS.includes(selectedId);
      const fd = new FormData();
      fd.append('page_id', selectedId);
      fd.append('content_id', isStructured ? JSON.stringify(structuredData) : formData.content_id);
      if (imageFile) fd.append('image', imageFile);
      if (removeImage && !imageFile) fd.append('remove_image', '1');

      const res = await api.post('/admin/page-contents', fd);
      const data = res.data;

      if (data?.success) {
        setSaveMsg({ type: 'success', text: 'Konten berhasil disimpan!' });
        await fetchContents();
        setImageFile(null);
        setRemoveImage(false);
      } else {
        const firstError = data?.errors ? Object.values(data.errors).flat()?.[0] : null;
        setSaveMsg({ type: 'error', text: firstError || data?.message || 'Gagal menyimpan konten' });
      }
    } catch (err) {
      const responseError = err?.response?.data;
      const firstValidationError = responseError?.errors
        ? Object.values(responseError.errors).flat()?.[0]
        : null;
      setSaveMsg({
        type: 'error',
        text: firstValidationError || responseError?.message || 'Terjadi kesalahan, coba lagi',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStructuredChange = (key, value) => {
    setStructuredData(prev => ({ ...prev, [key]: value }));
  };

  const handleArrayItemChange = (arrayKey, index, field, value) => {
    setStructuredData(prev => {
      const arr = [...(prev[arrayKey] || [])];
      arr[index] = field === null ? value : { ...arr[index], [field]: value };
      return { ...prev, [arrayKey]: arr };
    });
  };

  const handleAddArrayItem = (arrayKey, defaultItem) => {
    setStructuredData(prev => ({
      ...prev,
      [arrayKey]: [...(prev[arrayKey] || []), defaultItem],
    }));
  };

  const handleRemoveArrayItem = (arrayKey, index) => {
    setStructuredData(prev => ({
      ...prev,
      [arrayKey]: (prev[arrayKey] || []).filter((_, i) => i !== index),
    }));
  };

  // ─── Derived state ──────────────────────────────────────────────────────────

  const selectedPage    = allPages.find(p => p.id === selectedId);
  const selectedContent = selectedId ? getContent(selectedId) : null;
  const isStructuredPage = STRUCTURED_PAGE_IDS.includes(selectedId);
  const isUnduhPage     = selectedId?.startsWith('unduh/');
  const canSave         = (isStructuredPage || hasMeaningfulContent(formData.content_id)) && !saving;

  // ─── Render ─────────────────────────────────────────────────────────────────

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
              <div className="px-4 pt-4 pb-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Kategori</p>
              </div>
              <div className="px-3 pb-3 border-b border-gray-100 space-y-1">
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

              <div className="px-4 pt-3 pb-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Halaman —{' '}
                  <span className="normal-case font-semibold text-gray-500">
                    {sections.find(s => s.key === activeSection)?.label}
                  </span>
                </p>
              </div>
              <div className="px-2 pb-2">
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

                  {/* FAQ redirect — managed separately */}
                  {selectedId === 'faq' ? (
                    <div className="p-8 flex flex-col items-center justify-center text-center gap-5">
                      <div className="w-20 h-20 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
                        <FaQuestionCircle className="text-4xl text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-gray-800 mb-1">Halaman FAQ Dikelola Secara Terpisah</h4>
                        <p className="text-sm text-gray-500 max-w-xs">
                          Konten halaman FAQ (daftar pertanyaan &amp; jawaban) dikelola melalui menu{' '}
                          <span className="font-bold text-amber-600">Kelola FAQ</span>, bukan di sini.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/admin/faqs')}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-white text-sm font-bold shadow-md hover:from-amber-600 hover:to-yellow-500 transition-all"
                      >
                        Pergi ke Kelola FAQ
                        <FaArrowRight className="text-xs" />
                      </button>
                    </div>
                  ) : (
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

                      {/* Structured form — tentang-kan */}
                      {isStructuredPage && selectedId === 'tentang-kan' && (
                        <TentangKanForm
                          data={structuredData}
                          onChange={handleStructuredChange}
                          onArrayChange={handleArrayItemChange}
                          onAddItem={handleAddArrayItem}
                          onRemoveItem={handleRemoveArrayItem}
                        />
                      )}

                      {/* Structured form — layanan */}
                      {isStructuredPage && selectedId === 'layanan' && (
                        <LayananForm
                          data={structuredData}
                          onChange={handleStructuredChange}
                        />
                      )}

                      {/* Image Upload — halaman non-structured */}
                      {!isStructuredPage && (
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
                      )}

                      {/* Rich text editor + Word import — halaman non-structured */}
                      {!isStructuredPage && (
                        <WordImportPanel
                          value={formData.content_id}
                          onChange={(value) => setFormData(prev => ({ ...prev, content_id: value }))}
                          onError={(msg) => setSaveMsg({ type: 'error', text: msg })}
                        />
                      )}

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

                      {/* Download Files — unduh pages */}
                      {isUnduhPage && (
                        <DownloadFilesPanel
                          pageId={selectedId}
                          files={downloadFiles}
                          onFilesChange={() => fetchDownloadFiles(selectedId)}
                        />
                      )}

                    </div>
                  )}
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
