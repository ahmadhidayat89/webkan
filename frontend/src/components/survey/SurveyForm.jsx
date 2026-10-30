import { useState } from 'react';
import { Link } from 'react-router-dom';
import RichText, { stripHtml } from '../RichText';
import kanLogo from '../../assets/kan.png';
import ExtendedField, { EXTENDED_TYPES, CONTENT_TYPES } from './ExtendedField';
import SearchableSelect from './SearchableSelect';
import { numberSurveyQuestions } from './surveyFlow';
import toast from 'react-hot-toast';
import './surveyTheme.css';

const DEFAULT_SCALE_LABELS = ['Sangat Tidak Baik', 'Tidak Baik', 'Cukup', 'Baik', 'Sangat Baik'];
const scaleLabels = opts => Array.isArray(opts) && opts.length === 5 && opts.some(Boolean) ? opts : DEFAULT_SCALE_LABELS;
const SHORT_INPUT_TYPES = { email: 'email', number: 'number' };
const SHORT_INPUT_MODES = { phone: 'tel', number: 'decimal' };
const SHORT_PLACEHOLDERS = { email: 'nama@contoh.com', phone: '+62 812 3456 7890' };

export function SurveyFrame({ settings = {}, children }) {
  return <div className="min-h-screen px-4 py-8 kan-survey-theme sm:px-6" style={{ backgroundColor: settings.background_color || '#f4f7fc', '--survey-question-size': `${settings.question_size || 16}px`, '--survey-body-size': `${settings.body_size || 14}px`, fontFamily: settings.font === 'serif' ? 'Georgia, serif' : undefined }}>
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border shadow-sm rounded-2xl border-slate-200 sm:p-5">
        <div className="flex items-center gap-4"><img src={kanLogo} alt="Logo KAN" className="object-contain w-auto h-8" /><div><p className="text-xs font-extrabold tracking-wide text-blue-900 uppercase">Komite Akreditasi Nasional</p><p className="text-[11px] text-slate-500">Kuesioner & Survei Layanan</p></div></div>
        <Link to="/" className="text-xs font-bold text-blue-700">Website Utama →</Link>
      </header>
      {children}
    </div>
  </div>;
}

export function SurveyForm({ survey, pages, pageIndex, answers, errors, onAnswer, onPrevious, onContinue, onClear, submitting = false, uploadFile, preview = false }) {
  const [uploading, setUploading] = useState({});
  const settings = survey.settings || {};
  const page = pages[pageIndex] || [];
  const busy = submitting || Object.values(uploading).some(Boolean);
  const numbers = numberSurveyQuestions(survey.questions);
  return <form noValidate onSubmit={e => { e.preventDefault(); if (!busy) onContinue(e); }} className="space-y-4">
    <div className="p-6 space-y-3 text-white shadow-md rounded-2xl sm:p-8" style={{ background: settings.theme_color || '#1d4ed8' }}>
      {settings.header_image && <img src={settings.header_image} alt="Header kuesioner" className="object-cover w-full max-h-56 rounded-xl" />}
      <h1 className="font-extrabold tracking-tight" style={{ fontSize: settings.title_size || 28 }}>{survey.title || 'Kuesioner tanpa judul'}</h1>
      {survey.description && <RichText html={survey.description} block className="leading-relaxed text-blue-100 survey-description" />}
      <p className="pt-2 text-xs text-blue-100">Tanda <span className="font-bold text-red-200">*</span> wajib diisi</p>
    </div>
    {settings.show_progress && <div className="p-4 bg-white border rounded-xl border-slate-200"><div className="flex justify-between mb-2 text-xs text-slate-600"><span>Bagian {pageIndex + 1} dari {pages.length}</span><span>{Math.round((pageIndex + 1) / pages.length * 100)}%</span></div><progress aria-label="Progres pengisian" className="w-full h-2 accent-blue-700" max={pages.length} value={pageIndex + 1} /></div>}
    {page.map(q => <SurveyQuestion key={q.id} q={q} number={numbers.get(q.id)} pageNumber={pageIndex + 1} pageCount={pages.length} settings={settings} value={answers[q.id]} error={errors[q.id]} onChange={value => onAnswer(q.id, value)} uploading={uploading} setUploading={setUploading} uploadFile={uploadFile} preview={preview} />)}
    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
      {pageIndex > 0 && <button type="button" disabled={busy} className="px-5 py-3 text-sm font-bold bg-white border rounded-xl border-slate-300 disabled:opacity-50" onClick={onPrevious}>Sebelumnya</button>}
      <button type="button" disabled={busy} className="mr-auto text-sm font-bold text-slate-500 disabled:opacity-50" onClick={onClear}>Kosongkan</button>
      <button type="submit" disabled={busy} className="w-full px-8 py-3 text-sm font-bold text-white transition bg-blue-600 shadow-md rounded-xl hover:bg-blue-700 disabled:opacity-50 sm:w-auto">{submitting ? 'Mengirimkan…' : pageIndex === pages.length - 1 ? 'Kirim Jawaban' : 'Berikutnya'}</button>
    </div>
  </form>;
}

