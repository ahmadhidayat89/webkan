import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FaEnvelope, FaEnvelopeOpen, FaTrash, FaSearch,
  FaPhone, FaUser, FaTag, FaCalendarAlt, FaInbox,
  FaReply, FaPaperPlane, FaExclamationTriangle, FaExternalLinkAlt,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import { useConfirm } from '../../hooks/useConfirm';
import api from '../../services/api';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700',
  replied: 'bg-emerald-100 text-emerald-700',
  spam: 'bg-rose-100 text-rose-700',
  read: 'bg-blue-100 text-blue-700',
};

const getStatusLabel = (status) => {
  if (status === 'pending') return 'Pending';
  if (status === 'replied') return 'Replied';
  if (status === 'spam') return 'Spam';
  return 'Read';
};

const ContactManagement = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRead, setFilterRead] = useState('all');
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying,  setReplying]  = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [mailConfigured, setMailConfigured] = useState(true);
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    fetchContacts();
  }, [filterRead, currentPage]);

  useEffect(() => {
    api.get('/admin/settings?group=mail').then(({ data }) => {
      if (data.success && Array.isArray(data.data)) {
        const username = data.data.find(x => x.key === 'mail_username')?.value_id || '';
        const password = data.data.find(x => x.key === 'mail_password')?.value_id || '';
        setMailConfigured(!!username && !!password);
      }
    }).catch(() => {});
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ per_page: 20, page: currentPage });
      if (filterRead !== 'all') params.append('is_read', filterRead === 'read');
      if (searchTerm) params.append('search', searchTerm);

      const { data } = await api.get(`/admin/contacts?${params}`);
      if (data.success) {
        setContacts(data.data.data || []);
        setLastPage(data.data.last_page || 1);
        setUnread(data.unread || 0);
      }
    } catch (err) {
      console.error('ContactManagement fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchContacts();
  };

  const handleOpen = async (contact) => {
    setSelected(contact);
    setReplyText('');
    if (!contact.is_read) {
      await api.post(`/admin/contacts/${contact.id}/toggle-read`);
      setContacts((prev) =>
        prev.map((c) => c.id === contact.id ? { ...c, is_read: true } : c)
      );
      setUnread((prev) => Math.max(0, prev - 1));
    }
  };

  const handleToggleRead = async (contact) => {
    await api.post(`/admin/contacts/${contact.id}/toggle-read`);
    const wasRead = contact.is_read;
    setContacts((prev) =>
      prev.map((c) => c.id === contact.id ? { ...c, is_read: !c.is_read } : c)
    );
    setUnread((prev) => wasRead ? prev + 1 : Math.max(0, prev - 1));
    if (selected?.id === contact.id) {
      setSelected((prev) => ({ ...prev, is_read: !prev.is_read }));
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirm('Hapus pesan ini? Tindakan ini tidak dapat dibatalkan.'))) return;
    try {
      const { data } = await api.delete(`/admin/contacts/${id}`);
      if (data.success) {
        if (selected?.id === id) setSelected(null);
        fetchContacts();
        toast.success('Pesan berhasil dihapus');
      }
    } catch (err) {
      console.error('Delete contact error:', err);
      toast.error('Gagal menghapus pesan. Silakan coba lagi.');
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return;
    setReplying(true);
    try {
      const { data } = await api.post(`/admin/contacts/${selected.id}/reply`, {
        message: replyText,
      });
      if (data.success) {
        toast.success(data.message);
        setReplyText('');
        setContacts(prev =>
          prev.map(c => c.id === selected.id ? { ...c, is_read: true } : c)
        );
        setSelected(prev => ({ ...prev, is_read: true }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim balasan.');
    } finally {
      setReplying(false);
    }
  };

  return (
    <AdminLayout>
      <ConfirmDialog />
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800">Pesan Masuk</h2>
          {unread > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unread} belum dibaca
            </span>
          )}
        </div>
      </div>

      {/* Banner panduan email belum dikonfigurasi */}
      {!mailConfigured && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="text-amber-500 text-lg shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-800 mb-1">
                Pengaturan email belum dikonfigurasi
              </p>
              <p className="text-sm text-amber-700 mb-3">
                Tombol <strong>Kirim Balasan</strong> tidak akan berfungsi sampai Gmail dan App Password diisi.
                Ikuti langkah berikut untuk mendapatkan App Password:
              </p>
              <ol className="text-sm text-amber-800 space-y-1 mb-3 list-none">
                <li><span className="font-semibold">1.</span> Login ke akun Google yang akan digunakan untuk mengirim email.</li>
                <li><span className="font-semibold">2.</span> Aktifkan <strong>2-Step Verification</strong> di <span className="font-mono text-xs bg-amber-100 px-1 rounded">myaccount.google.com → Security</span>.</li>
                <li><span className="font-semibold">3.</span> Buka <span className="font-mono text-xs bg-amber-100 px-1 rounded">myaccount.google.com/apppasswords</span>, beri nama bebas (contoh: <em>KAN Admin</em>), lalu klik <strong>Buat</strong>.</li>
                <li><span className="font-semibold">4.</span> Salin 16 karakter yang muncul (tanpa spasi).</li>
                <li><span className="font-semibold">5.</span> Tempel ke kolom <strong>App Password Gmail</strong> di halaman Pengaturan → Email Balasan.</li>
              </ol>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/admin/settings"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition"
                >
                  Buka Pengaturan Email
                </Link>
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-amber-400 text-amber-800 hover:bg-amber-100 text-xs font-bold rounded-lg transition"
                >
                  Buka App Passwords Google
                  <FaExternalLinkAlt className="text-[10px]" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, email, atau subjek..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition"
          >
            Cari
          </button>
        </form>
        <select
          value={filterRead}
          onChange={(e) => { setFilterRead(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Semua</option>
          <option value="unread">Belum Dibaca</option>
          <option value="read">Sudah Dibaca</option>
        </select>
      </div>

      <div className="flex gap-4 h-[calc(100vh-260px)]">
        {/* List */}
        <div className="w-full md:w-2/5 bg-white rounded-xl border border-gray-200 overflow-y-auto flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Memuat...
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
              <FaInbox className="text-4xl" />
              <span className="text-sm">Tidak ada pesan</span>
            </div>
          ) : (
            contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => handleOpen(contact)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition ${
                  selected?.id === contact.id ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''
                } ${!contact.is_read ? 'bg-blue-50/40' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {contact.is_read
                      ? <FaEnvelopeOpen className="text-gray-400 shrink-0" />
                      : <FaEnvelope className="text-primary-500 shrink-0" />
                    }
                    <span className={`text-sm truncate ${!contact.is_read ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                      {contact.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{formatDate(contact.created_at)}</span>
                </div>
                <p className={`text-xs mt-1 truncate pl-6 ${!contact.is_read ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                  {contact.subject}
                </p>
                <div className="pl-6 mt-1">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${statusStyles[contact.status] || statusStyles.read}`}>
                    {getStatusLabel(contact.status)}
                  </span>
                </div>
              </button>
            ))
          )}

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="p-3 border-t border-gray-100 flex justify-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-100"
              >
                &lsaquo;
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                {currentPage} / {lastPage}
              </span>
              <button
                disabled={currentPage === lastPage}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-100"
              >
                &rsaquo;
              </button>
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-y-auto">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
              <FaEnvelope className="text-5xl" />
              <span className="text-sm">Pilih pesan untuk membaca</span>
            </div>
          ) : (
            <div className="p-6">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">{selected.subject}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleRead(selected)}
                    title={selected.is_read ? 'Tandai belum dibaca' : 'Tandai sudah dibaca'}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-primary-600 transition"
                  >
                    {selected.is_read ? <FaEnvelope /> : <FaEnvelopeOpen />}
                  </button>
                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-red-50 text-gray-500 hover:text-red-600 transition"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              {/* Sender info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 p-4 bg-gray-50 rounded-xl text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <FaUser className="text-primary-500 shrink-0" />
                  <span>{selected.name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <FaEnvelope className="text-primary-500 shrink-0" />
                  <a href={`mailto:${selected.email}`} className="hover:text-primary-600 underline">
                    {selected.email}
                  </a>
                </div>
                {selected.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaPhone className="text-primary-500 shrink-0" />
                    <a href={`tel:${selected.phone}`} className="hover:text-primary-600">
                      {selected.phone}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <FaCalendarAlt className="text-primary-500 shrink-0" />
                  <span>{formatDate(selected.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 sm:col-span-2">
                  <FaTag className="text-primary-500 shrink-0" />
                  <span>{selected.subject}</span>
                </div>
                {selected.status && (
                  <div className="flex items-center gap-2 text-gray-600 sm:col-span-2">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${statusStyles[selected.status] || statusStyles.read}`}>
                      {getStatusLabel(selected.status)}
                    </span>
                    {selected.spam_score > 0 && (
                      <span className="text-xs text-gray-500">Spam score: {selected.spam_score}</span>
                    )}
                  </div>
                )}
                {selected.spam_reason && (
                  <div className="sm:col-span-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                    Spam indicators: {selected.spam_reason}
                  </div>
                )}
              </div>

              {/* Message */}
              <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap bg-white border border-gray-100 rounded-xl p-4">
                {selected.message}
              </div>

              {/* Reply Form */}
              <div className="mt-6 border-t border-gray-100 pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <FaReply className="text-primary-500 text-sm" />
                  <span className="text-sm font-bold text-gray-800">
                    Balas ke {selected.email}
                  </span>
                </div>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={5}
                  placeholder="Tulis balasan di sini..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleReply}
                    disabled={replying || !replyText.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaPaperPlane className="text-xs" />
                    {replying ? 'Mengirim...' : 'Kirim Balasan'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ContactManagement;
