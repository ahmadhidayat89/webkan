import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicSurvey, submitPublicSurvey, uploadPublicSurveyFile } from '../services/api';
import RichText from '../components/RichText';
import kanLogo from '../assets/kan.png';
import toast, { Toaster } from 'react-hot-toast';
import { FaCheckCircle, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';

const DEFAULT_SCALE_LABELS = ['Sangat Tidak Baik', 'Tidak Baik', 'Cukup', 'Baik', 'Sangat Baik'];
const scaleLabels = (opts) =>
  Array.isArray(opts) && opts.length === 5 && opts.some(Boolean) ? opts : DEFAULT_SCALE_LABELS;

const isMissingAnswer = (value) => value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
const isValidEmail = (value) => {
  const email = String(value);
  const at = email.indexOf('@');
  const domain = email.slice(at + 1);
  const dot = domain.lastIndexOf('.');
  return at > 0 && at === email.lastIndexOf('@') && !/\s/.test(email)
    && dot > 0 && dot < domain.length - 1;
};
const isValidPhone = (value) => {
  const phone = String(value);
  const digits = phone.replace(/\D/g, '');
  return /^\+?[0-9() .-]{7,20}$/.test(phone) && digits.length >= 7 && digits.length <= 15;
};

function validateTextResponse(question, value, rules) {
  const length = value.trim().length;
  if (rules.min_length != null && length < rules.min_length) return `Jawaban minimal ${rules.min_length} karakter.`;
  if (rules.max_length != null && length > rules.max_length) return `Jawaban maksimal ${rules.max_length} karakter.`;

  const answerType = question.type === 'short' ? (rules.answer_type || 'text') : question.type;
  if (answerType === 'email' && !isValidEmail(value)) return 'Masukkan alamat email yang valid.';
  if (answerType === 'phone' && !isValidPhone(value)) return 'Masukkan nomor telepon yang valid (7–15 digit).';
  if (answerType === 'number' && !/^-?\d+(?:[.,]\d+)?$/.test(String(value))) return 'Masukkan angka yang valid.';
  if (answerType === 'text_number' && !/^[\p{L}\p{N}\s.,'-]+$/u.test(String(value))) return 'Gunakan huruf dan angka saja.';
  return null;
}

function validateQuestion(question, value) {
  if (question.is_required && isMissingAnswer(value)) return 'Pertanyaan ini wajib diisi.';
  if (isMissingAnswer(value)) return null;

  if (['short', 'para'].includes(question.type) && typeof value === 'string') {
    return validateTextResponse(question, value, question.validation || {});
  }
  if (question.type === 'check' && Array.isArray(value)) {
    return validateCheckResponse(value, question.validation || {});
  }

  return validateSingleResponse(question, value);
}

function validateCheckResponse(value, rules) {
  if (rules.min_selections != null && value.length < rules.min_selections) return `Pilih minimal ${rules.min_selections} opsi.`;
  if (rules.max_selections != null && value.length > rules.max_selections) return `Pilih maksimal ${rules.max_selections} opsi.`;
  return null;
}

function validateSingleResponse(question, value) {
  switch (question.type) {
    case 'choice':
    case 'drop':
      return question.options?.includes(value) ? null : 'Silakan pilih opsi yang tersedia.';
    case 'email':
      return isValidEmail(value) ? null : 'Masukkan alamat email yang valid.';
    case 'phone':
      return isValidPhone(value) ? null : 'Masukkan nomor telepon yang valid (7–15 digit).';
    case 'file':
      return value?.url && value?.name ? null : 'Silakan unggah berkas.';
    case 'scale':
      return Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 5
        ? null
        : 'Pilih nilai skala antara 1 dan 5.';
    default:
      return null;
  }
}

export default function PublicSurvey() {
  const { code } = useParams();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isClosed, setIsClosed] = useState(false);

  // Respondent answers & errors
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState({});

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        setLoading(true);
        const res = await getPublicSurvey(code);
        if (res.data?.success) {
          const data = res.data.data;
          setSurvey(data);
          if (!data.is_active) {
            setIsClosed(true);
          }
        }
      } catch (err) {
        console.error(err);
        if (err.response?.status === 404) {
          setErrorMsg('Kuesioner tidak ditemukan atau belum diterbitkan.');
        } else {
          setErrorMsg('Terjadi kesalahan saat memuat kuesioner.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      void fetchSurvey();
    }
  }, [code]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!survey || !survey.questions) return;

    // Validate configured question constraints before posting responses.
    const errs = {};
    survey.questions.forEach((question) => {
      const error = validateQuestion(question, answers[question.id]);
      if (error) errs[question.id] = error;
    });

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Mohon periksa kembali jawaban yang ditandai.');
      const firstErrEl = document.querySelector('.survey-error-msg');
      if (firstErrEl) {
        firstErrEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const res = await submitPublicSurvey(code, { answers });
      if (res.data?.success) {
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
      toast.error(err.response?.data?.message || 'Gagal mengirimkan jawaban. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 font-medium">Memuat kuesioner...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center text-2xl">
            <FaExclamationTriangle />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Kuesioner Tidak Tersedia</h2>
          <p className="text-sm text-gray-600">{errorMsg}</p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800"
            >
              <FaArrowLeft className="text-xs" /> Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fc] py-8 px-4 sm:px-6">
      <Toaster position="top-right" />
      <div className="max-w-2xl mx-auto space-y-6">

        {/* KAN Branding Header */}
        <header className="flex items-center justify-between bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-6">
            <img src={kanLogo} alt="Logo KAN" className="h-8 w-auto object-contain" />
            <div className="flex flex-col justify-center leading-none">
              <span className="block text-xs font-extrabold text-blue-900 tracking-wider uppercase">
                Komite Akreditasi Nasional
              </span>
              <span className="text-[11px] text-gray-500 font-medium">Kuesioner & Survei Layanan</span>
            </div>
          </div>
          <Link
            to="/"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
          >
            Website Utama &rarr;
          </Link>
        </header>

        {isClosed ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 mx-auto flex items-center justify-center text-3xl font-extrabold">
              <FaExclamationTriangle />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">{survey?.title}</h2>
            <div className="inline-block px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full border border-rose-200">
              Kuesioner Ditutup
            </div>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Kuesioner ini sudah selesai atau saat ini sedang tidak menerima tanggapan baru. Terima kasih atas perhatian Anda.
            </p>
          </div>
        ) : submitted ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-3xl font-extrabold">
              <FaCheckCircle />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Terima Kasih!</h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Jawaban Anda telah berhasil kami terima. Pendapat dan masukan Anda sangat berharga bagi peningkatan mutu layanan Komite Akreditasi Nasional (KAN).
            </p>
            <div className="pt-4">
              <Link
                to="/"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Survey Title & Description Banner */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-900 text-white rounded-2xl p-6 sm:p-8 shadow-md space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{survey?.title}</h1>
              {survey?.description && <RichText html={survey.description} block className="text-blue-100 text-sm sm:text-base leading-relaxed opacity-95" />}
              <div className="pt-2 text-xs text-blue-200 flex items-center gap-2">
                <span>Tanda <span className="text-red-300 font-bold">*</span> wajib diisi</span>
              </div>
            </div>

            {/* Questions List */}
            {survey?.questions?.map((q, idx) => (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-3"
              >
                <label className="block text-base font-bold text-gray-900">
                  {idx + 1}. <RichText html={q.text} />
                  {q.is_required && <span className="text-rose-600 ml-1 font-bold">*</span>}
                </label>
                {q.image_url && <img src={q.image_url} alt="Ilustrasi pertanyaan" className="max-h-72 w-auto rounded-xl object-contain" />}

                {/* Question Inputs */}
                {q.type === 'short' && (
                  <input
                    type={q.validation?.answer_type === 'email' ? 'email' : q.validation?.answer_type === 'number' ? 'number' : 'text'}
                    inputMode={q.validation?.answer_type === 'phone' ? 'tel' : q.validation?.answer_type === 'number' ? 'decimal' : undefined}
                    placeholder={q.validation?.answer_type === 'email' ? 'nama@contoh.com' : q.validation?.answer_type === 'phone' ? '+62 812 3456 7890' : 'Jawaban Anda'}
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="w-full text-sm border-0 border-b-2 border-gray-200 focus:border-blue-600 outline-none pb-1.5 transition"
                  />
                )}

                {q.type === 'para' && (
                  <textarea
                    placeholder="Jawaban Anda"
                    rows={3}
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="w-full text-sm border-0 border-b-2 border-gray-200 focus:border-blue-600 outline-none pb-1.5 transition resize-y"
                  />
                )}

                {q.type === 'email' && <input type="email" autoComplete="email" placeholder="nama@contoh.com" value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600" />}

                {q.type === 'phone' && <input type="tel" autoComplete="tel" placeholder="+62 812 3456 7890" value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600" />}

                {q.type === 'file' && <div className="space-y-2">
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv" disabled={uploading[q.id]} onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 10 * 1024 * 1024) { toast.error('Ukuran file maksimal 10 MB.'); e.target.value = ''; return; }
                    setUploading((prev) => ({ ...prev, [q.id]: true }));
                    try {
                      const result = await uploadPublicSurveyFile(code, q.id, file);
                      setAnswers((prev) => ({ ...prev, [q.id]: result.data.data }));
                      setErrors((prev) => ({ ...prev, [q.id]: undefined }));
                    } catch (error) {
                      toast.error(error.response?.data?.message || 'Gagal mengunggah file.');
                    } finally {
                      setUploading((prev) => ({ ...prev, [q.id]: false }));
                      e.target.value = '';
                    }
                  }} className="w-full text-sm" />
                  {uploading[q.id] && <p className="text-xs text-blue-600">Mengunggah file...</p>}
                  {answers[q.id]?.url && <div className="flex items-center gap-2 text-sm"><a href={answers[q.id].url} target="_blank" rel="noreferrer" className="text-blue-700 underline">{answers[q.id].name}</a><button type="button" onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: undefined }))} className="text-xs text-rose-600">Hapus</button></div>}
                  <p className="text-xs text-gray-500">PDF, Office, gambar, TXT, atau CSV; maksimal 10 MB.</p>
                </div>}

                {q.type === 'choice' && (
                  <div className="space-y-2.5 pt-1">
                    {q.options?.map((opt, oIdx) => (
                      <label key={oIdx} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:text-blue-700">
                        <input
                          type="radio"
                          name={`q_${q.id}`}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'check' && (
                  <div className="space-y-2.5 pt-1">
                    {q.options?.map((opt, oIdx) => {
                      const cur = answers[q.id] || [];
                      const isChecked = cur.includes(opt);
                      return (
                        <label key={oIdx} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:text-blue-700">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...cur, opt]
                                : cur.filter((x) => x !== opt);
                              setAnswers({ ...answers, [q.id]: next });
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
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-600"
                  >
                    <option value="">-- Silakan pilih --</option>
                    {q.options?.map((opt, oIdx) => (
                      <option key={oIdx} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                {q.type === 'scale' && (
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-gray-50/80 p-3 rounded-xl border border-gray-200">
                    {scaleLabels(q.options).map((label, i) => {
                      const n = i + 1;
                      return (
                        <label
                          key={n}
                          className={`flex sm:flex-col items-center gap-3 sm:gap-2 p-2 rounded-lg cursor-pointer sm:text-center transition ${
                            Number(answers[q.id]) === n ? 'bg-blue-50' : 'hover:bg-white'
                          }`}
                        >
                          <span className="text-sm font-bold text-gray-800 w-5 sm:w-auto">{n}</span>
                          <input
                            type="radio"
                            name={`scale_${q.id}`}
                            value={n}
                            checked={Number(answers[q.id]) === n}
                            onChange={(e) => setAnswers({ ...answers, [q.id]: Number(e.target.value) })}
                            className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600 leading-snug sm:min-h-[2rem] break-words">{label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {errors[q.id] && (
                  <p className="survey-error-msg text-xs text-rose-600 font-semibold mt-1">
                    {errors[q.id]}
                  </p>
                )}
              </div>
            ))}

            {/* Submit button */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting || Object.values(uploading).some(Boolean)}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl text-sm shadow-md hover:shadow-lg transition disabled:opacity-50"
              >
                {submitting ? 'Mengirimkan...' : 'Kirim Jawaban'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
