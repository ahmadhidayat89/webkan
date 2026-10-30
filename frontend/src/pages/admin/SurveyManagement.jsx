import { useState, useEffect, useRef, useReducer, useMemo } from 'react';
import ExtendedField, { CONTENT_TYPES, visibleQuestions } from '../../components/survey/ExtendedField';
import { QuestionPrimaryOptions, QuestionMoreOptions, ValidationOptions, QuizAnswerKey, SurveySettings, ThemeSettings, ImportQuestions } from '../../components/survey/BuilderControls';
import { EditorHeader, InsertToolbar, EditorDialog, InlineImageUpload } from '../../components/survey/EditorChrome';
import AdminLayout from '../../components/admin/AdminLayout';
import RichTextInput from '../../components/admin/RichTextInput';
import RichText, { stripHtml } from '../../components/RichText';
import '../../components/survey/surveyTheme.css';
import { SurveyFrame, SurveyForm } from '../../components/survey/SurveyForm';
import { splitSurveyPages, prepareSurveyQuestions } from '../../components/survey/surveyFlow';
import { validateQuestion } from '../../components/survey/surveyValidation';
import SearchableSelect from '../../components/survey/SearchableSelect';
import { surveyFingerprint } from '../../components/survey/surveyFingerprint';
import SubmitConfirmation from '../../components/survey/SubmitConfirmation';
import ResponseSummary from '../../components/survey/ResponseSummary';
import {
  gradeSurveyResponse,
  getAdminSurveys,
  getAdminSurvey,
  createAdminSurvey,
  updateAdminSurvey,
  deleteAdminSurvey,
  publishAdminSurvey,
  toggleActiveAdminSurvey,
  exportAdminSurveyCsv,
} from '../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import QRCode from 'qrcode';
import { FaCopy, FaDownload, FaPlus, FaTrash, FaClone, FaArrowLeft, FaCheck } from 'react-icons/fa';

const QUESTION_TYPES = {
  short: 'Jawaban singkat',
  para: 'Paragraf',
  file: 'Unggah file',
  choice: 'Pilihan ganda',
  check: 'Kotak centang',
  drop: 'Dropdown',
  scale: 'Skala 1–5 (label)',
  linear: 'Skala linear', rating: 'Rating', grid: 'Kisi pilihan ganda', check_grid: 'Kisi kotak centang',
  date: 'Tanggal', time: 'Waktu', duration: 'Durasi', section: 'Bagian / halaman', heading: 'Judul & petunjuk', video: 'Video YouTube', image: 'Gambar',
};

const hasOptions = (type) => ['choice', 'check', 'drop', 'grid', 'check_grid'].includes(type);

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

// Setiap opsi punya kunci tetap (optKeys) yang sejajar dengan opts,
// supaya input opsi tidak kehilangan fokus saat teksnya diketik
const newOptKeys = (opts) => (opts || []).map(() => uid());

const blankQuestion = () => ({
  _key: uid(),
  type: 'short',
  text: '',
  req: false,
  opts: [],
  optKeys: [],
  image_url: '',
  validation: {},
  config: { key: uid() },
});

const getQuestionOptions = (q) => {
  if (q.type === 'scale') return normalizeScale(q.options);
  if (q.options) return q.options;
  return hasOptions(q.type) ? ['Opsi 1'] : [];
};

const mapSurveyQuestion = (q) => {
  const opts = getQuestionOptions(q);
  return {
    _key: uid(),
    id: q.id,
    type: ['email', 'phone'].includes(q.type) ? 'short' : q.type,
    text: q.text,
    image_url: q.image_url || '',
    config: { ...q.config, key: q.config?.key || uid() },
    validation: { ...q.validation, ...(['email', 'phone'].includes(q.type) && { answer_type: q.type }) },
    req: Boolean(q.is_required),
    opts,
    optKeys: newOptKeys(opts),
  };
};

const mapSurveyQuestions = (surveyQuestions = []) =>
  surveyQuestions.length > 0 ? surveyQuestions.map(mapSurveyQuestion) : [blankQuestion()];

const validatePreviewQuestion = (q, answer) => validateQuestion({ ...q, is_required: q.req, options: q.opts || q.options || [] }, answer);

// ── Helper murni umum ──

const isRangeInvalid = (min, max) => min != null && max != null && min > max;

const hasInvalidValidationRule = (questions) =>
  questions.some((q) => {
    const v = q.validation || {};
    return isRangeInvalid(v.min_length, v.max_length)
      || isRangeInvalid(v.min_selections, v.max_selections)
      || (v.max_selections != null && v.max_selections > q.opts.length);
  });

const getSaveProblem = (title, questions) => {
  if (!title.trim()) return 'Judul kuesioner wajib diisi.';
  if (questions.some(q => ['grid', 'check_grid'].includes(q.type) && !(q.config?.rows || []).some(r => r.trim()))) return 'Tambahkan minimal satu baris pada pertanyaan kisi.';
  if (questions.some(q => ['choice', 'check', 'drop', 'grid', 'check_grid'].includes(q.type) && (q.opts.some(o => !o.trim()) || new Set(q.opts).size !== q.opts.length))) return 'Opsi jawaban harus terisi dan berbeda dalam satu pertanyaan.';
  if (hasInvalidValidationRule(questions)) {
    return 'Rentang validasi tidak sesuai. Periksa batas minimum dan maksimum.';
  }
  return null;
};

const buildSurveyPayload = ({ title, desc, survey, questions, settings }) => ({
  settings,
  title,
  description: desc,
  is_published: survey?.is_published ?? false,
  is_active: survey?.is_active ?? true,
  questions: questions.map((q, idx) => ({
    id: q.id,
    order: idx + 1,
    text: stripHtml(q.text).trim() ? q.text : `Pertanyaan ${idx + 1}`,
    type: q.type,
    is_required: q.req,
    options: hasOptions(q.type) || q.type === 'scale' ? q.opts : [],
    image_url: q.image_url || null,
    validation: q.validation || {},
    config: { ...q.config, ...(q.config?.rows && { rows: q.config.rows.map(r => r.trim()).filter(Boolean) }), ...(q.config?.correct_answers && { correct_answers: q.config.correct_answers.filter(a => typeof a === 'string' && a.trim()) }) },
  })),
});

const getSaveErrorMessage = (err) => {
  const validationMessage = Object.values(err.response?.data?.errors || {}).flat()[0];
  return validationMessage
    || err.response?.data?.message
    || 'Gagal menyimpan kuesioner. Periksa koneksi dan konfigurasi server.';
};

const saveSuccessMessage = (isUpdate) =>
  isUpdate ? 'Kuesioner berhasil diperbarui.' : 'Kuesioner berhasil dibuat.';

const persistSurvey = (survey, payload) =>
  survey?.id ? updateAdminSurvey(survey.id, payload) : createAdminSurvey(payload);

const optsForType = (oldType, newType, oldOpts) => {
  if (newType === 'scale') {
    return oldType === 'scale' ? oldOpts : [...SCALE_PRESETS.kualitas.labels];
  }
  if (!hasOptions(newType)) return [];
  const keep = oldType !== 'scale' && oldOpts?.length > 0;
  return keep ? oldOpts : ['Opsi 1'];
};

