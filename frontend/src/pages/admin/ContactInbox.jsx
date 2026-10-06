import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaEnvelope,
  FaEnvelopeOpen,
  FaTrash,
  FaSearch,
  FaInbox,
  FaExclamationTriangle,
  FaExternalLinkAlt,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';

// Ubah ke false kalau banner peringatan email tidak ingin ditampilkan
const SHOW_EMAIL_WARNING = true;

const ContactInbox = () => {
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | unread | read

  const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/admin/contact-submissions', { headers });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal memuat pesan.');
      }
      setMessages(result.data.data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const markRead = async (message, isRead) => {
    try {
      const response = await fetch(`/api/v1/admin/contact-submissions/${message.id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: isRead }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal memperbarui status pesan.');
      }
      await loadMessages();
      setSelected({ ...message, read_at: isRead ? new Date().toISOString() : null });
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const deleteMessage = async (message) => {
    if (!window.confirm(`Hapus pesan "${message.subject}"?`)) return;
    try {
      const response = await fetch(`/api/v1/admin/contact-submissions/${message.id}`, {
        method: 'DELETE',
        headers,
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal menghapus pesan.');
      }
      setSelected(null);
      await loadMessages();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setQuery(searchInput.trim().toLowerCase());
  };

  // Pencarian dan filter dilakukan di sisi frontend (dari 25 pesan terbaru yang dimuat)
  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      if (filter === 'unread' && message.read_at) return false;
      if (filter === 'read' && !message.read_at) return false;

      if (!query) return true;

      const haystack = `${message.name} ${message.email} ${message.subject}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [messages, filter, query]);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <h2 className="text-2xl font-black text-gray-900">Pesan Masuk</h2>

        {/* Banner pengaturan email */}
        {SHOW_EMAIL_WARNING && (
          <div className="p-4 border rounded-2xl border-amber-200 bg-amber-50">
            <div className="flex gap-3">
              <FaExclamationTriangle className="flex-shrink-0 mt-1 text-amber-500" />

              <div className="text-sm text-amber-900">
                <p className="font-bold">Pengaturan email belum dikonfigurasi</p>

                <p className="mt-1">
                  Tombol Kirim Balasan tidak akan berfungsi sampai Gmail dan App Password
                  diisi. Ikuti langkah berikut untuk mendapatkan App Password:
                </p>

                <ol className="mt-3 space-y-1.5 list-decimal list-inside">
                  <li>Login ke akun Google yang akan digunakan untuk mengirim email.</li>
                  <li>
                    Aktifkan <strong>2-Step Verification</strong> di{' '}
                    <code className="px-1.5 py-0.5 text-xs rounded bg-amber-100">
                      myaccount.google.com → Security
                    </code>
                    .
                  </li>
                  <li>
                    Buka{' '}
                    <code className="px-1.5 py-0.5 text-xs rounded bg-amber-100">
                      myaccount.google.com/apppasswords
                    </code>
                    , beri nama bebas (contoh: <em>KAN Admin</em>), lalu klik <strong>Buat</strong>.
                  </li>
                  <li>Salin 16 karakter yang muncul (tanpa spasi).</li>
                  <li>
                    Tempel ke kolom <strong>App Password Gmail</strong> di halaman Pengaturan →
                    Email Balasan.
                  </li>
                </ol>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Link
                    to="/admin/settings"
                    className="px-4 py-2 text-xs font-bold text-white transition-all rounded-lg bg-amber-600 hover:bg-amber-700"
                  >
                    Buka Pengaturan Email
                  </Link>

                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all bg-white border rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100"
                  >
                    Buka App Passwords Google
                    <FaExternalLinkAlt className="text-[10px]" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="p-4 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50"
          >
            {error}
          </div>
        )}

        {/* Pencarian + filter */}
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <FaSearch className="absolute text-sm text-gray-400 -translate-y-1/2 left-4 top-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama, email, atau subjek..."
              className="w-full py-2.5 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 text-sm font-bold text-white transition-all rounded-xl bg-primary-600 hover:bg-primary-700"
          >
            Cari
          </button>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="all">Semua</option>
            <option value="unread">Belum dibaca</option>
            <option value="read">Sudah dibaca</option>
          </select>
        </form>

        {/* Dua panel */}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          {/* Daftar pesan */}
          <div className="overflow-hidden bg-white border border-gray-200 rounded-2xl min-h-[320px]">
            {loading ? (
              <p className="p-8 text-center text-gray-500">Memuat pesan...</p>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
                <FaInbox className="mb-3 text-3xl" />
                <p className="text-sm font-medium">Tidak ada pesan</p>
              </div>
            ) : (
              <ul className="divide-y">
                {filteredMessages.map((message) => (
                  <li key={message.id}>
                    <button
                      onClick={() => {
                        setSelected(message);
                        if (!message.read_at) markRead(message, true);
                      }}
                      className={`w-full p-4 text-left hover:bg-gray-50 ${
                        selected?.id === message.id ? 'bg-primary-50' : ''
                      } ${!message.read_at ? 'bg-blue-50/60' : ''}`}
                    >
                      <span className="flex items-center gap-2 font-bold text-gray-900">
                        {message.read_at ? (
                          <FaEnvelopeOpen className="text-gray-400" />
                        ) : (
                          <FaEnvelope className="text-blue-600" />
                        )}
                        {message.subject}
                      </span>

                      <span className="block mt-1 text-sm text-gray-600">
                        {message.name} · {message.email}
                      </span>

                      <span className="block mt-1 text-xs text-gray-400">
                        {new Date(message.created_at).toLocaleString('id-ID')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Detail pesan */}
          <section className="p-6 bg-white border border-gray-200 rounded-2xl min-h-[320px]">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
                <FaEnvelope className="mb-3 text-4xl" />
                <p className="text-sm font-medium">Pilih pesan untuk membaca</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selected.subject}</h3>

                    <p className="mt-1 text-sm text-gray-600">
                      {selected.name} ·{' '}
                      <a
                        className="underline text-primary-700"
                        href={`mailto:${selected.email}`}
                      >
                        {selected.email}
                      </a>
                    </p>

                    {selected.phone && (
                      <p className="mt-1 text-sm text-gray-600">Telepon: {selected.phone}</p>
                    )}
                  </div>

                  <button
                    onClick={() => deleteMessage(selected)}
                    aria-label="Hapus pesan"
                    className="p-2 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <FaTrash />
                  </button>
                </div>

                <p className="mt-5 text-sm leading-7 text-gray-700 break-words whitespace-pre-wrap">
                  {selected.message}
                </p>

                <div className="flex flex-wrap gap-3 mt-6">
                  <a
                    href={`mailto:${selected.email}?subject=${encodeURIComponent(
                      `Re: ${selected.subject}`
                    )}`}
                    className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-primary-600"
                  >
                    Balas Email
                  </a>

                  <button
                    onClick={() => markRead(selected, !selected.read_at)}
                    className="px-4 py-2 text-sm font-semibold border rounded-lg"
                  >
                    {selected.read_at ? 'Tandai belum dibaca' : 'Tandai sudah dibaca'}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ContactInbox;