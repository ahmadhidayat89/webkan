import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import RichTextInput from '../../components/admin/RichTextInput';
import RichText, { stripHtml } from '../../components/RichText';
import {
  getAdminSurveys,
  getAdminSurvey,
  createAdminSurvey,
  updateAdminSurvey,
  deleteAdminSurvey,
  publishAdminSurvey,
  toggleActiveAdminSurvey,
  exportAdminSurveyCsv,
  uploadSurveyImage,
} from '../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import QRCode from 'qrcode';
import { FaCopy, FaDownload, FaPlus, FaTrash, FaClone, FaArrowLeft, FaCheck, FaClipboardList } from 'react-icons/fa';

const QUESTION_TYPES = {
  short: 'Jawaban singkat',
  para: 'Paragraf',
  file: 'Unggah file',
  choice: 'Pilihan ganda',
  check: 'Kotak centang',
  drop: 'Dropdown',
  scale: 'Skala 1–5',
};

const hasOptions = (type) => ['choice', 'check', 'drop'].includes(type);

// Preset label untuk tipe skala 1–5
const SCALE_PRESETS = {
  kualitas: { name: 'Kualitas', labels: ['Sangat Tidak Baik', 'Tidak Baik', 'Cukup', 'Baik', 'Sangat Baik'] },
  kepuasan: { name: 'Kepuasan', labels: ['Sangat Tidak Puas', 'Tidak Puas', 'Netral', 'Puas', 'Sangat Puas'] },
  setuju: { name: 'Kesetujuan', labels: ['Sangat Tidak Setuju', 'Tidak Setuju', 'Netral', 'Setuju', 'Sangat Setuju'] },
  frekuensi: { name: 'Frekuensi', labels: ['Tidak Pernah', 'Jarang', 'Kadang-kadang', 'Sering', 'Selalu'] },
};

const normalizeScale = (opts) =>
  Array.isArray(opts) && opts.length === 5 && opts.some(Boolean)
    ? opts
    : [...SCALE_PRESETS.kualitas.labels];

const detectScalePreset = (opts = []) => {
  const found = Object.entries(SCALE_PRESETS).find(
    ([, p]) => p.labels.every((l, i) => l === opts[i])
  );
  return found ? found[0] : 'custom';
};

// Kunci unik di sisi frontend supaya editor tidak tertukar saat duplikat/hapus
let keySeed = 0;
const uid = () => `k${Date.now()}_${keySeed++}`;
const blankQuestion = () => ({ _key: uid(), type: 'short', text: '', req: false, opts: [], image_url: '', validation: {} });

const mapSurveyQuestions = (surveyQuestions = []) => surveyQuestions.length > 0
  ? surveyQuestions.map((q) => ({
      _key: uid(),
      id: q.id,
      type: ['email', 'phone'].includes(q.type) ? 'short' : q.type,
      text: q.text,
      image_url: q.image_url || '',
      validation: { ...(q.validation || {}), ...(['email', 'phone'].includes(q.type) ? { answer_type: q.type } : {}) },
      req: Boolean(q.is_required),
      opts: q.type === 'scale'
        ? normalizeScale(q.options)
        : q.options || (hasOptions(q.type) ? ['Opsi 1'] : []),
    }))
  : [blankQuestion()];

const isPreviewAnswerMissing = (answer) => answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0);

