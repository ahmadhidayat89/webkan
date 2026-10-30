import { useState } from 'react';
import { getAdminSurvey } from '../../services/api';
import { InlineImageUpload } from './EditorChrome';
import toast from 'react-hot-toast';

const field = 'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-800 focus:border-blue-500 focus:outline-none';
const Toggle = ({ label, hint, value, onChange, disabled }) => <label className={`flex items-start justify-between gap-5 py-3 text-sm text-slate-700 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}><span><span className="font-medium">{label}</span>{hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}</span><input type="checkbox" role="switch" aria-label={label} className="mt-0.5 h-4 w-4 shrink-0 accent-blue-700" checked={Boolean(value)} disabled={disabled} onChange={e => onChange(e.target.checked)} /></label>;
const Text = ({ label, value, onChange, ...rest }) => <label className="block text-xs font-semibold text-slate-600">{label}<input className={field} value={value ?? ''} onChange={e => onChange(e.target.value)} {...rest} /></label>;
const Num = ({ label, value, onChange, ...rest }) => <Text label={label} type="number" value={value} onChange={v => onChange(v === '' ? undefined : Number(v))} {...rest} />;
const Select = ({ label, value, onChange, options }) => <label className="block text-xs font-semibold text-slate-600">{label}<select className={field} value={value} onChange={e => onChange(e.target.value)}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
const Lines = ({ label, values, onChange }) => <label className="block text-xs font-semibold text-slate-600">{label}<textarea className={field} rows={3} value={(values || []).join('\n')} onChange={e => onChange(e.target.value.split('\n'))} /></label>;
const Group = ({ title, hint, children, open = false }) => <details open={open || undefined} className="rounded-xl border border-slate-200 bg-white group"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5"><span><span className="block font-bold text-slate-900">{title}</span>{hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}</span><span className="text-slate-400 transition group-open:rotate-180">⌄</span></summary><div className="space-y-4 border-t border-slate-100 p-5">{children}</div></details>;

export function QuestionPrimaryOptions({ q, onConfig, onPatch }) {
  const c = q.config || {};
  const fileGroups = [['PDF', 'pdf'], ['Word', 'doc,docx'], ['Excel', 'xls,xlsx,csv'], ['PowerPoint', 'ppt,pptx'], ['Gambar', 'jpg,jpeg,png,gif,webp'], ['Teks', 'txt']];
  const types = (c.file_types || 'pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,webp,txt,csv').split(',');
  return <div className="space-y-4">
    {(c.show_description || c.description || ['section', 'heading', 'image', 'video'].includes(q.type)) && <Text label="Deskripsi" placeholder="Tambahkan deskripsi (opsional)" value={c.description} onChange={description => onConfig({ description })} />}
    {q.type === 'image' && <InlineImageUpload label="Pilih gambar" url={q.image_url} onChange={image_url => onPatch({ image_url })} />}
    {q.type === 'video' && <Text label="Tautan video YouTube" placeholder="https://www.youtube.com/watch?v=…" value={c.video_url} onChange={video_url => onConfig({ video_url })} />}
    {['linear', 'rating'].includes(q.type) && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4"><div className="grid grid-cols-2 gap-4">
      {q.type === 'linear' && <Select label="Mulai dari" value={c.min ?? 1} options={[[0, '0'], [1, '1']]} onChange={v => onConfig({ min: Number(v) })} />}
      <Select label={q.type === 'rating' ? 'Jumlah nilai' : 'Sampai dengan'} value={c.max ?? 5} options={Array.from({ length: q.type === 'rating' ? 8 : 9 }, (_, i) => [i + (q.type === 'rating' ? 3 : 2), String(i + (q.type === 'rating' ? 3 : 2))])} onChange={v => onConfig({ max: Number(v) })} />
      {q.type === 'rating' && <Select label="Simbol" value={c.icon || 'star'} options={[['star', '★ Bintang'], ['heart', '♥ Hati'], ['thumb', '👍 Jempol']]} onChange={icon => onConfig({ icon })} />}
    </div><div className="grid grid-cols-2 gap-4"><Text label="Label awal (opsional)" value={c.min_label} onChange={min_label => onConfig({ min_label })} /><Text label="Label akhir (opsional)" value={c.max_label} onChange={max_label => onConfig({ max_label })} /></div></div>}
    {['grid', 'check_grid'].includes(q.type) && <Lines label="Baris — satu aspek pada setiap baris" values={c.rows || []} onChange={rows => onConfig({ rows })} />}
    {q.type === 'file' && <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-600">Jenis file yang diperbolehkan</p><div className="grid grid-cols-2 gap-2">{fileGroups.map(([label, extensions]) => <label key={label} className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={extensions.split(',').some(t => types.includes(t))} onChange={e => { const group = extensions.split(','); const next = e.target.checked ? [...new Set([...types, ...group])] : types.filter(t => !group.includes(t)); if (!next.length) { toast.error('Pilih minimal satu jenis file.'); return; } onConfig({ file_types: next.join(',') }); }} />{label}</label>)}</div><div className="grid grid-cols-2 gap-4"><Select label="Jumlah file maksimal" value={c.file_max_files ?? 1} options={Array.from({ length: 10 }, (_, i) => [i + 1, String(i + 1)])} onChange={v => onConfig({ file_max_files: Number(v) })} /><Num label="Ukuran per file (MB)" min="1" max="50" value={c.file_max_mb ?? 10} onChange={file_max_mb => onConfig({ file_max_mb })} /></div></div>}
  </div>;
}

export function ValidationOptions({ q, onChange }) {
  const v = q.validation || {};
  return <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold text-slate-600">Validasi jawaban</p>
    {q.type === 'short' && <Select label="Jenis jawaban" value={v.answer_type || 'text'} options={[['text', 'Teks bebas'], ['text_number', 'Huruf dan angka'], ['email', 'Email'], ['phone', 'Nomor telepon'], ['number', 'Angka']]} onChange={answer_type => onChange({ answer_type })} />}
    {['short', 'para'].includes(q.type) && <><div className="grid grid-cols-2 gap-3"><Num label="Minimal karakter" min="0" value={v.min_length} onChange={min_length => onChange({ min_length })} /><Num label="Maksimal karakter" min="1" value={v.max_length} onChange={max_length => onChange({ max_length })} /></div>{v.answer_type === 'number' && <div className="grid grid-cols-2 gap-3"><Num label="Angka minimum" value={v.min_value} onChange={min_value => onChange({ min_value })} /><Num label="Angka maksimum" value={v.max_value} onChange={max_value => onChange({ max_value })} /></div>}<Text label="Harus memuat teks (opsional)" value={v.contains} onChange={contains => onChange({ contains })} /><details><summary className="cursor-pointer text-xs text-blue-700">Pola teks khusus</summary><div className="mt-2"><Text label="Pola regex tanpa delimiter" value={v.pattern} onChange={pattern => onChange({ pattern })} /></div></details></>}
    {q.type === 'check' && <div className="grid grid-cols-2 gap-3"><Num label="Minimal pilihan" min="0" max={q.opts.length} value={v.min_selections} onChange={min_selections => onChange({ min_selections })} /><Num label="Maksimal pilihan" min="1" max={q.opts.length} value={v.max_selections} onChange={max_selections => onChange({ max_selections })} /></div>}
    <Text label="Pesan kesalahan (opsional)" value={v.error_message} onChange={error_message => onChange({ error_message })} />
  </div>;
}

export function QuestionMoreOptions({ q, onConfig, onPatch }) {
  const c = q.config || {};
  const hasValidation = c.show_validation || Object.values(q.validation || {}).some(v => v != null && v !== '');
  return <details className="relative"><summary className="cursor-pointer list-none rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600" aria-label="Opsi lain pertanyaan">••• Opsi lain</summary><div className="absolute bottom-full right-0 z-20 mb-2 w-64 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-xl">
    <Toggle label="Deskripsi" value={c.show_description || Boolean(c.description)} onChange={enabled => onConfig({ show_description: enabled, ...(!enabled && { description: '' }) })} />
    {['short', 'para', 'check'].includes(q.type) && <Toggle label="Validasi jawaban" value={hasValidation} onChange={enabled => { onConfig({ show_validation: enabled }); if (!enabled) onPatch({ validation: {} }); }} />}
    {['choice', 'drop'].includes(q.type) && <Toggle label="Buka bagian berdasarkan jawaban" value={c.show_branches || Object.values(c.branches || {}).some(Boolean)} onChange={enabled => onConfig({ show_branches: enabled, ...(!enabled && { branches: {} }) })} />}
    {['choice', 'check', 'drop'].includes(q.type) && <Toggle label="Acak urutan opsi" value={c.shuffle_options} onChange={shuffle_options => onConfig({ shuffle_options })} />}
    {['grid', 'check_grid'].includes(q.type) && <><Toggle label="Wajib isi setiap baris" value={c.require_rows} onChange={require_rows => onConfig({ require_rows })} /><Toggle label="Satu pilihan per kolom" value={c.unique_columns} onChange={unique_columns => onConfig({ unique_columns })} /><Toggle label="Acak urutan baris" value={c.shuffle_rows} onChange={shuffle_rows => onConfig({ shuffle_rows })} /></>}
  </div></details>;
}

export function QuizAnswerKey({ q, onConfig }) {
  const c = q.config || {};
  return <details className="rounded-xl border border-blue-100 bg-blue-50/40 p-3"><summary className="cursor-pointer text-xs font-bold text-blue-800">Kunci jawaban · {c.points ?? 0} poin</summary><div className="mt-3 space-y-4"><Num label="Poin" min="0" max="1000" value={c.points ?? 0} onChange={points => onConfig({ points })} />{!['para', 'file', 'grid', 'check_grid'].includes(q.type) && <Lines label={q.type === 'check' ? 'Pilihan yang benar — satu per baris' : 'Jawaban yang benar (persis)'} values={c.correct_answers} onChange={correct_answers => onConfig({ correct_answers })} />}{['para', 'file', 'grid', 'check_grid'].includes(q.type) && <p className="text-xs text-slate-500">Jawaban diperiksa manual melalui tab Jawaban.</p>}<Text label="Masukan untuk responden" value={c.feedback} onChange={feedback => onConfig({ feedback })} /></div></details>;
}

export function SurveySettings({ settings: s, onChange }) {
  const patch = (key, value) => onChange({ ...s, [key]: value });
  return <div className="mx-auto max-w-3xl space-y-4">
    <Group title="Kuis" hint="Kunci jawaban, poin, dan pengaturan nilai" open><Toggle label="Jadikan sebagai kuis" hint="Tentukan kunci dan poin pada masing-masing pertanyaan." value={s.quiz} onChange={v => patch('quiz', v)} />{s.quiz && <><Toggle label="Tampilkan nilai setelah dikirim" value={s.show_score} onChange={v => patch('show_score', v)} /><Toggle label="Tampilkan jawaban benar dan masukan" value={s.show_feedback} onChange={v => patch('show_feedback', v)} /></>}</Group>
    <Group title="Respons" hint="Pengeditan jawaban dan batas penerimaan respons" open>
      <Toggle label="Izinkan pengeditan respons" hint="Jawaban dapat dibuka kembali melalui tautan edit." value={s.allow_edit} onChange={v => patch('allow_edit', v)} />
      <div className="grid gap-4 sm:grid-cols-2"><Text label="Tutup otomatis (waktu Jakarta)" type="datetime-local" value={s.closes_at?.slice(0, 16)} onChange={v => patch('closes_at', v ? `${v}:00+07:00` : null)} /><Num label="Jumlah respons maksimal" min="1" value={s.response_limit} onChange={v => patch('response_limit', v ?? null)} /></div>
    </Group>
    <Group title="Presentasi" hint="Tampilan pengisian dan progres">
      <Toggle label="Tampilkan progres pengisian" value={s.show_progress} onChange={v => patch('show_progress', v)} /><Toggle label="Acak urutan pertanyaan" hint="Dinonaktifkan bila ada percabangan." value={s.shuffle_questions} onChange={v => patch('shuffle_questions', v)} /><Toggle label="Simpan progres pada perangkat" value={s.save_draft} onChange={v => patch('save_draft', v)} />
      </Group>
    <Group title="Setelah pengiriman" hint="Atur pesan terima kasih yang dilihat responden" open><label className="block text-xs font-semibold text-slate-600">Pesan setelah jawaban dikirim<textarea rows={4} maxLength={2000} className={field} placeholder="Jawaban Anda telah berhasil kami terima. Terima kasih atas masukan Anda untuk meningkatkan mutu layanan KAN." value={s.confirmation_message ?? ''} onChange={e => patch('confirmation_message', e.target.value)} /><span className="mt-2 block font-normal text-slate-500">Ditampilkan di halaman Terima Kasih setelah pengiriman berhasil. Kosongkan untuk memakai pesan bawaan KAN.</span></label><Toggle label="Tampilkan tautan untuk mengisi lagi" value={s.submit_another} onChange={v => patch('submit_another', v)} /><Toggle label="Tampilkan ringkasan jawaban responden" hint="Setelah mengirim, responden hanya melihat jawaban miliknya sendiri." value={s.show_summary} onChange={v => patch('show_summary', v)} /><Text label="Pesan saat form ditutup" value={s.closed_message} onChange={v => patch('closed_message', v)} />
    </Group>
    <Group title="Default" hint="Pengaturan untuk pertanyaan baru"><Toggle label="Buat pertanyaan wajib diisi secara default" hint="Berlaku untuk pertanyaan yang ditambahkan setelah pengaturan ini aktif." value={s.required_default} onChange={v => patch('required_default', v)} /></Group>
    <p className="px-1 text-xs text-slate-400">Gunakan tombol Simpan di bagian atas untuk menerapkan perubahan.</p>
  </div>;
}

export function ThemeSettings({ settings: s, onChange }) {
  const patch = (key, value) => onChange({ ...s, [key]: value });
  return <div className="space-y-6 rounded-xl bg-white p-4"><div><h3 className="mb-3 text-sm font-bold text-slate-900">Header</h3><InlineImageUpload label="Pilih gambar header" url={s.header_image} onChange={v => patch('header_image', v)} /></div><div className="grid grid-cols-2 gap-4"><Text label="Warna aksen" type="color" value={s.theme_color || '#1d4ed8'} onChange={v => patch('theme_color', v)} /><Text label="Warna latar" type="color" value={s.background_color || '#f4f7fc'} onChange={v => patch('background_color', v)} /></div><Select label="Gaya font" value={s.font || 'system'} options={[['system', 'Standar KAN'], ['serif', 'Serif']]} onChange={v => patch('font', v)} /><div className="grid grid-cols-3 gap-3"><Num label="Judul (px)" min="20" max="40" value={s.title_size ?? 28} onChange={v => patch('title_size', v)} /><Num label="Pertanyaan (px)" min="14" max="24" value={s.question_size ?? 16} onChange={v => patch('question_size', v)} /><Num label="Isi (px)" min="12" max="20" value={s.body_size ?? 14} onChange={v => patch('body_size', v)} /></div><p className="text-xs text-slate-400">Lihat hasil melalui Pratinjau. Simpan untuk menerapkan pada form publik.</p></div>;
}

export function ImportQuestions({ surveys, currentId, onImport }) {
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(false);
  const importSource = async () => { setBusy(true); try { const response = await getAdminSurvey(source); onImport(response.data.data.survey.questions); toast.success('Pertanyaan diimpor. Simpan untuk menerapkan.'); } catch { toast.error('Gagal memuat sumber pertanyaan.'); } finally { setBusy(false); } };
  return <div className="space-y-4"><label className="block text-xs font-semibold text-slate-600">Kuesioner sumber<select value={source} onChange={e => setSource(e.target.value)} className={field}><option value="">Pilih kuesioner…</option>{surveys.filter(s => s.id !== currentId).map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label><button type="button" disabled={!source || busy} onClick={importSource} className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-bold text-white disabled:opacity-40">{busy ? 'Memuat…' : 'Impor pertanyaan'}</button></div>;
}
