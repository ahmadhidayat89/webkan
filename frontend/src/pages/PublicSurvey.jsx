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
      fetchSurvey();
    }
  }, [code]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!survey || !survey.questions) return;

    // Validate required questions
    const errs = {};
    survey.questions.forEach((q) => {
      if (q.is_required) {
        const val = answers[q.id];
        if (val === undefined || val === null || val === '') {
          errs[q.id] = 'Pertanyaan ini wajib diisi.';
        } else if (Array.isArray(val) && val.length === 0) {
          errs[q.id] = 'Pertanyaan ini wajib diisi.';
        }
      }
      const rules = q.validation || {};
      const val = answers[q.id];
      if (errs[q.id] || val === undefined || val === null || val === '') return;
      if (['short', 'para'].includes(q.type) && typeof val === 'string') {
        const length = val.trim().length;
        if (rules.min_length != null && length < rules.min_length) errs[q.id] = `Jawaban minimal ${rules.min_length} karakter.`;
        else if (rules.max_length != null && length > rules.max_length) errs[q.id] = `Jawaban maksimal ${rules.max_length} karakter.`;
        const answerType = q.type === 'short' ? (rules.answer_type || 'text') : q.type;
        if (!errs[q.id] && answerType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))) errs[q.id] = 'Masukkan alamat email yang valid.';
        else if (!errs[q.id] && answerType === 'phone' && (!/^\+?[0-9() .-]{7,20}$/.test(String(val)) || String(val).replace(/\D/g, '').length < 7 || String(val).replace(/\D/g, '').length > 15)) errs[q.id] = 'Masukkan nomor telepon yang valid (7–15 digit).';
        else if (!errs[q.id] && answerType === 'number' && !/^-?\d+(?:[.,]\d+)?$/.test(String(val))) errs[q.id] = 'Masukkan angka yang valid.';
        else if (!errs[q.id] && answerType === 'text_number' && !/^[\p{L}\p{N}\s.,'-]+$/u.test(String(val))) errs[q.id] = 'Gunakan huruf dan angka saja.';
      } else if (q.type === 'check' && Array.isArray(val)) {
        if (rules.min_selections != null && val.length < rules.min_selections) errs[q.id] = `Pilih minimal ${rules.min_selections} opsi.`;
        else if (rules.max_selections != null && val.length > rules.max_selections) errs[q.id] = `Pilih maksimal ${rules.max_selections} opsi.`;
      } else if (['choice', 'drop'].includes(q.type) && !q.options?.includes(val)) errs[q.id] = 'Silakan pilih opsi yang tersedia.';
      else if (q.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))) errs[q.id] = 'Masukkan alamat email yang valid.';
      else if (q.type === 'phone' && (!/^\+?[0-9() .-]{7,20}$/.test(String(val)) || String(val).replace(/\D/g, '').length < 7 || String(val).replace(/\D/g, '').length > 15)) errs[q.id] = 'Masukkan nomor telepon yang valid (7–15 digit).';
      else if (q.type === 'file' && (!val || !val.url || !val.name)) errs[q.id] = 'Silakan unggah berkas.';
      else if (q.type === 'scale' && (!Number.isInteger(Number(val)) || Number(val) < 1 || Number(val) > 5)) errs[q.id] = 'Pilih nilai skala antara 1 dan 5.';
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
      <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50">
        <div className="space-y-3 text-center">
          <div className="w-10 h-10 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-gray-500">Memuat kuesioner...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50">
        <div className="w-full max-w-md p-8 space-y-4 text-center bg-white border border-gray-200 shadow-sm rounded-2xl">
          <div className="flex items-center justify-center mx-auto text-2xl rounded-full w-14 h-14 bg-rose-50 text-rose-500">
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
        <header className="flex items-center justify-between p-4 bg-white border border-gray-200 shadow-sm rounded-2xl sm:p-5">
          <div className="flex items-center gap-6">
            <img src={kanLogo} alt="Logo KAN" className="object-contain w-auto h-8" />
            <div className="flex flex-col justify-center leading-none">
              <span className="block text-xs font-extrabold tracking-wider text-blue-900 uppercase">
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
          <div className="p-10 space-y-4 text-center bg-white border border-gray-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto text-3xl font-extrabold rounded-full bg-amber-50 text-amber-500">
              <FaExclamationTriangle />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">{survey?.title}</h2>
            <div className="inline-block px-3 py-1 text-xs font-bold border rounded-full bg-rose-50 text-rose-700 border-rose-200">
              Kuesioner Ditutup
            </div>
            <p className="max-w-md mx-auto text-sm text-gray-600">
              Kuesioner ini sudah selesai atau saat ini sedang tidak menerima tanggapan baru. Terima kasih atas perhatian Anda.
            </p>
          </div>
        ) : submitted ? (
          <div className="p-10 space-y-4 text-center bg-white border border-gray-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto text-3xl font-extrabold rounded-full bg-emerald-100 text-emerald-600">
              <FaCheckCircle />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Terima Kasih!</h2>
            <p className="max-w-md mx-auto text-sm text-gray-600">
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
            <div className="p-6 space-y-3 text-white shadow-md bg-gradient-to-r from-blue-700 to-indigo-900 rounded-2xl sm:p-8">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{survey?.title}</h1>
              {survey?.description && <RichText html={survey.description} block className="text-sm leading-relaxed text-blue-100 sm:text-base opacity-95" />}
              <div className="flex items-center gap-2 pt-2 text-xs text-blue-200">
                <span>Tanda <span className="font-bold text-red-300">*</span> wajib diisi</span>
              </div>
            </div>

            {/* Questions List */}
            {survey?.questions?.map((q, idx) => (
              <div
                key={q.id}
                className="p-6 space-y-3 bg-white border border-gray-200 shadow-sm rounded-2xl"
              >
                <label className="block text-base font-bold text-gray-900">
                  {idx + 1}. <RichText html={q.text} />
                  {q.is_required && <span className="ml-1 font-bold text-rose-600">*</span>}
                </label>
                {q.image_url && <img src={q.image_url} alt="Ilustrasi pertanyaan" className="object-contain w-auto max-h-72 rounded-xl" />}

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

                {q.type === 'email' && <input type="email" autoComplete="email" placeholder="nama@contoh.com" value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-600" />}

                {q.type === 'phone' && <input type="tel" autoComplete="tel" placeholder="+62 812 3456 7890" value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-600" />}

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
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
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
                    className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 outline-none rounded-xl focus:border-blue-600"
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
                  <div className="grid grid-cols-1 gap-2 p-3 border border-gray-200 sm:grid-cols-5 bg-gray-50/80 rounded-xl">
                    {scaleLabels(q.options).map((label, i) => {
                      const n = i + 1;
                      return (
                        <label
                          key={n}
                          className={`flex sm:flex-col items-center gap-3 sm:gap-2 p-2 rounded-lg cursor-pointer sm:text-center transition ${
                            Number(answers[q.id]) === n ? 'bg-blue-50' : 'hover:bg-white'
                          }`}
                        >
                          <span className="w-5 text-sm font-bold text-gray-800 sm:w-auto">{n}</span>
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
                  <p className="mt-1 text-xs font-semibold survey-error-msg text-rose-600">
                    {errors[q.id]}
                  </p>
                )}
              </div>
            ))}

            {/* Submit button */}
            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={submitting || Object.values(uploading).some(Boolean)}
                className="w-full px-8 py-3 text-sm font-bold text-white transition bg-blue-600 shadow-md sm:w-auto hover:bg-blue-700 rounded-xl hover:shadow-lg disabled:opacity-50"
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