const getSurveyStatus = (item) => {
  if (!item.is_published) {
    return { label: 'Draf', className: 'bg-gray-100 text-gray-700 border-gray-200' };
  }
  if (item.is_active) {
    return { label: 'Aktif', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  return { label: 'Ditutup', className: 'bg-rose-50 text-rose-700 border-rose-200' };
};

const getPublicLink = (survey) =>
  survey?.code ? `${window.location.origin}/survei/${survey.code}` : '';

const newSurvey = () => ({
  id: null,
  code: '',
  title: '',
  description: '',
  is_published: false,
  is_active: true,
  questions: [],
  responses_count: 0,
});

const percentOf = (count, total) => (total > 0 ? Math.round((count / total) * 100) : 0);

const isEmptyResult = (data) => !data?.stats || data.stats.total_responses === 0;

const getVisibleResponses = (responses, showAll) =>
  showAll ? responses : responses?.slice(0, 8);

// Label skor pada grafik skala, mis. "Skor 5 · Sangat Baik"
const getScaleLabel = (qSum, score) => {
  const text = qSum.options?.[score - 1];
  return text ? `Skor ${score} · ${text}` : `Skor ${score}`;
};

// Kunci unik untuk teks yang bisa sama: "Baik#0", "Baik#1", ...
const withOccurrenceKeys = (texts) => {
  const seen = {};
  return texts.map((text) => {
    seen[text] = (seen[text] ?? -1) + 1;
    return { text, key: `${text}#${seen[text]}` };
  });
};

// Pemanggilan API: mengembalikan body kalau sukses, null kalau gagal (toast otomatis)
const callApi = async (request, failMessage) => {
  try {
    const res = await request();
    return res.data?.success ? res.data : null;
  } catch (err) {
    console.error(err);
    toast.error(failMessage);
    return null;
  }
};

// ── Helper murni untuk daftar pertanyaan ──

const mapAt = (list, idx, fn) => list.map((it, i) => (i === idx ? fn(it) : it));

const patchAt = (list, idx, patch) => mapAt(list, idx, (it) => ({ ...it, ...patch }));

const patchValidationAt = (list, idx, patch) =>
  mapAt(list, idx, (it) => ({ ...it, validation: { ...it.validation, ...patch } }));

const insertAt = (list, idx, item) => [...list.slice(0, idx), item, ...list.slice(idx)];

const cloneQuestion = (q) => {
  const copy = { ...structuredClone(q), _key: uid() };
  copy.config = { ...copy.config, key: uid() };
  delete copy.id; // salinan harus dianggap pertanyaan baru oleh backend
  copy.optKeys = newOptKeys(copy.opts);
  return copy;
};

const withScaleLabel = (q, labelIdx, val) => {
  const opts = Array.from({ length: 5 }, (_, k) => q.opts?.[k] ?? '');
  opts[labelIdx] = val;
  return { ...q, opts };
};

const withNewOption = (q) => {
  const opts = q.opts || [];
  return {
    ...q,
    opts: [...opts, `Opsi ${opts.length + 1}`],
    optKeys: [...(q.optKeys || []), uid()],
  };
};

const withOption = (q, optIdx, val) => ({
  ...q,
  opts: q.opts.map((o, i) => (i === optIdx ? val : o)),
});

const withoutOption = (q, optIdx) =>
  q.opts.length <= 1
    ? q
    : {
      ...q,
      opts: q.opts.filter((_, i) => i !== optIdx),
      optKeys: q.optKeys.filter((_, i) => i !== optIdx),
    };

const withQuestionType = (q, newType) => {
  const opts = optsForType(q.type, newType, q.opts);
  const config = { ...q.config };
  if (!['grid', 'check_grid'].includes(newType)) {
    ['rows', 'require_rows', 'unique_columns', 'shuffle_rows'].forEach(key => delete config[key]);
  }
  if (!hasOptions(newType)) {
    ['option_images', 'allow_other', 'shuffle_options'].forEach(key => delete config[key]);
  }
  if (!['choice', 'drop'].includes(newType)) {
    delete config.branches;
    delete config.show_branches;
  }
  if (q.type !== newType) { delete config.correct_answers; delete config.show_validation; }
  return {
    ...q,
    type: newType,
    req: CONTENT_TYPES.includes(newType) ? false : q.req,
    validation: q.type === newType ? q.validation : {},
    config: { ...config, ...(['grid', 'check_grid'].includes(newType) ? { rows: q.config?.rows || ['Aspek 1', 'Aspek 2'] } : {}) },
    opts,
    optKeys: opts === q.opts ? q.optKeys : newOptKeys(opts),
  };
};



// ══════════════════════════════════════════════════════════════════════
// CUSTOM HOOKS
// ══════════════════════════════════════════════════════════════════════

function useSurveyList() {
  const [surveys, setSurveys] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, responses: 0 });
  const [loading, setLoading] = useState(true);

  const fetchSurveys = async () => {
    setLoading(true);
    const body = await callApi(getAdminSurveys, 'Gagal memuat daftar kuesioner.');
    if (body) {
      setSurveys(body.data || []);
      setStats(body.stats || { total: 0, active: 0, responses: 0 });
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchSurveys();
  }, []);

  return { surveys, stats, loading, fetchSurveys };
}

function useSurveyDetail() {
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchSurveyDetail = async (id) => {
    setDetailLoading(true);
    const body = await callApi(() => getAdminSurvey(id), 'Gagal memuat detail kuesioner.');
    if (body) setDetailData(body.data);
    setDetailLoading(false);
  };

  const clearDetail = () => setDetailData(null);

  return { detailData, detailLoading, fetchSurveyDetail, clearDetail };
}

function useQuestionEditor(settings) {
  const [history, dispatch] = useReducer((state, action) => {
    if (action.type === 'undo') return state.past.length ? { past: state.past.slice(0, -1), present: state.past.at(-1), future: [state.present, ...state.future] } : state;
    if (action.type === 'redo') return state.future.length ? { past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1) } : state;
    if (action.type === 'reset') return { past: [], present: action.value, future: [] };
    const next = typeof action.value === 'function' ? action.value(state.present) : action.value;
    return { past: [...state.past.slice(-29), state.present], present: next, future: [] };
  }, { past: [], present: [], future: [] });
  const questions = history.present;
  const setQuestions = value => dispatch({ type: 'update', value });
  const [selectedQIndex, setSelectedQIndex] = useState(0);
  const [scrollTarget, setScrollTarget] = useState(null);

  const resetQuestions = (surveyQuestions) => {
    dispatch({ type: 'reset', value: mapSurveyQuestions(surveyQuestions) });
    setSelectedQIndex(0);
  };

  const replaceQuestions = (surveyQuestions) => setQuestions(mapSurveyQuestions(surveyQuestions));

  const addQuestion = (type = 'short') => {
    const question = withQuestionType(blankQuestion(), type);
    question.req = !CONTENT_TYPES.includes(type) && Boolean(settings.required_default);
    question.text = { section: 'Bagian baru', heading: 'Judul', image: 'Gambar', video: 'Video' }[type] || '';
    const index = Math.min(selectedQIndex + 1, questions.length);
    setQuestions(prev => insertAt(prev, index, question));
    setSelectedQIndex(index);
    setScrollTarget(question._key);
  };

  const duplicateQuestion = (idx) => {
    const copy = cloneQuestion(questions[idx]);
    setQuestions(prev => insertAt(prev, idx + 1, copy));
    setSelectedQIndex(idx + 1);
    setScrollTarget(copy._key);
  };

  const removeQuestion = (idx) => {
    if (questions.length <= 1) {
      toast.error('Kuesioner harus memiliki minimal 1 pertanyaan.');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    setSelectedQIndex(Math.max(0, idx - 1));
  };

  const changeQuestionType = (idx, newType) =>
    setQuestions((prev) => mapAt(prev, idx, (q) => withQuestionType(q, newType)));

  const patchQuestion = (qIdx, patch) => setQuestions((prev) => patchAt(prev, qIdx, patch));

  const patchValidation = (qIdx, patch) =>
    setQuestions((prev) => patchValidationAt(prev, qIdx, patch));

  const setText = (qIdx, html) => patchQuestion(qIdx, { text: html });

  const setRequired = (qIdx, req) => patchQuestion(qIdx, { req });

  const applyScalePreset = (qIdx, key) => {
    if (!SCALE_PRESETS[key]) return;
    patchQuestion(qIdx, { opts: [...SCALE_PRESETS[key].labels] });
  };

  const updateScaleLabel = (qIdx, labelIdx, val) =>
    setQuestions((prev) => mapAt(prev, qIdx, (q) => withScaleLabel(q, labelIdx, val)));

  const addOption = (qIdx) => setQuestions((prev) => mapAt(prev, qIdx, withNewOption));

  const updateOption = (qIdx, optIdx, val) =>
    setQuestions((prev) => mapAt(prev, qIdx, (q) => {
      const old = q.opts[optIdx];
      const next = withOption(q, optIdx, val);
      const config = { ...q.config };
      for (const key of ['option_images', 'branches']) {
        if (config[key] && Object.hasOwn(config[key], old)) {
          const values = { ...config[key] }; const kept = values[old]; delete values[old]; values[val] = kept; config[key] = values;
        }
      }
      return { ...next, config };
    }));

  const removeOption = (qIdx, optIdx) =>
    setQuestions((prev) => mapAt(prev, qIdx, (q) => withoutOption(q, optIdx)));

  return {
    questions,
    quiz: Boolean(settings.quiz),
    undo: () => dispatch({ type: 'undo' }), redo: () => dispatch({ type: 'redo' }), canUndo: history.past.length > 0, canRedo: history.future.length > 0,
    moveQuestion: (idx, delta) => {
      const next = idx + delta;
      if (next < 0 || next >= questions.length) {
        return;
      }
      setQuestions(prev => {
        const copy = [...prev];
        const [moved] = copy.splice(idx, 1);
        copy.splice(next, 0, moved);
        return copy;
      });
      setSelectedQIndex(next);
    },
    importQuestions: (items) => setQuestions(prev => [...prev, ...mapSurveyQuestions(items).map(q => ({ ...q, id: undefined, config: { ...q.config, key: uid(), branches: {} } }))]),
    scrollTarget,
    clearScrollTarget: setScrollTarget,
    selectedQIndex: Math.min(selectedQIndex, Math.max(0, questions.length - 1)),
    setSelectedQIndex,
    resetQuestions,
    replaceQuestions,
    addQuestion,
    duplicateQuestion,
    removeQuestion,
    changeQuestionType,
    patchQuestion,
    patchValidation,
    setText,
    setRequired,
    applyScalePreset,
    updateScaleLabel,
    addOption,
    updateOption,
    removeOption,
  };
}

