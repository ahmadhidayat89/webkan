import { useEffect, useRef, useState } from 'react';
import {
  answersList,
  formatReadinessScore as formatScore,
  readinessAnswerLabel as answerLabel,
  readinessButton,
  readinessInput,
  readinessLimitation as limitation,
  readinessPrimary,
  tallyReadiness,
} from './readiness';

const panel = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 print:border-0 print:p-0 print:shadow-none';
const heading = 'scroll-mt-36 break-words text-2xl font-bold tracking-tight text-primary-950 sm:text-3xl';
const subheading = 'text-lg font-bold text-primary-900';
const actions = 'mt-6 flex flex-wrap items-center gap-3 print:hidden';
const info = 'rounded-lg border-l-4 border-primary-600 bg-primary-50 px-4 py-3 text-sm leading-relaxed text-primary-950';
const notice = 'rounded-lg border-l-4 border-accent-500 bg-accent-50 px-4 py-3 text-sm leading-relaxed text-accent-950';

const answerColors = {
  yes: 'border-emerald-600 bg-emerald-50 text-emerald-800',
  partial: 'border-accent-500 bg-accent-50 text-accent-900',
  no: 'border-red-600 bg-red-50 text-red-800',
  na: 'border-slate-400 bg-slate-100 text-slate-700',
};
const stepNumbers = { intro: 1, glossary: 1, scope: 2, questions: 2, review: 3, results: 4 };
const stepTitles = {
  glossary: 'Glosarium',
  scope: 'Pilih cakupan penilaian',
  questions: 'Penilaian kesiapan',
  review: 'Tinjau jawaban',
  results: 'Ringkasan hasil',
};

function Progress({ step, answered, total, preview }) {
  const offset = preview ? 'top-0' : 'top-14 md:top-[4.5rem] lg:top-20';
  return (
    <div className={'sticky z-20 -mx-1 mb-4 border-b border-slate-200 bg-slate-50/95 px-1 pb-3 pt-2 backdrop-blur-sm print:hidden ' + offset}>
      <div role="progressbar" aria-label="Butir dijawab" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answered} className="h-2 overflow-hidden rounded-full bg-primary-100">
        <div className="h-full rounded-full bg-gradient-to-r from-primary-700 to-primary-500 motion-safe:transition-[width]" style={{ width: (total ? answered / total * 100 : 0) + '%' }} />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-slate-600 sm:text-sm">
        <span className="font-semibold text-primary-900">
          Langkah {stepNumbers[step]} dari 4{step === 'scope' && ' · Pilih cakupan'}
        </span>
        <span className="tabular-nums">{answered} dari {total} butir dijawab</span>
      </div>
    </div>
  );
}

