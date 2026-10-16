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
    validation: { ...q.validation, ...(['email', 'phone'].includes(q.type) && { answer_type: q.type }) },
    req: Boolean(q.is_required),
    opts,
    optKeys: newOptKeys(opts),
  };
};

const mapSurveyQuestions = (surveyQuestions = []) =>
  surveyQuestions.length > 0 ? surveyQuestions.map(mapSurveyQuestion) : [blankQuestion()];

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

// ── Helper murni umum ──

const toOptionalNumber = (value) => (value === '' ? undefined : Number(value));

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
  if (hasInvalidValidationRule(questions)) {
    return 'Rentang validasi tidak sesuai. Periksa batas minimum dan maksimum.';
  }
  return null;
};

const buildSurveyPayload = ({ title, desc, survey, questions }) => ({
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
  return {
    ...q,
    type: newType,
    opts,
    optKeys: opts === q.opts ? q.optKeys : newOptKeys(opts),
  };
};

const collectPreviewErrors = (questions, answers) =>
  questions.reduce((errors, question, index) => {
    const error = validatePreviewQuestion(question, answers[index]);
    if (error) errors[index] = error;
    return errors;
  }, {});

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

function useQuestionEditor() {
  const [questions, setQuestions] = useState([]);
  const [selectedQIndex, setSelectedQIndex] = useState(0);

  const resetQuestions = (surveyQuestions) => {
    setQuestions(mapSurveyQuestions(surveyQuestions));
    setSelectedQIndex(0);
  };

  const replaceQuestions = (surveyQuestions) => setQuestions(mapSurveyQuestions(surveyQuestions));

  const addQuestion = () => {
    setQuestions((prev) => [...prev, blankQuestion()]);
    setSelectedQIndex(questions.length);
  };

  const duplicateQuestion = (idx) => {
    setQuestions((prev) => insertAt(prev, idx + 1, cloneQuestion(prev[idx])));
    setSelectedQIndex(idx + 1);
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
    setQuestions((prev) => mapAt(prev, qIdx, (q) => withOption(q, optIdx, val)));

  const removeOption = (qIdx, optIdx) =>
    setQuestions((prev) => mapAt(prev, qIdx, (q) => withoutOption(q, optIdx)));

  return {
    questions,
    selectedQIndex,
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

  const setAnswer = (idx, value) => setAnswers((prev) => ({ ...prev, [idx]: value }));

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
    const errs = collectPreviewErrors(questions, answers);

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Mohon lengkapi pertanyaan yang wajib diisi.');
    } else {
      setErrors({});
      setDone(true);
      toast.success('Jawaban pratinjau berhasil divalidasi!');
    }
  };

  return { answers, errors, done, setAnswer, reset, clearAnswers, submit };
}

function useSurveySave({ title, desc, questions, currentSurvey, onSaved }) {
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
      const payload = buildSurveyPayload({ title, desc, survey: currentSurvey, questions });
      const res = await persistSurvey(currentSurvey, payload);

      if (res.data?.success) {
        toast.success(saveSuccessMessage(isUpdate));
        onSaved(res.data.data);
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

const NumberField = ({ label, value, min, max, onChange }) => (
  <label className="text-xs font-semibold text-gray-600">
    {label}
    <input
      type="number"
      min={min}
      max={max}
      value={value ?? ''}
      onChange={(e) => onChange(toOptionalNumber(e.target.value))}
      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
    />
  </label>
);

const QuestionSettings = ({ q, onPatch, onPatchValidation }) => {
  const handleImageChange = async (e) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const result = await uploadSurveyImage(file);
      onPatch({ image_url: result.data?.data?.url });
      toast.success('Gambar berhasil diunggah.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal mengunggah gambar.');
    }
    input.value = '';
  };

  const isText = ['short', 'para'].includes(q.type);

  return (
    <div className="mb-4 space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
      <label className="block text-xs font-bold text-gray-600">
        Unggah gambar pertanyaan (maks. 5 MB){' '}
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImageChange}
          className="mt-2 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal"
        />
      </label>

      {q.image_url && (
        <div className="flex items-start gap-3">
          <img src={q.image_url} alt="Pratinjau gambar pertanyaan" className="max-h-48 rounded-lg object-contain" />
          <button
            type="button"
            onClick={() => onPatch({ image_url: '' })}
            className="text-xs font-semibold text-rose-600"
          >
            Hapus gambar
          </button>
        </div>
      )}

      {q.type === 'short' && (
        <label className="block text-xs font-bold text-gray-600">
          Validasi jawaban{' '}
          <select
            value={q.validation?.answer_type || 'text'}
            onChange={(e) => onPatchValidation({ answer_type: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal"
          >
            <option value="text_number">Teks</option>
            <option value="email">Email</option>
            <option value="phone">Nomor telepon</option>
            <option value="number">Angka</option>
          </select>
        </label>
      )}

      {isText && (
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Minimal karakter" min="0" max="10000" value={q.validation?.min_length}
            onChange={(v) => onPatchValidation({ min_length: v })} />
          <NumberField label="Maksimal karakter" min="1" max="10000" value={q.validation?.max_length}
            onChange={(v) => onPatchValidation({ max_length: v })} />
        </div>
      )}

      {q.type === 'check' && (
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Minimal pilihan" min="0" max={q.opts.length} value={q.validation?.min_selections}
            onChange={(v) => onPatchValidation({ min_selections: v })} />
          <NumberField label="Maksimal pilihan" min="1" max={q.opts.length} value={q.validation?.max_selections}
            onChange={(v) => onPatchValidation({ max_selections: v })} />
        </div>
      )}

      <p className="text-[11px] text-gray-500">Aturan ini diterapkan saat responden mengirim jawaban.</p>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// KOMPONEN: FIELD PRATINJAU PER TIPE PERTANYAAN
// ══════════════════════════════════════════════════════════════════════

const SHORT_INPUT = {
  email: { type: 'email', placeholder: 'nama@contoh.com' },
  phone: { type: 'text', inputMode: 'tel', placeholder: '+62 812 3456 7890' },
  number: { type: 'number', inputMode: 'decimal', placeholder: 'Jawaban Anda' },
};
const DEFAULT_SHORT = { type: 'text', placeholder: 'Jawaban Anda' };

const PreviewShort = ({ q, value, onChange }) => {
  const cfg = SHORT_INPUT[q.validation?.answer_type] || DEFAULT_SHORT;
  return (
    <input
      type={cfg.type}
      inputMode={cfg.inputMode}
      placeholder={cfg.placeholder}
      minLength={q.validation?.min_length}
      maxLength={q.validation?.max_length}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-sm border-0 border-b-2 border-gray-200 focus:border-blue-600 outline-none pb-1.5 transition"
    />
  );
};

const PreviewPara = ({ q, value, onChange }) => (
  <textarea
    placeholder="Jawaban Anda"
    rows={3}
    minLength={q.validation?.min_length}
    maxLength={q.validation?.max_length}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    className="w-full text-sm border-0 border-b-2 border-gray-200 focus:border-blue-600 outline-none pb-1.5 transition resize-y"
  />
);

// Tipe lama 'email' dan 'phone' (sebelum jadi validasi pada jawaban singkat)
const PreviewLegacyInput = ({ q, value, onChange }) => (
  <input
    type={q.type === 'email' ? 'email' : 'tel'}
    placeholder={q.type === 'email' ? 'nama@contoh.com' : '+62 812 3456 7890'}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
  />
);

const PreviewFile = () => (
  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
    Kolom unggah file ditampilkan pada survei yang diterbitkan.
  </div>
);

const PreviewChoice = ({ q, idx, value, onChange }) => (
  <div className="space-y-2 pt-1">
    {q.opts.map((opt, oIdx) => (
      <label key={q.optKeys[oIdx]} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
        <input
          type="radio"
          name={`preview_q_${idx}`}
          value={opt}
          checked={value === opt}
          onChange={(e) => onChange(e.target.value)}
          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
        />
        <span>{opt}</span>
      </label>
    ))}
  </div>
);

const PreviewCheck = ({ q, value, onChange }) => {
  const current = value || [];
  const toggle = (opt, checked) =>
    onChange(checked ? [...current, opt] : current.filter((x) => x !== opt));

  return (
    <div className="space-y-2 pt-1">
      {q.opts.map((opt, oIdx) => (
        <label key={q.optKeys[oIdx]} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={current.includes(opt)}
            onChange={(e) => toggle(opt, e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
};

const PreviewDrop = ({ q, value, onChange }) => (
  <select
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-600"
  >
    <option value="">-- Pilih salah satu --</option>
    {q.opts.map((opt, oIdx) => (
      <option key={q.optKeys[oIdx]} value={opt}>{opt}</option>
    ))}
  </select>
);

const PreviewScale = ({ q, idx, value, onChange }) => (
  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
    {[1, 2, 3, 4, 5].map((n) => (
      <label
        key={n}
        className={`flex sm:flex-col items-center gap-3 sm:gap-2 p-2 rounded-lg cursor-pointer sm:text-center transition ${
          Number(value) === n ? 'bg-blue-50' : 'hover:bg-white'
        }`}
      >
        <span className="text-sm font-bold text-gray-800 w-5 sm:w-auto">{n}</span>
        <input
          type="radio"
          name={`preview_scale_${idx}`}
          value={n}
          checked={Number(value) === n}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-5 h-5 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-xs text-gray-600 leading-snug sm:min-h-[2rem] break-words">
          {q.opts?.[n - 1] || ''}
        </span>
      </label>
    ))}
  </div>
);

const PREVIEW_FIELDS = {
  short: PreviewShort,
  para: PreviewPara,
  email: PreviewLegacyInput,
  phone: PreviewLegacyInput,
  file: PreviewFile,
  choice: PreviewChoice,
  check: PreviewCheck,
  drop: PreviewDrop,
  scale: PreviewScale,
};

const PreviewField = ({ q, idx, value, onChange }) => {
  const Field = PREVIEW_FIELDS[q.type];
  return Field ? <Field q={q} idx={idx} value={value} onChange={onChange} /> : null;
};

// ══════════════════════════════════════════════════════════════════════
// KOMPONEN: HEADER
// ══════════════════════════════════════════════════════════════════════

const HeaderSubtitle = ({ view, desc }) => {
  if (view === 'list') {
    return <p className="text-blue-100 text-sm mt-1 max-w-xl">Buat kuesioner, bagikan lewat kode QR, dan lihat hasilnya secara instan.</p>;
  }
  if (desc) {
    return <RichText html={desc} block className="text-blue-100 text-sm mt-1 max-w-xl" />;
  }
  return <p className="text-blue-100 text-sm mt-1 max-w-xl">Tanpa deskripsi singkat.</p>;
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
    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
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

const DETAIL_TABS = [
  { key: 'edit', label: 'Susun' },
  { key: 'pv', label: 'Pratinjau' },
  { key: 'share', label: 'Bagikan' },
  { key: 'res', label: 'Hasil' },
];

const DetailTabNav = ({ mode, onTabChange }) => (
  <nav className="flex items-center bg-white/15 p-1 rounded-full backdrop-blur-sm">
    {DETAIL_TABS.map((tab) => (
      <button
        key={tab.key}
        onClick={() => onTabChange(tab.key)}
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
);

const SurveyHeader = ({ view, mode, title, desc, stats, onBack, onAddNew, onTabChange }) => (
  <section className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
        <FaClipboardList className="text-2xl text-white" />
      </div>
      <HeaderText view={view} title={title} desc={desc} onBack={onBack} />
    </div>

    {view === 'list'
      ? <ListHeaderActions stats={stats} onAddNew={onAddNew} />
      : <DetailTabNav mode={mode} onTabChange={onTabChange} />}
  </section>
);

// ══════════════════════════════════════════════════════════════════════
// KOMPONEN: DAFTAR KUESIONER
// ══════════════════════════════════════════════════════════════════════

const ListLoading = () => (
  <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
    Memuat daftar kuesioner...
  </div>
);

const ListEmpty = ({ onAddNew }) => (
  <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
    <h3 className="text-lg font-bold text-gray-800 mb-1">Belum ada kuesioner</h3>
    <p className="text-sm text-gray-500 mb-4">Tekan tombol Tambah Kuesioner untuk membuat kuesioner pertama Anda.</p>
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
  <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
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
        <span className="text-xs text-rose-600 font-semibold">Yakin hapus?</span>
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
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow space-y-3">
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

      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium">
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
  <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
    <div className="flex-1 w-full">
      <button
        type="button"
        onClick={() => editor.setSelectedQIndex(qIdx)}
        className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1"
      >
        Pertanyaan {qIdx + 1}
      </button>

      {isSelected ? (
        <RichTextInput
          key={q._key}
          value={q.text}
          autoFocus
          onChange={(html) => editor.setText(qIdx, html)}
        />
      ) : (
        <QuestionTextPreview html={q.text} />
      )}
    </div>
    <div className="w-full sm:w-48 flex-shrink-0">
      <select
        value={q.type}
        onChange={(e) => editor.changeQuestionType(qIdx, e.target.value)}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:border-blue-600 outline-none"
      >
        {Object.entries(QUESTION_TYPES).map(([k, label]) => (
          <option key={k} value={k}>{label}</option>
        ))}
      </select>
    </div>
  </div>
);

const OptionMarker = ({ type, index }) => {
  if (type === 'choice') return <div className="w-4 h-4 rounded-full border-2 border-gray-400 flex-shrink-0" />;
  if (type === 'check') return <div className="w-4 h-4 rounded border-2 border-gray-400 flex-shrink-0" />;
  return <span className="text-xs font-bold text-gray-400 w-4">{index + 1}.</span>;
};

const OptionsEditor = ({ q, qIdx, editor }) => (
  <div className="space-y-2">
    {q.opts.map((opt, optIdx) => (
      <div key={q.optKeys[optIdx]} className="flex items-center gap-2.5">
        <OptionMarker type={q.type} index={optIdx} />
        <input
          type="text"
          value={opt}
          onChange={(e) => editor.updateOption(qIdx, optIdx, e.target.value)}
          className="flex-1 text-sm border-0 border-b border-gray-200 focus:border-blue-600 outline-none pb-1 transition"
        />
        {q.opts.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              editor.removeOption(qIdx, optIdx);
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
        editor.addOption(qIdx);
      }}
      className="text-xs font-bold text-blue-600 hover:text-blue-800 pt-1 flex items-center gap-1"
    >
      + Tambah opsi
    </button>
  </div>
);

const ScaleEditor = ({ q, qIdx, editor }) => (
  <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
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
        <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
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

const QuestionBody = ({ q, qIdx, isSelected, editor }) => (
  <div className="pt-2">
    {isSelected && (
      <QuestionSettings
        q={q}
        onPatch={(patch) => editor.patchQuestion(qIdx, patch)}
        onPatchValidation={(patch) => editor.patchValidation(qIdx, patch)}
      />
    )}

    {hasOptions(q.type) && <OptionsEditor q={q} qIdx={qIdx} editor={editor} />}

    {q.type === 'scale' && <ScaleEditor q={q} qIdx={qIdx} editor={editor} />}

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
);

const QuestionFooter = ({ q, qIdx, editor }) => (
  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          editor.duplicateQuestion(qIdx);
        }}
        className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 font-semibold"
      >
        <FaClone className="text-xs" /> Duplikat
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          editor.removeQuestion(qIdx);
        }}
        className="flex items-center gap-1.5 text-gray-600 hover:text-rose-600 font-semibold"
      >
        <FaTrash className="text-xs" /> Hapus
      </button>
    </div>
    <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
      <input
        type="checkbox"
        checked={q.req}
        onChange={(e) => editor.setRequired(qIdx, e.target.checked)}
        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
      />{' '}
      Wajib diisi
    </label>
  </div>
);

const QuestionCard = ({ q, qIdx, isSelected, editor }) => (
  <div
    className={`bg-white rounded-2xl border transition-all p-5 shadow-sm space-y-4 ${
      isSelected
        ? 'border-l-4 border-l-blue-600 border-gray-300 shadow-md ring-1 ring-blue-100'
        : 'border-gray-200 hover:border-gray-300'
    }`}
  >
    <QuestionHeader q={q} qIdx={qIdx} isSelected={isSelected} editor={editor} />
    <QuestionBody q={q} qIdx={qIdx} isSelected={isSelected} editor={editor} />
    {isSelected && <QuestionFooter q={q} qIdx={qIdx} editor={editor} />}
  </div>
);

const SurveyEditTab = ({ surveyId, title, setTitle, desc, setDesc, editor, saving, onSave, onBack }) => (
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
          key={`description-${surveyId || 'new'}`}
          value={desc}
          onChange={setDesc}
          placeholder="Deskripsi singkat mengenai tujuan kuesioner..."
        />
      </div>
    </div>

    {/* List Pertanyaan */}
    {editor.questions.map((q, qIdx) => (
      <QuestionCard
        key={q._key}
        q={q}
        qIdx={qIdx}
        isSelected={editor.selectedQIndex === qIdx}
        editor={editor}
      />
    ))}

    {/* Tombol Tambah Pertanyaan */}
    <button
      type="button"
      onClick={editor.addQuestion}
      className="w-full py-4 border-2 border-dashed border-blue-400 hover:border-blue-600 text-blue-600 hover:text-blue-800 font-bold rounded-2xl text-sm transition-all bg-white hover:bg-blue-50/50 flex items-center justify-center gap-2 shadow-sm"
    >
      <FaPlus /> Tambah Pertanyaan
    </button>

    {/* Tombol Aksi Simpan */}
    <div className="pt-4 flex items-center justify-end gap-3">
      <button
        type="button"
        onClick={onBack}
        className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold text-sm transition"
      >
        Kembali
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition disabled:opacity-50"
      >
        {saving ? 'Menyimpan...' : 'Simpan Kuesioner'}
      </button>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════
// KOMPONEN: TAB PRATINJAU
// ══════════════════════════════════════════════════════════════════════

const PreviewDone = ({ onReset }) => (
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
      onClick={onReset}
      className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-blue-700 transition"
    >
      Isi lagi
    </button>
  </div>
);

const PreviewQuestionCard = ({ q, idx, value, error, onChange }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-3">
    <label className="block text-base font-bold text-gray-900">
      {stripHtml(q.text)
        ? <RichText html={q.text} />
        : `Pertanyaan ${idx + 1}`}
      {q.req && <span className="text-rose-500 ml-1 font-bold">*</span>}
    </label>

    {q.image_url && (
      <img src={q.image_url} alt="Ilustrasi pertanyaan" className="max-h-72 w-auto rounded-xl object-contain" />
    )}

    <PreviewField q={q} idx={idx} value={value} onChange={onChange} />

    {error && <p className="text-xs text-rose-600 font-semibold mt-1">{error}</p>}
  </div>
);

const SurveyPreviewTab = ({ title, desc, questions, preview }) => {
  if (preview.done) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <PreviewDone onReset={preview.reset} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <form onSubmit={preview.submit} className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-extrabold text-gray-900">{title || 'Kuesioner tanpa judul'}</h2>
          {desc && <RichText html={desc} block className="text-sm text-gray-600 mt-2" />}
        </div>

        {questions.map((q, idx) => (
          <PreviewQuestionCard
            key={q._key}
            q={q}
            idx={idx}
            value={preview.answers[idx]}
            error={preview.errors[idx]}
            onChange={(value) => preview.setAnswer(idx, value)}
          />
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
            onClick={preview.clearAnswers}
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold px-5 py-2.5 rounded-xl text-sm transition"
          >
            Kosongkan
          </button>
        </div>
      </form>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// KOMPONEN: TAB BAGIKAN
// ══════════════════════════════════════════════════════════════════════

const SharePublishPrompt = ({ onPublish }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-4 shadow-sm">
    <h3 className="text-xl font-bold text-gray-900">Kuesioner belum diterbitkan</h3>
    <p className="text-sm text-gray-500 max-w-md mx-auto">
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
  const handleCopyLink = () => {
    if (!link) return;
    navigator.clipboard.writeText(link).then(
      () => toast.success('Tautan berhasil disalin ke clipboard!'),
      () => toast.error('Gagal menyalin tautan.')
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900">Tautan kuesioner</h3>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full ${
            survey.is_active
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {survey.is_active ? 'Terbuka' : 'Ditutup'}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
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

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={survey.is_active}
            onChange={onToggleActive}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
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
    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Kode QR</h3>
      <div className="inline-block p-4 bg-white rounded-2xl border-2 border-gray-200 shadow-inner">
        <canvas ref={canvasRef} className="max-w-full h-auto w-64 mx-auto rounded-lg" />
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
  <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
    Memuat data hasil kuesioner...
  </div>
);

const ResultsEmpty = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-2">
    <h3 className="text-lg font-bold text-gray-800">Belum ada jawaban</h3>
    <p className="text-sm text-gray-500">
      Data statistik dan rincian jawaban akan muncul di sini setelah peserta mengisi kuesioner.
    </p>
  </div>
);

const StatBox = ({ value, label, large = true }) => (
  <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4">
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
      <div className="w-full bg-blue-50 h-3 rounded-full overflow-hidden">
        <div className={`${barClass} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const OptionCounts = ({ qSum }) => (
  <div className="space-y-3 pt-1">
    {Object.entries(qSum.counts).map(([optName, count]) => (
      <BarRow key={optName} label={optName} count={count} total={qSum.total_answers} barClass="bg-blue-600" />
    ))}
  </div>
);

const ScaleCounts = ({ qSum }) => (
  <div className="space-y-3 pt-1">
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
  <div className="space-y-2 pt-1">
    {qSum.sample_answers.length === 0 ? (
      <p className="text-xs text-gray-400 italic">Belum ada tanggapan teks.</p>
    ) : (
      withOccurrenceKeys(qSum.sample_answers.slice(0, 4)).map(({ text, key }) => (
        <div
          key={key}
          className="p-3 bg-gray-50 rounded-xl border-l-4 border-l-blue-600 text-xs text-gray-700 italic"
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

const isTextType = (type) => type === 'short' || type === 'para';

const QuestionSummary = ({ qSum }) => (
  <div className="min-w-0 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
    <div>
      <h4 className="text-base font-bold text-gray-900">
        <RichText html={qSum.text} />
      </h4>
      <span className="text-xs text-gray-500 font-medium">{qSum.total_answers} jawaban</span>
    </div>

    {hasOptions(qSum.type) && qSum.counts && <OptionCounts qSum={qSum} />}
    {qSum.type === 'scale' && qSum.scale_counts && <ScaleCounts qSum={qSum} />}
    {isTextType(qSum.type) && qSum.sample_answers && <SampleAnswers qSum={qSum} />}
  </div>
);

const ResponsesTable = ({ detailData }) => {
  const [showAll, setShowAll] = useState(false);
  const questions = detailData.survey?.questions;
  const responses = detailData.responses;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Jawaban per responden</h3>
        <span className="text-xs text-gray-500 font-semibold">
          Total: {responses?.length || 0} responden
        </span>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50 text-gray-700 font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left whitespace-nowrap">Waktu</th>
              {questions?.map((q, qIdx) => (
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
            {getVisibleResponses(responses, showAll)?.map((resp, rIdx) => (
              <tr key={resp.id || rIdx} className="hover:bg-gray-50/60">
                <td className="px-4 py-3 font-bold text-gray-600">{rIdx + 1}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{resp.created_at_human}</td>
                {questions?.map((q) => {
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

      {responses?.length > 8 && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const editor = useQuestionEditor();
  const preview = usePreviewForm(editor.questions);

  const openSurvey = (survey, targetMode = 'edit') => {
    setCurrentSurvey(survey);
    setTitle(survey.title || '');
    setDesc(survey.description || '');
    editor.resetQuestions(survey.questions);
    setMode(targetMode);
    setView('detail');
    preview.reset();

    if (survey.id) void fetchSurveyDetail(survey.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddNew = () => openSurvey(newSurvey(), 'edit');

  const goToList = () => {
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
    currentSurvey,
    onSaved: (saved) => {
      setCurrentSurvey(saved);
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

  const detailTabs = {
    edit: (
      <SurveyEditTab
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
    pv: <SurveyPreviewTab title={title} desc={desc} questions={editor.questions} preview={preview} />,
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
        <SurveyHeader
          view={view}
          mode={mode}
          title={title}
          desc={desc}
          stats={stats}
          onBack={goToList}
          onAddNew={handleAddNew}
          onTabChange={handleTabChange}
        />

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