function usePreviewForm(questions) {
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    setAnswers({});
    setErrors({});
    setDone(false);
  }, [questions]);

  const setAnswer = (idx, value) => {
    setAnswers(prev => ({ ...prev, [idx]: value }));
    setErrors(prev => ({ ...prev, [idx]: undefined }));
  };

  const reset = () => {
    setAnswers({});
    setErrors({});
    setDone(false);
  };

  const clearAnswers = () => {
    setAnswers({});
    setErrors({});
  };

  const submit = (e) => {
    e.preventDefault();
    const routed = visibleQuestions(questions.map((q, i) => ({ ...q, id: i })), answers);
    const errs = {};
    routed.forEach(q => { const error = validatePreviewQuestion(q, answers[q.id]); if (error) errs[q.id] = error; });

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Mohon lengkapi pertanyaan yang wajib diisi.');
    } else {
      setErrors({});
      setDone(true);
      toast.success('Jawaban pratinjau berhasil divalidasi!');
    }
  };

  const validatePage = (page) => {
    const errs = {};
    page.forEach(q => { const error = validatePreviewQuestion(q, answers[q.id]); if (error) errs[q.id] = error; });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  return { answers, errors, done, setAnswer, reset, clearAnswers, submit, validatePage };
}

function useSurveySave({ title, desc, questions, currentSurvey, settings, onSaved }) {
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const problem = getSaveProblem(title, questions);
    if (problem) {
      toast.error(problem);
      return;
    }

    setSaving(true);
    const isUpdate = Boolean(currentSurvey?.id);

    try {
      const payload = buildSurveyPayload({ title, desc, survey: currentSurvey, questions, settings });
      const res = await persistSurvey(currentSurvey, payload);

      if (res.data?.success) {
        toast.success(saveSuccessMessage(isUpdate));
        onSaved(res.data.data);
        return res.data.data;
      }
    } catch (err) {
      console.error(err);
      toast.error(getSaveErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return { saving, save };
}

function useSurveyStatusActions({ currentSurvey, setCurrentSurvey, fetchSurveys, fetchSurveyDetail }) {
  const refresh = () => {
    void fetchSurveys();
    if (currentSurvey?.id) void fetchSurveyDetail(currentSurvey.id);
  };

  // updater menerima survei saat ini dan mengembalikan perubahan yang diterapkan
  const patchCurrent = (surveyId, updater) => {
    if (currentSurvey?.id === surveyId) {
      setCurrentSurvey((prev) => ({ ...prev, ...updater(prev) }));
    }
  };

  const handlePublish = async (surveyId) => {
    const body = await callApi(() => publishAdminSurvey(surveyId), 'Gagal menerbitkan kuesioner.');
    if (!body) return;

    toast.success('Kuesioner berhasil diterbitkan!');
    patchCurrent(surveyId, () => ({ is_published: true, is_active: true, code: body.data.code }));
    refresh();
  };

  const handleToggleActive = async (surveyId) => {
    const body = await callApi(() => toggleActiveAdminSurvey(surveyId), 'Gagal mengubah status kuesioner.');
    if (!body) return;

    toast.success(body.message);
    patchCurrent(surveyId, (prev) => ({ is_active: !prev.is_active }));
    refresh();
  };

  return { handlePublish, handleToggleActive };
}

function useSurveyDelete({ currentSurvey, fetchSurveys, goToList, setDeleteConfirmId }) {
  return async (surveyId) => {
    const body = await callApi(() => deleteAdminSurvey(surveyId), 'Gagal menghapus kuesioner.');
    if (!body) return;

    toast.success('Kuesioner berhasil dihapus.');
    setDeleteConfirmId(null);

    if (currentSurvey?.id === surveyId) goToList();
    else void fetchSurveys();
  };
}

function useQrCanvas(canvasRef, link) {
  useEffect(() => {
    if (!link || !canvasRef.current) return;

    QRCode.toCanvas(
      canvasRef.current,
      link,
      {
        width: 500,
        margin: 3,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      },
      (error) => {
        if (error) console.error('QR code generation error:', error);
      }
    );
  }, [link, canvasRef]);
}

// ══════════════════════════════════════════════════════════════════════
// KOMPONEN: PENGATURAN PERTANYAAN
// ══════════════════════════════════════════════════════════════════════





const HeaderSubtitle = ({ view, desc }) => {
  if (view === 'list') {
    return <p className="max-w-xl mt-1 text-sm text-blue-100">Buat kuesioner, bagikan lewat kode QR, dan lihat hasilnya secara instan.</p>;
  }
  if (desc) {
    return <RichText html={desc} block className="max-w-xl mt-1 text-sm text-blue-100" />;
  }
  return <p className="max-w-xl mt-1 text-sm text-blue-100">Tanpa deskripsi singkat.</p>;
};

const HeaderText = ({ view, title, desc, onBack }) => (
  <div>
    {view === 'detail' && (
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-200 hover:text-white transition-colors mb-1"
      >
        <FaArrowLeft className="text-xs" /> Daftar kuesioner
      </button>
    )}
    <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
      {view === 'list' ? 'Kelola Kuesioner' : (title || 'Kuesioner tanpa judul')}
    </h1>
    <HeaderSubtitle view={view} desc={desc} />
  </div>
);

const ListHeaderActions = ({ stats, onAddNew }) => (
  <div className="flex flex-wrap items-center gap-3">
    {[
      ['Aktif', stats.active],
      ['Total', stats.total],
      ['Responden', stats.responses],
    ].map(([label, value]) => (
      <div key={label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-center min-w-[72px]">
        <span className="block text-xl font-bold">{value}</span>
        <span className="text-[11px] text-blue-200 font-medium">{label}</span>
      </div>
    ))}
    <button
      onClick={onAddNew}
      className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-5 py-2.5 rounded-xl transition-all shadow hover:shadow-md flex items-center gap-2 text-sm"
    >
      <FaPlus /> Tambah Kuesioner
    </button>
  </div>
);

const SurveyHeader = ({ stats, onAddNew }) => (
  <section className="flex flex-wrap items-center justify-between gap-5 p-6 text-white shadow-sm rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-900">
    <HeaderText view="list" onBack={() => { }} />
    <ListHeaderActions stats={stats} onAddNew={onAddNew} />
  </section>
);

// ══════════════════════════════════════════════════════════════════════
// KOMPONEN: DAFTAR KUESIONER
// ══════════════════════════════════════════════════════════════════════

const ListLoading = () => (
  <div className="p-12 text-center text-gray-500 bg-white border border-gray-200 rounded-2xl">
    <div className="w-8 h-8 mx-auto mb-3 border-b-2 border-blue-600 rounded-full animate-spin"></div>
    Memuat daftar kuesioner...
  </div>
);

const ListEmpty = ({ onAddNew }) => (
  <div className="p-12 text-center bg-white border border-gray-200 rounded-2xl">
    <h3 className="mb-1 text-lg font-bold text-gray-800">Belum ada kuesioner</h3>
    <p className="mb-4 text-sm text-gray-500">Tekan tombol Tambah Kuesioner untuk membuat kuesioner pertama Anda.</p>
    <button
      onClick={onAddNew}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition"
    >
      + Tambah Kuesioner
    </button>
  </div>
);

const SurveyCardActions = ({
  item,
  confirming,
  onOpen,
  onPublish,
  onToggleActive,
  onAskDelete,
  onCancelDelete,
  onDelete,
}) => (
  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
    {item.is_published ? (
      <>
        <button
          onClick={() => onOpen(item, 'res')}
          className="text-xs font-bold px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
        >
          Lihat Hasil
        </button>
        <button
          onClick={() => onOpen(item, 'share')}
          className="text-xs font-bold px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
        >
          Bagikan QR
        </button>
        <button
          onClick={() => onToggleActive(item.id)}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${item.is_active
            ? 'text-amber-600 hover:bg-amber-50'
            : 'text-emerald-600 hover:bg-emerald-50'
            }`}
        >
          {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
        </button>
      </>
    ) : (
      <button
        onClick={() => onPublish(item.id)}
        className="text-xs font-bold px-3 py-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
      >
        Terbitkan
      </button>
    )}

    <button
      onClick={() => onOpen(item, 'edit')}
      className="text-xs font-bold px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
    >
      Edit
    </button>

    {confirming ? (
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-xs font-semibold text-rose-600">Yakin hapus?</span>
        <button
          onClick={() => onDelete(item.id)}
          className="text-xs font-bold px-2.5 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 transition"
        >
          Ya, hapus
        </button>
        <button
          onClick={onCancelDelete}
          className="text-xs font-bold px-2.5 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
        >
          Batal
        </button>
      </div>
    ) : (
      <button
        onClick={() => onAskDelete(item.id)}
        className="text-xs font-bold px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition ml-auto"
      >
        Hapus
      </button>
    )}
  </div>
);

const SurveyCard = ({ item, index, actions }) => {
  const status = getSurveyStatus(item);

  return (
    <div className="p-5 space-y-3 transition-shadow bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-blue-50 text-blue-700 font-bold text-xs px-2.5 py-1 rounded-lg">
            #{index + 1}
          </span>
          <h2 className="text-lg font-bold text-gray-900">{item.title || 'Kuesioner tanpa judul'}</h2>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
        <span>{item.questions_count ?? item.questions?.length ?? 0} pertanyaan</span>
        <span>•</span>
        <span>{item.responses_count ?? 0} responden</span>
        {item.is_published && item.code && (
          <>
            <span>•</span>
            <span className="font-mono text-blue-600">kan.go.id/survei/{item.code}</span>
          </>
        )}
      </div>

      {item.description
        ? <RichText html={item.description} block className="text-sm text-gray-600" />
        : <p className="text-sm text-gray-400">Belum ada deskripsi singkat.</p>}

      <SurveyCardActions item={item} {...actions} />
    </div>
  );
};

const SurveyListView = ({ loading, surveys, deleteConfirmId, onAddNew, onOpen, onPublish, onToggleActive, onDelete, onAskDelete, onCancelDelete }) => {
  if (loading) return <ListLoading />;
  if (surveys.length === 0) return <ListEmpty onAddNew={onAddNew} />;

  return (
    <div className="space-y-4">
      {surveys.map((item, idx) => (
        <SurveyCard
          key={item.id}
          item={item}
          index={idx}
          actions={{
            confirming: deleteConfirmId === item.id,
            onOpen,
            onPublish,
            onToggleActive,
            onAskDelete,
            onCancelDelete,
            onDelete,
          }}
        />
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// KOMPONEN: TAB SUSUN (EDIT)
// ══════════════════════════════════════════════════════════════════════

const QuestionTextPreview = ({ html }) => (
  <div className="w-full text-base font-bold text-gray-900 border-b-2 border-gray-200 pb-1.5 min-h-[32px]">
    {stripHtml(html)
      ? <RichText html={html} />
      : <span className="text-gray-400">Tulis pertanyaan</span>}
  </div>
);

const QuestionHeader = ({ q, qIdx, isSelected, editor }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between gap-3">
      <button type="button" draggable onDragStart={e => { e.dataTransfer.setData('application/x-kan-question', String(qIdx)); e.dataTransfer.effectAllowed = 'move'; }} onClick={() => editor.setSelectedQIndex(qIdx)} title="Seret untuk memindahkan" className="text-xs font-semibold cursor-grab text-slate-400 active:cursor-grabbing">⋮⋮ {CONTENT_TYPES.includes(q.type) ? QUESTION_TYPES[q.type] : `Pertanyaan ${qIdx + 1}`}</button>
      {isSelected && <SearchableSelect className="w-56 max-w-[65%]" label="Jenis pertanyaan" value={q.type} options={Object.entries(QUESTION_TYPES).map(([value, label]) => ({ value, label }))} onChange={value => editor.changeQuestionType(qIdx, value)} searchPlaceholder="Cari jenis pertanyaan…" />}
    </div>
    {isSelected ? <RichTextInput key={q._key} value={q.text} onChange={html => editor.setText(qIdx, html)} placeholder={CONTENT_TYPES.includes(q.type) ? 'Judul konten' : 'Tulis pertanyaan'} /> : <button type="button" onClick={() => editor.setSelectedQIndex(qIdx)} className="w-full text-left"><QuestionTextPreview html={q.text} /></button>}
  </div>
);

const OptionMarker = ({ type, index }) => {
  if (type === 'choice') return <div className="flex-shrink-0 w-4 h-4 border-2 border-gray-400 rounded-full" />;
  if (type === 'check') return <div className="flex-shrink-0 w-4 h-4 border-2 border-gray-400 rounded" />;
  return <span className="w-4 text-xs font-bold text-gray-400">{index + 1}.</span>;
};

const OptionsEditor = ({ q, qIdx, editor }) => {
  const branches = q.config?.show_branches || Object.values(q.config?.branches || {}).some(Boolean);
  return <div className="space-y-3">
    {['grid', 'check_grid'].includes(q.type) && <p className="text-xs font-semibold text-slate-500">Kolom jawaban</p>}
    {q.opts.map((opt, optIdx) => <div key={q.optKeys[optIdx]} className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <OptionMarker type={q.type} index={optIdx} />
        <input aria-label={`Opsi ${optIdx + 1}`} value={opt} onChange={e => editor.updateOption(qIdx, optIdx, e.target.value)} className="flex-1 min-w-0 py-2 text-sm border-b outline-none border-slate-200 focus:border-blue-500" />
        {['choice', 'check'].includes(q.type) && <InlineImageUpload label="Gambar opsi" onChange={url => editor.patchQuestion(qIdx, { config: { ...q.config, option_images: { ...q.config?.option_images, [opt]: url } } })} />}
        {q.opts.length > 1 && <button type="button" aria-label={`Hapus opsi ${optIdx + 1}`} onClick={() => editor.removeOption(qIdx, optIdx)} className="px-2 text-xl text-slate-400 hover:text-rose-600">×</button>}
      </div>
      {q.config?.option_images?.[opt] && <div className="flex gap-3"><img src={q.config.option_images[opt]} alt={opt} className="object-contain h-24 ml-6 rounded-lg" /><button type="button" className="text-xs text-rose-600" onClick={() => editor.patchQuestion(qIdx, { config: { ...q.config, option_images: { ...q.config.option_images, [opt]: null } } })}>Hapus gambar</button></div>}
      {branches && ['choice', 'drop'].includes(q.type) && <select aria-label={`Tujuan untuk ${opt}`} value={q.config?.branches?.[opt] || ''} onChange={e => editor.patchQuestion(qIdx, { config: { ...q.config, branches: { ...q.config?.branches, [opt]: e.target.value } } })} className="ml-6 w-[calc(100%_-_1.5rem)] rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900"><option value="">Lanjut ke pertanyaan berikutnya</option>{editor.questions.slice(qIdx + 1).filter(q => q.type === 'section').map(q => <option key={q.config.key} value={q.config.key}>Buka: {stripHtml(q.text) || 'Bagian tanpa judul'}</option>)}<option value="__submit">Kirim formulir</option></select>}
    </div>)}
    {q.config?.allow_other && <div className="flex justify-between p-3 text-sm rounded-lg bg-slate-50 text-slate-400"><span>Lainnya: jawaban responden</span><button type="button" className="text-rose-600" onClick={() => editor.patchQuestion(qIdx, { config: { ...q.config, allow_other: false } })}>×</button></div>}
    <div className="flex flex-wrap gap-2 text-xs font-semibold"><button type="button" onClick={() => editor.addOption(qIdx)} className="text-blue-700">+ Tambahkan opsi</button>{['choice', 'check'].includes(q.type) && !q.config?.allow_other && <><span className="text-slate-400">atau</span><button type="button" onClick={() => editor.patchQuestion(qIdx, { config: { ...q.config, allow_other: true } })} className="text-blue-700">tambahkan “Lainnya”</button></>}</div>
  </div>;
};

const ScaleEditor = ({ q, qIdx, editor }) => (
  <div className="p-4 space-y-3 border border-gray-200 bg-gray-50 rounded-xl">
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold text-gray-600">Label siap pakai</span>
      <select
        value={detectScalePreset(q.opts)}
        onChange={(e) => editor.applyScalePreset(qIdx, e.target.value)}
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
        <span className="flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-700 rounded-full w-7 h-7 bg-blue-50">
          {i + 1}
        </span>
        <input
          type="text"
          value={q.opts?.[i] ?? ''}
          onChange={(e) => editor.updateScaleLabel(qIdx, i, e.target.value)}
          placeholder={`Label untuk skor ${i + 1}`}
          maxLength={100}
          className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:border-blue-600 outline-none"
        />
      </div>
    ))}
  </div>
);

const QuestionBody = ({ q, qIdx, isSelected, editor }) => {
  const config = patch => editor.patchQuestion(qIdx, { config: { ...q.config, ...patch } });
  const hasValidation = q.config?.show_validation || Object.values(q.validation || {}).some(v => v != null && v !== '');
  if (!isSelected) return <div className="text-xs text-slate-400">{QUESTION_TYPES[q.type]}{q.req ? ' · Wajib diisi' : ''}</div>;
  return <div className="space-y-4">
    {!CONTENT_TYPES.includes(q.type) && <InlineImageUpload label="Gambar pertanyaan" onChange={image_url => editor.patchQuestion(qIdx, { image_url })} />}
    {q.image_url && q.type !== 'image' && <div className="flex gap-3"><img src={q.image_url} alt="Gambar pertanyaan" className="max-w-full rounded-lg max-h-52" /><button type="button" className="text-xs text-rose-600" onClick={() => editor.patchQuestion(qIdx, { image_url: null })}>Hapus gambar</button></div>}
    <QuestionPrimaryOptions q={q} onConfig={config} onPatch={patch => editor.patchQuestion(qIdx, patch)} />
    {hasOptions(q.type) && <OptionsEditor q={q} qIdx={qIdx} editor={editor} />}
    {q.type === 'scale' && <ScaleEditor q={q} qIdx={qIdx} editor={editor} />}
    {['short', 'para'].includes(q.type) && <div className="pb-3 text-sm border-b border-dotted border-slate-300 text-slate-400">{q.type === 'short' ? 'Teks jawaban singkat' : 'Teks jawaban panjang'}</div>}
    {['linear', 'rating', 'date', 'time', 'duration', 'video'].includes(q.type) && <div className="pointer-events-none"><ExtendedField q={q} value={undefined} onChange={() => { }} /></div>}
    {['short', 'para', 'check'].includes(q.type) && hasValidation && <ValidationOptions q={q} onChange={patch => editor.patchValidation(qIdx, patch)} />}
    {editor.quiz && !CONTENT_TYPES.includes(q.type) && <QuizAnswerKey q={q} onConfig={config} />}
  </div>;
};

const QuestionFooter = ({ q, qIdx, editor }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-xs border-t border-slate-100">
    <div className="flex items-center gap-2"><button type="button" aria-label="Naikkan pertanyaan" disabled={qIdx === 0} onClick={() => editor.moveQuestion(qIdx, -1)} className="p-2 text-slate-500 disabled:opacity-30">↑</button><button type="button" aria-label="Turunkan pertanyaan" disabled={qIdx === editor.questions.length - 1} onClick={() => editor.moveQuestion(qIdx, 1)} className="p-2 text-slate-500 disabled:opacity-30">↓</button><button type="button" title="Duplikat" aria-label="Duplikat pertanyaan" onClick={() => editor.duplicateQuestion(qIdx)} className="p-2 text-slate-500 hover:text-blue-700"><FaClone /></button><button type="button" title="Hapus" aria-label="Hapus pertanyaan" onClick={() => editor.removeQuestion(qIdx)} className="p-2 text-slate-500 hover:text-rose-600"><FaTrash /></button></div>
    <div className="flex items-center gap-4">{!CONTENT_TYPES.includes(q.type) && <label className="flex items-center gap-2 text-slate-600"><input type="checkbox" checked={q.req} onChange={e => editor.setRequired(qIdx, e.target.checked)} className="accent-blue-700" />Wajib diisi</label>}<QuestionMoreOptions q={q} onConfig={patch => editor.patchQuestion(qIdx, { config: { ...q.config, ...patch } })} onPatch={patch => editor.patchQuestion(qIdx, patch)} /></div>
  </div>
);

const QuestionCard = ({ q, qIdx, isSelected, editor }) => (
  <div id={`survey-item-${q._key}`} tabIndex={-1}
    onDragOver={e => { if (e.dataTransfer.types.includes('application/x-kan-question')) e.preventDefault(); }}
    onDrop={e => { const from = Number(e.dataTransfer.getData('application/x-kan-question')); if (Number.isInteger(from)) { e.preventDefault(); editor.moveQuestion(from, qIdx - from); } }}
    className={`bg-white rounded-2xl border transition-all p-5 shadow-sm space-y-4 ${isSelected
      ? 'border-l-4 border-l-blue-600 border-gray-300 shadow-md ring-1 ring-blue-100'
      : 'border-gray-200 hover:border-gray-300'
      }`}
  >
    <QuestionHeader q={q} qIdx={qIdx} isSelected={isSelected} editor={editor} />
    <QuestionBody q={q} qIdx={qIdx} isSelected={isSelected} editor={editor} />
    {isSelected && <QuestionFooter q={q} qIdx={qIdx} editor={editor} />}
  </div>
);

const SurveyEditTab = ({ surveyId, title, setTitle, desc, setDesc, editor, onImport }) => {
  const { scrollTarget, clearScrollTarget } = editor;
  useEffect(() => {
    if (!scrollTarget) return;
    const card = document.getElementById(`survey-item-${scrollTarget}`);
    if (!card) return;
    const frame = requestAnimationFrame(() => {
      const header = document.querySelector('[data-survey-editor-header]');
      card.style.scrollMarginTop = `${(header?.getBoundingClientRect().height || 160) + 24}px`;
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      card.focus({ preventScroll: true });
      clearScrollTarget(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollTarget, clearScrollTarget]);
  return (
    <div className="mx-auto grid max-w-5xl items-start gap-4 lg:grid-cols-[minmax(0,1fr)_170px]">
      <div className="order-2 min-w-0 space-y-4 lg:order-1">
        <div className="p-6 space-y-4 bg-white border border-t-4 shadow-sm rounded-2xl border-slate-200 border-t-blue-700">
          <input aria-label="Judul kuesioner" value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul kuesioner" className="w-full pb-2 text-2xl font-bold border-0 border-b outline-none border-slate-200 text-slate-900 focus:border-blue-500" />
          <RichTextInput key={`description-${surveyId || 'new'}`} value={desc} onChange={setDesc} placeholder="Deskripsi formulir (opsional)" />
        </div>
        {editor.questions.map((q, qIdx) => <QuestionCard key={q._key} q={q} qIdx={qIdx} isSelected={editor.selectedQIndex === qIdx} editor={editor} />)}
        <button type="button" onClick={() => editor.addQuestion('short')} className="w-full py-4 text-sm font-semibold text-blue-700 bg-white border border-blue-200 border-dashed rounded-xl">+ Tambahkan pertanyaan</button>
      </div>
      <div className="order-1 lg:order-2 lg:sticky lg:top-40"><InsertToolbar onAdd={editor.addQuestion} onImport={onImport} /></div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// KOMPONEN: TAB PRATINJAU
// ══════════════════════════════════════════════════════════════════════

const PreviewDone = ({ onReset, message, summary }) => (
  <div className="p-10 space-y-4 text-center bg-white border border-gray-200 shadow-sm rounded-2xl">
    <div className="flex items-center justify-center w-16 h-16 mx-auto text-3xl font-extrabold rounded-full bg-emerald-100 text-emerald-600">
      <FaCheck />
    </div>
    <h2 className="text-2xl font-extrabold text-gray-900">Terima kasih</h2>
    <p className="max-w-sm mx-auto text-sm text-gray-500 whitespace-pre-wrap">
      {message || 'Jawaban Anda telah berhasil kami terima. Terima kasih atas masukan Anda untuk meningkatkan mutu layanan KAN.'}
    </p>
    <ResponseSummary items={summary} />
    <button
      type="button"
      onClick={onReset}
      className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-blue-700 transition"
    >
      Isi lagi
    </button>
  </div>
);

const SurveyPreviewTab = ({ title, desc, settings, questions, preview }) => {
  const [section, setSection] = useState(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const prepared = useMemo(() => prepareSurveyQuestions(questions.map((q, index) => ({ ...q, id: index, is_required: q.req, options: q.opts })), { shuffle_questions: settings.shuffle_questions }), [questions, settings.shuffle_questions]);
  const pages = splitSurveyPages(visibleQuestions(prepared, preview.answers));
  const pageIndex = Math.min(section, pages.length - 1);
  useEffect(() => { setSection(0); }, [questions]);
  const reset = () => { setSection(0); preview.reset(); };
  const onContinue = () => {
    if (!preview.validatePage(pages[pageIndex])) return;
    if (pageIndex === pages.length - 1) setConfirmSubmit(true);
    else { setSection(pageIndex + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };
  return <SurveyFrame settings={settings}>
    {confirmSubmit && <SubmitConfirmation onCancel={() => setConfirmSubmit(false)} onConfirm={() => { setConfirmSubmit(false); preview.submit({ preventDefault() { } }); }} />}
    {preview.done ? <PreviewDone onReset={reset} message={settings.confirmation_message} summary={settings.show_summary ? visibleQuestions(prepared, preview.answers).filter(q => !CONTENT_TYPES.includes(q.type)).map(q => ({ question_id: q.id, text: q.text, type: q.type, options: q.options, answer: preview.answers[q.id] })) : []} /> : <SurveyForm preview survey={{ title, description: desc, settings, questions: prepared }} pages={pages} pageIndex={pageIndex} answers={preview.answers} errors={preview.errors} onAnswer={preview.setAnswer} onPrevious={() => { setSection(pageIndex - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onContinue={onContinue} onClear={reset} />}
  </SurveyFrame>;
};

// ══════════════════════════════════════════════════════════════════════
// KOMPONEN: TAB BAGIKAN
// ══════════════════════════════════════════════════════════════════════

const SharePublishPrompt = ({ onPublish }) => (
  <div className="p-10 space-y-4 text-center bg-white border border-gray-200 shadow-sm rounded-2xl">
    <h3 className="text-xl font-bold text-gray-900">Kuesioner belum diterbitkan</h3>
    <p className="max-w-md mx-auto text-sm text-gray-500">
      Setelah diterbitkan, kuesioner akan mendapatkan tautan publik dan kode QR resmi yang dapat dibagikan kepada peserta.
    </p>
    <button
      type="button"
      onClick={onPublish}
      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow transition"
    >
      Terbitkan kuesioner sekarang
    </button>
  </div>
);

const ShareLinkCard = ({ survey, link, onToggleActive }) => {
  const [prefilled, setPrefilled] = useState({});
  const handleCopyLink = () => {
    if (!link) return;
    navigator.clipboard.writeText(link).then(
      () => toast.success('Tautan berhasil disalin ke clipboard!'),
      () => toast.error('Gagal menyalin tautan.')
    );
  };

  // FIX: template literal bersarang dipindah ke variabel terpisah
  const prefillQuery = new URLSearchParams(
    Object.fromEntries(
      Object.entries(prefilled)
        .filter(([, v]) => v)
        .map(([k, v]) => [`q_${k}`, v])
    )
  ).toString();
  const prefilledLink = `${link}?${prefillQuery}`;

  return (
    <div className="p-6 space-y-4 bg-white border border-gray-200 shadow-sm rounded-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900">Tautan kuesioner</h3>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full ${survey.is_active
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
        >
          {survey.is_active ? 'Terbuka' : 'Ditutup'}
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          readOnly
          value={link}
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

      <details className="p-4 border rounded-xl border-slate-200"><summary className="text-sm font-bold text-blue-900 cursor-pointer">Sematkan ke website</summary><textarea readOnly rows={3} className="w-full p-3 mt-3 font-mono text-xs rounded-lg bg-slate-50" value={`<iframe src="${link}" title="Kuesioner KAN" width="100%" height="800" frameborder="0"></iframe>`} /></details>
      <details className="p-4 border rounded-xl border-slate-200"><summary className="text-sm font-bold text-blue-900 cursor-pointer">Tautan dengan jawaban awal</summary><div className="mt-3 space-y-3">{survey.questions?.filter(q => ['short', 'para', 'choice', 'drop', 'date', 'time'].includes(q.type)).map(q => <label key={q.id} className="block text-xs text-slate-600">{stripHtml(q.text)}<input className="w-full p-2 mt-1 border rounded-lg border-slate-200" value={prefilled[q.id] || ''} onChange={e => setPrefilled(prev => ({ ...prev, [q.id]: e.target.value }))} /></label>)}<textarea aria-label="Tautan jawaban awal" readOnly className="w-full p-3 text-xs rounded-lg bg-slate-50" value={prefilledLink} /></div></details>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={survey.is_active}
            onChange={onToggleActive}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />{' '}
          Terima jawaban baru
        </label>
      </div>
      <p className="text-xs text-gray-500">
        {survey.is_active
          ? 'Mengubah pertanyaan tidak mengubah tautan atau kode QR yang sudah dicetak.'
          : 'Peserta yang membuka tautan atau memindai QR akan melihat pesan bahwa kuesioner sudah ditutup.'}
      </p>
    </div>
  );
};

const ShareQrCard = ({ survey, title, link }) => {
  const canvasRef = useRef(null);
  useQrCanvas(canvasRef, link);

  const handleDownloadQR = () => {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    a.download = `qr-kuesioner-${survey.code || 'kan'}.png`;
    a.click();
    toast.success('Kode QR berhasil diunduh.');
  };

  return (
    <div className="p-8 space-y-4 text-center bg-white border border-gray-200 shadow-sm rounded-2xl">
      <h3 className="text-lg font-bold text-gray-900">Kode QR</h3>
      <div className="inline-block p-4 bg-white border-2 border-gray-200 shadow-inner rounded-2xl">
        <canvas ref={canvasRef} className="w-64 h-auto max-w-full mx-auto rounded-lg" />
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
  );
};

const SurveyShareTab = ({ survey, title, onPublish, onToggleActive }) => {
  const link = getPublicLink(survey);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {survey?.is_published ? (
        <>
          <ShareLinkCard survey={survey} link={link} onToggleActive={() => onToggleActive(survey.id)} />
          <ShareQrCard survey={survey} title={title} link={link} />
        </>
      ) : (
        <SharePublishPrompt onPublish={() => onPublish(survey?.id)} />
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// KOMPONEN: TAB HASIL
// ══════════════════════════════════════════════════════════════════════

const ResultsLoading = () => (
  <div className="p-12 text-center text-gray-500 bg-white border border-gray-200 rounded-2xl">
    <div className="w-8 h-8 mx-auto mb-3 border-b-2 border-blue-600 rounded-full animate-spin"></div>
    Memuat data hasil kuesioner...
  </div>
);

const ResultsEmpty = () => (
  <div className="p-12 space-y-2 text-center bg-white border border-gray-200 rounded-2xl">
    <h3 className="text-lg font-bold text-gray-800">Belum ada jawaban</h3>
    <p className="text-sm text-gray-500">
      Data statistik dan rincian jawaban akan muncul di sini setelah peserta mengisi kuesioner.
    </p>
  </div>
);

const StatBox = ({ value, label, large = true }) => (
  <div className="p-4 border border-blue-100 bg-blue-50/70 rounded-2xl">
    <span className={`block font-extrabold text-blue-700 ${large ? 'text-3xl' : 'text-xl pt-1'}`}>
      {value}
    </span>
    <span className="text-xs font-semibold text-gray-600">{label}</span>
  </div>
);

const ResultsSummary = ({ survey, stats }) => {
  const handleDownloadCsv = async () => {
    if (!survey?.id) return;
    try {
      const res = await exportAdminSurveyCsv(survey.id);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hasil-kuesioner-${survey.code || survey.id}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('File CSV berhasil diunduh.');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunduh CSV.');
    }
  };

  return (
    <div className="p-6 space-y-5 bg-white border border-gray-200 shadow-sm rounded-2xl">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatBox value={stats.total_responses} label="Total Responden" />
        <StatBox value={stats.average_scale || '-'} label="Rata-rata skala" />
        <StatBox value={stats.last_response_at || '-'} label="Terakhir mengisi" large={false} />
      </div>
    </div>
  );
};

const BarRow = ({ label, count, total, barClass, labelClass = 'truncate pr-2', countClass = 'font-bold flex-shrink-0' }) => {
  const pct = percentOf(count, total);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
        <span className={labelClass}>{label}</span>
        <span className={countClass}>{count} ({pct}%)</span>
      </div>
      <div className="w-full h-3 overflow-hidden rounded-full bg-blue-50">
        <div className={`${barClass} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const OptionCounts = ({ qSum }) => (
  <div className="pt-1 space-y-3">
    {Object.entries(qSum.counts).map(([optName, count]) => (
      <BarRow key={optName} label={optName} count={count} total={qSum.total_answers} barClass="bg-blue-600" />
    ))}
  </div>
);

const ScaleCounts = ({ qSum }) => (
  <div className="pt-1 space-y-3">
    {[5, 4, 3, 2, 1].map((score) => (
      <BarRow
        key={score}
        label={getScaleLabel(qSum, score)}
        count={qSum.scale_counts[score] || 0}
        total={qSum.total_answers}
        barClass="bg-indigo-600"
      />
    ))}
  </div>
);

const SampleAnswers = ({ qSum }) => (
  <div className="pt-1 space-y-2">
    {qSum.sample_answers.length === 0 ? (
      <p className="text-xs italic text-gray-400">Belum ada tanggapan teks.</p>
    ) : (
      withOccurrenceKeys(qSum.sample_answers.slice(0, 4)).map(({ text, key }) => (
        <div
          key={key}
          className="p-3 text-xs italic text-gray-700 border-l-4 bg-gray-50 rounded-xl border-l-blue-600"
        >
          &ldquo;{text}&rdquo;
        </div>
      ))
    )}
    {qSum.sample_answers.length > 4 && (
      <p className="text-[11px] text-gray-400 font-medium">
        + {qSum.total_answers - 4} tanggapan lainnya pada tabel di bawah.
      </p>
    )}
  </div>
);

const isTextType = (type) => !['choice', 'check', 'drop', 'scale', 'linear', 'rating', 'section', 'heading', 'video', 'image'].includes(type);

const QuestionSummary = ({ qSum }) => (
  <div className="min-w-0 p-6 space-y-4 bg-white border border-gray-200 shadow-sm rounded-2xl">
    <div>
      <h4 className="text-base font-bold text-gray-900">
        <RichText html={qSum.text} />
      </h4>
      <span className="text-xs font-medium text-gray-500">{qSum.total_answers} jawaban</span>
    </div>

    {hasOptions(qSum.type) && qSum.counts && <OptionCounts qSum={qSum} />}
    {qSum.type === 'scale' && qSum.scale_counts && <ScaleCounts qSum={qSum} />}
    {['linear', 'rating'].includes(qSum.type) && qSum.counts && <OptionCounts qSum={qSum} />}
    {qSum.grid_counts && Object.entries(qSum.grid_counts).map(([row, counts]) => <div key={row} className="p-3 space-y-2 rounded-xl bg-slate-50"><p className="text-xs font-bold text-blue-950">{row}</p>{Object.entries(counts).map(([column, count]) => <BarRow key={column} label={column} count={count} total={qSum.total_answers} barClass="bg-blue-600" />)}</div>)}
    {isTextType(qSum.type) && qSum.sample_answers && <SampleAnswers qSum={qSum} />}
  </div>
);

const ResponsesTable = ({ detailData }) => {
  const [showAll, setShowAll] = useState(false);
  const questions = detailData.survey?.questions.filter(q => !CONTENT_TYPES.includes(q.type));
  const [gradeOverrides, setGradeOverrides] = useState({});
  const [maxOverrides, setMaxOverrides] = useState({});
  const [query, setQuery] = useState('');
  const isQuiz = Boolean(detailData.survey?.settings?.quiz);
  const responses = detailData.responses?.filter(r => JSON.stringify(r).toLocaleLowerCase().includes(query.toLocaleLowerCase()));

  return (
    <div className="p-6 space-y-4 bg-white border border-gray-200 shadow-sm rounded-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Jawaban per responden</h3>
        <span className="text-xs font-semibold text-gray-500">
          Total: {responses?.length || 0} responden
        </span>
      </div>

      <input aria-label="Cari jawaban" placeholder="Cari isi jawaban…" value={query} onChange={e => setQuery(e.target.value)} className="w-full px-4 py-2 text-sm border rounded-xl border-slate-200" />
      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="min-w-full text-xs divide-y divide-gray-200">
          <thead className="font-bold tracking-wider text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left whitespace-nowrap">Waktu</th>
              {isQuiz && <th className="px-4 py-3 text-left">Nilai</th>}
              {questions?.map((q, qIdx) => (
                <th
                  key={q.id || qIdx}
                  className="max-w-xs px-4 py-3 text-left truncate"
                  title={stripHtml(q.text)}
                >
                  {stripHtml(q.text)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {getVisibleResponses(responses, showAll)?.map((resp, rIdx) => (
              <tr key={resp.id || rIdx} className="hover:bg-gray-50/60">
                <td className="px-4 py-3 font-bold text-gray-600">{rIdx + 1}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{resp.created_at_human}</td>
                {isQuiz && <td className="px-4 py-3"><div className="flex items-center gap-2"><input aria-label={`Nilai responden ${rIdx + 1}`} type="number" min="0" value={gradeOverrides[resp.id] ?? resp.score ?? 0} onChange={e => setGradeOverrides(prev => ({ ...prev, [resp.id]: e.target.value }))} className="w-16 p-1 border rounded border-slate-200" /><button type="button" className="font-bold text-blue-700" onClick={async () => { try { await gradeSurveyResponse(detailData.survey.id, resp.id, { score: Number(gradeOverrides[resp.id] ?? resp.score ?? 0), max_score: Number(maxOverrides[resp.id] ?? resp.max_score ?? 0) }); toast.success('Nilai disimpan.'); } catch { toast.error('Gagal menyimpan nilai.'); } }}>Simpan</button><span>/</span><input aria-label={`Nilai maksimum responden ${rIdx + 1}`} type="number" min="0" value={maxOverrides[resp.id] ?? resp.max_score ?? 0} onChange={e => setMaxOverrides(prev => ({ ...prev, [resp.id]: e.target.value }))} className="w-16 p-1 border rounded border-slate-200" /></div></td>}
                {questions?.map((q) => {
                  const ansVal = resp.answers[q.id];
                  return (
                    <td key={q.id} className="max-w-xs px-4 py-3 text-gray-800 truncate" title={ansVal}>
                      {ansVal || <span className="text-gray-300">-</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {responses?.length > 8 && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="text-xs font-bold text-blue-600 transition hover:text-blue-800"
          >
            {showAll ? 'Tampilkan lebih sedikit' : `Tampilkan semua ${responses.length} responden`}
          </button>
        </div>
      )}
    </div>
  );
};

const SurveyResultsTab = ({ survey, detailData, detailLoading }) => {
  if (detailLoading) return <ResultsLoading />;
  if (isEmptyResult(detailData)) return <ResultsEmpty />;

  return (
    <div className="space-y-6">
      <ResultsSummary survey={survey} stats={detailData.stats} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {detailData.summary?.map((qSum, idx) => (
          <QuestionSummary key={qSum.id || idx} qSum={qSum} />
        ))}
      </div>

      <ResponsesTable detailData={detailData} />
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ══════════════════════════════════════════════════════════════════════


export default function SurveyManagement() {
  const { surveys, stats, loading, fetchSurveys } = useSurveyList();
  const { detailData, detailLoading, fetchSurveyDetail, clearDetail } = useSurveyDetail();

  // View: 'list' | 'detail'. Mode (tab di detail): 'edit' | 'pv' | 'share' | 'res'
  const [view, setView] = useState('list');
  const [mode, setMode] = useState('edit');
  const [currentSurvey, setCurrentSurvey] = useState(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [settings, setSettings] = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [savedSignature, setSavedSignature] = useState('');

  const editor = useQuestionEditor(settings);
  const preview = usePreviewForm(editor.questions);

  const openSurvey = (survey, targetMode = 'edit') => {
    setCurrentSurvey(survey);
    setDialog(null);
    setSavedSignature(surveyFingerprint(survey.title || '', survey.description || '', survey.settings || {}, mapSurveyQuestions(survey.questions)));
    setTitle(survey.title || '');
    setDesc(survey.description || '');
    setSettings(survey.settings || {});
    editor.resetQuestions(survey.questions);
    setMode(targetMode === 'share' ? 'edit' : targetMode);
    setDialog(targetMode === 'share' ? 'share' : null);
    setView('detail');
    preview.reset();

    if (survey.id) void fetchSurveyDetail(survey.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddNew = () => openSurvey(newSurvey(), 'edit');
  const duplicateSurvey = () => {
    const copy = { ...currentSurvey, id: null, code: '', title: `${title} (salinan)`, description: desc, is_published: false, settings: { ...settings }, questions: editor.questions.map(q => ({ ...q, id: undefined, options: q.opts, is_required: q.req })) };
    openSurvey(copy, 'edit');
    toast.success('Salinan siap diedit. Simpan sebagai kuesioner baru.');
  };

  const goToList = () => {
    if (dirty && !window.confirm('Ada perubahan yang belum disimpan. Kembali ke daftar dan abaikan perubahan?')) return;
    setView('list');
    setCurrentSurvey(null);
    clearDetail();
    setDeleteConfirmId(null);
    void fetchSurveys();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (key) => {
    setMode(key);
    if (key === 'res' && currentSurvey?.id) void fetchSurveyDetail(currentSurvey.id);
  };

  const { saving, save } = useSurveySave({
    title,
    desc,
    questions: editor.questions,
    settings,
    currentSurvey,
    onSaved: (saved) => {
      setCurrentSurvey(saved);
      setTitle(saved.title || '');
      setDesc(saved.description || '');
      setSettings(saved.settings || {});
      setSavedSignature(surveyFingerprint(saved.title, saved.description || '', saved.settings || {}, mapSurveyQuestions(saved.questions)));
      editor.replaceQuestions(saved.questions);
      void fetchSurveyDetail(saved.id ?? currentSurvey?.id);
    },
  });

  const { handlePublish, handleToggleActive } = useSurveyStatusActions({
    currentSurvey,
    setCurrentSurvey,
    fetchSurveys,
    fetchSurveyDetail,
  });

  const handleDelete = useSurveyDelete({ currentSurvey, fetchSurveys, goToList, setDeleteConfirmId });

  const publishCurrent = async () => {
    const saved = await save();
    if (!saved?.id) return;
    const body = await callApi(() => publishAdminSurvey(saved.id), 'Gagal memublikasikan kuesioner.');
    if (body) { setCurrentSurvey({ ...saved, is_published: true, is_active: true, code: body.data.code }); toast.success('Kuesioner dipublikasikan.'); }
  };
  const unpublishCurrent = async () => {
    if (!currentSurvey?.id) return;
    const body = await callApi(() => updateAdminSurvey(currentSurvey.id, { title: currentSurvey.title, is_published: false }), 'Gagal membatalkan publikasi.');
    if (body) { setCurrentSurvey(body.data); setDialog(null); toast.success('Publikasi dibatalkan.'); }
  };
  const dirty = surveyFingerprint(title, desc, settings, editor.questions) !== savedSignature;
  useEffect(() => {
    if (view !== 'detail' || !dirty) return;
    const warn = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, view]);

  const detailTabs = {
    edit: (
      <SurveyEditTab
        onImport={() => setDialog('import')}
        surveyId={currentSurvey?.id}
        title={title}
        setTitle={setTitle}
        desc={desc}
        setDesc={setDesc}
        editor={editor}
        saving={saving}
        onSave={save}
        onBack={goToList}
      />
    ),
    settings: <SurveySettings settings={settings} onChange={setSettings} />,
    pv: <SurveyPreviewTab title={title} desc={desc} settings={settings} questions={editor.questions} preview={preview} />,
    share: (
      <SurveyShareTab
        survey={currentSurvey}
        title={title}
        onPublish={handlePublish}
        onToggleActive={handleToggleActive}
      />
    ),
    res: <SurveyResultsTab survey={currentSurvey} detailData={detailData} detailLoading={detailLoading} />,
  };

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="space-y-6">
        {view === 'list' ? <SurveyHeader stats={stats} onAddNew={handleAddNew} /> : <EditorHeader title={title} persisted={Boolean(currentSurvey?.id)} published={currentSurvey?.is_published} mode={mode} onMode={handleTabChange} onBack={goToList} onSave={save} saving={saving} dirty={dirty} onShare={() => setDialog('share')} onTheme={() => setDialog('theme')} onCopy={duplicateSurvey} onUnpublish={() => setDialog('unpublish')} undo={editor.undo} redo={editor.redo} canUndo={editor.canUndo} canRedo={editor.canRedo} />}
        {dialog === 'theme' && <EditorDialog title="Tema formulir" onClose={() => setDialog(null)}><ThemeSettings settings={settings} onChange={setSettings} /></EditorDialog>}
        {dialog === 'import' && <EditorDialog title="Impor pertanyaan" onClose={() => setDialog(null)}><ImportQuestions surveys={surveys} currentId={currentSurvey?.id} onImport={items => { editor.importQuestions(items); setDialog(null); }} /></EditorDialog>}
        {dialog === 'share' && <EditorDialog title="Publikasi & bagikan" wide onClose={() => setDialog(null)}>{dirty && <div className="p-3 mb-4 text-sm border rounded-xl border-amber-200 bg-amber-50 text-amber-800">Ada perubahan yang belum disimpan. <button type="button" onClick={save} disabled={saving} className="font-bold underline">Simpan sekarang</button></div>}<SurveyShareTab survey={currentSurvey} title={title} onPublish={publishCurrent} onToggleActive={handleToggleActive} /></EditorDialog>}
        {dialog === 'unpublish' && <EditorDialog title="Batalkan publikasi?" onClose={() => setDialog(null)}><p className="text-sm text-slate-600">Tautan pengisian tidak dapat diakses sampai kuesioner dipublikasikan kembali. Jawaban yang sudah masuk tetap tersedia.</p><button type="button" disabled={saving} onClick={unpublishCurrent} className="px-4 py-2 mt-5 text-sm font-bold text-white rounded-lg bg-rose-700">Batalkan publikasi</button></EditorDialog>}

        {view === 'list' ? (
          <SurveyListView
            loading={loading}
            surveys={surveys}
            deleteConfirmId={deleteConfirmId}
            onAddNew={handleAddNew}
            onOpen={openSurvey}
            onPublish={handlePublish}
            onToggleActive={handleToggleActive}
            onDelete={handleDelete}
            onAskDelete={setDeleteConfirmId}
            onCancelDelete={() => setDeleteConfirmId(null)}
          />
        ) : (
          detailTabs[mode]
        )}
      </div>
    </AdminLayout>
  );
}