function Question({ question, clause, number, document, response = {}, onChange }) {
  const flagged = response.answer === 'no' || response.answer === 'partial';
  return (
    <fieldset id={'readiness-question-' + question.id} className={'min-w-0 scroll-mt-36 rounded-xl border bg-white p-4 sm:p-5 ' + (flagged ? 'border-accent-200 border-l-4 border-l-accent-500' : 'border-slate-200')}>
      <legend className="px-2 text-xs font-semibold text-primary-800">Butir {number} · Klausul {question.reference || clause.code}</legend>
      <p className="whitespace-pre-line break-words text-sm leading-relaxed text-slate-900 sm:text-base">{question.text}</p>
      {document && (
        <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          <strong>Dokumen acuan:</strong> {document.code} — {document.title} · Bukti: {question.evidence}
          {document.sample && <span className="block">Contoh nama berkas: {document.sample}</span>}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Pilihan jawaban">
        {answersList.filter(([key]) => key !== 'na' || question.allowNA).map(([key, label]) => (
          <label key={key} className={'flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-primary-500 ' + (response.answer === key ? answerColors[key] : 'border-slate-300 text-slate-700 hover:border-primary-500 hover:bg-primary-50')}>
            <input type="radio" className="accent-primary-700" name={'answer-' + question.id} checked={response.answer === key} onChange={() => onChange({ answer: key })} />
            {label}
          </label>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_12rem]">
        <label className="text-sm text-slate-700">
          Bukti / catatan {response.answer === 'na' && '(alasan N/A)'}
          <textarea className={readinessInput} rows={2} maxLength={3000} value={response.note ?? ''} onChange={(event) => onChange({ note: event.target.value })} />
        </label>
        <label className="text-sm text-slate-700">
          Kejelasan butir (1–5){' '}
          <select className={readinessInput} value={response.clarity ?? ''} onChange={(event) => onChange({ clarity: event.target.value })}>
            <option value="">Belum dinilai</option>
            {[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
      </div>
    </fieldset>
  );
}

function ResultStatus({ result }) {
  let tone = answerColors.na;
  if (result.status === 'Siap diajukan') tone = answerColors.yes;
  if (result.status === 'Hampir siap') tone = answerColors.partial;
  if (result.status === 'Perlu perbaikan') tone = answerColors.no;
  return <span className={'inline-block rounded-full px-3 py-1 text-xs font-bold ' + tone}>{result.status}</span>;
}

function Results({ groups, questions, responses, summary }) {
  const priorities = questions.filter(({ id }) => ['no', 'partial'].includes(responses[id]?.answer));
  return (
    <>
      <div className="mt-5 rounded-xl border border-primary-100 bg-primary-50 p-4 text-center sm:p-5">
        <ResultStatus result={summary} />
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-primary-100 bg-white p-3">
            <dt className="text-xs font-semibold text-slate-600">Skor kesiapan</dt>
            <dd className="mt-1 text-xl font-bold text-primary-900">{formatScore(summary.score)}{summary.score !== null && <span className="text-sm font-medium text-slate-500"> / 2</span>}</dd>
          </div>
          <div className="rounded-lg border border-primary-100 bg-white p-3">
            <dt className="text-xs font-semibold text-slate-600">Butir dijawab</dt>
            <dd className="mt-1 text-xl font-bold text-primary-900">{summary.answered} <span className="text-sm font-medium text-slate-500">/ {questions.length}</span></dd>
          </div>
          <div className="col-span-2 rounded-lg border border-primary-100 bg-white p-3 sm:col-span-1">
            <dt className="text-xs font-semibold text-slate-600">Prioritas perbaikan</dt>
            <dd className="mt-1 text-xl font-bold text-primary-900">{priorities.length}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-600">Ya bernilai 2, Sebagian bernilai 1, dan Tidak bernilai 0. Butir N/A dikeluarkan dari skor.</p>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[30rem] text-left text-sm print:min-w-0">
          <caption className={'mb-3 text-left ' + subheading}>Hasil per klausul</caption>
          <thead className="bg-primary-50 text-primary-950">
            <tr>{['Klausul', 'Ya', 'Sebagian', 'Tidak', 'N/A', 'Skor', 'Status'].map((label) => <th key={label} scope="col" className="p-2">{label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {groups.map(({ clause, items }) => {
              const result = tallyReadiness(items, responses);
              return (
                <tr key={clause.id} className="print:break-inside-avoid">
                  <th scope="row" className="p-2 font-medium">{clause.code} — {clause.title}</th>
                  {Object.entries(result.counts).map(([key, count]) => <td key={key} className="p-2">{count}</td>)}
                  <td className="p-2">
                    {formatScore(result.score)}
                    {result.score !== null && (
                      <div className="mt-1 h-1.5 w-12 overflow-hidden rounded-full bg-primary-100 print:hidden" aria-hidden="true">
                        <div className="h-full rounded-full bg-primary-600" style={{ width: result.score / 2 * 100 + '%' }} />
                      </div>
                    )}
                  </td>
                  <td className="p-2"><ResultStatus result={result} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {priorities.length > 0 && (
        <div className="mt-6">
          <h2 className={subheading}>Butir prioritas perbaikan</h2>
          <ul className="mt-2 space-y-2 text-sm text-slate-700">
            {priorities.map((item) => <li key={item.id} className="break-words rounded-lg border border-accent-200 bg-accent-50 p-3 print:break-inside-avoid"><strong>Butir {questions.indexOf(item) + 1} · {answerLabel(responses[item.id].answer)}</strong><p className="mt-1">{item.text}</p></li>)}
          </ul>
        </div>
      )}
      <p className="mt-6 text-sm text-slate-700">Siapkan bukti untuk butir yang perlu diperbaiki dan lengkapi klausul yang belum dinilai sebelum mengajukan akreditasi.</p>
    </>
  );
}

export default function ReadinessForm({ assessment, preview = false }) {
  const [step, setStep] = useState('intro');
  const [selection, setSelection] = useState([]);
  const [identity, setIdentity] = useState({});
  const [responses, setResponses] = useState({});
  const [pdfStatus, setPdfStatus] = useState('idle');
  const focusTarget = useRef(null);
  const targetQuestion = useRef(null);
  const previousStep = useRef(step);

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    const question = targetQuestion.current && document.getElementById('readiness-question-' + targetQuestion.current);
    targetQuestion.current = null;
    const field = question && (question.querySelector('input:checked') || question.querySelector('input'));
    (field || focusTarget.current)?.focus({ preventScroll: true });
    (question || focusTarget.current)?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [step]);

  const available = assessment.clauses
    .map((clause) => ({ clause, items: assessment.questions.filter((question) => question.clauseId === clause.id) }))
    .filter(({ items }) => items.length > 0);
  const selectable = available.filter(({ clause }) => !clause.always);
  const groups = available.filter(({ clause }) => clause.always || selection.includes(clause.id));
  const questions = groups.flatMap(({ items }) => items);
  const documents = new Map(assessment.documents.map((document) => [document.id, document]));
  const summary = tallyReadiness(questions, responses);
  const allSelected = selectable.every(({ clause }) => selection.includes(clause.id));
  const label = allSelected ? 'Cakupan lengkap' : 'Klausul ' + groups.map(({ clause }) => clause.code).join(', ');
  const progressQuestions = step === 'intro' || step === 'glossary' ? assessment.questions : questions;
  const progressAnswered = progressQuestions === questions ? summary.answered : tallyReadiness(progressQuestions, responses).answered;

  const changeAnswer = (id, change) => setResponses((current) => ({
    ...current, [id]: { ...current[id], ...change },
  }));

  const downloadResults = () => {
    const payload = {
      title: assessment.title,
      standard: assessment.standard,
      date: new Date().toISOString(),
      scope: label,
      clauses: groups.map(({ clause }) => ({ code: clause.code, title: clause.title })),
      identity: assessment.identity.map(({ id, label }) => ({ label, value: identity[id] || '' })),
      results: questions.map(({ id, text, reference, clauseId }, index) => ({
        id, number: index + 1, text, reference, clauseId, ...responses[id],
      })),
      summary,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'hasil-readiness-assessment.json';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadPdf = async () => {
    setPdfStatus('loading');
    try {
      const { downloadReadinessPdf } = await import('./readinessPdf.js');
      await downloadReadinessPdf({ assessment, scope: label, groups, questions, responses, summary });
      setPdfStatus('idle');
    } catch {
      setPdfStatus('error');
    }
  };

  return (
    <>
      <Progress step={step} answered={progressAnswered} total={progressQuestions.length} preview={preview} />
      <section className={panel} aria-labelledby="readiness-step-title">
        {step !== 'intro' && <p className="mb-1 break-words text-sm font-semibold text-primary-700">{assessment.title}</p>}
        <h1 id="readiness-step-title" ref={focusTarget} tabIndex={-1} className={heading}>{stepTitles[step] || assessment.title}</h1>
        <p className="mt-2 break-words text-sm text-slate-600">
          {assessment.standard}{assessment.subtitle && ' — ' + assessment.subtitle}
        </p>

        {step === 'intro' && (
          <>
            <div className="mt-6 border-t border-slate-200 pt-5">
              <h2 className={subheading}>Selamat datang</h2>
              {assessment.intro && <p className="mt-2 whitespace-pre-line break-words leading-relaxed text-slate-700">{assessment.intro}</p>}
            </div>
            <div className="mt-5 space-y-3">
              <p className={info}>
                <strong>Cara pengisian</strong><br />
                Pilih klausul, isi penilaian, lalu tinjau jawaban dan lihat hasilnya. Jawaban dan identitas hanya digunakan di halaman ini. Unduh hasil sebelum menutup halaman.
              </p>
              <p className={notice}><strong>Batasan penilaian</strong><br />{limitation}</p>
            </div>
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <caption className={'px-4 pb-3 pt-4 text-left ' + subheading}>Skala penilaian</caption>
                <thead className="bg-primary-50 text-primary-950">
                  <tr><th scope="col" className="px-3 py-2 sm:px-4">Pilihan</th><th scope="col" className="px-3 py-2 sm:px-4">Arti</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {answersList.map(([key, name, meaning]) => (
                    <tr key={key}>
                      <th scope="row" className="w-1/3 px-3 py-2.5 align-top sm:w-1/4 sm:px-4">
                        <span className={'inline-block rounded-full px-2.5 py-1 text-xs font-bold ' + answerColors[key]}>{name}</span>
                      </th>
                      <td className="px-3 py-2.5 text-slate-700 sm:px-4">{meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={actions}>
              <button type="button" className={readinessPrimary} disabled={!available.length} onClick={() => setStep('scope')}>Mulai penilaian</button>
              {assessment.glossary.length > 0 && <button type="button" className={readinessButton} onClick={() => setStep('glossary')}>Lihat glosarium</button>}
            </div>
          </>
        )}

        {step === 'glossary' && (
          <>
            <dl className="mt-5 gap-6 text-sm sm:columns-2">
              {assessment.glossary.map(({ id, term, definition, note }) => (
                <div key={id} className="mb-3 break-inside-avoid break-words rounded-lg border border-slate-200 p-3">
                  <dt className="font-bold text-primary-900">{term}</dt>
                  <dd className="mt-1 leading-relaxed text-slate-700">{definition}{note && <span className="mt-1 block text-slate-600">{note}</span>}</dd>
                </div>
              ))}
            </dl>
            <div className={actions}><button type="button" className={readinessButton} onClick={() => setStep('intro')}>Kembali ke petunjuk</button></div>
          </>
        )}

        {step === 'scope' && (
          <>
            <p className="mt-5 text-sm text-slate-700">Pilih klausul yang ingin dinilai. Klausul wajib selalu disertakan.</p>
            {selectable.length > 0 && (
              <button type="button" className={readinessButton + ' mt-4'} onClick={() => setSelection(allSelected ? [] : selectable.map(({ clause }) => clause.id))}>
                {allSelected ? 'Kosongkan pilihan' : 'Pilih semua klausul'}
              </button>
            )}
            <div className="mt-4 grid gap-2">
              {available.map(({ clause, items }) => (
                <label key={clause.id} className={'flex items-start gap-3 rounded-xl border p-3.5 sm:p-4 ' + (clause.always ? 'border-slate-200 bg-slate-50' : 'cursor-pointer border-slate-200 hover:border-primary-400 has-[:checked]:border-primary-400 has-[:checked]:bg-primary-50')}>
                  <input type="checkbox" className="mt-1 accent-primary-700" checked={clause.always || selection.includes(clause.id)} disabled={clause.always}
                    onChange={(event) => setSelection(event.target.checked ? [...selection, clause.id] : selection.filter((id) => id !== clause.id))} />
                  <span className="min-w-0 flex-1 break-words">
                    <span className="block text-sm font-bold text-primary-950">{clause.code} — {clause.title}</span>
                    {clause.description && <span className="mt-1 block text-sm text-slate-700">{clause.description}</span>}
                    <span className="mt-1 block text-xs font-semibold text-primary-800">{items.length} butir{clause.always && ' · Wajib'}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className={actions}>
              <button type="button" className={readinessButton} onClick={() => setStep('intro')}>Kembali</button>
              <button type="button" className={readinessPrimary} disabled={!questions.length} onClick={() => setStep('questions')}>Isi {questions.length} butir</button>
            </div>
          </>
        )}

        {step === 'questions' && (
          <>
            <p className={'mt-5 ' + info}>{label}</p>
            {assessment.identity.length > 0 && (
              <fieldset className="mt-5 min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <legend className="px-2 font-bold text-primary-900">Identitas lembaga <span className="text-sm font-medium text-slate-600">(opsional)</span></legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {assessment.identity.map(({ id, label }) => (
                    <label key={id} className="text-sm text-slate-700">{label}
                      <input className={readinessInput} maxLength={500} value={identity[id] ?? ''} onChange={(event) => setIdentity({ ...identity, [id]: event.target.value })} />
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            {groups.map(({ clause, items }) => (
              <div className="mt-6 space-y-3 border-t border-slate-200 pt-4" key={clause.id}>
                <h2 className={subheading}>{clause.code} — {clause.title}</h2>
                {items.map((item) => (
                  <Question key={item.id} question={item} clause={clause} number={questions.indexOf(item) + 1}
                    document={documents.get(item.documentId)} response={responses[item.id]} onChange={(change) => changeAnswer(item.id, change)} />
                ))}
              </div>
            ))}
            <div className={actions}>
              <button type="button" className={readinessButton} onClick={() => setStep('scope')}>Ubah cakupan</button>
              <button type="button" className={readinessPrimary} onClick={() => setStep('review')}>Tinjau jawaban</button>
            </div>
          </>
        )}

        {step === 'review' && (
          <>
            <p className="mt-5 text-sm text-slate-700">Pilih butir untuk mengubah jawaban.</p>
            {groups.map(({ clause, items }) => (
              <div key={clause.id} className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                <h2 className="bg-primary-50 px-4 py-3 text-sm font-bold text-primary-950">{clause.code} — {clause.title}</h2>
                <ul className="divide-y divide-slate-200">
                  {items.map((item) => {
                    const response = responses[item.id];
                    return (
                      <li key={item.id}>
                        <button type="button" className="block w-full break-words px-4 py-3 text-left text-sm hover:bg-slate-50 focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-primary-600" onClick={() => { targetQuestion.current = item.id; setStep('questions'); }}>
                          <span className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-primary-900">Butir {questions.indexOf(item) + 1}</span>
                            <span className={'rounded-full px-2.5 py-1 text-xs font-bold ' + (answerColors[response?.answer] || answerColors.na)}>{answerLabel(response?.answer) || 'Belum dijawab'}</span>
                          </span>
                          <span className="whitespace-pre-line">{item.text}</span>
                          {response?.note && <span className="mt-1 block text-slate-600">Catatan: {response.note}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            <div className={actions}>
              <button type="button" className={readinessButton} onClick={() => setStep('questions')}>Kembali ke penilaian</button>
              <button type="button" className={readinessPrimary} onClick={() => setStep('results')}>Lihat ringkasan</button>
            </div>
          </>
        )}

        {step === 'results' && (
          <>
            <p className="mt-4 text-sm font-semibold text-primary-800">{label}</p>
            <Results groups={groups} questions={questions} responses={responses} summary={summary} />
            <p className={'mt-5 ' + notice}><strong>Batasan penilaian</strong><br />{limitation}</p>
            <div className={actions}>
              <button type="button" className={readinessButton} onClick={() => setStep('review')}>Kembali ke tinjauan</button>
              {!preview && <button type="button" className={readinessPrimary} onClick={downloadPdf} disabled={pdfStatus === 'loading'}>{pdfStatus === 'loading' ? 'Menyiapkan PDF…' : 'Unduh hasil (PDF)'}</button>}
              {!preview && <button type="button" className={readinessButton} onClick={downloadResults}>Unduh hasil (JSON)</button>}
            </div>
            {pdfStatus === 'error' && <p role="alert" className="mt-3 text-sm text-red-700">PDF belum dapat diunduh. Silakan coba lagi.</p>}
          </>
        )}
      </section>
    </>
  );
}
