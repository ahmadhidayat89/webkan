import { useState, useEffect } from 'react';
import { visibleQuestions, splitSurveyPages, prepareSurveyQuestions } from '../components/survey/surveyFlow';
import { validateQuestion } from '../components/survey/surveyValidation';
import { SurveyFrame, SurveyForm } from '../components/survey/SurveyForm';
import { useParams, Link } from 'react-router-dom';
import { getPublicSurvey, submitPublicSurvey, uploadPublicSurveyFile } from '../services/api';
import SubmitConfirmation from '../components/survey/SubmitConfirmation';
import ResponseSummary from '../components/survey/ResponseSummary';
import '../components/survey/surveyTheme.css';
import toast, { Toaster } from 'react-hot-toast';
import { FaCheckCircle, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';

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
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [editToken, setEditToken] = useState(null);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    if (!survey) return;
    try {
      const stored = survey.settings?.save_draft && !survey.edit_response ? JSON.parse(localStorage.getItem(`kan-survey-${code}`) || 'null') : null;
      if (stored) { setAnswers(stored.answers || {}); }
      const params = new URLSearchParams(window.location.search);
      setAnswers(prev => ({ ...prev, ...Object.fromEntries(survey.questions.filter(q => !['file', 'grid', 'check_grid', 'check'].includes(q.type) && params.has(`q_${q.id}`)).map(q => [q.id, params.get(`q_${q.id}`)])) }));
    } catch { /* Storage is optional when unavailable. */ }
    setDraftReady(true);
  }, [survey, code]);
  useEffect(() => {
    if (!draftReady || !survey?.settings?.save_draft || submitted) return;
    try { localStorage.setItem(`kan-survey-${code}`, JSON.stringify({ answers })); } catch { /* Storage unavailable. */ }
  }, [answers, code, draftReady, survey, submitted]);

  const routed = visibleQuestions(survey?.questions || [], answers);
  const pages = splitSurveyPages(routed);
  const pageIndex = Math.min(sectionIndex, pages.length - 1);
  const pageQuestions = pages[pageIndex] || [];
  const lastPage = pageIndex === pages.length - 1;
  const goNext = () => {
    const errs = {};
    pageQuestions.forEach(q => { const error = validateQuestion(q, answers[q.id]); if (error) errs[q.id] = error; });
    setErrors(errs);
    if (!Object.keys(errs).length) { setSectionIndex(pageIndex + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else toast.error('Lengkapi jawaban pada bagian ini.');
  };

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        setLoading(true);
        const token = new URLSearchParams(window.location.search).get('edit');
        const res = await getPublicSurvey(code, token);
        if (res.data?.success) {
          const data = res.data.data;
          if (data.edit_response) { setEditToken(token); setAnswers(data.edit_response.answers || {}); }
          setSurvey({ ...data, questions: prepareSurveyQuestions(data.questions, data.settings) });
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
    if (!survey?.questions) return;

    // Validate configured question constraints before posting responses.
    const errs = {};
    routed.forEach((question) => {
      const error = validateQuestion(question, answers[question.id]);
      if (error) errs[question.id] = error;
    });

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const errorPage = pages.findIndex(items => items.some(q => errs[q.id]));
      if (errorPage >= 0) setSectionIndex(errorPage);
      toast.error('Mohon periksa kembali jawaban yang ditandai.');
      const firstErrEl = document.querySelector('.survey-error-msg');
      if (firstErrEl) {
        firstErrEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setErrors({});
    setConfirmSubmit(true);
  };

  const sendAnswers = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await submitPublicSurvey(code, { answers, edit_token: editToken });
      if (res.data?.success) {
        setReceipt(res.data.data);
        if (res.data.data?.edit_token) window.history.replaceState(null, '', `${window.location.pathname}?edit=${res.data.data.edit_token}`);
        setSubmitted(true);
        try { localStorage.removeItem(`kan-survey-${code}`); } catch { /* Storage unavailable. */ }
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
      setConfirmSubmit(false);
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

  // Tiga tampilan yang saling lepas: ditutup, terima kasih, atau form
  const showThanks = !isClosed && submitted;
  const showForm = !isClosed && !submitted;

  return (
    <SurveyFrame settings={survey?.settings}>
      <Toaster position="top-right" />
      {confirmSubmit && <SubmitConfirmation busy={submitting} onCancel={() => setConfirmSubmit(false)} onConfirm={sendAnswers} />}
        {isClosed && (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 mx-auto flex items-center justify-center text-3xl font-extrabold">
              <FaExclamationTriangle />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">{survey?.title}</h2>
            <div className="inline-block px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full border border-rose-200">
              Kuesioner Ditutup
            </div>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              {survey?.settings?.closed_message || 'Kuesioner ini sudah selesai atau saat ini sedang tidak menerima tanggapan baru. Terima kasih atas perhatian Anda.'}
            </p>
          </div>
        )}

        {showThanks && (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-3xl font-extrabold">
              <FaCheckCircle />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Terima Kasih!</h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto whitespace-pre-wrap">
              {survey?.settings?.confirmation_message || 'Jawaban Anda telah berhasil kami terima. Terima kasih atas masukan Anda untuk meningkatkan mutu layanan KAN.'}
            </p>
            {receipt?.feedback?.length > 0 && <div className="space-y-3 text-left">{receipt.feedback.map((f, i) => <div key={i} className="rounded-xl bg-blue-50 p-4 text-sm"><p className="font-bold text-blue-950">{f.question}</p><p>Jawaban benar: {f.correct_answers.join(', ')}</p>{f.feedback && <p className="text-slate-600 mt-2">{f.feedback}</p>}</div>)}</div>}
            <ResponseSummary items={receipt?.summary} />
            {survey?.settings?.submit_another && <button type="button" className="block mx-auto text-sm font-semibold text-blue-700 underline" onClick={() => { setSubmitted(false); setAnswers({}); setErrors({}); setReceipt(null); setEditToken(null); setSectionIndex(0); window.history.replaceState(null, '', window.location.pathname); }}>Kirim jawaban lain</button>}
            {receipt?.score != null && <p className="text-xl font-bold text-blue-800">Nilai: {receipt.score} / {receipt.max_score}</p>}
            {receipt?.edit_token && <p className="text-xs text-slate-500">Simpan alamat halaman ini untuk mengubah jawaban Anda nanti.</p>}
            {receipt?.edit_token && <button type="button" className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700" onClick={() => { setEditToken(receipt.edit_token); setSubmitted(false); setSectionIndex(0); }}>Ubah jawaban saya</button>}
            <div className="pt-4">
              <Link
                to="/"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        )}

        {showForm && <SurveyForm survey={survey} pages={pages} pageIndex={pageIndex} answers={answers} errors={errors} onAnswer={(id, value) => { setAnswers(prev => ({ ...prev, [id]: value })); setErrors(prev => ({ ...prev, [id]: undefined })); }} onPrevious={() => { setSectionIndex(pageIndex - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onContinue={e => { if (lastPage) void handleSubmit(e); else goNext(); }} onClear={() => { if (window.confirm('Kosongkan semua jawaban?')) { setAnswers({}); setSectionIndex(0); setErrors({}); } }} submitting={submitting} uploadFile={async (q, file) => (await uploadPublicSurveyFile(code, q.id, file)).data.data} />}
    </SurveyFrame>
  );
}
