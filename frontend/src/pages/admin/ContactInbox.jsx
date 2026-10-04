import { useEffect, useState } from 'react';
import { FaEnvelope, FaEnvelopeOpen, FaTrash } from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';

const ContactInbox = () => {
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/admin/contact-submissions', { headers });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Gagal memuat pesan.');
      setMessages(result.data.data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMessages(); }, []);

  const markRead = async (message, isRead) => {
    try {
      const response = await fetch(`/api/v1/admin/contact-submissions/${message.id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: isRead }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Gagal memperbarui status pesan.');
      await loadMessages();
      setSelected({ ...message, read_at: isRead ? new Date().toISOString() : null });
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const deleteMessage = async (message) => {
    if (!window.confirm(`Hapus pesan "${message.subject}"?`)) return;
    try {
      const response = await fetch(`/api/v1/admin/contact-submissions/${message.id}`, { method: 'DELETE', headers });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Gagal menghapus pesan.');
      setSelected(null);
      await loadMessages();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div><h2 className="text-2xl font-black text-gray-900">Pesan Masuk</h2><p className="mt-1 text-gray-600">Pesan yang dikirim melalui formulir Hubungi Kami.</p></div>
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="overflow-hidden rounded-2xl border bg-white">
            {loading ? <p className="p-8 text-center text-gray-500">Memuat pesan...</p>
              : messages.length === 0 ? <p className="p-8 text-center text-gray-500">Belum ada pesan masuk.</p>
                : <ul className="divide-y">{messages.map((message) => <li key={message.id}>
                  <button onClick={() => { setSelected(message); if (!message.read_at) markRead(message, true); }} className={`w-full p-4 text-left hover:bg-gray-50 ${!message.read_at ? 'bg-blue-50/60' : ''}`}>
                    <span className="flex items-center gap-2 font-bold text-gray-900">{message.read_at ? <FaEnvelopeOpen className="text-gray-400" /> : <FaEnvelope className="text-blue-600" />}{message.subject}</span>
                    <span className="mt-1 block text-sm text-gray-600">{message.name} · {message.email}</span>
                    <span className="mt-1 block text-xs text-gray-400">{new Date(message.created_at).toLocaleString('id-ID')}</span>
                  </button>
                </li>)}</ul>}
          </div>
          <section className="min-h-64 rounded-2xl border bg-white p-6">
            {!selected ? <p className="text-gray-500">Pilih pesan untuk membaca isinya.</p> : <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="text-xl font-bold text-gray-900">{selected.subject}</h3><p className="mt-1 text-sm text-gray-600">{selected.name} · <a className="text-primary-700 underline" href={`mailto:${selected.email}`}>{selected.email}</a></p>{selected.phone && <p className="mt-1 text-sm text-gray-600">Telepon: {selected.phone}</p>}</div>
                <button onClick={() => deleteMessage(selected)} aria-label="Hapus pesan" className="rounded-lg p-2 text-red-600 hover:bg-red-50"><FaTrash /></button>
              </div>
              <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-gray-700">{selected.message}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white">Balas Email</a>
                <button onClick={() => markRead(selected, !selected.read_at)} className="rounded-lg border px-4 py-2 text-sm font-semibold">{selected.read_at ? 'Tandai belum dibaca' : 'Tandai sudah dibaca'}</button>
              </div>
            </>}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ContactInbox;
