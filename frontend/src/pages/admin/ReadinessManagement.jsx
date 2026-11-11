import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaClipboardCheck, FaPlus } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import ReadinessForm from '../../components/readiness/ReadinessForm';
import { readinessButton, readinessInput, readinessPrimary, readinessUrl } from '../../components/readiness/readiness';
import { useConfirm } from '../../hooks/useConfirm';
import {
  deleteReadiness, getReadiness, getReadinessTemplate, listReadiness,
  publishReadiness, saveReadiness, unpublishReadiness,
} from '../../services/api';

const collections = {
  clauses: { label: 'Klausul', singular: 'klausul', empty: { code: '', title: '', description: '', always: false } },
  questions: { label: 'Butir Penilaian', singular: 'butir', empty: { clauseId: '', reference: '', text: '', allowNA: false, documentId: '', evidence: '' } },
  identity: { label: 'Identitas Lembaga', singular: 'kolom identitas', empty: { label: '' } },
  documents: { label: 'Dokumen Acuan', singular: 'dokumen acuan', empty: { code: '', title: '', sample: '' } },
  glossary: { label: 'Glosarium', singular: 'istilah', empty: { term: '', definition: '', note: '' } },
};
const blank = () => ({
  title: '', standard: '', subtitle: '', intro: '',
  clauses: [], questions: [], identity: [], documents: [], glossary: [],
});
const card = 'rounded-2xl border border-slate-200 bg-white p-5 sm:p-6';
const rowActions = 'flex shrink-0 flex-wrap items-start gap-2';

function Field({ name, label, value, onChange, max, required, multiline, options }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}{required && ' *'}
      {options ? (
        <select name={name} className={readinessInput} required={required} value={value ?? ''} onChange={onChange}>
          {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      ) : multiline ? (
        <textarea name={name} className={readinessInput} rows={4} maxLength={max} required={required} value={value ?? ''} onChange={onChange} />
      ) : (
        <input name={name} className={readinessInput} maxLength={max} required={required} value={value ?? ''} onChange={onChange} />
      )}
    </label>
  );
}

function Settings({ draft, onChange }) {
  const field = (name, label, max, required, multiline) => (
    <Field name={name} label={label} max={max} required={required} multiline={multiline} value={draft[name]} onChange={onChange} />
  );
  return (
    <div className="grid gap-4">
      {field('title', 'Judul asesmen', 200, true)}
      {field('standard', 'Standar', 120, true)}
      {field('subtitle', 'Subjudul / jenis lembaga', 250)}
      {field('intro', 'Petunjuk pengisian', 3000, false, true)}
    </div>
  );
}

function ItemFields({ section, item, draft, onChange }) {
  const field = (name, label, max, required, multiline, options) => (
    <Field name={name} label={label} max={max} required={required} multiline={multiline} options={options} value={item[name]} onChange={onChange} />
  );
  const checkbox = (name, label) => (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" name={name} checked={item[name]} onChange={onChange} />
      {label}
    </label>
  );
  if (section === 'clauses') return (
    <>
      {field('code', 'Kode klausul', 40, true)}
      {field('title', 'Nama klausul', 200, true)}
      {field('description', 'Deskripsi', 600, false, true)}
      {checkbox('always', 'Sertakan klausul ini pada setiap penilaian')}
    </>
  );
  if (section === 'questions') return (
    <>
      {field('clauseId', 'Klausul', undefined, true, false, draft.clauses.map(({ id, code, title }) => [id, code + ' — ' + title]))}
      {field('reference', 'Subklausul / rujukan', 120)}
      {field('text', 'Pertanyaan', 4000, true, true)}
      {checkbox('allowNA', 'Izinkan jawaban Tidak berlaku (N/A)')}
      {field('documentId', 'Dokumen acuan', undefined, false, false, [['', 'Tanpa dokumen acuan'], ...draft.documents.map(({ id, code, title }) => [id, code + ' — ' + title])])}
      {item.documentId && field('evidence', 'Ketentuan bukti', undefined, true, false, [['Wajib', 'Wajib'], ['Jika ada', 'Jika ada']])}
    </>
  );
  if (section === 'identity') return field('label', 'Label kolom', 250, true);
  if (section === 'documents') return (
    <>
      {field('code', 'Kode dokumen', 40, true)}
      {field('title', 'Nama dokumen', 350, true)}
      {field('sample', 'Contoh nama berkas', 250)}
    </>
  );
  return (
    <>
      {field('term', 'Istilah', 250, true)}
      {field('definition', 'Definisi', 3000, true, true)}
      {field('note', 'Catatan', 3000, false, true)}
    </>
  );
}

