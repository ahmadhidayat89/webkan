import { useState } from 'react';
import { FaRegCheckSquare, FaCheck, FaRegCommentDots } from 'react-icons/fa';
import RichText from '../RichText';
import { supportsWeightedScoring, scoringChoices, answerScores } from './surveyScoring';

const field = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none';

const OPTION_TYPES = ['choice', 'check', 'drop'];
const SCALE_TYPES = ['scale', 'rating', 'linear'];

const plainText = html => new DOMParser().parseFromString(html || '', 'text/html').body.textContent.trim();

const choiceLabel = (choice, index) => choice.label || `Pilihan ${index + 1}`;

function withKeys(choices) {
  const seen = new Map();
  return choices.map(choice => {
    const count = (seen.get(choice.value) ?? 0) + 1;
    seen.set(choice.value, count);
    return { ...choice, key: `${choice.value}#${count}` };
  });
}

function getChoices(q) {
  if (OPTION_TYPES.includes(q.type)) {
    return withKeys((q.opts || []).map(value => ({ value, label: value })));
  }
  if (SCALE_TYPES.includes(q.type)) {
    return withKeys(scoringChoices(q));
  }
  return [];
}

function toggleAnswer(type, keys, value) {
  const selected = keys.includes(value);
  if (type === 'check') {
    return selected ? keys.filter(key => key !== value) : [...keys, value];
  }
  return selected ? [] : [value];
}

function headingText(weighted, manual) {
  if (weighted) return 'Atur skor setiap jawaban:';
  if (manual) return 'Atur poin pertanyaan:';
  return 'Pilih jawaban yang benar:';
}

