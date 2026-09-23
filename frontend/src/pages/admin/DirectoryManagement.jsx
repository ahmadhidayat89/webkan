import { useState, useEffect } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaSearch, FaFilter,
  FaBuilding, FaTimes, FaSave, FaSpinner, FaCheckCircle,
  FaExclamationCircle, FaBan,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';

const STATUS_MAP = {
  active:    { label: 'Terakreditasi',       color: 'bg-emerald-100 text-emerald-700' },
  suspended: { label: 'Dibekukan',           color: 'bg-amber-100 text-amber-700' },
  revoked:   { label: 'Dicabut',             color: 'bg-red-100 text-red-700' },
};

const TYPE_OPTIONS = [
  'Laboratorium Pengujian',
  'Laboratorium Kalibrasi',
  'Laboratorium Medis',
  'Lembaga Inspeksi',
  'Lembaga Sertifikasi Produk',
  'Lembaga Sertifikasi Personel',
  'Lembaga Sertifikasi Sistem Manajemen',
  'Penyelenggara Uji Profisiensi',
  'Produsen Bahan Acuan',
  'Lembaga Verifikasi & Validasi GRK',
];

const emptyForm = {
  name: '', type: '', certificate_number: '',
  accreditation_date: '', expiry_date: '',
  status: 'active', address: '', phone: '', email: '', website: '',
};

const DirectoryManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' };

  useEffect(() => { fetchData(); }, [search, filterStatus, filterType, page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ per_page: 15, page });
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('type', filterType);

      const res = await fetch(`/api/v1/admin/directory?${params}`, { headers });
      const json = await res.json();
      if (json.success) {
        setData(json.data.data || []);
        setPagination(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setSaveMsg(null); setModalOpen(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name, type: item.type,
      certificate_number: item.certificate_number,
      accreditation_date: item.accreditation_date,
      expiry_date: item.expiry_date,
      status: item.status,
      address: item.address || '', phone: item.phone || '',
      email: item.email || '', website: item.website || '',
    });
    setSaveMsg(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true); setSaveMsg(null);
      const url = editItem
        ? `/api/v1/admin/directory/${editItem.id}`
        : '/api/v1/admin/directory';
      const method = editItem ? 'PUT' : 'POST';
      let website = form.website?.trim() || null;
      if (website && !/^https?:\/\//i.test(website)) {
        website = 'https://' + website;
      }
      const payload = {
        ...form,
        address: form.address || null,
        phone: form.phone || null,
        email: form.email || null,
        website,
      };
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const json = await res.json();
      if (json.success) {
        setSaveMsg({ type: 'success', text: json.message });
        fetchData();
        setTimeout(() => { setModalOpen(false); setSaveMsg(null); }, 1200);
      } else {
        const errMsg = json.errors
          ? Object.values(json.errors).flat().join(', ')
          : (json.message || 'Gagal menyimpan');
        setSaveMsg({ type: 'error', text: errMsg });
      }
    } catch (e) {
      setSaveMsg({ type: 'error', text: 'Gagal terhubung ke server. Pastikan migration sudah dijalankan.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/v1/admin/directory/${id}`, { method: 'DELETE', headers });
      const json = await res.json();
      if (json.success) { fetchData(); setDeleteConfirm(null); }
    } catch (e) { console.error(e); }
  };

  const StatusIcon = ({ status }) => {
    if (status === 'active') return <FaCheckCircle className="text-emerald-500" />;
    if (status === 'suspended') return <FaExclamationCircle className="text-amber-500" />;
    return <FaBan className="text-red-500" />;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 rounded-2xl p-7 text-white shadow-xl overflow-hidden">
          <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
                <FaBuilding className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Direktori LPK</h2>
                <p className="text-white/70 text-sm mt-0.5">Kelola data lembaga penilaian kesesuaian terakreditasi</p>
              </div>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-700 rounded-xl font-bold text-sm hover:bg-white/90 transition-all shadow-lg"
            >
              <FaPlus className="text-xs" />
              Tambah LPK
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-48 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Cari nama / nomor sertifikat..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">Semua Status</option>
              <option value="active">Terakreditasi</option>
              <option value="suspended">Dibekukan</option>
              <option value="revoked">Dicabut</option>
            </select>
            <select
              value={filterType}
              onChange={e => { setFilterType(e.target.value); setPage(1); }}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white max-w-xs"
            >
              <option value="">Semua Tipe</option>
              {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {(search || filterStatus || filterType) && (
              <button
                onClick={() => { setSearch(''); setFilterStatus(''); setFilterType(''); setPage(1); }}
                className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl transition-colors"
              >
                <FaTimes className="text-xs" /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center">
              <FaSpinner className="text-primary-600 text-3xl animate-spin" />
            </div>
          ) : data.length === 0 ? (
            <div className="py-16 text-center">
              <FaBuilding className="text-gray-300 text-4xl mx-auto mb-3" />
              <p className="text-gray-500 font-semibold">Belum ada data LPK</p>
              <button onClick={openAdd} className="mt-3 text-sm text-primary-600 font-bold hover:underline">+ Tambah LPK pertama</button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3.5 font-bold text-gray-700">Nama Lembaga</th>
                      <th className="text-left px-5 py-3.5 font-bold text-gray-700">Tipe</th>
                      <th className="text-left px-5 py-3.5 font-bold text-gray-700">No. Sertifikat</th>
                      <th className="text-left px-5 py-3.5 font-bold text-gray-700">Berlaku s/d</th>
                      <th className="text-left px-5 py-3.5 font-bold text-gray-700">Status</th>
                      <th className="text-right px-5 py-3.5 font-bold text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-gray-900">{item.name}</div>
                          {item.address && <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{item.address}</div>}
                        </td>
                        <td className="px-5 py-4 text-gray-600">{item.type}</td>
                        <td className="px-5 py-4 font-mono text-xs text-gray-700">{item.certificate_number}</td>
                        <td className="px-5 py-4 text-gray-600">
                          {new Date(item.expiry_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_MAP[item.status]?.color}`}>
                            <StatusIcon status={item.status} />
                            {STATUS_MAP[item.status]?.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEdit(item)}
                              className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors">
                              <FaEdit className="text-sm" />
                            </button>
                            <button onClick={() => setDeleteConfirm(item)}
                              className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.last_page > 1 && (
                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Menampilkan {pagination.from}–{pagination.to} dari {pagination.total} data
                  </p>
                  <div className="flex gap-2">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                      ← Prev
                    </button>
                    <span className="px-3 py-1.5 text-sm font-semibold">{page} / {pagination.last_page}</span>
                    <button disabled={page === pagination.last_page} onClick={() => setPage(p => p + 1)}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black text-gray-900">{editItem ? 'Edit Data LPK' : 'Tambah LPK Baru'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {saveMsg && (
                <div className={`px-4 py-3 rounded-xl text-sm font-semibold ${saveMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {saveMsg.text}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lembaga *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tipe LPK *</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                    <option value="">-- Pilih Tipe --</option>
                    {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nomor Sertifikat *</label>
                  <input value={form.certificate_number} onChange={e => setForm(f => ({ ...f, certificate_number: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tanggal Akreditasi *</label>
                  <input type="date" value={form.accreditation_date} onChange={e => setForm(f => ({ ...f, accreditation_date: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Berlaku Sampai *</label>
                  <input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Status *</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                    <option value="active">Terakreditasi</option>
                    <option value="suspended">Dibekukan</option>
                    <option value="revoked">Dicabut</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Alamat</label>
                  <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Telepon</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Website</label>
                  <input type="url" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                    placeholder="https://..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50">
                {saving ? <FaSpinner className="animate-spin text-xs" /> : <FaSave className="text-xs" />}
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTrash className="text-red-500 text-xl" />
            </div>
            <h3 className="font-black text-gray-900 mb-2">Hapus Data?</h3>
            <p className="text-gray-500 text-sm mb-6">
              <span className="font-semibold text-gray-700">{deleteConfirm.name}</span> akan dihapus permanen.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 text-sm font-bold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 py-2.5 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default DirectoryManagement;