function ItemEditor({ section, item, draft, onApply, onCancel }) {
  const [value, setValue] = useState(item);
  const [error, setError] = useState('');

  const change = ({ target }) => {
    setError('');
    const updated = target.type === 'checkbox' ? target.checked : target.value;
    setValue((current) => target.name === 'documentId'
      ? { ...current, documentId: updated, evidence: updated ? current.evidence || 'Wajib' : '' }
      : { ...current, [target.name]: updated });
  };
  const apply = (event) => {
    event.preventDefault();
    const clean = Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, typeof entry === 'string' ? entry.trim() || null : entry]));
    if (['code', 'title', 'text', 'label', 'term', 'definition'].some((key) => key in clean && !clean[key])) {
      setError('Lengkapi kolom wajib.');
    } else if (clean.code && draft[section].some((entry) => entry.id !== item.id && entry.code.toLowerCase() === clean.code.toLowerCase())) {
      setError('Kode ini sudah digunakan.');
    } else {
      onApply(clean);
    }
  };
  return (
    <form className="mt-4 grid gap-4 rounded-xl border border-primary-200 bg-primary-50 p-4" onSubmit={apply}>
      <h3 className="font-semibold text-slate-900">{draft[section].some(({ id }) => id === item.id) ? 'Edit' : 'Tambah'} {collections[section].singular}</h3>
      <ItemFields section={section} item={value} draft={draft} onChange={change} />
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className={rowActions}>
        <button type="submit" className={readinessPrimary}>Terapkan</button>
        <button type="button" className={readinessButton} onClick={onCancel}>Batal</button>
      </div>
    </form>
  );
}

function describeItem(section, item, draft, number) {
  if (section === 'questions') {
    const clause = draft.clauses.find(({ id }) => id === item.clauseId);
    const document = draft.documents.find(({ id }) => id === item.documentId);
    return [item.text, ['Butir ' + number, 'Klausul ' + (item.reference || clause?.code), document?.code, item.allowNA && 'N/A'].filter(Boolean).join(' · ')];
  }
  if (section === 'clauses') return [item.code + ' — ' + item.title, [
    draft.questions.filter(({ clauseId }) => clauseId === item.id).length + ' butir', item.always && 'Wajib', item.description,
  ].filter(Boolean).join(' · ')];
  if (section === 'documents') return [item.code + ' — ' + item.title, item.sample];
  if (section === 'glossary') return [item.term, item.definition];
  return [item.label, ''];
}

