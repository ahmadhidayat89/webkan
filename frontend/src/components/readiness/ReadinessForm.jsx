import { useEffect, useRef, useState } from 'react';
import { submitPublicReadiness } from '../../services/api';
import {
  answersList,
  formatScopeClauseLabel,
  friendlyClauseTitle,
  getIdentityMeta,
  getOptionalHint,
  getReadinessMessages,
  getReadinessRatings,
  normalizeAnswer,
  readinessButton,
  readinessInput,
  readinessPlainAnswerLabel,
  readinessPrimary,
  shortClauseTitle,
  tallyReadiness,
} from './readiness';

const panelClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 print:border-0 print:p-0 print:shadow-none';
const badgeClass = 'mb-2 inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-800';
const headingClass = 'scroll-mt-36 break-words text-2xl font-bold tracking-tight text-primary-950 sm:text-3xl';
const subheadingClass = 'mt-5 mb-2.5 text-lg font-bold text-primary-900';
const h3Class = 'mt-4 mb-2 text-base font-bold text-primary-900';
const subtitleClass = 'mt-1 mb-4 text-sm leading-relaxed text-slate-600';
const infoBoxClass = 'my-3.5 rounded-lg border-l-4 border-primary-600 bg-primary-50 px-4 py-3 text-sm leading-relaxed text-primary-950';
const noticeBoxClass = 'my-3.5 rounded-lg border-l-4 border-accent-500 bg-accent-50 px-4 py-3 text-sm leading-relaxed text-accent-950';
const actionsClass = 'mt-6 flex flex-wrap items-center gap-3 print:hidden';

const answerColors = {
  yes: 'border-emerald-600 bg-emerald-50 text-emerald-800',
  partial: 'border-accent-500 bg-accent-50 text-accent-900',
  no: 'border-red-600 bg-red-50 text-red-800',
  na: 'border-slate-400 bg-slate-100 text-slate-700',
};

const toneClasses = {
  hijau: answerColors.yes,
  kuning: answerColors.partial,
  merah: answerColors.no,
  abu: answerColors.na,
};

const cardBorderClasses = {
  yes: 'border-solid border-slate-200 border-l-4 border-l-emerald-600 bg-white',
  partial: 'border-solid border-accent-200 border-l-4 border-l-accent-500 bg-white',
  no: 'border-solid border-red-200 border-l-4 border-l-red-600 bg-white',
};

function StatusPill({ label, tone = 'abu', large = false }) {
  const size = large ? 'px-5 py-1.5 text-base' : 'px-3 py-1 text-xs';
  return (
    <span className={`inline-block rounded-full border font-bold ${size} ${toneClasses[tone] || toneClasses.abu}`}>
      {label}
    </span>
  );
}