export default function QuizAnswerKey({ q, onConfig, onDone }) {
  const config = q.config || {};
  const weighted = config.score_mode === 'weighted' && supportsWeightedScoring(q.type);
  const choices = getChoices(q);
  const hasTitle = plainText(q.text) !== '';
  const scores = weighted ? answerScores(q) : [];
  const maximum = weighted ? Math.max(0, ...scores.map(entry => Number(entry.points))) : (config.points ?? 0);
  const [feedbackOpen, setFeedbackOpen] = useState(Boolean(config.feedback));
  const manual = ['para', 'file', 'grid', 'check_grid'].includes(q.type);

  function chooseAnswer(value) {
    onConfig({ correct_answers: toggleAnswer(q.type, config.correct_answers || [], value) });
  }

  return <section aria-label="Kunci jawaban dan poin" className="space-y-5">
    <div className="flex items-center gap-3 px-5 pb-5 -mx-5 border-b border-slate-200 text-slate-700">
      <FaRegCheckSquare className="text-lg" /><h3 className="text-base font-semibold">{headingText(weighted, manual)}</h3>
    </div>
    <div className="flex items-start justify-between gap-5">
      <div className="flex-1 min-w-0 pt-2 text-sm text-slate-800">{hasTitle ? <RichText html={q.text} /> : 'Pertanyaan tanpa judul'}</div>
      <label className="flex items-center gap-2 text-sm shrink-0 text-slate-600">
        <input aria-label={weighted ? 'Poin maksimum' : 'Poin pertanyaan'} type="number" min="0" max="1000" step="1" readOnly={weighted} value={maximum} onChange={event => onConfig({ points: event.target.value === '' ? 0 : Number(event.target.value) })} className="w-16 px-1 py-1 text-sm text-center bg-transparent border-0 border-b border-slate-300 text-slate-800 focus:border-blue-600 focus:ring-0 read-only:bg-slate-50" />
        {weighted ? 'poin maks.' : 'poin'}
      </label>
    </div>
    {supportsWeightedScoring(q.type) && <label className="block max-w-xs space-y-1 text-xs font-semibold text-slate-600"><span className="block">Metode penilaian</span>
      <select value={weighted ? 'weighted' : 'exact'} onChange={event => onConfig({ score_mode: event.target.value, ...(event.target.value === 'weighted' ? { answer_scores: answerScores(q), correct_answers: [] } : {}) })} className={field}>
        <option value="exact">Kunci benar/salah</option><option value="weighted">Skor per jawaban</option>
      </select>
    </label>}
    {weighted ? <>
      <p className="text-xs text-slate-500">Setiap jawaban memiliki skor sendiri. Nilai maksimum mengikuti skor tertinggi; jawaban kosong bernilai 0.</p>
      <div className="space-y-2">{choices.map((choice, index) => <div key={choice.key} className="grid grid-cols-[1fr_6rem] items-center gap-3 rounded-lg border border-slate-100 px-3 py-2">
  <span className="text-sm break-words text-slate-700">{choiceLabel(choice, index)}</span>
        <label className="text-xs font-semibold text-slate-600">Skor<input aria-label={`Skor ${choiceLabel(choice, index)}`} type="number" min="0" max="1000" step="1" value={scores[index].points} onChange={event => onConfig({ answer_scores: scores.map((entry, i) => i === index ? { ...entry, points: Number(event.target.value) } : entry) })} className={`mt-1 ${field}`} /></label>
      </div>)}</div>
      <button type="button" className="text-xs font-semibold text-blue-700" onClick={() => onConfig({ answer_scores: scores.map((entry, index) => ({ ...entry, points: ['choice', 'drop'].includes(q.type) ? index : Number(entry.value) })) })}>{['choice', 'drop'].includes(q.type) ? 'Isi skor berurutan: 0, 1, 2, …' : 'Gunakan nilai angka skala sebagai skor'}</button>
      {config.allow_other && <p className="text-xs text-slate-500">Jawaban Lainnya bernilai 0.</p>}
    </> : <>
      {choices.length > 0 ? <fieldset className="space-y-2"><legend className="sr-only">Pilihan kunci jawaban</legend>{choices.map((choice, index) => {
        const selected = (config.correct_answers || []).includes(choice.value);
        return <button key={choice.key} type="button" disabled={!choice.value.trim()} aria-pressed={selected} aria-label={`Kunci jawaban: ${choiceLabel(choice, index)}`} onClick={() => chooseAnswer(choice.value)} className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-40 ${selected ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-transparent text-slate-700 hover:bg-slate-50'}`}>
          <span aria-hidden="true" className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 ${q.type === 'check' ? 'rounded' : 'rounded-full'} ${selected ? 'border-emerald-600 text-emerald-600' : 'border-slate-300'}`}>{selected && <FaCheck className="text-[10px]" />}</span>
          <span className="flex-1 min-w-0 break-words">{choice.label || `Pilihan ${index + 1}`}</span>{selected && <><span className="sr-only">Jawaban benar</span><FaCheck aria-hidden="true" className="shrink-0 text-emerald-600" /></>}
        </button>;
      })}<p className="px-4 text-xs text-slate-400">{q.type === 'check' ? 'Pilih semua jawaban yang benar.' : 'Klik satu jawaban yang benar. Klik kembali untuk membatalkan pilihan.'}</p></fieldset> : !manual && <label className="block space-y-1 text-xs font-semibold text-slate-600">Jawaban yang benar (persis)<textarea rows={3} value={(config.correct_answers || []).join('\n')} onChange={event => onConfig({ correct_answers: event.target.value.split('\n') })} className={field} /></label>}
      {manual && <p className="p-3 text-xs rounded-lg bg-slate-50 text-slate-500">Jawaban diperiksa manual melalui tab Jawaban.</p>}
    </>}
    <div className="space-y-3">
      <button type="button" aria-expanded={feedbackOpen} onClick={() => setFeedbackOpen(!feedbackOpen)} className="inline-flex items-center gap-2 py-2 text-sm font-semibold text-blue-700"><FaRegCommentDots />{config.feedback ? 'Edit masukan jawaban' : 'Tambahkan masukan jawaban'}</button>
      {feedbackOpen && <label className="block space-y-1 text-xs font-semibold text-slate-600">Masukan untuk responden<textarea rows={3} value={config.feedback || ''} onChange={event => onConfig({ feedback: event.target.value })} className={field} /></label>}
    </div>
    <div className="flex items-center justify-between gap-3 px-5 pt-4 -mx-5 border-t border-slate-200">
      <p className="text-xs text-slate-400">Gunakan Simpan di atas untuk menyimpan perubahan kuesioner.</p>
      <button type="button" onClick={onDone} className="px-5 py-2 text-sm font-semibold text-blue-700 bg-white border border-blue-200 rounded-lg shrink-0 hover:bg-blue-50">Selesai</button>
    </div>
  </section>;
}
