import RichText from '../RichText';

function AnswerValue({ value, type, options = [] }) {
  if (value == null || value === '' || (typeof value === 'object' && !Object.keys(value).length)) return <span className="italic text-slate-400">Tidak diisi</span>;
  if (type === 'file') {
    const files = Array.isArray(value) ? value : [value];
    return <ul className="space-y-1">{files.map((file, i) => <li key={i}>{/^https?:\/\//i.test(file.url || '') ? <a href={file.url} target="_blank" rel="noreferrer" className="text-blue-700 underline break-all">{file.name || 'File terunggah'}</a> : <span>{file.name || 'File terunggah'}</span>}</li>)}</ul>;
  }
  if (Array.isArray(value)) return <ul className="list-disc space-y-1 pl-5">{value.map((item, i) => <li key={i}><AnswerValue value={item} /></li>)}</ul>;
  if (typeof value === 'object') return <dl className="space-y-2">{Object.entries(value).map(([row, answer]) => <div key={row}><dt className="font-medium text-slate-700">{row}</dt><dd className="mt-1"><AnswerValue value={answer} /></dd></div>)}</dl>;
  if (type === 'scale' && options?.[Number(value) - 1]) return <span>{value} — {options[Number(value) - 1]}</span>;
  if (type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) return <span>{String(value).split('-').reverse().join('/')}</span>;
  return <span className="whitespace-pre-wrap break-words">{String(value)}</span>;
}

export default function ResponseSummary({ items = [] }) {
  if (!items.length) return null;
  return <details className="rounded-xl border border-slate-200 p-4 text-left">
    <summary className="cursor-pointer font-bold text-blue-900">Ringkasan jawaban Anda</summary>
    <p className="mt-2 text-xs text-slate-500">Jawaban yang Anda kirim pada pengisian ini.</p>
    <div className="mt-4 divide-y divide-slate-100">{items.map((q, i) => <div key={q.question_id ?? i} className="py-3 text-sm first:pt-0 last:pb-0">
      <div className="mb-2 font-semibold text-slate-900"><RichText html={q.text} /></div>
      <div className="text-slate-600"><AnswerValue value={q.answer} type={q.type} options={q.options} /></div>
    </div>)}</div>
  </details>;
}