function ProgressStepper({ step, summary, hasQuestions, hasSubmitted, onNavigate, preview }) {
  const offset = preview ? 'top-0' : 'top-14 md:top-[4.5rem] lg:top-20';
  const pct = summary.mandTotal ? Math.round((summary.mandDone / summary.mandTotal) * 100) : 0;
  const optText = summary.optDone > 0 ? ` (+${summary.optDone} opsional)` : '';
  const canReview = summary.mandDone > 0 || summary.optDone > 0;
  const canResults = canReview && (hasSubmitted || preview);

  const tabs = [
    { key: 'intro', label: '1. Pengantar & Profil', locked: false },
    { key: 'scope', label: '2. Pilih Bagian', locked: false },
    { key: 'questions', label: '3. Kuesioner', locked: !hasQuestions },
    { key: 'review', label: '4. Tinjau Jawaban', locked: !canReview },
    { key: 'results', label: '5. Ringkasan Hasil', locked: !canResults },
  ];

  return (
    <div className={`sticky z-20 mb-4 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm print:hidden ${offset}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((tab) => {
            const active = step === tab.key;
            let cls = 'border-slate-300 bg-slate-50 text-slate-600 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-800';
            if (active) cls = 'border-primary-700 bg-primary-700 text-white';
            else if (tab.locked) cls = 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-50';
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onNavigate(tab.key)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${cls}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="text-xs font-semibold tabular-nums text-primary-900 sm:text-sm">
          {summary.mandDone} dari {summary.mandTotal} wajib terjawab{optText}
        </div>
      </div>
      <progress aria-label="Pertanyaan wajib terjawab" max={summary.mandTotal || 1} value={summary.mandDone} className="sr-only" />
      <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-primary-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary-700 to-primary-500 motion-safe:transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function IntroStep({ assessment, messages, ratings, allCounts, identity, onIdentityChange, onNext, onGlossary }) {
  const entityLabel = assessment.subtitle || 'Lembaga';

  return (
    <div className={panelClass}>
      <span className={badgeClass}>Langkah Awal Sebelum Pengajuan Akreditasi</span>
      <h1 className={headingClass}>
        {assessment.title || 'Penilaian Kesiapan Akreditasi'}
      </h1>
      <p className={subtitleClass}>
        {assessment.intro || 'Halaman ini membantu Anda memeriksa kelengkapan dokumen dan rekaman lembaga secara mandiri sebelum mengajukan permohonan akreditasi KAN.'}
      </p>

      <div className={infoBoxClass}>
        <strong>Cara Mengisi (Cukup 3 Pilihan Jawaban):</strong>
        <br />
        1. <strong>Isi Profil Singkat:</strong> Lengkapi informasi dasar mengenai instansi Anda di bagian bawah halaman ini.
        <br />
        2. <strong>Jawab Pertanyaan dengan 3 Pilihan (Ya / Sebagian / Tidak):</strong> Terdapat{' '}
        <strong>{allCounts.mandTotal} pertanyaan wajib</strong> dan{' '}
        <strong>{allCounts.optTotal} pertanyaan opsional</strong>. Untuk pertanyaan berlabel <em>Opsional</em>, cukup{' '}
        <strong>lewati (kosongkan)</strong> apabila kegiatan tersebut tidak dilakukan di lembaga Anda.
        <br />
        3. <strong>Lihat Ringkasan Kesiapan:</strong> Di akhir kuesioner, Anda akan mendapatkan gambaran kesiapan dokumen beserta daftar bukti yang masih perlu dilengkapi.
      </div>

      <h2 className={subheadingClass}>Panduan Pilihan Jawaban</h2>
      <div className="my-3 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-primary-50 text-primary-950">
            <tr>
              <th scope="col" className="w-44 px-3 py-2.5 sm:px-4">Pilihan Jawaban</th>
              <th scope="col" className="px-3 py-2.5 sm:px-4">Kapan Memilih Jawaban Ini?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr>
              <td className="px-3 py-2.5 align-middle sm:px-4"><StatusPill label="Ya" tone="hijau" /></td>
              <td className="px-3 py-2.5 text-slate-700 sm:px-4">{messages.guideYes}</td>
            </tr>
            <tr>
              <td className="px-3 py-2.5 align-middle sm:px-4"><StatusPill label="Sebagian" tone="kuning" /></td>
              <td className="px-3 py-2.5 text-slate-700 sm:px-4">{messages.guidePartial}</td>
            </tr>
            <tr>
              <td className="px-3 py-2.5 align-middle sm:px-4"><StatusPill label="Tidak" tone="merah" /></td>
              <td className="px-3 py-2.5 text-slate-700 sm:px-4">{messages.guideNo}</td>
            </tr>
            <tr>
              <td className="px-3 py-2.5 align-middle sm:px-4">
                <span className="inline-block rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-bold text-accent-900">
                  Opsional (Lewati)
                </span>
              </td>
              <td className="px-3 py-2.5 text-slate-700 sm:px-4">{messages.guideOptional}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className={h3Class}>Arti Kategori Hasil Kesiapan</h3>
      <div className="my-3 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-primary-50 text-primary-950">
            <tr>
              <th scope="col" className="w-36 px-3 py-2.5 sm:px-4">Kategori</th>
              <th scope="col" className="px-3 py-2.5 sm:px-4">Arti &amp; Saran Tindak Lanjut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {ratings.map((rating) => (
              <tr key={rating.label}>
                <td className="px-3 py-2.5 align-middle sm:px-4">
                  <StatusPill label={rating.label} tone={rating.tone} />
                </td>
                <td className="px-3 py-2.5 text-slate-700 sm:px-4">{rating.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={noticeBoxClass}>
        <strong>Catatan Penting:</strong> {messages.limitation}
      </div>

      {assessment.identity.length > 0 && (
        <div id="identSection" className="mt-6 border-t border-slate-200 pt-5">
          <h3 className={h3Class}>Profil Singkat {entityLabel}</h3>
          <p className={subtitleClass}>
            Silakan lengkapi {assessment.identity.length} data dasar instansi Anda di bawah ini untuk dicantumkan pada lembar ringkasan hasil.
          </p>
          <div className="grid grid-cols-1 gap-3.5 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
            {assessment.identity.map((item, idx) => {
              const meta = getIdentityMeta(item, idx);
              return (
                <div key={item.id} className={meta.fullSpan ? 'sm:col-span-2' : ''}>
                  <label htmlFor={`ident_${item.id}`} className="block text-sm font-semibold text-primary-900">
                    {item.label}
                  </label>
                  <input
                    id={`ident_${item.id}`}
                    type={meta.type}
                    placeholder={meta.placeholder}
                    maxLength={500}
                    value={identity[item.id] ?? ''}
                    onChange={(e) => onIdentityChange(item.id, e.target.value)}
                    className={readinessInput}
                  />
                  {meta.hint && <p className="mt-1 text-xs text-slate-500">{meta.hint}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={actionsClass}>
        <button type="button" className={readinessPrimary} onClick={onNext}>
          Lanjut Pilih Bagian Kuesioner
        </button>
        {assessment.glossary?.length > 0 && (
          <button type="button" className={readinessButton} onClick={onGlossary}>
            Lihat Kamus Istilah (Glosarium)
          </button>
        )}
      </div>
    </div>
  );
}

function GlossaryStep({ assessment, onBack }) {
  return (
    <div className={panelClass}>
      <span className={badgeClass}>Kamus Istilah</span>
      <h1 className={headingClass}>Glosarium ({assessment.standard})</h1>
      <p className={subtitleClass}>
        Penjelasan singkat mengenai istilah dan singkatan yang sering digunakan dalam proses akreditasi.
      </p>
      <dl className="mt-5 gap-6 text-sm sm:columns-2">
        {assessment.glossary.map(({ id, term, definition, note }) => (
          <div key={id} className="mb-3 break-inside-avoid break-words rounded-lg border border-slate-200 p-3">
            <dt className="font-bold text-primary-900">{term}</dt>
            <dd className="mt-1 leading-relaxed text-slate-700">
              {definition}
              {note && note !== '-' && (
                <span className="mt-1 block text-xs italic text-slate-500">{note}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <div className={actionsClass}>
        <button type="button" className={readinessButton} onClick={onBack}>
          Kembali
        </button>
      </div>
    </div>
  );
}

function ScopeStep({ available, selection, allCounts, summary, onToggleAll, onToggleClause, onBack, onStart }) {
  const isAll = available.length > 0 && available.every(({ clause }) => clause.always || selection.includes(clause.id));

  let scopeInfoContent;
  if (isAll) {
    scopeInfoContent = (
      <>
        <strong>Kuesioner Lengkap Terpilih:</strong> {summary.mandTotal} pertanyaan wajib dan {summary.optTotal} pertanyaan opsional (lewati bila tidak relevan).
      </>
    );
  } else if (selection.length === 0) {
    scopeInfoContent = (
      <>
        Silakan pilih minimal satu bagian di atas, atau klik <strong>Pilih Semua Bagian</strong>.
      </>
    );
  } else {
    scopeInfoContent = (
      <>
        <strong>Bagian Terpilih:</strong> {summary.mandTotal} pertanyaan wajib dan {summary.optTotal} pertanyaan opsional.
      </>
    );
  }

  return (
    <div className={panelClass}>
      <span className={badgeClass}>Pilihan Bagian</span>
      <h1 className={headingClass}>Pilih Bagian yang Ingin Diperiksa</h1>
      <p className={subtitleClass}>
        Secara otomatis seluruh bagian telah dipilih ({allCounts.mandTotal} pertanyaan wajib + {allCounts.optTotal} pertanyaan opsional). Jika Anda ingin memeriksa bagian tertentu saja secara bertahap, silakan sesuaikan pilihan di bawah ini.
      </p>

      <div className="my-4">
        <div className="mb-3.5">
          <button
            type="button"
            onClick={onToggleAll}
            className={`inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm transition ${
              isAll
                ? 'border-primary-700 bg-primary-700 font-bold text-white'
                : 'border-slate-300 bg-white font-semibold text-slate-700 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-800'
            }`}
          >
            Pilih Semua Bagian — Kuesioner Lengkap ({allCounts.mandTotal} Wajib + {allCounts.optTotal} Opsional)
          </button>
        </div>
        <div className="space-y-2.5 border-t border-slate-200 pt-3.5">
          {available.map(({ clause, items }) => {
            const selected = clause.always || selection.includes(clause.id);
            return (
              <div key={clause.id} className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                <button
                  type="button"
                  disabled={clause.always}
                  onClick={() => onToggleClause(clause.id)}
                  className={`min-w-[290px] rounded-full border px-5 py-2 text-left text-xs transition sm:text-sm ${
                    selected
                      ? 'border-primary-500 bg-primary-50 font-bold text-primary-900'
                      : 'border-slate-300 bg-white font-semibold text-slate-700 hover:border-primary-500 hover:bg-primary-50'
                  }`}
                >
                  {formatScopeClauseLabel(clause, items)}
                </button>
                {clause.description && (
                  <span className="flex-1 text-xs text-slate-600 sm:text-sm">{clause.description}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={infoBoxClass}>{scopeInfoContent}</div>

      <div className={actionsClass}>
        <button type="button" className={readinessButton} onClick={onBack}>
          Kembali ke Profil
        </button>
        <button
          type="button"
          className={readinessPrimary}
          disabled={selection.length === 0}
          onClick={onStart}
        >
          Mulai Jawab Kuesioner
        </button>
      </div>
    </div>
  );
}

function QuestionCard({ question, number, response, onAnswer }) {
  const curAns = normalizeAnswer(response?.answer);
  const isOptional = Boolean(question.allowNA);

  let cardStyle = isOptional && !curAns
    ? 'border-dashed border-slate-300 bg-slate-50/40'
    : 'border-solid border-slate-200 bg-white';
  if (curAns && cardBorderClasses[curAns]) {
    cardStyle = cardBorderClasses[curAns];
  }

  return (
    <fieldset
      id={`readiness-question-${question.id}`}
      className={`mb-3 min-w-0 scroll-mt-36 rounded-xl border p-4 transition sm:p-5 ${cardStyle}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-primary-800">Pertanyaan {number}</span>
        {isOptional ? (
          <span className="rounded-full border border-accent-200 bg-accent-50 px-2.5 py-0.5 text-xs font-bold text-accent-900">
            Opsional — Lewati jika tidak relevan
          </span>
        ) : (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-bold text-slate-700">
            Wajib
          </span>
        )}
      </div>

      <p className="my-2.5 whitespace-pre-line break-words text-sm font-medium leading-relaxed text-slate-900 sm:text-base">
        {question.text}
      </p>

      {isOptional && (
        <div className="mb-3 rounded-lg border-l-4 border-accent-500 bg-accent-50 px-3 py-2 text-xs text-accent-950">
          <strong>Catatan Opsional:</strong> {getOptionalHint(question)}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {answersList.map(([key, label]) => {
          const selected = curAns === key;
          const pillCls = selected
            ? `${answerColors[key]} font-bold`
            : 'border-slate-300 bg-white font-semibold text-slate-700 hover:border-primary-500 hover:bg-primary-50';
          return (
            <button
              key={key}
              type="button"
              aria-pressed={selected}
              onClick={() => onAnswer(question.id, selected ? undefined : key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition ${pillCls}`}
            >
              {label}
            </button>
          );
        })}
        {isOptional && curAns && (
          <button
            type="button"
            onClick={() => onAnswer(question.id, undefined)}
            className="px-2 py-1 text-xs font-medium text-slate-500 underline hover:text-red-700"
          >
            Kosongkan (Lewati)
          </button>
        )}
      </div>
    </fieldset>
  );
}

function QuestionsStep({
  assessment,
  groups,
  questions,
  responses,
  summary,
  identityCount,
  identityTotal,
  filter,
  setFilter,
  collapsed,
  onToggleCollapse,
  onAnswer,
  onGoToProfile,
  onGoToScope,
  onGoToReview,
}) {
  const scrollToSection = (clauseId) => {
    if (collapsed[clauseId]) {
      onToggleCollapse(clauseId, false);
    }
    window.setTimeout(() => {
      const el = document.getElementById(`sec_${clauseId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[270px_1fr]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto print:hidden">
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          Profil Instansi
        </div>
        <button
          type="button"
          onClick={onGoToProfile}
          className="mb-1 flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-primary-50 hover:text-primary-800"
        >
          <span>Profil Lembaga</span>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs ${
              identityCount === identityTotal && identityTotal > 0
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            {identityCount}/{identityTotal}
          </span>
        </button>

        <div className="mt-4 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          Bagian Kuesioner
        </div>
        <div>
          {groups.map(({ clause, items }) => {
            const mandItems = items.filter((q) => !q.allowNA);
            const mandDone = mandItems.filter((q) => normalizeAnswer(responses[q.id]?.answer)).length;
            const allDone = mandDone === mandItems.length;
            return (
              <button
                key={clause.id}
                type="button"
                onClick={() => scrollToSection(clause.id)}
                className="mb-1 flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-primary-50 hover:text-primary-800"
              >
                <span className="truncate">{shortClauseTitle(clause)}</span>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${
                    allDone
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  {mandDone}/{mandItems.length} wajib
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          Saring Pertanyaan
        </div>
        <div className="flex flex-col gap-1.5">
          {[
            ['all', 'Tampilkan Semua'],
            ['unanswered', 'Wajib Belum Dijawab'],
            ['flagged', 'Perlu Dilengkapi (Sebagian/Tidak)'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-lg border px-2.5 py-1.5 text-left text-xs font-semibold transition ${
                filter === key
                  ? 'border-primary-500 bg-primary-50 text-primary-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-primary-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </aside>

      <main className="min-w-0">
        <div className={panelClass}>
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div>
              <span className={badgeClass}>Pemeriksaan Ketersediaan Bukti</span>
              <h1 className={headingClass}>{assessment.title || 'Kuesioner Kesiapan Bukti'}</h1>
            </div>
            <button
              type="button"
              onClick={onGoToScope}
              className={readinessButton}
            >
              Ubah Pilihan Bagian
            </button>
          </div>
          <p className="mt-2 mb-3 text-sm text-slate-600">
            Jawab <strong>{summary.mandTotal} pertanyaan wajib</strong> di bawah ini dengan memilih{' '}
            <strong>Ya</strong>, <strong>Sebagian</strong>, atau <strong>Tidak</strong>. Untuk{' '}
            <strong>{summary.optTotal} pertanyaan berlabel Opsional</strong>, cukup lewati (biarkan kosong) jika kegiatan tersebut tidak dilakukan di lembaga Anda.
          </p>

          {groups.map(({ clause, items }) => {
            const isCollapsed = Boolean(collapsed[clause.id]);
            const mandItems = items.filter((q) => !q.allowNA);
            const mandDone = mandItems.filter((q) => normalizeAnswer(responses[q.id]?.answer)).length;
            const optItems = items.filter((q) => q.allowNA);
            const optDone = optItems.filter((q) => normalizeAnswer(responses[q.id]?.answer)).length;
            const optMeta = optItems.length > 0 ? ` · ${optDone}/${optItems.length} opsional diisi` : '';

            const visibleItems = items.filter((item) => {
              const curAns = normalizeAnswer(responses[item.id]?.answer);
              if (filter === 'unanswered') return !curAns && !item.allowNA;
              if (filter === 'flagged') return curAns === 'no' || curAns === 'partial';
              return true;
            });

            return (
              <div key={clause.id} id={`sec_${clause.id}`} className="scroll-mt-32">
                <button
                  type="button"
                  onClick={() => onToggleCollapse(clause.id, !isCollapsed)}
                  className="mt-5 mb-3 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-primary-50/60 px-4 py-3 text-left select-none"
                >
                  <span className="text-base font-bold text-primary-950">{friendlyClauseTitle(clause)}</span>
                  <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <span>
                      {mandDone}/{mandItems.length} wajib terjawab{optMeta}
                    </span>
                    <span className="text-primary-800">{isCollapsed ? 'Buka' : 'Tutup'}</span>
                  </span>
                </button>

                {!isCollapsed && (
                  <div>
                    {visibleItems.map((item) => (
                      <QuestionCard
                        key={item.id}
                        question={item}
                        number={questions.indexOf(item) + 1}
                        response={responses[item.id]}
                        onAnswer={onAnswer}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className={actionsClass}>
            <button type="button" className={readinessButton} onClick={onGoToScope}>
              Kembali ke Pilihan Bagian
            </button>
            <button type="button" className={readinessPrimary} onClick={onGoToReview}>
              Periksa Kembali Jawaban
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function ReviewStep({
  assessment,
  groups,
  questions,
  responses,
  identity,
  submitting,
  submitError,
  onEditQuestion,
  onBack,
  onSubmit,
}) {
  const entityLabel = assessment.subtitle || 'Lembaga';

  return (
    <div className={panelClass}>
      <span className={badgeClass}>Pemeriksaan Sebelum Hasil Akhir</span>
      <h1 className={headingClass}>Tinjau Jawaban Anda</h1>
      <p className={subtitleClass}>
        Silakan periksa kembali jawaban Anda di bawah ini. Pertanyaan opsional yang dikosongkan otomatis tercatat sebagai{' '}
        <em>Dilewati (Tidak Berlaku)</em>. Klik pada baris mana saja jika ingin mengubah jawaban.
      </p>

      {assessment.identity.length > 0 && (
        <>
          <h3 className={h3Class}>Profil Singkat {entityLabel}</h3>
          <div className="my-3 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-primary-50 text-primary-950">
                <tr>
                  <th scope="col" className="w-2/5 px-3 py-2.5 sm:px-4">Informasi</th>
                  <th scope="col" className="px-3 py-2.5 sm:px-4">Isian Anda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {assessment.identity.map((item) => {
                  const val = (identity[item.id] || '').trim();
                  return (
                    <tr key={item.id}>
                      <td className="px-3 py-2.5 font-bold text-slate-800 sm:px-4">{item.label}</td>
                      <td className="px-3 py-2.5 text-slate-700 sm:px-4">
                        {val || <span className="text-slate-400">Belum diisi</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {groups.map(({ clause, items }) => (
        <div key={clause.id} className="mt-5 overflow-hidden rounded-xl border border-slate-200">
          <h2 className="bg-primary-50 px-4 py-3 text-sm font-bold text-primary-950">{friendlyClauseTitle(clause)}</h2>
          <div className="divide-y divide-slate-200">
            {items.map((item) => {
              const ans = normalizeAnswer(responses[item.id]?.answer);
              const isOpt = Boolean(item.allowNA);
              let ansText = 'Belum dijawab (Wajib)';
              let ansTone = 'abu';
              if (ans === 'yes') {
                ansText = 'Ya';
                ansTone = 'hijau';
              } else if (ans === 'partial') {
                ansText = 'Sebagian';
                ansTone = 'kuning';
              } else if (ans === 'no') {
                ansText = 'Tidak';
                ansTone = 'merah';
              } else if (isOpt) {
                ansText = 'Dilewati (Opsional)';
                ansTone = 'abu';
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onEditQuestion(item)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold text-primary-900">
                        Pertanyaan {questions.indexOf(item) + 1}
                      </span>
                      {isOpt ? (
                        <span className="rounded-full border border-accent-200 bg-accent-50 px-2 py-0.5 text-xs font-bold text-accent-900">
                          Opsional
                        </span>
                      ) : (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-700">
                          Wajib
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-900">{item.text}</p>
                  </div>
                  <div className="shrink-0">
                    <StatusPill label={ansText} tone={ansTone} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {submitError && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {submitError}
        </p>
      )}

      <div className={actionsClass}>
        <button type="button" className={readinessButton} disabled={submitting} onClick={onBack}>
          Kembali ke Kuesioner
        </button>
        <button type="button" className={readinessPrimary} disabled={submitting} onClick={onSubmit}>
          {submitting ? 'Mengirim Jawaban…' : 'Kirim Jawaban'}
        </button>
      </div>
    </div>
  );
}

function ResultsStep({
  assessment,
  messages,
  groups,
  questions,
  responses,
  summary,
  identity,
  preview,
  pdfStatus,
  onBack,
  onDownloadPdf,
}) {
  const entityLabel = assessment.subtitle || 'Lembaga';
  const priorities = questions.filter((q) => {
    const a = normalizeAnswer(responses[q.id]?.answer);
    return a === 'no' || a === 'partial';
  });
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={panelClass}>
      <span className={badgeClass}>Laporan Kesiapan Mandiri</span>
      <h1 className={headingClass}>Ringkasan Hasil — {assessment.title || 'Kesiapan Akreditasi'}</h1>

      <h3 className={h3Class}>Profil {entityLabel}</h3>
      <div className="my-3 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-primary-50 text-primary-950">
            <tr>
              <th scope="col" className="w-2/5 px-3 py-2.5 sm:px-4">Informasi Instansi</th>
              <th scope="col" className="px-3 py-2.5 sm:px-4">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {assessment.identity.map((item) => {
              const val = (identity[item.id] || '').trim();
              return (
                <tr key={item.id}>
                  <td className="px-3 py-2.5 font-bold text-slate-800 sm:px-4">{item.label}</td>
                  <td className="px-3 py-2.5 text-slate-700 sm:px-4">
                    {val || <span className="text-slate-400">Belum diisi</span>}
                  </td>
                </tr>
              );
            })}
            <tr>
              <td className="px-3 py-2.5 font-bold text-slate-800 sm:px-4">Tanggal Pemeriksaan Mandiri</td>
              <td className="px-3 py-2.5 text-slate-700 sm:px-4">{dateStr}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="my-5 rounded-xl border border-primary-100 bg-primary-50 px-5 py-6 text-center">
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-primary-900">
          Status Kesiapan {entityLabel} Anda
        </div>
        <StatusPill label={summary.status} tone={summary.tone} large />
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-700">{summary.description}</p>
      </div>

      <div className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-700">{summary.counts.yes}</div>
          <div className="mt-1 text-xs font-semibold text-slate-600">Ya (Sudah Lengkap)</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-accent-700">{summary.counts.partial}</div>
          <div className="mt-1 text-xs font-semibold text-slate-600">Sebagian</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-red-700">{summary.counts.no}</div>
          <div className="mt-1 text-xs font-semibold text-slate-600">Tidak (Belum Ada)</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-slate-700">{summary.counts.na}</div>
          <div className="mt-1 text-xs font-semibold text-slate-600">Opsional Dilewati</div>
        </div>
        <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center sm:col-span-1">
          <div className="text-2xl font-bold text-primary-900">
            {summary.mandDone}/{summary.mandTotal}
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-600">Wajib Terjawab</div>
        </div>
      </div>

      <h2 className={subheadingClass}>Kesiapan per Bagian</h2>
      <div className="my-3 overflow-hidden rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-primary-50 text-primary-950">
              <tr>
                <th scope="col" className="px-3 py-2.5 sm:px-4">Bagian</th>
                <th scope="col" className="px-3 py-2.5 sm:px-4">Ya</th>
                <th scope="col" className="px-3 py-2.5 sm:px-4">Sebagian</th>
                <th scope="col" className="px-3 py-2.5 sm:px-4">Tidak</th>
                <th scope="col" className="px-3 py-2.5 sm:px-4">Opsional Dilewati</th>
                <th scope="col" className="px-3 py-2.5 sm:px-4">Status Kesiapan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {groups.map(({ clause, items }) => {
                const ev = tallyReadiness(items, responses, messages);
                return (
                  <tr key={clause.id}>
                    <td className="px-3 py-2.5 font-bold text-slate-800 sm:px-4">{friendlyClauseTitle(clause)}</td>
                    <td className="px-3 py-2.5 sm:px-4">{ev.counts.yes}</td>
                    <td className="px-3 py-2.5 sm:px-4">{ev.counts.partial}</td>
                    <td className="px-3 py-2.5 sm:px-4">{ev.counts.no}</td>
                    <td className="px-3 py-2.5 sm:px-4">{ev.counts.na}</td>
                    <td className="px-3 py-2.5 sm:px-4">
                      <StatusPill label={ev.status} tone={ev.tone} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {assessment.documents?.length > 0 && (
        <>
          <h2 className={subheadingClass}>Kesiapan Dokumen Pendukung Pengajuan Akreditasi</h2>
          <div className="my-3 overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-primary-50 text-primary-950">
                  <tr>
                    <th scope="col" className="w-20 px-3 py-2.5 sm:px-4">Kode</th>
                    <th scope="col" className="px-3 py-2.5 sm:px-4">Dokumen yang Perlu Disiapkan</th>
                    <th scope="col" className="w-52 px-3 py-2.5 sm:px-4">Status Kesiapan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {assessment.documents.map((doc) => {
                    const hasAnyQuestionInAssessment = assessment.questions.some(
                      (q) => q.documentId === doc.id || q.documentId === doc.code
                    );
                    if (!hasAnyQuestionInAssessment) {
                      return (
                        <tr key={doc.id}>
                          <td className="px-3 py-2.5 font-bold text-slate-800 sm:px-4">{doc.code}</td>
                          <td className="px-3 py-2.5 text-slate-700 sm:px-4">{doc.title}</td>
                          <td className="px-3 py-2.5 sm:px-4">
                            <StatusPill label="Diisi Tahap Berikutnya" tone="abu" />
                          </td>
                        </tr>
                      );
                    }
                    const dItems = questions.filter((q) => q.documentId === doc.id || q.documentId === doc.code);
                    if (!dItems.length) return null;
                    const ev = tallyReadiness(dItems, responses, messages);
                    return (
                      <tr key={doc.id}>
                        <td className="px-3 py-2.5 font-bold text-slate-800 sm:px-4">{doc.code}</td>
                        <td className="px-3 py-2.5 text-slate-700 sm:px-4">{doc.title}</td>
                        <td className="px-3 py-2.5 sm:px-4">
                          <StatusPill label={ev.status} tone={ev.tone} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {priorities.length > 0 ? (
        <>
          <h2 className={subheadingClass}>Daftar Bukti yang Perlu Dilengkapi ({priorities.length} Butir)</h2>
          <div className="my-3 overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-primary-50 text-primary-950">
                  <tr>
                    <th scope="col" className="w-20 px-3 py-2.5 sm:px-4">No.</th>
                    <th scope="col" className="px-3 py-2.5 sm:px-4">Bukti yang Perlu Dilengkapi</th>
                    <th scope="col" className="w-36 px-3 py-2.5 sm:px-4">Status Saat Ini</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {priorities.map((item) => {
                    const ans = normalizeAnswer(responses[item.id]?.answer);
                    const tone = ans === 'no' ? 'merah' : 'kuning';
                    const lbl = readinessPlainAnswerLabel(ans);
                    return (
                      <tr key={item.id}>
                        <td className="px-3 py-2.5 font-bold text-slate-800 sm:px-4">
                          #{questions.indexOf(item) + 1}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 sm:px-4">{item.text}</td>
                        <td className="px-3 py-2.5 sm:px-4">
                          <StatusPill label={lbl} tone={tone} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        summary.unansweredMand === 0 && (
          <div className={infoBoxClass}>
            {messages.completeMessage}
          </div>
        )
      )}

      <div className={noticeBoxClass}>
        <strong>Langkah Selanjutnya:</strong> {messages.nextStepMessage}
      </div>

      <div className={actionsClass}>
        <button type="button" className={readinessButton} onClick={onBack}>
          Kembali ke Kuesioner
        </button>
        {!preview && (
          <button
            type="button"
            className={readinessPrimary}
            onClick={onDownloadPdf}
            disabled={pdfStatus === 'loading'}
          >
            {pdfStatus === 'loading' ? 'Menyiapkan PDF…' : 'Unduh PDF'}
          </button>
        )}
      </div>
      {pdfStatus === 'error' && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          PDF belum dapat diunduh. Silakan coba lagi.
        </p>
      )}
    </div>
  );
}

export default function ReadinessForm({ assessment, assessmentId, preview = false }) {
  const allClauseIds = assessment.clauses.map((c) => c.id);
  const [step, setStep] = useState('intro');
  const [prevStep, setPrevStep] = useState('intro');
  const [selection, setSelection] = useState(allClauseIds);
  const [identity, setIdentity] = useState({});
  const [responses, setResponses] = useState({});
  const [submissionToken, setSubmissionToken] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [filter, setFilter] = useState('all');
  const [collapsed, setCollapsed] = useState({});
  const [pdfStatus, setPdfStatus] = useState('idle');
  const targetQuestion = useRef(null);
  const targetElementId = useRef(null);

  useEffect(() => {
    if (!assessmentId) return;
    const key = 'kan-readiness-draft:' + assessmentId;
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      // ignore storage errors
    }
  }, [assessmentId]);

  useEffect(() => {
    if (targetQuestion.current && step === 'questions') {
      const qEl = document.getElementById('readiness-question-' + targetQuestion.current);
      targetQuestion.current = null;
      if (qEl) {
        qEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    if (targetElementId.current) {
      const el = document.getElementById(targetElementId.current);
      targetElementId.current = null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const messages = getReadinessMessages(assessment);
  const ratings = getReadinessRatings(messages);

  const available = assessment.clauses
    .map((clause) => ({
      clause,
      items: assessment.questions.filter((question) => question.clauseId === clause.id),
    }))
    .filter(({ items }) => items.length > 0);
  const selectable = available.filter(({ clause }) => !clause.always);
  const groups = available.filter(({ clause }) => clause.always || selection.includes(clause.id));
  const questions = groups.flatMap(({ items }) => items);
  const allCounts = tallyReadiness(assessment.questions, responses, messages);
  const summary = tallyReadiness(questions.length ? questions : assessment.questions, responses, messages);
  const allSelected = selectable.every(({ clause }) => selection.includes(clause.id));
  const scopeLabel = allSelected ? 'Cakupan lengkap' : 'Bagian ' + groups.map(({ clause }) => clause.code).join(', ');

  const filledIdentity = assessment.identity
    .map(({ id, label }) => ({ id, label, value: Object.hasOwn(identity, id) ? (identity[id] || '').trim() : '' }))
    .filter(({ value }) => value);

  const handleSubmitAssessment = async () => {
    setSubmitError('');
    if (preview || !assessmentId) {
      setHasSubmitted(true);
      setPrevStep(step);
      setStep('results');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        submission_token: submissionToken,
        scope: scopeLabel,
        selected_clauses: selection,
        identity,
        responses,
      };
      const { data } = await submitPublicReadiness(assessmentId, payload);
      if (data?.data?.submission_token) {
        setSubmissionToken(data.data.submission_token);
      }
      setHasSubmitted(true);
      setPrevStep(step);
      setStep('results');
    } catch {
      setSubmitError('Gagal mengirim jawaban ke server. Silakan periksa koneksi Anda dan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const navigateTo = (nextStep) => {
    if ((nextStep === 'review' || nextStep === 'results') && summary.mandDone === 0 && summary.optDone === 0) {
      window.alert('Silakan jawab minimal satu pertanyaan pada kuesioner terlebih dahulu sebelum melihat tinjauan atau ringkasan hasil.');
      setPrevStep(step);
      setStep('questions');
      return;
    }
    if (nextStep === 'results' && !hasSubmitted && !preview) {
      window.alert('Silakan tinjau jawaban Anda dan klik tombol Kirim Jawaban terlebih dahulu.');
      setPrevStep(step);
      setStep('review');
      return;
    }
    if (nextStep === 'questions' && questions.length === 0) {
      setSelection(allClauseIds);
    }
    setPrevStep(step);
    setStep(nextStep);
  };

  const handleAnswer = (id, value) => {
    setResponses((current) => {
      const next = { ...current };
      if (!value) {
        delete next[id];
      } else {
        next[id] = { answer: value };
      }
      return next;
    });
  };

  const handleEditQuestion = (item) => {
    setFilter('all');
    setCollapsed((cur) => ({ ...cur, [item.clauseId]: false }));
    targetQuestion.current = item.id;
    setPrevStep(step);
    setStep('questions');
  };

  const handleGoToProfile = () => {
    targetElementId.current = 'identSection';
    setPrevStep(step);
    setStep('intro');
  };

  const downloadPdf = async () => {
    setPdfStatus('loading');
    try {
      const { downloadReadinessPdf } = await import('./readinessPdf.js');
      await downloadReadinessPdf({
        assessment,
        identity: filledIdentity,
        scope: scopeLabel,
        groups,
        questions,
        responses,
        summary,
      });
      setPdfStatus('idle');
    } catch {
      setPdfStatus('error');
    }
  };

  return (
    <div className="font-sans">
      <ProgressStepper
        step={step}
        summary={summary}
        hasQuestions={questions.length > 0}
        hasSubmitted={hasSubmitted}
        onNavigate={navigateTo}
        preview={preview}
      />

      {step === 'intro' && (
        <IntroStep
          assessment={assessment}
          messages={messages}
          ratings={ratings}
          allCounts={allCounts}
          identity={identity}
          onIdentityChange={(id, val) => setIdentity((cur) => ({ ...cur, [id]: val }))}
          onNext={() => navigateTo('scope')}
          onGlossary={() => navigateTo('glossary')}
        />
      )}

      {step === 'glossary' && (
        <GlossaryStep
          assessment={assessment}
          onBack={() => setStep(prevStep === 'glossary' ? 'intro' : prevStep)}
        />
      )}

      {step === 'scope' && (
        <ScopeStep
          available={available}
          selection={selection}
          allCounts={allCounts}
          summary={summary}
          onToggleAll={() =>
            setSelection(allSelected ? [] : selectable.map(({ clause }) => clause.id))
          }
          onToggleClause={(clauseId) =>
            setSelection((cur) =>
              cur.includes(clauseId) ? cur.filter((id) => id !== clauseId) : [...cur, clauseId]
            )
          }
          onBack={() => navigateTo('intro')}
          onStart={() => navigateTo('questions')}
        />
      )}

      {step === 'questions' && (
        <QuestionsStep
          assessment={assessment}
          groups={groups}
          questions={questions}
          responses={responses}
          summary={summary}
          identityCount={filledIdentity.length}
          identityTotal={assessment.identity.length}
          filter={filter}
          setFilter={setFilter}
          collapsed={collapsed}
          onToggleCollapse={(clauseId, val) =>
            setCollapsed((cur) => ({ ...cur, [clauseId]: val }))
          }
          onAnswer={handleAnswer}
          onGoToProfile={handleGoToProfile}
          onGoToScope={() => navigateTo('scope')}
          onGoToReview={() => navigateTo('review')}
        />
      )}

      {step === 'review' && (
        <ReviewStep
          assessment={assessment}
          groups={groups}
          questions={questions}
          responses={responses}
          identity={identity}
          submitting={submitting}
          submitError={submitError}
          onEditQuestion={handleEditQuestion}
          onBack={() => navigateTo('questions')}
          onSubmit={handleSubmitAssessment}
        />
      )}

      {step === 'results' && (
        <ResultsStep
          assessment={assessment}
          messages={messages}
          groups={groups}
          questions={questions}
          responses={responses}
          summary={summary}
          identity={identity}
          preview={preview}
          pdfStatus={pdfStatus}
          onBack={() => navigateTo('questions')}
          onDownloadPdf={downloadPdf}
        />
      )}
    </div>
  );
}