function validatePreviewFormat(answerType, answer) {
  const value = String(answer);
  if (answerType === 'email') {
    const at = value.indexOf('@');
    const domain = value.slice(at + 1);
    const dot = domain.lastIndexOf('.');
    return at > 0 && at === value.lastIndexOf('@') && !/\s/.test(value) && dot > 0 && dot < domain.length - 1
      ? null : 'Masukkan alamat email yang valid.';
  }
  if (answerType === 'phone') {
    const digits = value.replace(/\D/g, '');
    return /^\+?[0-9() .-]{7,20}$/.test(value) && digits.length >= 7 && digits.length <= 15
      ? null : 'Masukkan nomor telepon yang valid (7–15 digit).';
  }
  if (answerType === 'number') return /^-?\d+(?:[.,]\d+)?$/.test(value) ? null : 'Masukkan angka yang valid.';
  if (answerType === 'text_number') return /^[\p{L}\p{N}\s.,'-]+$/u.test(value) ? null : 'Gunakan huruf dan angka saja.';
  return null;
}

function validatePreviewLength(question, answer) {
  if (!['short', 'para'].includes(question.type)) return null;
  const length = String(answer).trim().length;
  if (question.validation?.min_length != null && length < question.validation.min_length) return `Jawaban minimal ${question.validation.min_length} karakter.`;
  if (question.validation?.max_length != null && length > question.validation.max_length) return `Jawaban maksimal ${question.validation.max_length} karakter.`;
  return null;
}

function validatePreviewSelections(question, answer) {
  if (question.type !== 'check') return null;
  if (question.validation?.min_selections != null && answer.length < question.validation.min_selections) return `Pilih minimal ${question.validation.min_selections} opsi.`;
  if (question.validation?.max_selections != null && answer.length > question.validation.max_selections) return `Pilih maksimal ${question.validation.max_selections} opsi.`;
  return null;
}

function validatePreviewQuestion(question, answer) {
  if (isPreviewAnswerMissing(answer)) return question.req ? 'Pertanyaan ini wajib diisi.' : null;
  const answerType = question.type === 'short' ? (question.validation?.answer_type || 'text') : question.type;
  return validatePreviewFormat(answerType, answer)
    || validatePreviewLength(question, answer)
    || validatePreviewSelections(question, answer);
}

export default function SurveyManagement() {
  const [surveys, setSurveys] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, responses: 0 });
  const [loading, setLoading] = useState(true);

  // View state: 'list' or 'detail'
  const [view, setView] = useState('list');
  // Sub-tabs in detail: 'edit' | 'pv' | 'share' | 'res'
  const [mode, setMode] = useState('edit');

  // Currently selected / edited survey
  const [currentSurvey, setCurrentSurvey] = useState(null);
  const [detailData, setDetailData] = useState(null); // Full data when viewing results
  const [detailLoading, setDetailLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [questions, setQuestions] = useState([]);
  const [selectedQIndex, setSelectedQIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Preview form state
  const [previewAnswers, setPreviewAnswers] = useState({});
  const [previewErrors, setPreviewErrors] = useState({});
  const [previewDone, setPreviewDone] = useState(false);

  // Results table show all state
  const [showAllResponses, setShowAllResponses] = useState(false);

  // QR canvas ref
  const qrCanvasRef = useRef(null);

  // Fetch surveys list
  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const res = await getAdminSurveys();
      if (res.data?.success) {
        setSurveys(res.data.data || []);
        setStats(res.data.stats || { total: 0, active: 0, responses: 0 });
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat daftar kuesioner.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  // Fetch full details of a survey (especially for results)
  const fetchSurveyDetail = async (id) => {
    try {
      setDetailLoading(true);
      const res = await getAdminSurvey(id);
      if (res.data?.success) {
        setDetailData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat detail kuesioner.');
    } finally {
      setDetailLoading(false);
    }
  };

  // Switch to detail view
  const openSurvey = (survey, targetMode = 'edit') => {
    setCurrentSurvey(survey);
    setTitle(survey.title || '');
    setDesc(survey.description || '');

    setQuestions(mapSurveyQuestions(survey.questions));
    setSelectedQIndex(0);
    setMode(targetMode);
    setView('detail');
    setPreviewDone(false);
    setPreviewAnswers({});
    setPreviewErrors({});
    setShowAllResponses(false);

    if (survey.id) {
      fetchSurveyDetail(survey.id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Create new survey
  const handleAddNew = () => {
    const newSurvey = {
      id: null,
      code: '',
      title: '',
      description: '',
      is_published: false,
      is_active: true,
      questions: [],
      responses_count: 0,
    };
    openSurvey(newSurvey, 'edit');
  };

  // Back to list
  const handleBackToList = () => {
    setView('list');
    setCurrentSurvey(null);
    setDetailData(null);
    setDeleteConfirmId(null);
    fetchSurveys();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save / Update Survey
  const handleSaveSurvey = async () => {
    if (!title.trim()) {
      toast.error('Judul kuesioner wajib diisi.');
      return;
    }
    const invalidRule = questions.some((q) => {
      const v = q.validation || {};
      return (v.min_length != null && v.max_length != null && v.min_length > v.max_length)
        || (v.min_selections != null && v.max_selections != null && v.min_selections > v.max_selections)
      || (v.max_selections != null && v.max_selections > q.opts.length);
    });
    if (invalidRule) {
      toast.error('Rentang validasi tidak sesuai. Periksa batas minimum dan maksimum.');
      return;
    }

    setSaving(true);
    const payload = {
      title,
      description: desc,
      is_published: currentSurvey?.is_published ?? false,
      is_active: currentSurvey?.is_active ?? true,
      questions: questions.map((q, idx) => ({
        id: q.id,
        order: idx + 1,
        text: stripHtml(q.text).trim() ? q.text : `Pertanyaan ${idx + 1}`,
        type: q.type,
        is_required: q.req,
        options: hasOptions(q.type) || q.type === 'scale' ? q.opts : [],
        image_url: q.image_url || null,
        validation: q.validation || {},
      })),
    };

    try {
      if (currentSurvey?.id) {
        const res = await updateAdminSurvey(currentSurvey.id, payload);
        if (res.data?.success) {
          toast.success('Kuesioner berhasil diperbarui.');
          setCurrentSurvey(res.data.data);
          setQuestions(mapSurveyQuestions(res.data.data.questions));
          fetchSurveyDetail(currentSurvey.id);
        }
      } else {
        const res = await createAdminSurvey(payload);
        if (res.data?.success) {
          toast.success('Kuesioner berhasil dibuat.');
          setCurrentSurvey(res.data.data);
          setQuestions(mapSurveyQuestions(res.data.data.questions));
          fetchSurveyDetail(res.data.data.id);
        }
      }
    } catch (err) {
      console.error(err);
      const validationMessage = Object.values(err.response?.data?.errors || {}).flat()[0];
      toast.error(validationMessage || err.response?.data?.message || 'Gagal menyimpan kuesioner. Periksa koneksi dan konfigurasi server.');
    } finally {
      setSaving(false);
    }
  };

  // Publish
  const handlePublish = async (surveyId) => {
    try {
      const res = await publishAdminSurvey(surveyId);
      if (res.data?.success) {
        toast.success('Kuesioner berhasil diterbitkan!');
        if (currentSurvey?.id === surveyId) {
          setCurrentSurvey((prev) => ({ ...prev, is_published: true, is_active: true, code: res.data.data.code }));
        }
        fetchSurveys();
        if (currentSurvey?.id) fetchSurveyDetail(currentSurvey.id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menerbitkan kuesioner.');
    }
  };

  // Toggle active/closed
  const handleToggleActive = async (surveyId) => {
    try {
      const res = await toggleActiveAdminSurvey(surveyId);
      if (res.data?.success) {
        toast.success(res.data.message);
        if (currentSurvey?.id === surveyId) {
          setCurrentSurvey((prev) => ({ ...prev, is_active: !prev.is_active }));
        }
        fetchSurveys();
        if (currentSurvey?.id) fetchSurveyDetail(currentSurvey.id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengubah status kuesioner.');
    }
  };

  // Delete survey
  const handleDelete = async (surveyId) => {
    try {
      const res = await deleteAdminSurvey(surveyId);
      if (res.data?.success) {
        toast.success('Kuesioner berhasil dihapus.');
        setDeleteConfirmId(null);
        if (currentSurvey?.id === surveyId) {
          handleBackToList();
        } else {
          fetchSurveys();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus kuesioner.');
    }
  };

  // Question manipulation
  const addQuestion = () => {
    const newQ = blankQuestion();
    setQuestions([...questions, newQ]);
    setSelectedQIndex(questions.length);
  };

  const duplicateQuestion = (idx) => {
    const copy = { ...JSON.parse(JSON.stringify(questions[idx])), _key: uid() };
    delete copy.id; // salinan harus dianggap pertanyaan baru oleh backend
    const next = [...questions];
    next.splice(idx + 1, 0, copy);
    setQuestions(next);
    setSelectedQIndex(idx + 1);
  };

  const removeQuestion = (idx) => {
    if (questions.length <= 1) {
      toast.error('Kuesioner harus memiliki minimal 1 pertanyaan.');
      return;
    }
    const next = questions.filter((_, i) => i !== idx);
    setQuestions(next);
    setSelectedQIndex(Math.max(0, idx - 1));
  };

  const changeQuestionType = (idx, newType) => {
    const next = [...questions];
    const oldType = next[idx].type;
    next[idx] = { ...next[idx], type: newType };

    if (newType === 'scale') {
      next[idx].opts = oldType === 'scale' ? next[idx].opts : [...SCALE_PRESETS.kualitas.labels];
    } else if (hasOptions(newType)) {
      const keep = oldType !== 'scale' && next[idx].opts && next[idx].opts.length > 0;
      next[idx].opts = keep ? next[idx].opts : ['Opsi 1'];
    } else {
      next[idx].opts = [];
    }
    setQuestions(next);
  };

  const applyScalePreset = (qIdx, key) => {
    if (!SCALE_PRESETS[key]) return;
    setQuestions((prev) =>
      prev.map((it, i) => (i === qIdx ? { ...it, opts: [...SCALE_PRESETS[key].labels] } : it))
    );
  };

  const updateScaleLabel = (qIdx, labelIdx, val) => {
    setQuestions((prev) =>
      prev.map((it, i) => {
        if (i !== qIdx) return it;
        const opts = Array.from({ length: 5 }, (_, k) => it.opts?.[k] ?? '');
        opts[labelIdx] = val;
        return { ...it, opts };
      })
    );
  };

  const addOption = (qIdx) => {
    const next = [...questions];
    const opts = next[qIdx].opts || [];
    opts.push(`Opsi ${opts.length + 1}`);
    next[qIdx].opts = opts;
    setQuestions(next);
  };

  const updateOption = (qIdx, optIdx, val) => {
    const next = [...questions];
    next[qIdx].opts[optIdx] = val;
    setQuestions(next);
  };

  const removeOption = (qIdx, optIdx) => {
    const next = [...questions];
    if (next[qIdx].opts.length <= 1) return;
    next[qIdx].opts.splice(optIdx, 1);
    setQuestions(next);
  };

  // Generate public link
  const getPublicLink = () => {
    const code = currentSurvey?.code || '';
    if (!code) return '';
    return `${window.location.origin}/survei/${code}`;
  };

  // Draw QR code onto canvas (hitam polos, tanpa logo)
  useEffect(() => {
    if (mode === 'share' && currentSurvey?.is_published && currentSurvey?.code && qrCanvasRef.current) {
      const link = getPublicLink();
      QRCode.toCanvas(
        qrCanvasRef.current,
        link,
        {
          width: 500,
          margin: 3,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        },
        (error) => {
          if (error) {
            console.error('QR code generation error:', error);
          }
        }
      );
    }
  }, [mode, currentSurvey]);

  // Copy link to clipboard
  const handleCopyLink = () => {
    const link = getPublicLink();
    if (!link) return;
    navigator.clipboard.writeText(link).then(
      () => toast.success('Tautan berhasil disalin ke clipboard!'),
      () => toast.error('Gagal menyalin tautan.')
    );
  };

  // Download QR code PNG
  const handleDownloadQR = () => {
    if (!qrCanvasRef.current) return;
    const canvas = qrCanvasRef.current;
    const image = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = image;
    a.download = `qr-kuesioner-${currentSurvey?.code || 'kan'}.png`;
    a.click();
    toast.success('Kode QR berhasil diunduh.');
  };

  // Download CSV
  const handleDownloadCsv = async () => {
    if (!currentSurvey?.id) return;
    try {
      const res = await exportAdminSurveyCsv(currentSurvey.id);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hasil-kuesioner-${currentSurvey.code || currentSurvey.id}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('File CSV berhasil diunduh.');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunduh CSV.');
    }
  };

  // Preview Form Submission
  const handlePreviewSubmit = (e) => {
    e.preventDefault();
    const errs = questions.reduce((errors, question, index) => {
      const error = validatePreviewQuestion(question, previewAnswers[index]);
      if (error) errors[index] = error;
      return errors;
    }, {});

    if (Object.keys(errs).length > 0) {
      setPreviewErrors(errs);
      toast.error('Mohon lengkapi pertanyaan yang wajib diisi.');
    } else {
      setPreviewErrors({});
      setPreviewDone(true);
      toast.success('Jawaban pratinjau berhasil divalidasi!');
    }
  };

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="space-y-6">

        {/* ─── BANNER HEADER ──────────────────────────────────────────────── */}
        <section className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <FaClipboardList className="text-2xl text-white" />
            </div>
            <div>
              {view === 'detail' && (
                <button
                  onClick={handleBackToList}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-200 hover:text-white transition-colors mb-1"
                >
                  <FaArrowLeft className="text-xs" /> Daftar kuesioner
                </button>
              )}
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {view === 'list' ? 'Kelola Kuesioner' : (title || 'Kuesioner tanpa judul')}
              </h1>
              {view === 'list' ? (
                <p className="text-blue-100 text-sm mt-1 max-w-xl">Buat kuesioner, bagikan lewat kode QR, dan lihat hasilnya secara instan.</p>
              ) : desc ? (
                <RichText html={desc} block className="text-blue-100 text-sm mt-1 max-w-xl" />
              ) : (
                <p className="text-blue-100 text-sm mt-1 max-w-xl">Tanpa deskripsi singkat.</p>
              )}
            </div>
          </div>

          {view === 'list' ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-center min-w-[72px]">
                <span className="block text-xl font-bold">{stats.active}</span>
                <span className="text-[11px] text-blue-200 font-medium">Aktif</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-center min-w-[72px]">
                <span className="block text-xl font-bold">{stats.total}</span>
                <span className="text-[11px] text-blue-200 font-medium">Total</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-center min-w-[72px]">
                <span className="block text-xl font-bold">{stats.responses}</span>
                <span className="text-[11px] text-blue-200 font-medium">Responden</span>
              </div>
              <button
                onClick={handleAddNew}
                className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-5 py-2.5 rounded-xl transition-all shadow hover:shadow-md flex items-center gap-2 text-sm"
              >
                <FaPlus /> Tambah Kuesioner
              </button>
            </div>
          ) : (
            <nav className="flex items-center bg-white/15 p-1 rounded-full backdrop-blur-sm">
              {[
                { key: 'edit', label: 'Susun' },
                { key: 'pv', label: 'Pratinjau' },
                { key: 'share', label: 'Bagikan' },
                { key: 'res', label: 'Hasil' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setMode(tab.key);
                    if (tab.key === 'res' && currentSurvey?.id) {
                      fetchSurveyDetail(currentSurvey.id);
                    }
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all ${
                    mode === tab.key
                      ? 'bg-white text-blue-800 shadow'
                      : 'text-white hover:text-blue-100 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          )}
        </section>

        {/* ─── LIST VIEW ──────────────────────────────────────────────────── */}
        {view === 'list' && (
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                Memuat daftar kuesioner...
              </div>
            ) : surveys.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-1">Belum ada kuesioner</h3>
                <p className="text-sm text-gray-500 mb-4">Tekan tombol Tambah Kuesioner untuk membuat kuesioner pertama Anda.</p>
                <button
                  onClick={handleAddNew}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition"
                >
                  + Tambah Kuesioner
                </button>
              </div>
            ) : (
              surveys.map((item, idx) => {
                const statusLabel = !item.is_published ? 'Draf' : item.is_active ? 'Aktif' : 'Ditutup';
                const statusBadgeClass = !item.is_published
                  ? 'bg-gray-100 text-gray-700 border-gray-200'
                  : item.is_active
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200';

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-50 text-blue-700 font-bold text-xs px-2.5 py-1 rounded-lg">
                          #{idx + 1}
                        </span>
                        <h2 className="text-lg font-bold text-gray-900">{item.title || 'Kuesioner tanpa judul'}</h2>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusBadgeClass}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium">
                      <span>{item.questions_count ?? item.questions?.length ?? 0} pertanyaan</span>
                      <span>•</span>
                      <span>{item.responses_count ?? 0} responden</span>
                      {item.is_published && item.code && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-blue-600">
                            kan.go.id/survei/{item.code}
                          </span>
                        </>
                      )}
                    </div>

                    {item.description
                      ? <RichText html={item.description} block className="text-sm text-gray-600" />
                      : <p className="text-sm text-gray-400">Belum ada deskripsi singkat.</p>}

                    <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
                      {item.is_published ? (
                        <>
                          <button
                            onClick={() => openSurvey(item, 'res')}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                          >
                            Lihat Hasil
                          </button>
                          <button
                            onClick={() => openSurvey(item, 'share')}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                          >
                            Bagikan QR
                          </button>
                          <button
                            onClick={() => handleToggleActive(item.id)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                              item.is_active
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handlePublish(item.id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                        >
                          Terbitkan
                        </button>
                      )}

                      <button
                        onClick={() => openSurvey(item, 'edit')}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                      >
                        Edit
                      </button>

                      {deleteConfirmId === item.id ? (
                        <div className="flex items-center gap-2 ml-auto">
                          <span className="text-xs text-rose-600 font-semibold">Yakin hapus?</span>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-xs font-bold px-2.5 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 transition"
                          >
                            Ya, hapus
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-xs font-bold px-2.5 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition ml-auto"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ─── TAB: SUSUN (EDIT) ───────────────────────────────────────────── */}
        {view === 'detail' && mode === 'edit' && (
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Judul & Deskripsi Kuesioner Card */}
            <div className="bg-white rounded-2xl border-2 border-blue-600 shadow-sm p-6 space-y-4">
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Judul kuesioner"
                  className="w-full text-2xl font-extrabold text-gray-900 border-0 border-b-2 border-gray-200 focus:border-blue-600 outline-none pb-2 transition placeholder-gray-400"
                />
              </div>
              <div>
                <RichTextInput
                  key={`description-${currentSurvey?.id || 'new'}`}
                  value={desc}
                  onChange={setDesc}
                  placeholder="Deskripsi singkat mengenai tujuan kuesioner..."
                />
              </div>
            </div>

            {/* List Pertanyaan */}
            {questions.map((q, qIdx) => {
              const isSelected = selectedQIndex === qIdx;
              return (
                <div
                  key={q._key}
                  className={`bg-white rounded-2xl border transition-all p-5 shadow-sm space-y-4 ${
                    isSelected
                      ? 'border-l-4 border-l-blue-600 border-gray-300 shadow-md ring-1 ring-blue-100'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                    <div className="flex-1 w-full">
                      <button type="button" onClick={() => setSelectedQIndex(qIdx)} className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Pertanyaan {qIdx + 1}
                      </button>

                      {isSelected ? (
                        <RichTextInput
                          key={q._key}
                          value={q.text}
                          autoFocus
                          onChange={(html) => {
                            setQuestions((prev) =>
                              prev.map((it, i) => (i === qIdx ? { ...it, text: html } : it))
                            );
                          }}
                        />
                      ) : (
                        <div className="w-full text-base font-bold text-gray-900 border-b-2 border-gray-200 pb-1.5 min-h-[32px]">
                          {stripHtml(q.text)
                            ? <RichText html={q.text} />
                            : <span className="text-gray-400">Tulis pertanyaan</span>}
                        </div>
                      )}
                    </div>
                    <div className="w-full sm:w-48 flex-shrink-0">
                      <select
                        value={q.type}
                        onChange={(e) => changeQuestionType(qIdx, e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:border-blue-600 outline-none"
                      >
                        {Object.entries(QUESTION_TYPES).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Body sesuai tipe pertanyaan */}
                  <div className="pt-2">
                    {isSelected && (
                      <div className="mb-4 space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                        <label className="block text-xs font-bold text-gray-600">Unggah gambar pertanyaan (maks. 5 MB)
                          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const result = await uploadSurveyImage(file);
                              const url = result.data?.data?.url;
                              setQuestions((prev) => prev.map((it, i) => i === qIdx ? { ...it, image_url: url } : it));
                              toast.success('Gambar berhasil diunggah.');
                            } catch (error) {
                              toast.error(error.response?.data?.message || 'Gagal mengunggah gambar.');
                            }
                            e.target.value = '';
                          }} className="mt-2 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal" />
                        </label>
                        {q.image_url && <div className="flex items-start gap-3"><img src={q.image_url} alt="Pratinjau gambar pertanyaan" className="max-h-48 rounded-lg object-contain" /><button type="button" onClick={() => setQuestions((prev) => prev.map((it, i) => i === qIdx ? { ...it, image_url: '' } : it))} className="text-xs font-semibold text-rose-600">Hapus gambar</button></div>}
                        {q.type === 'short' && <label className="block text-xs font-bold text-gray-600">Validasi jawaban
                          <select value={q.validation?.answer_type || 'text'} onChange={(e) => setQuestions((prev) => prev.map((it, i) => i === qIdx ? { ...it, validation: { ...it.validation, answer_type: e.target.value } } : it))} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal">
                            <option value="text_number">Teks</option><option value="email">Email</option><option value="phone">Nomor telepon</option><option value="number">Angka</option>
                          </select>
                        </label>}
                        {['short', 'para'].includes(q.type) && <div className="grid grid-cols-2 gap-3">
                          <label className="text-xs font-semibold text-gray-600">Minimal karakter<input type="number" min="0" max="10000" value={q.validation?.min_length ?? ''} onChange={(e) => setQuestions((prev) => prev.map((it, i) => i === qIdx ? { ...it, validation: { ...it.validation, min_length: e.target.value === '' ? undefined : Number(e.target.value) } } : it))} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
                          <label className="text-xs font-semibold text-gray-600">Maksimal karakter<input type="number" min="1" max="10000" value={q.validation?.max_length ?? ''} onChange={(e) => setQuestions((prev) => prev.map((it, i) => i === qIdx ? { ...it, validation: { ...it.validation, max_length: e.target.value === '' ? undefined : Number(e.target.value) } } : it))} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
                        </div>}
                        {q.type === 'check' && <div className="grid grid-cols-2 gap-3">
                          <label className="text-xs font-semibold text-gray-600">Minimal pilihan<input type="number" min="0" max={q.opts.length} value={q.validation?.min_selections ?? ''} onChange={(e) => setQuestions((prev) => prev.map((it, i) => i === qIdx ? { ...it, validation: { ...it.validation, min_selections: e.target.value === '' ? undefined : Number(e.target.value) } } : it))} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
                          <label className="text-xs font-semibold text-gray-600">Maksimal pilihan<input type="number" min="1" max={q.opts.length} value={q.validation?.max_selections ?? ''} onChange={(e) => setQuestions((prev) => prev.map((it, i) => i === qIdx ? { ...it, validation: { ...it.validation, max_selections: e.target.value === '' ? undefined : Number(e.target.value) } } : it))} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
                        </div>}
                        <p className="text-[11px] text-gray-500">Aturan ini diterapkan saat responden mengirim jawaban.</p>
                      </div>
                    )}
                    {hasOptions(q.type) && (
                      <div className="space-y-2">
                        {q.opts.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2.5">
                            {q.type === 'choice' && (
                              <div className="w-4 h-4 rounded-full border-2 border-gray-400 flex-shrink-0" />
                            )}
                            {q.type === 'check' && (
                              <div className="w-4 h-4 rounded border-2 border-gray-400 flex-shrink-0" />
                            )}
                            {q.type === 'drop' && (
                              <span className="text-xs font-bold text-gray-400 w-4">{optIdx + 1}.</span>
                            )}
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                              className="flex-1 text-sm border-0 border-b border-gray-200 focus:border-blue-600 outline-none pb-1 transition"
                            />
                            {q.opts.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeOption(qIdx, optIdx);
                                }}
                                className="text-gray-400 hover:text-rose-600 text-lg px-2"
                                title="Hapus opsi"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addOption(qIdx);
                          }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 pt-1 flex items-center gap-1"
                        >
                          + Tambah opsi
                        </button>
                      </div>
                    )}

                    {q.type === 'scale' && (
                      <div
                        className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-gray-600">Label siap pakai</span>
                          <select
                            value={detectScalePreset(q.opts)}
                            onChange={(e) => applyScalePreset(qIdx, e.target.value)}
                            className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:border-blue-600 outline-none"
                          >
                            {Object.entries(SCALE_PRESETS).map(([k, preset]) => (
                              <option key={k} value={k}>{preset.name}</option>
                            ))}
                            <option value="custom">Kustom</option>
                          </select>
                        </div>
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div key={i} className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {i + 1}
                            </span>
                            <input
                              type="text"
                              value={q.opts?.[i] ?? ''}
                              onChange={(e) => updateScaleLabel(qIdx, i, e.target.value)}
                              placeholder={`Label untuk skor ${i + 1}`}
                              maxLength={100}
                              className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:border-blue-600 outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === 'short' && (
                      <input
                        type="text"
                        disabled
                        placeholder="Jawaban singkat"
                        className="w-full text-sm text-gray-400 border-0 border-b border-gray-200 bg-transparent pb-1"
                      />
                    )}

                    {q.type === 'para' && (
                      <textarea
                        disabled
                        placeholder="Jawaban panjang (paragraf)"
                        rows={2}
                        className="w-full text-sm text-gray-400 border-0 border-b border-gray-200 bg-transparent pb-1 resize-none"
                      />
                    )}
                  </div>

                  {/* Foot actions per pertanyaan saat terseleksi */}
                  {isSelected && (
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateQuestion(qIdx);
                          }}
                          className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 font-semibold"
                        >
                          <FaClone className="text-xs" /> Duplikat
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeQuestion(qIdx);
                          }}
                          className="flex items-center gap-1.5 text-gray-600 hover:text-rose-600 font-semibold"
                        >
                          <FaTrash className="text-xs" /> Hapus
                        </button>
                      </div>
                      <label
                        className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={q.req}
                          onChange={(e) => {
                            const next = [...questions];
                            next[qIdx].req = e.target.checked;
                            setQuestions(next);
                          }}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        Wajib diisi
                      </label>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Tombol Tambah Pertanyaan */}
            <button
              type="button"
              onClick={addQuestion}
              className="w-full py-4 border-2 border-dashed border-blue-400 hover:border-blue-600 text-blue-600 hover:text-blue-800 font-bold rounded-2xl text-sm transition-all bg-white hover:bg-blue-50/50 flex items-center justify-center gap-2 shadow-sm"
            >
              <FaPlus /> Tambah Pertanyaan
            </button>

            {/* Tombol Aksi Simpan */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold text-sm transition"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleSaveSurvey}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Kuesioner'}
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB: PRATINJAU (PREVIEW) ───────────────────────────────────── */}
        {view === 'detail' && mode === 'pv' && (
          <div className="max-w-2xl mx-auto space-y-4">
            {previewDone ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-3xl font-extrabold">
                  <FaCheck />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900">Terima kasih</h2>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                  Jawaban Anda sudah kami terima secara lengkap dalam mode pratinjau ini.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewDone(false);
                    setPreviewAnswers({});
                  }}
                  className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-blue-700 transition"
                >
                  Isi lagi
                </button>
              </div>
            ) : (
              <form onSubmit={handlePreviewSubmit} className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-xl font-extrabold text-gray-900">{title || 'Kuesioner tanpa judul'}</h2>
                  {desc && <RichText html={desc} block className="text-sm text-gray-600 mt-2" />}
                </div>

                {questions.map((q, idx) => (
                  <div key={q._key} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-3">
                    <label className="block text-base font-bold text-gray-900">
                      {stripHtml(q.text)
                        ? <RichText html={q.text} />
                        : `Pertanyaan ${idx + 1}`}
                      {q.req && <span className="text-rose-500 ml-1 font-bold">*</span>}
                    </label>
                    {q.image_url && <img src={q.image_url} alt="Ilustrasi pertanyaan" className="max-h-72 w-auto rounded-xl object-contain" />}

                    {q.type === 'short' && (
                      <input
                        type={q.validation?.answer_type === 'email' ? 'email' : q.validation?.answer_type === 'number' ? 'number' : 'text'}
                        inputMode={q.validation?.answer_type === 'phone' ? 'tel' : q.validation?.answer_type === 'number' ? 'decimal' : undefined}
                        placeholder={q.validation?.answer_type === 'email' ? 'nama@contoh.com' : q.validation?.answer_type === 'phone' ? '+62 812 3456 7890' : 'Jawaban Anda'}
                        minLength={q.validation?.min_length}
                        maxLength={q.validation?.max_length}
                        value={previewAnswers[idx] || ''}
                        onChange={(e) => setPreviewAnswers({ ...previewAnswers, [idx]: e.target.value })}
                        className="w-full text-sm border-0 border-b-2 border-gray-200 focus:border-blue-600 outline-none pb-1.5 transition"
                      />
                    )}

                    {q.type === 'para' && (
                      <textarea
                        placeholder="Jawaban Anda"
                        rows={3}
                        minLength={q.validation?.min_length}
                        maxLength={q.validation?.max_length}
                        value={previewAnswers[idx] || ''}
                        onChange={(e) => setPreviewAnswers({ ...previewAnswers, [idx]: e.target.value })}
                        className="w-full text-sm border-0 border-b-2 border-gray-200 focus:border-blue-600 outline-none pb-1.5 transition resize-y"
                      />
                    )}

                    {q.type === 'email' && <input type="email" placeholder="nama@contoh.com" value={previewAnswers[idx] || ''} onChange={(e) => setPreviewAnswers({ ...previewAnswers, [idx]: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />}
                    {q.type === 'phone' && <input type="tel" placeholder="+62 812 3456 7890" value={previewAnswers[idx] || ''} onChange={(e) => setPreviewAnswers({ ...previewAnswers, [idx]: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />}
                    {q.type === 'file' && <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">Kolom unggah file ditampilkan pada survei yang diterbitkan.</div>}
                    {previewErrors[idx] && <p className="text-xs font-semibold text-rose-600">{previewErrors[idx]}</p>}

                    {q.type === 'choice' && (
                      <div className="space-y-2 pt-1">
                        {q.opts.map((opt, oIdx) => (
                          <label key={oIdx} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                            <input
                              type="radio"
                              name={`preview_q_${idx}`}
                              value={opt}
                              checked={previewAnswers[idx] === opt}
                              onChange={(e) => setPreviewAnswers({ ...previewAnswers, [idx]: e.target.value })}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === 'check' && (
                      <div className="space-y-2 pt-1">
                        {q.opts.map((opt, oIdx) => {
                          const currentArr = previewAnswers[idx] || [];
                          const checked = currentArr.includes(opt);
                          return (
                            <label key={oIdx} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const nextArr = e.target.checked
                                    ? [...currentArr, opt]
                                    : currentArr.filter((x) => x !== opt);
                                  setPreviewAnswers({ ...previewAnswers, [idx]: nextArr });
                                }}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'drop' && (
                      <select
                        value={previewAnswers[idx] || ''}
                        onChange={(e) => setPreviewAnswers({ ...previewAnswers, [idx]: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-600"
                      >
                        <option value="">-- Pilih salah satu --</option>
                        {q.opts.map((opt, oIdx) => (
                          <option key={oIdx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {q.type === 'scale' && (
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <label
                            key={n}
                            className={`flex sm:flex-col items-center gap-3 sm:gap-2 p-2 rounded-lg cursor-pointer sm:text-center transition ${
                              Number(previewAnswers[idx]) === n ? 'bg-blue-50' : 'hover:bg-white'
                            }`}
                          >
                            <span className="text-sm font-bold text-gray-800 w-5 sm:w-auto">{n}</span>
                            <input
                              type="radio"
                              name={`preview_scale_${idx}`}
                              value={n}
                              checked={Number(previewAnswers[idx]) === n}
                              onChange={(e) => setPreviewAnswers({ ...previewAnswers, [idx]: Number(e.target.value) })}
                              className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-600 leading-snug sm:min-h-[2rem] break-words">
                              {q.opts?.[n - 1] || ''}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    {previewErrors[idx] && (
                      <p className="text-xs text-rose-600 font-semibold mt-1">{previewErrors[idx]}</p>
                    )}
                  </div>
                ))}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow"
                  >
                    Kirim jawaban
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewAnswers({});
                      setPreviewErrors({});
                    }}
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold px-5 py-2.5 rounded-xl text-sm transition"
                  >
                    Kosongkan
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ─── TAB: BAGIKAN (SHARE) ────────────────────────────────────────── */}
        {view === 'detail' && mode === 'share' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {!currentSurvey?.is_published ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-4 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900">Kuesioner belum diterbitkan</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Setelah diterbitkan, kuesioner akan mendapatkan tautan publik dan kode QR resmi yang dapat dibagikan kepada peserta.
                </p>
                <button
                  type="button"
                  onClick={() => handlePublish(currentSurvey.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow transition"
                >
                  Terbitkan kuesioner sekarang
                </button>
              </div>
            ) : (
              <>
                {/* Tautan Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-900">Tautan kuesioner</h3>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        currentSurvey.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {currentSurvey.is_active ? 'Terbuka' : 'Ditutup'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getPublicLink()}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-mono text-gray-700 outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition flex-shrink-0"
                    >
                      <FaCopy /> Salin tautan
                    </button>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentSurvey.is_active}
                        onChange={() => handleToggleActive(currentSurvey.id)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      Terima jawaban baru
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    {currentSurvey.is_active
                      ? 'Mengubah pertanyaan tidak mengubah tautan atau kode QR yang sudah dicetak.'
                      : 'Peserta yang membuka tautan atau memindai QR akan melihat pesan bahwa kuesioner sudah ditutup.'}
                  </p>
                </div>

                {/* QR Code Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">Kode QR</h3>
                  <div className="inline-block p-4 bg-white rounded-2xl border-2 border-gray-200 shadow-inner">
                    <canvas ref={qrCanvasRef} className="max-w-full h-auto w-64 mx-auto rounded-lg" />
                  </div>
                  <p className="text-xs text-gray-600">
                    Pindai untuk mengisi: <span className="font-bold text-gray-800">{title}</span>
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm inline-flex items-center gap-2 transition shadow"
                  >
                    <FaDownload /> Unduh PNG
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── TAB: HASIL (RESULTS) ────────────────────────────────────────── */}
        {view === 'detail' && mode === 'res' && (
          <div className="space-y-6">
            {detailLoading ? (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                Memuat data hasil kuesioner...
              </div>
            ) : !detailData || !detailData.stats || detailData.stats.total_responses === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-2">
                <h3 className="text-lg font-bold text-gray-800">Belum ada jawaban</h3>
                <p className="text-sm text-gray-500">
                  Data statistik dan rincian jawaban akan muncul di sini setelah peserta mengisi kuesioner.
                </p>
              </div>
            ) : (
              <>
                {/* Ringkasan Hasil Stats */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h3 className="text-xl font-extrabold text-gray-900">Ringkasan hasil</h3>
                    <button
                      type="button"
                      onClick={handleDownloadCsv}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm inline-flex items-center gap-2 transition shadow"
                    >
                      <FaDownload /> Unduh CSV
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4">
                      <span className="block text-3xl font-extrabold text-blue-700">
                        {detailData.stats.total_responses}
                      </span>
                      <span className="text-xs font-semibold text-gray-600">Total Responden</span>
                    </div>
                    <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4">
                      <span className="block text-3xl font-extrabold text-blue-700">
                        {detailData.stats.average_scale || '-'}
                      </span>
                      <span className="text-xs font-semibold text-gray-600">Rata-rata skala</span>
                    </div>
                    <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4">
                      <span className="block text-xl font-extrabold text-blue-700 pt-1">
                        {detailData.stats.last_response_at || '-'}
                      </span>
                      <span className="text-xs font-semibold text-gray-600">Terakhir mengisi</span>
                    </div>
                  </div>
                </div>

                {/* Question Summaries */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {detailData.summary?.map((qSum, idx) => (
                    <div
                      key={qSum.id || idx}
                      className="min-w-0 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4"
                    >
                      <div>
                        <h4 className="text-base font-bold text-gray-900">
                          <RichText html={qSum.text} />
                        </h4>
                        <span className="text-xs text-gray-500 font-medium">
                          {qSum.total_answers} jawaban
                        </span>
                      </div>

                      {/* Bar charts for choice, check, drop */}
                      {hasOptions(qSum.type) && qSum.counts && (
                        <div className="space-y-3 pt-1">
                          {Object.entries(qSum.counts).map(([optName, count]) => {
                            const pct = qSum.total_answers > 0
                              ? Math.round((count / qSum.total_answers) * 100)
                              : 0;
                            return (
                              <div key={optName} className="space-y-1">
                                <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                                  <span className="truncate pr-2">{optName}</span>
                                  <span className="font-bold flex-shrink-0">
                                    {count} ({pct}%)
                                  </span>
                                </div>
                                <div className="w-full bg-blue-50 h-3 rounded-full overflow-hidden">
                                  <div
                                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Bar chart for scale 1–5 */}
                      {qSum.type === 'scale' && qSum.scale_counts && (
                        <div className="space-y-3 pt-1">
                          {[5, 4, 3, 2, 1].map((score) => {
                            const count = qSum.scale_counts[score] || 0;
                            const pct = qSum.total_answers > 0
                              ? Math.round((count / qSum.total_answers) * 100)
                              : 0;
                            return (
                              <div key={score} className="space-y-1">
                                <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                                  <span className="truncate pr-2">
                                    Skor {score}{qSum.options?.[score - 1] ? ` · ${qSum.options[score - 1]}` : ''}
                                  </span>
                                  <span className="font-bold">
                                    {count} ({pct}%)
                                  </span>
                                </div>
                                <div className="w-full bg-blue-50 h-3 rounded-full overflow-hidden">
                                  <div
                                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Sample quotes for short & para text */}
                      {(qSum.type === 'short' || qSum.type === 'para') && qSum.sample_answers && (
                        <div className="space-y-2 pt-1">
                          {qSum.sample_answers.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">Belum ada tanggapan teks.</p>
                          ) : (
                            qSum.sample_answers.slice(0, 4).map((ansText, aIdx) => (
                              <div
                                key={aIdx}
                                className="p-3 bg-gray-50 rounded-xl border-l-4 border-l-blue-600 text-xs text-gray-700 italic"
                              >
                                &ldquo;{ansText}&rdquo;
                              </div>
                            ))
                          )}
                          {qSum.sample_answers.length > 4 && (
                            <p className="text-[11px] text-gray-400 font-medium">
                              + {qSum.total_answers - 4} tanggapan lainnya pada tabel di bawah.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Tabel Jawaban per Responden */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Jawaban per responden</h3>
                    <span className="text-xs text-gray-500 font-semibold">
                      Total: {detailData.responses?.length || 0} responden
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50 text-gray-700 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 text-left">#</th>
                          <th className="px-4 py-3 text-left whitespace-nowrap">Waktu</th>
                          {detailData.survey?.questions?.map((q, qIdx) => (
                            <th
                              key={q.id || qIdx}
                              className="px-4 py-3 text-left max-w-xs truncate"
                              title={stripHtml(q.text)}
                            >
                              {stripHtml(q.text)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {(showAllResponses
                          ? detailData.responses
                          : detailData.responses?.slice(0, 8)
                        )?.map((resp, rIdx) => (
                          <tr key={resp.id || rIdx} className="hover:bg-gray-50/60">
                            <td className="px-4 py-3 font-bold text-gray-600">{rIdx + 1}</td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                              {resp.created_at_human}
                            </td>
                            {detailData.survey?.questions?.map((q) => {
                              const ansVal = resp.answers[q.id];
                              return (
                                <td key={q.id} className="px-4 py-3 text-gray-800 max-w-xs truncate" title={ansVal}>
                                  {ansVal || <span className="text-gray-300">-</span>}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {detailData.responses?.length > 8 && (
                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAllResponses(!showAllResponses)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                      >
                        {showAllResponses
                          ? 'Tampilkan lebih sedikit'
                          : `Tampilkan semua ${detailData.responses.length} responden`}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
