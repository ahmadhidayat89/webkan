import React from 'react';

export const EXTENDED_TYPES = ['linear', 'rating', 'grid', 'check_grid', 'date', 'time', 'duration', 'section', 'heading', 'video', 'image'];
export { CONTENT_TYPES, visibleQuestions, validateExtended } from './surveyFlow';

function youtubeId(u) {
  if (u.hostname === 'youtu.be') return u.pathname.slice(1);
  if (['youtube.com', 'www.youtube.com'].includes(u.hostname)) return u.searchParams.get('v');
  return '';
}

export function videoEmbed(url) {
  try {
    const u = new URL(url);
    const id = youtubeId(u);
    return /^[\w-]{11}$/.test(id || '') ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch { return null; }
}

export default function ExtendedField({ q, value, onChange }) {
  const c = q.config || {};
  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-600 outline-none';
  if (['section', 'heading', 'image'].includes(q.type)) return c.description ? <p className="survey-description text-slate-500 whitespace-pre-wrap">{c.description}</p> : null;
  if (q.type === 'video') {
    const url = videoEmbed(c.video_url);
    return url ? <iframe title="Video kuesioner" src={url} className="w-full aspect-video rounded-xl" allowFullScreen /> : <p className="text-sm text-slate-500">Tambahkan tautan video YouTube.</p>;
  }
  if (['date', 'time', 'duration'].includes(q.type)) return <input aria-label={q.type === 'duration' ? 'Durasi jam:menit:detik' : 'Jawaban'} className={inputClass} type={q.type === 'duration' ? 'text' : q.type} placeholder={q.type === 'duration' ? '00:30:00 (jam:menit:detik)' : ''} value={value ?? ''} onChange={e => onChange(e.target.value)} />;
  if (['linear', 'rating'].includes(q.type)) return <ScaleField q={q} value={value} onChange={onChange} />;
  if (['grid', 'check_grid'].includes(q.type)) return <GridField q={q} value={value} onChange={onChange} />;
  return null;
}

function ScaleField({ q, value, onChange }) {
  const c = q.config || {};
  const min = q.type === 'rating' ? 1 : (c.min ?? 1);
  const max = c.max ?? 5;
  const symbol = { star: '★', heart: '♥', thumb: '👍' }[c.icon || 'star'];
  return <div className="space-y-4 pt-2"><div className="flex flex-wrap justify-center gap-3 sm:gap-5" role="radiogroup" aria-label="Nilai">
    {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(n => <button type="button" role="radio" aria-checked={Number(value) === n && value !== '' && value != null} aria-label={`${n} dari ${max}`} key={n} onClick={() => onChange(n)} className={`min-w-10 rounded-xl border px-3 py-2 transition ${Number(value) === n && value !== '' && value != null ? 'bg-blue-700 border-blue-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-400'}`}>
      {q.type === 'rating' ? <><span className={Number(value) >= n ? 'text-amber-400' : ''}>{symbol}</span><span className="block text-xs">{n}</span></> : n}
    </button>)}
  </div><div className="flex justify-between gap-6 text-xs text-slate-500"><span className="flex-1">{c.min_label}</span><span className="flex-1 text-right">{c.max_label}</span></div></div>;
}

function GridField({ q, value, onChange }) {
  const c = q.config || {};
  const columns = q.options || q.opts || [];
  return <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full text-sm"><thead className="bg-blue-50 text-blue-900"><tr><th scope="col" className="p-3 text-left">Aspek</th>{columns.map(col => <th scope="col" key={col} className="p-3 font-semibold">{col}</th>)}</tr></thead><tbody>
    {(c.rows || []).map((row, r) => <tr key={row} className="border-t border-slate-100"><th scope="row" className="p-3 text-left font-medium">{row}</th>{columns.map(col => {
      return <GridCell key={col} q={q} value={value} row={row} rowIndex={r} column={col} onChange={onChange} />;
    })}</tr>)}
  </tbody></table></div>;
}

function GridCell({ q, value, row, rowIndex, column, onChange }) {
  const current = value?.[row];
  const single = q.type === 'grid';
  const checked = single ? current === column : (current || []).includes(column);
  const change = event => {
    let next = column;
    if (!single) next = event.target.checked ? [...(current || []), column] : current.filter(v => v !== column);
    onChange({ ...(value || {}), [row]: next });
  };
  return <td className="p-3 text-center"><input aria-label={`${row}: ${column}`} type={single ? 'radio' : 'checkbox'} name={`${q.id || q._key}_${rowIndex}`} checked={checked} onChange={change} className="h-4 w-4 accent-blue-700" /></td>;
}