function Collection({ section, draft, item, setItem, update, confirm }) {
  const [query, setQuery] = useState('');
  const [clauseFilter, setClauseFilter] = useState('');
  const [page, setPage] = useState(1);
  const list = draft[section];
  const filtered = list.map((entry, index) => ({ entry, index, description: describeItem(section, entry, draft, index + 1) }))
    .filter(({ entry, description }) => (!clauseFilter || entry.clauseId === clauseFilter)
      && description.join(' ').toLowerCase().includes(query.trim().toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pages);

  const add = () => {
    const id = 'item-' + crypto.getRandomValues(new Uint32Array(4)).join('-');
    const value = { ...collections[section].empty, id };
    if (section === 'questions') value.clauseId = clauseFilter || draft.clauses[0].id;
    setItem(value);
  };
  const remove = async (entry) => {
    const questionCount = section === 'clauses' && draft.questions.filter(({ clauseId }) => clauseId === entry.id).length;
    const message = questionCount
      ? 'Hapus klausul ini dan ' + questionCount + ' butir di dalamnya?'
      : 'Hapus ' + collections[section].singular + ' ini dari draf?';
    if (!await confirm(message)) return;
    const changes = { [section]: list.filter(({ id }) => id !== entry.id) };
    if (section === 'clauses') changes.questions = draft.questions.filter(({ clauseId }) => clauseId !== entry.id);
    if (section === 'documents') changes.questions = draft.questions.map((question) => question.documentId === entry.id
      ? { ...question, documentId: null, evidence: null } : question);
    update(changes);
  };
  const move = (index, offset) => {
    const copy = [...list];
    [copy[index], copy[index + offset]] = [copy[index + offset], copy[index]];
    update({ [section]: copy });
  };
  const apply = (value) => {
    const existing = list.some(({ id }) => id === value.id);
    update({ [section]: existing ? list.map((entry) => entry.id === value.id ? value : entry) : [...list, value] });
    if (!existing) {
      setQuery('');
      setClauseFilter('');
      setPage(Math.ceil((list.length + 1) / 10));
    }
    setItem(null);
  };
  const missingClause = section === 'questions' && !draft.clauses.length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Field name="query" label={'Cari ' + collections[section].singular} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
          {section === 'questions' && <Field name="filter" label="Filter klausul" value={clauseFilter} options={[['', 'Semua klausul'], ...draft.clauses.map(({ id, code, title }) => [id, code + ' — ' + title])]} onChange={(event) => { setClauseFilter(event.target.value); setPage(1); }} />}
        </div>
        <button type="button" className={readinessPrimary} disabled={!!item || missingClause} onClick={add}><FaPlus aria-hidden="true" /> Tambah {collections[section].singular}</button>
      </div>
      {item && <ItemEditor key={item.id} section={section} item={item} draft={draft} onApply={apply} onCancel={() => setItem(null)} />}
      {missingClause && <p className="mt-4 text-sm text-slate-600">Tambahkan klausul terlebih dahulu untuk membuat butir penilaian.</p>}
      {!filtered.length && !missingClause && <p className="mt-4 text-sm text-slate-600">{list.length ? 'Tidak ada hasil yang cocok.' : 'Belum ada ' + collections[section].singular + '.'}</p>}
      <ul className="mt-4 divide-y divide-slate-200">
        {filtered.slice((currentPage - 1) * 10, currentPage * 10).map(({ entry, index, description: [title, detail] }) => (
          <li className="flex flex-col justify-between gap-3 py-4 lg:flex-row" key={entry.id}>
            <div className="min-w-0">
              <p className="whitespace-pre-line break-words text-sm font-semibold text-slate-900">{title}</p>
              {detail && <p className="mt-1 break-words text-xs text-slate-600">{detail}</p>}
            </div>
            <div className={rowActions}>
              <button type="button" className={readinessButton} aria-label={'Naikkan ' + collections[section].singular + ' ' + (index + 1)} disabled={!!item || index === 0} onClick={() => move(index, -1)}>↑</button>
              <button type="button" className={readinessButton} aria-label={'Turunkan ' + collections[section].singular + ' ' + (index + 1)} disabled={!!item || index === list.length - 1} onClick={() => move(index, 1)}>↓</button>
              <button type="button" className={readinessButton} disabled={!!item} onClick={() => setItem(entry)}>Edit</button>
              <button type="button" className={readinessButton + ' text-red-700'} disabled={!!item} onClick={() => void remove(entry)}>Hapus</button>
            </div>
          </li>
        ))}
      </ul>
      {pages > 1 && <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-700">
        <button type="button" className={readinessButton} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Sebelumnya</button>
        <span>Halaman {currentPage} dari {pages} · {filtered.length} entri</span>
        <button type="button" className={readinessButton} disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Berikutnya</button>
      </div>}
    </>
  );
}

function Preview({ draft, onClose }) {
  const dialog = useRef(null);
  useEffect(() => { dialog.current.showModal(); }, []);
  return (
    <dialog ref={dialog} onClose={onClose} aria-labelledby="readiness-preview" className="max-h-[90vh] w-[min(94vw,64rem)] rounded-2xl bg-slate-50 p-4 backdrop:bg-slate-950/60 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="readiness-preview" className="text-lg font-bold">Pratinjau formulir</h2>
        <button type="button" className={readinessButton} onClick={() => dialog.current.close()}>Tutup</button>
      </div>
      <ReadinessForm assessment={draft} preview />
    </dialog>
  );
}