export function SurveyQuestion({ q, number, pageNumber, pageCount, settings, value, error, onChange, uploading, setUploading, uploadFile, preview }) {
  const answers = { [q.id]: value };
  const errors = { [q.id]: error };
  const setAnswers = change => { const next = typeof change === 'function' ? change(answers) : change; onChange(next[q.id]); };
  if (q.type === 'section') return <section data-survey-section className="overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200" aria-label={stripHtml(q.text) || 'Bagian'}>
    <div className="px-6 py-2 text-xs font-bold text-white" style={{ backgroundColor: settings.theme_color || '#1d4ed8' }}>Bagian {pageNumber} dari {pageCount}</div>
    <div className="p-6 space-y-3"><h2 className="text-xl font-bold text-slate-900"><RichText html={q.text} /></h2>{q.config?.description && <p className="whitespace-pre-wrap survey-description text-slate-500">{q.config.description}</p>}{q.image_url && <img src={q.image_url} alt="Gambar bagian" className="object-contain max-h-72 rounded-xl" />}</div>
  </section>;
  if (CONTENT_TYPES.includes(q.type)) return <section className="p-6 space-y-3 bg-white border shadow-sm rounded-2xl border-slate-200">
    <h2 className="font-bold survey-question-label text-slate-900"><RichText html={q.text} /></h2>
    {q.image_url && <img src={q.image_url} alt={stripHtml(q.text) || 'Ilustrasi'} className="object-contain max-h-72 rounded-xl" />}
    <ExtendedField q={q} />
  </section>;
  return (
    <div
      key={q.id}
      data-survey-question={q.id}
      className="p-6 space-y-3 bg-white border border-gray-200 shadow-sm rounded-2xl"
    >
      <label className="block font-bold text-gray-900 survey-question-label" id={`question-title-${q.id}`}>
        {number}. <RichText html={q.text} />
        {!CONTENT_TYPES.includes(q.type) && q.is_required && <span className="ml-1 font-bold text-rose-600">*</span>}
      </label>
      {q.image_url && <img src={q.image_url} alt="Ilustrasi pertanyaan" className="object-contain w-auto max-h-72 rounded-xl" />}

      {q.config?.description && !CONTENT_TYPES.includes(q.type) && <p className="whitespace-pre-wrap survey-description text-slate-500">{q.config.description}</p>}
      {EXTENDED_TYPES.includes(q.type) && <ExtendedField q={q} value={answers[q.id]} onChange={value => setAnswers(prev => ({ ...prev, [q.id]: value }))} />}
      {/* Question Inputs */}
      {q.type === 'short' && (
        <input
          aria-labelledby={`question-title-${q.id}`}
          type={SHORT_INPUT_TYPES[q.validation?.answer_type] || 'text'}
          inputMode={SHORT_INPUT_MODES[q.validation?.answer_type]}
          placeholder={SHORT_PLACEHOLDERS[q.validation?.answer_type] || 'Jawaban Anda'}
          value={answers[q.id] || ''}
          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
          className="w-full text-sm border-0 border-b-2 border-gray-200 focus:border-blue-600 outline-none pb-1.5 transition"
        />
      )}

      {q.type === 'para' && (
        <textarea
          aria-labelledby={`question-title-${q.id}`}
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
        <input type="file" multiple={(q.config?.file_max_files || 1) > 1} accept={(q.config?.file_types || "pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,webp,txt,csv").split(",").map(x => `.${x.replaceAll(".", "").trim()}`).join(",")} disabled={uploading[q.id]} onChange={async (e) => {
          const files = Array.from(e.target.files || []);
          if (!files.length) return;
          if (files.length > (q.config?.file_max_files || 1)) { toast.error(`Maksimal ${q.config?.file_max_files || 1} file.`); e.target.value = ''; return; }
          const file = files.reduce((a, b) => a.size > b.size ? a : b, files[0]); if (file.size > (q.config?.file_max_mb || 10) * 1024 * 1024) { toast.error(`Ukuran file maksimal ${q.config?.file_max_mb || 10} MB.`); e.target.value = ''; return; }
          setUploading((prev) => ({ ...prev, [q.id]: true }));
          try {
            const results = [];
            for (const selected of files) results.push(uploadFile ? await uploadFile(q, selected) : { name: selected.name, size: selected.size, url: 'preview' });
            setAnswers((prev) => ({ ...prev, [q.id]: (q.config?.file_max_files || 1) > 1 ? results : results[0] }));
          } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal mengunggah file.');
          } finally {
            setUploading((prev) => ({ ...prev, [q.id]: false }));
            e.target.value = '';
          }
        }} className="w-full text-sm" />
        {uploading[q.id] && <p className="text-xs text-blue-600">Mengunggah file...</p>}
        {Array.isArray(answers[q.id]) && answers[q.id].map((f, i) => <div key={i} className="flex items-center gap-2 text-sm"><a href={preview ? undefined : f.url} target="_blank" rel="noreferrer" className="text-blue-700 underline">{f.name}</a><button type="button" className="text-xs text-rose-600" onClick={() => setAnswers(prev => ({ ...prev, [q.id]: prev[q.id].filter((_, j) => j !== i) }))}>Hapus</button></div>)}
        {Array.isArray(answers[q.id]) && answers[q.id].map((f, i) => <div key={i} className="flex items-center gap-2 text-sm">{preview ? <span className="text-blue-700 underline">{f.name}</span> : <a href={f.url} target="_blank" rel="noreferrer" className="text-blue-700 underline">{f.name}</a>}<button type="button" className="text-xs text-rose-600" onClick={() => setAnswers(prev => ({ ...prev, [q.id]: prev[q.id].filter((_, j) => j !== i) }))}>Hapus</button></div>)}
        {answers[q.id]?.url && <div className="flex items-center gap-2 text-sm">{preview ? <span className="text-blue-700 underline">{answers[q.id].name}</span> : <a href={answers[q.id].url} target="_blank" rel="noreferrer" className="text-blue-700 underline">{answers[q.id].name}</a>}<button type="button" onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: undefined }))} className="text-xs text-rose-600">Hapus</button></div>}
      </div>}

      {q.type === 'choice' && (
        <div className="space-y-2.5 pt-1">
          {q.options?.map((opt) => (
            <label key={opt} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:text-blue-700">
              <input
                type="radio"
                name={`q_${q.id}`}
                value={opt}
                checked={answers[q.id] === opt}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span>{opt}{q.config?.option_images?.[opt] && <img src={q.config.option_images[opt]} alt={opt} className="object-contain mt-2 max-h-32 rounded-xl" />}</span>
            </label>
          ))}
        </div>
      )}

      {q.type === 'check' && (
        <div className="space-y-2.5 pt-1">
          {q.options?.map((opt) => {
            const cur = answers[q.id] || [];
            const isChecked = cur.includes(opt);
            return (
              <label key={opt} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:text-blue-700">
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
                <span>{opt}{q.config?.option_images?.[opt] && <img src={q.config.option_images[opt]} alt={opt} className="object-contain mt-2 max-h-32 rounded-xl" />}</span>
              </label>
            );
          })}
        </div>
      )}

      {['choice', 'check'].includes(q.type) && q.config?.allow_other && <label className="flex items-center gap-3 text-sm text-slate-700">
        <input type={q.type === 'choice' ? 'radio' : 'checkbox'} name={`q_${q.id}`} checked={q.type === 'choice' ? String(answers[q.id] || '').startsWith('Lainnya: ') : (answers[q.id] || []).some(v => v.startsWith('Lainnya: '))} onChange={e => setAnswers(prev => ({ ...prev, [q.id]: q.type === 'choice' ? 'Lainnya: ' : e.target.checked ? [...(prev[q.id] || []), 'Lainnya: '] : (prev[q.id] || []).filter(v => !v.startsWith('Lainnya: ')) }))} />
        <span>Lainnya:</span><input aria-label="Jawaban lainnya" className="flex-1 min-w-0 px-3 py-2 border rounded-lg border-slate-200" value={q.type === 'choice' ? (String(answers[q.id] || '').startsWith('Lainnya: ') ? answers[q.id].slice(9) : '') : ((answers[q.id] || []).find(v => v.startsWith('Lainnya: ')) || '').slice(9)} onChange={e => setAnswers(prev => ({ ...prev, [q.id]: q.type === 'choice' ? `Lainnya: ${e.target.value}` : [...(prev[q.id] || []).filter(v => !v.startsWith('Lainnya: ')), `Lainnya: ${e.target.value}`] }))} />
      </label>}
      {q.type === 'drop' && <SearchableSelect clearable label={`Jawaban: ${stripHtml(q.text)}`} value={answers[q.id] || ''} options={(q.options || []).map(option => ({ value: option, label: option }))} onChange={value => setAnswers({ ...answers, [q.id]: value })} placeholder="Silakan pilih" searchPlaceholder="Cari opsi jawaban…" />}

      {q.type === 'scale' && (
        <div className="grid grid-cols-1 gap-2 p-3 border border-gray-200 sm:grid-cols-5 bg-gray-50/80 rounded-xl">
          {scaleLabels(q.options).map((label, i) => {
            const n = i + 1;
            return (
              <label
                key={n}
                className={`flex sm:flex-col items-center gap-3 sm:gap-2 p-2 rounded-lg cursor-pointer sm:text-center transition ${Number(answers[q.id]) === n ? 'bg-blue-50' : 'hover:bg-white'
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
  );
}
