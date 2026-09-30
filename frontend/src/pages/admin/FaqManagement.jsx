import { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import {
  FaSave, FaTimes, FaTrash, FaPlus, FaQuestionCircle,
  FaCheckCircle, FaExclamationCircle, FaArrowUp, FaArrowDown, FaClock,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

const parseApiJson = (rawText) => {
  if (!rawText) return null;
  try {
    return JSON.parse(rawText);
  } catch {
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(rawText.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

const trimEmptyTail = (html) =>
  html.replace(/(?:\s*<p>(?:<br\s*\/?>)?<\/p>)+\s*$/i, '');

const hasMeaningfulContent = (html) => {
  if (!html) return false;
  const textOnly = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  return textOnly.length > 0;
};

const QuillEditor = ({ value, onChange, placeholder }) => {
  const wrapperRef = useRef(null);
  const quillRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!wrapperRef.current || quillRef.current) return;

    const wrapper = wrapperRef.current;
    wrapper.innerHTML = '';
    const editorElement = document.createElement('div');
    wrapper.appendChild(editorElement);

    const quill = new Quill(editorElement, {
      theme: 'snow',
      placeholder,
      modules: quillModules,
    });
    quillRef.current = quill;

    const initial = initialValueRef.current;
    if (initial) {
      const delta = quill.clipboard.convert({ html: initial, text: '\n' });
      quill.updateContents(delta, 'silent');
    }

    quill.on('text-change', () => {
      onChangeRef.current(trimEmptyTail(quill.root.innerHTML));
    });

    return () => {
      wrapper.innerHTML = '';
      quillRef.current = null;
    };
  }, [placeholder]);

  return (
    <div className="bg-white [&_.ql-toolbar]:rounded-t-xl [&_.ql-container]:rounded-b-xl [&_.ql-editor]:min-h-[160px] [&_.ql-editor]:text-sm">
      <div ref={wrapperRef} />
    </div>
  );
};

const FaqManagement = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null); // number = edit, 'new' = tambah baru, null = tidak ada
  const [formData, setFormData] = useState({ question: '', answer: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [reordering, setReordering] = useState(false);

  useEffect(() => { fetchFaqs(); }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/admin/faqs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });
      const raw = await res.text();
      const data = parseApiJson(raw);
      if (data?.success) setFaqs(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNew = () => {
    setSelectedId('new');
    setFormData({ question: '', answer: '' });
    setSaveMsg(null);
  };

  const handleSelect = (faq) => {
    setSelectedId(faq.id);
    setFormData({ question: faq.question, answer: faq.answer });
    setSaveMsg(null);
  };

  const canSave = formData.question.trim().length > 0 && hasMeaningfulContent(formData.answer) && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      setSaveMsg(null);

      const isNew = selectedId === 'new';
      const url = isNew ? '/api/v1/admin/faqs' : `/api/v1/admin/faqs/${selectedId}`;

      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: formData.question.trim(),
          answer: formData.answer,
        }),
      });
      const raw = await res.text();
      const data = parseApiJson(raw);

      if (res.ok && data?.success) {
        setSaveMsg({ type: 'success', text: isNew ? 'FAQ berhasil ditambahkan!' : 'FAQ berhasil diperbarui!' });
        await fetchFaqs();
        if (isNew && data.data?.id) setSelectedId(data.data.id);
      } else {
        const firstError = data?.errors ? Object.values(data.errors).flat()?.[0] : null;
        setSaveMsg({ type: 'error', text: firstError || data?.message || `Gagal menyimpan (HTTP ${res.status})` });
      }
    } catch (e) {
      setSaveMsg({ type: 'error', text: 'Terjadi kesalahan, coba lagi' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedId === 'new' || !selectedId) return;
    if (!window.confirm('Hapus FAQ ini? Tindakan ini tidak bisa dibatalkan.')) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/v1/admin/faqs/${selectedId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });
      const data = parseApiJson(await res.text());

      if (res.ok && data?.success) {
        setSelectedId(null);
        await fetchFaqs();
      } else {
        setSaveMsg({ type: 'error', text: data?.message || `Gagal menghapus (HTTP ${res.status})` });
      }
    } catch (e) {
      setSaveMsg({ type: 'error', text: 'Terjadi kesalahan, coba lagi' });
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const reordered = [...faqs];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setFaqs(reordered);

    try {
      setReordering(true);
      await fetch('/api/v1/admin/faqs/reorder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          faqs: reordered.map((f, i) => ({ id: f.id, order: i + 1 })),
        }),
      });
      await fetchFaqs();
    } catch (e) {
      console.error(e);
    } finally {
      setReordering(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden text-white shadow-xl bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 rounded-2xl p-7">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-56 h-56 rounded-full -top-10 -right-10 bg-white/5 blur-3xl"></div>
          </div>
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-white/15 rounded-xl">
                <FaQuestionCircle className="text-xl text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Kelola FAQ</h2>
                <p className="text-white/70 text-sm mt-0.5">Atur pertanyaan yang sering diajukan di halaman depan</p>
              </div>
            </div>
            <div className="px-5 py-3 text-center border bg-white/15 rounded-xl border-white/20">
              <div className="text-2xl font-black">{faqs.length}</div>
              <div className="text-xs font-semibold text-white/70">Total FAQ</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 rounded-full border-primary-600 border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <div className="flex items-start gap-6">

            {/* Sidebar */}
            <div className="sticky flex-shrink-0 overflow-hidden bg-white border border-gray-200 shadow-sm w-72 rounded-2xl top-6">
              <div className="p-3">
                <button
                  onClick={handleSelectNew}
                  className="flex items-center justify-center w-full gap-2 px-3 py-3 mb-2 text-sm font-bold text-white transition-all rounded-xl bg-primary-600 hover:bg-primary-700"
                >
                  <FaPlus className="text-xs" />
                  Tambah FAQ
                </button>

                {faqs.length === 0 && (
                  <p className="px-2 py-4 text-xs text-center text-gray-400">
                    Belum ada FAQ. Klik "Tambah FAQ" untuk membuat yang pertama.
                  </p>
                )}

                {faqs.map((faq, index) => {
                  const isSelected = selectedId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className={`flex items-stretch gap-1 rounded-xl mb-1 overflow-hidden ${
                        isSelected ? 'bg-primary-600' : 'hover:bg-gray-50'
                      }`}
                    >
                      <button
                        onClick={() => handleSelect(faq)}
                        className={`flex-1 min-w-0 flex items-center gap-2 px-3 py-3 text-left ${
                          isSelected ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        <span className={`text-xs font-bold flex-shrink-0 ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="text-sm font-semibold truncate">{faq.question}</span>
                      </button>
                      <div className="flex flex-col flex-shrink-0">
                        <button
                          onClick={() => handleMove(index, -1)}
                          disabled={index === 0 || reordering}
                          className={`px-2 flex-1 flex items-center justify-center disabled:opacity-30 ${
                            isSelected ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-gray-700'
                          }`}
                          title="Pindah ke atas"
                        >
                          <FaArrowUp className="text-[10px]" />
                        </button>
                        <button
                          onClick={() => handleMove(index, 1)}
                          disabled={index === faqs.length - 1 || reordering}
                          className={`px-2 flex-1 flex items-center justify-center disabled:opacity-30 ${
                            isSelected ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-gray-700'
                          }`}
                          title="Pindah ke bawah"
                        >
                          <FaArrowDown className="text-[10px]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Editor Panel */}
            <div className="flex-1 min-w-0">
              {!selectedId ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-gray-200 shadow-sm rounded-2xl">
                  <div className="flex items-center justify-center w-20 h-20 mb-4 bg-gray-100 rounded-2xl">
                    <FaQuestionCircle className="text-3xl text-gray-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-black text-gray-800">Pilih atau Tambah FAQ</h3>
                  <p className="max-w-xs text-sm text-gray-500">
                    Pilih FAQ dari daftar di kiri untuk mengedit, atau klik "Tambah FAQ" untuk membuat baru.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">

                  <div className="py-5 border-b border-gray-100 px-7 bg-gradient-to-r from-gray-50 to-white">
                    <h3 className="text-xl font-black text-gray-900">
                      {selectedId === 'new' ? 'FAQ Baru' : 'Edit FAQ'}
                    </h3>
                  </div>

                  <div className="space-y-6 p-7">

                    {saveMsg && (
                      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${
                        saveMsg.type === 'success'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {saveMsg.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                        {saveMsg.text}
                      </div>
                    )}

                    <div>
                      <label className="block mb-2 text-sm font-bold text-gray-800">
                        Pertanyaan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.question}
                        onChange={(e) => setFormData((prev) => ({ ...prev, question: e.target.value }))}
                        placeholder="mis. Bagaimana cara mengajukan permohonan akreditasi?"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-bold text-gray-800">
                        Jawaban <span className="text-red-500">*</span>
                      </label>
                      <QuillEditor
                        key={selectedId}
                        value={formData.answer}
                        onChange={(value) => setFormData((prev) => ({ ...prev, answer: value }))}
                        placeholder="Tulis jawaban di sini..."
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                      <button
                        onClick={handleSave}
                        disabled={!canSave}
                        className="flex items-center gap-2 py-3 font-bold text-white transition-all shadow-md px-7 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:from-primary-700 hover:to-primary-800 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaSave />
                        {saving ? 'Menyimpan...' : 'Simpan FAQ'}
                      </button>
                      <button
                        onClick={() => { setSelectedId(null); setSaveMsg(null); }}
                        className="flex items-center gap-2 px-5 py-3 font-bold text-gray-600 transition-all border border-gray-200 rounded-xl hover:bg-gray-50"
                      >
                        <FaTimes />
                        Tutup
                      </button>
                      {selectedId !== 'new' && (
                        <button
                          onClick={handleDelete}
                          disabled={saving}
                          className="flex items-center gap-2 px-5 py-3 ml-auto font-bold text-red-600 transition-all border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-50"
                        >
                          <FaTrash />
                          Hapus FAQ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default FaqManagement;