export default function ReadinessManagement() {
  const [catalog, setCatalog] = useState(null);
  const [reload, setReload] = useState(0);
  const [record, setRecord] = useState(null);
  const [draft, setDraft] = useState(null);
  const [section, setSection] = useState('settings');
  const [item, setItem] = useState(null);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { confirm, ConfirmDialog } = useConfirm();
  const dirty = !!draft && draft !== record?.draft;
  const unsaved = dirty || !!item;

  useEffect(() => {
    const controller = new AbortController();
    listReadiness(controller.signal)
      .then(({ data }) => setCatalog(data.data))
      .catch(() => {
        if (!controller.signal.aborted) setError('Daftar asesmen gagal dimuat. Silakan coba lagi.');
      });
    return () => controller.abort();
  }, [reload]);

  useEffect(() => {
    if (!unsaved) return;
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);

  const perform = async (operation) => {
    setBusy(true);
    setError('');
    try {
      await operation();
    } catch (error) {
      const details = Object.values(error.response?.data?.errors || {}).flat();
      setError(details[0] || 'Tindakan gagal. Silakan coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  const open = (data = null, initial = blank(), tab = 'settings') => {
    setRecord(data);
    setDraft(data?.draft || initial);
    setSection(tab);
    setItem(null);
    setError('');
  };
  const back = async () => {
    if (unsaved && !await confirm('Buang perubahan yang belum disimpan dan kembali ke daftar?')) return;
    setDraft(null);
    setRecord(null);
    setItem(null);
    setError('');
    setReload((value) => value + 1);
  };
  const edit = (id, duplicate = false) => perform(async () => {
    const { data: { data } } = await getReadiness(id);
    if (duplicate) open(null, { ...data.draft, title: (data.draft.title.slice(0, 190) + ' (Salinan)') });
    else open(data, data.draft, 'clauses');
  });
  const useTemplate = () => perform(async () => {
    const { data: { data } } = await getReadinessTemplate();
    open(null, data, 'clauses');
  });
  const save = () => {
    if (!draft.title.trim() || !draft.standard.trim()) {
      setSection('settings');
      setError('Isi judul dan standar asesmen sebelum menyimpan draf.');
      return;
    }
    return perform(async () => {
      const { data: { data } } = await saveReadiness(record?.id, draft);
      setRecord(data);
      setDraft(data.draft);
      toast.success('Draf tersimpan.');
    });
  };
  const changePublication = (publish) => perform(async () => {
    const operation = publish ? publishReadiness : unpublishReadiness;
    const { data: { data } } = await operation(record.id);
    setRecord(data);
    setDraft(data.draft);
    toast.success(publish ? 'Asesmen diterbitkan di Layanan Akreditasi.' : 'Asesmen ditarik dari Layanan Akreditasi.');
  });
  const remove = async ({ id, title, published_at }) => {
    const note = published_at ? ' Asesmen ini juga akan hilang dari Layanan Akreditasi.' : '';
    if (!await confirm('Hapus asesmen “' + title + '”?' + note)) return;
    return perform(async () => {
      await deleteReadiness(id);
      setCatalog((current) => current.filter((entry) => entry.id !== id));
      toast.success('Asesmen dihapus.');
    });
  };

  return (
    <AdminLayout>
      <Toaster />
      <div className="space-y-6">
        {draft && <button type="button" className={readinessButton} disabled={busy} onClick={() => void back()}>← Daftar asesmen</button>}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 p-5 text-white shadow-xl sm:p-7">
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <FaClipboardCheck className="text-xl" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                {draft?.standard && <p className="text-xs font-semibold text-white/80">{draft.standard}</p>}
                <h1 className="break-words text-2xl font-black">{draft ? draft.title || 'Asesmen baru' : 'Kelola Readiness Assessment'}</h1>
                <p className="mt-0.5 text-sm text-white/80">{draft ? draft.subtitle || 'Atur formulir penilaian kesiapan.' : 'Kelola asesmen kesiapan lembaga untuk setiap standar akreditasi.'}</p>
              </div>
            </div>
            {!draft && (
              <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                <button
                  type="button"
                  className="rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
                  disabled={busy}
                  onClick={useTemplate}
                >
                  Gunakan templat LSP
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-primary-700 shadow-md transition-colors hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
                  disabled={busy}
                  onClick={() => open()}
                >
                  <FaPlus aria-hidden="true" /> Tambah asesmen
                </button>
              </div>
            )}
          </div>
        </section>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}

        {!draft && (
          <div className="grid gap-4 lg:grid-cols-2">
            {catalog === null && !error && <p role="status">Memuat daftar asesmen…</p>}
            {catalog === null && error && <div><button type="button" className={readinessButton} onClick={() => { setError(''); setReload((value) => value + 1); }}>Coba lagi</button></div>}
            {catalog?.length === 0 && <p className={card + ' text-sm text-slate-600'}>Belum ada asesmen. Buat asesmen baru atau mulai dari templat LSP.</p>}
            {catalog?.map((entry) => (
              <article key={entry.id} className={card}>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-primary-800">
                  <span className="rounded-full bg-primary-50 px-2 py-1">{entry.standard}</span>
                  <span className={'rounded-full px-2 py-1 ' + (entry.published_at ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700')}>{entry.published_at ? 'Terbit' : 'Draf'}</span>
                </div>
                <h2 className="mt-3 break-words text-lg font-bold text-slate-900">{entry.title}</h2>
                <p className="text-sm text-slate-700">{entry.subtitle}</p>
                <p className="mt-3 text-sm text-slate-700">{entry.clause_count} klausul · {entry.question_count} butir</p>
                <div className={rowActions + ' mt-4'}>
                  <button type="button" className={readinessPrimary} disabled={busy} onClick={() => edit(entry.id)}>Kelola</button>
                  <button type="button" className={readinessButton} disabled={busy} onClick={() => edit(entry.id, true)}>Duplikat</button>
                  <button type="button" className={readinessButton + ' text-red-700'} disabled={busy} onClick={() => void remove(entry)}>Hapus</button>
                </div>
              </article>
            ))}
          </div>
        )}

        {draft && (
          <fieldset disabled={busy} className="min-w-0 space-y-5">
            <legend className="sr-only">Pengaturan asesmen</legend>
            <div className={card}>
              <p className="text-sm text-slate-700" role="status">
                {record?.published_at ? 'Versi publik terbit.' : 'Belum terbit.'} {unsaved ? 'Ada perubahan yang belum disimpan.' : 'Draf tersimpan.'}
                {record?.published_at && ' Simpan dan terbitkan ulang untuk memperbarui versi publik.'}
              </p>
              <div className={rowActions + ' mt-3'}>
                <button type="button" className={readinessPrimary} disabled={!dirty || !!item} onClick={save}>Simpan draf</button>
                <button type="button" className={readinessButton} disabled={!draft.questions.length || !!item} onClick={() => setPreview(true)}>Pratinjau formulir</button>
                <button type="button" className={readinessButton} disabled={!record || unsaved || !draft.questions.length} onClick={() => changePublication(true)}>{record?.published_at ? 'Terbitkan ulang' : 'Terbitkan'}</button>
                {record?.published_at && <>
                  <Link className={readinessButton} to={readinessUrl(record.id)} target="_blank" rel="noreferrer">Lihat versi publik</Link>
                  <button type="button" className={readinessButton + ' text-red-700'} disabled={unsaved} onClick={() => changePublication(false)}>Tarik dari publik</button>
                </>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Object.entries(collections).filter(([key]) => key !== 'glossary').map(([key, { label }]) => (
                <div key={key} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xl font-bold text-primary-800">{draft[key].length}</p><p className="text-sm text-slate-600">{label}</p></div>
              ))}
            </div>
            <div className={card}>
              <nav className="mb-5 flex flex-wrap gap-2 border-b border-slate-200 pb-4" aria-label="Bagian pengaturan asesmen">
                {[...Object.entries(collections).map(([key, { label }]) => [key, label]), ['settings', 'Pengaturan']].map(([key, label]) => (
                  <button key={key} type="button" aria-pressed={section === key} className={section === key ? readinessPrimary : readinessButton} disabled={!!item} onClick={() => setSection(key)}>{label}</button>
                ))}
              </nav>
              <h2 className="mb-4 text-lg font-bold text-slate-900">{collections[section]?.label || 'Pengaturan'}</h2>
              {section === 'settings'
                ? <Settings draft={draft} onChange={({ target }) => setDraft({ ...draft, [target.name]: target.value })} />
                : <Collection key={section} section={section} draft={draft} item={item} setItem={setItem} update={(change) => setDraft({ ...draft, ...change })} confirm={confirm} />}
            </div>
          </fieldset>
        )}
        {preview && <Preview draft={draft} onClose={() => setPreview(false)} />}
      </div>
      <ConfirmDialog />
    </AdminLayout>
  );
}
