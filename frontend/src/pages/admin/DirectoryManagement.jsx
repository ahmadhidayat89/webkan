import { useState, useEffect } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaSearch, FaBuilding, FaTimes, FaSave, FaSpinner,
  FaCheckCircle, FaExclamationCircle, FaBan, FaFileImport, FaThList, FaTags,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import { LPK_COLUMNS } from '../../components/lpk/LpkColumns';

const API = '/api/v1/admin/directory';

// key = nilai ?tab= ke API, segment = kunci di LPK_COLUMNS
const TABS = [
  { key: 'semua', segment: 'semua', label: 'Semua', icon: FaThList, cls: 'border-primary-600 text-primary-700' },
  { key: 'terakreditasi', segment: 'terakreditasi', label: 'Terakreditasi', icon: FaCheckCircle, cls: 'border-emerald-500 text-emerald-700' },
  { key: 'dibekukan', segment: 'akreditasi-dibekukan', label: 'Dibekukan', icon: FaExclamationCircle, cls: 'border-amber-500 text-amber-700' },
  { key: 'dicabut', segment: 'akreditasi-dicabut', label: 'Dicabut', icon: FaBan, cls: 'border-red-500 text-red-700' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Terakreditasi' },
  { value: 'suspended_full', label: 'Pembekuan Seluruh RL' },
  { value: 'suspended_partial', label: 'Pembekuan Sebagian RL' },
  { value: 'revoked', label: 'Dicabut' },
];

// Khusus untuk Import
const IMPORT_STATUS_OPTIONS = [
  { value: 'active', label: 'Terakreditasi' },
  { value: 'suspended_full', label: 'Pembekuan Seluruh RL' },
  { value: 'suspended_partial', label: 'Pembekuan Sebagian RL' },
  { value: 'revoked', label: 'Dicabut' },
  { value: 'from_file', label: 'Ambil dari kolom Status di file' },
];

const IMPORT_HINT = {
  active: 'NO. AKREDITASI, NAMA LPK, ALAMAT, TELEPON/FAX, E-MAIL, LINGKUP, MASA BERLAKU AKREDITASI (EXPIRED), LINK',
  suspended: 'NO. AKREDITASI, NAMA LPK, STATUS PEMBEKUAN (atau RUANG LINGKUP), TANGGAL DIBEKUKAN',
  revoked: 'NO. AKREDITASI, NAMA LPK, TANGGAL DICABUT',

  // Import berdasarkan status yang terdapat di file
  // Import berdasarkan status yang terdapat di file
  from_file: 'NO. AKREDITASI, NAMA LPK, STATUS, ALAMAT, TELEPON/FAX, EMAIL, (kolom Lingkup tepat setelah EMAIL, apa pun judulnya), MASA BERLAKU AKREDITASI (EXPIRED), LINK, Status Pembekuan, Tanggal Dibekukan, Tanggal Dicabut',
};

const choiceFromItem = (item) => {
  if (item.status === 'suspended') return item.suspension_scope === 'full' ? 'suspended_full' : 'suspended_partial';
  return item.status || 'active';
};

const emptyForm = {
  type: '',
  status_choice: 'active',
  certificate_number: '',
  name: '',
  address: '',
  phone: '',
  email: '',
  scope: '',
  expiry_date: '',
  certificate_link: '',
  suspension_status: '',
  suspended_at: '',
  revoked_at: '',
};

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white';
const Req = () => <span className="text-red-500">*</span>;

const DirectoryManagement = () => {
  const [tab, setTab] = useState(TABS[0]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState('');

  // form tambah/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // import
  const [importOpen, setImportOpen] = useState(false);
  const [imp, setImp] = useState({
    status_choice: 'active',
    type: '',
    file: null,
  });
  const [impPreview, setImpPreview] = useState(null);
  const [impLoading, setImpLoading] = useState(false);
  const [impMsg, setImpMsg] = useState(null);

  // daftar jenis LPK dari database + tombol Tambah Jenis LPK
  const [typeOptions, setTypeOptions] = useState([]);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [newType, setNewType] = useState('');
  const [typeSaving, setTypeSaving] = useState(false);
  const [typeMsg, setTypeMsg] = useState(null);

  const columns = LPK_COLUMNS[tab.segment];
  const token = localStorage.getItem('token');

  const authH = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };

  const jsonH = {
    ...authH,
    'Content-Type': 'application/json',
  };

  useEffect(() => {
    fetchData();
  }, [tab, search, filterType, page]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        tab: tab.key,
        page,
      });

      if (search) params.set('search', search);
      if (filterType) params.set('type', filterType);

      const res = await fetch(`${API}?${params}`, {
        headers: authH,
      });

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

  /* ---------- Jenis LPK ---------- */
  const fetchTypes = async () => {
    try {
      const res = await fetch(`${API}-types`, { headers: authH });
      const json = await res.json();
      if (json.success) setTypeOptions(json.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchTypes(); }, []);

  const openTypeModal = () => {
    setNewType('');
    setTypeMsg(null);
    setTypeModalOpen(true);
  };

  const saveType = async () => {
    try {
      setTypeSaving(true);
      setTypeMsg(null);
      const res = await fetch(`${API}-types`, {
        method: 'POST',
        headers: jsonH,
        body: JSON.stringify({ name: newType }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        await fetchTypes();
        setTypeModalOpen(false);
        setNotice(`Jenis LPK "${json.data}" berhasil ditambahkan`);
      } else {
        const msg = json.errors
          ? Object.values(json.errors).flat().join(', ')
          : (json.message || 'Gagal menambahkan jenis LPK');
        setTypeMsg(msg);
      }
    } catch (e) {
      setTypeMsg('Gagal terhubung ke server.');
    } finally {
      setTypeSaving(false);
    }
  };

  const changeTab = (t) => {
    setTab(t);
    setPage(1);
    setSearch('');
    setFilterType('');
  };

  const setF = (k, v) => {
    setForm(f => ({
      ...f,
      [k]: v,
    }));
  };

  const handleStatusChange = (value) => {
    setForm(f => ({
      ...f,
      status_choice: value,
      suspension_status:
        value === 'suspended_full'
          ? 'Pembekuan Seluruh RL'
          : (f.status_choice === 'suspended_full' ? '' : f.suspension_status),
    }));
  };

  /* ---------- Tambah / Edit ---------- */

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setSaveMsg(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    const f = { ...emptyForm };

    Object.keys(emptyForm).forEach(k => {
      f[k] = item[k] ?? '';
    });

    ['expiry_date', 'suspended_at', 'revoked_at'].forEach(k => {
      f[k] = item[k] ? String(item[k]).slice(0, 10) : '';
    });

    f.status_choice = choiceFromItem(item);

    if (f.status_choice === 'suspended_full') {
      f.suspension_status = 'Pembekuan Seluruh RL';
    }

    setEditItem(item);
    setForm(f);
    setSaveMsg(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const choice = form.status_choice;

    const becomingRevoked =
      choice === 'revoked' &&
      editItem?.status !== 'revoked';

    if (
      becomingRevoked &&
      !window.confirm(
        'Status Dicabut TIDAK DAPAT diubah kembali.\n\nLPK ini akan hilang dari tab Terakreditasi dan Dibekukan. Lanjutkan?'
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      setSaveMsg(null);

      const isSuspended = choice.startsWith('suspended');

      const payload = {
        type: form.type,
        certificate_number: form.certificate_number,
        name: form.name,
        address: form.address,
        phone: form.phone,
        email: form.email,
        scope: form.scope,
        expiry_date: form.expiry_date,
        certificate_link: form.certificate_link,
        status: isSuspended ? 'suspended' : choice,
        suspension_scope:
          choice === 'suspended_full'
            ? 'full'
            : choice === 'suspended_partial'
              ? 'partial'
              : null,
        suspension_status: isSuspended ? form.suspension_status : '',
        suspended_at: isSuspended ? form.suspended_at : '',
        revoked_at: choice === 'revoked' ? form.revoked_at : '',
      };

      Object.keys(payload).forEach(k => {
        let v =
          typeof payload[k] === 'string'
            ? payload[k].trim()
            : payload[k];

        if (
          k === 'certificate_link' &&
          v &&
          !/^https?:\/\//i.test(v)
        ) {
          v = 'https://' + v;
        }

        payload[k] = v === '' ? null : v;
      });

      const url = editItem
        ? `${API}/${editItem.id}`
        : API;

      const res = await fetch(url, {
        method: editItem ? 'PUT' : 'POST',
        headers: jsonH,
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setSaveMsg({
          type: 'success',
          text: json.message,
        });

        fetchData();

        setTimeout(() => {
          setModalOpen(false);
          setSaveMsg(null);
        }, 1000);
      } else {
        const msg = json.errors
          ? Object.values(json.errors).flat().join(', ')
          : (json.message || 'Gagal menyimpan');

        setSaveMsg({
          type: 'error',
          text: msg,
        });
      }
    } catch (e) {
      setSaveMsg({
        type: 'error',
        text: 'Gagal terhubung ke server.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'DELETE',
        headers: authH,
      });

      const json = await res.json();

      if (json.success) {
        fetchData();
        setDeleteConfirm(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  /* ---------- Import ---------- */

  const openImport = () => {
    setImp({
      status_choice: 'from_file',
      type: '',
      file: null,
    });

    setImpPreview(null);
    setImpMsg(null);
    setImportOpen(true);
  };

  const updateImp = (patch) => {
    setImp(p => ({
      ...p,
      ...patch,
    }));

    setImpPreview(null);
    setImpMsg(null);
  };

  const sendImport = async (dry) => {
    const fd = new FormData();

    fd.append('status_choice', imp.status_choice);
    fd.append('type', imp.type);
    fd.append('file', imp.file);
    fd.append('dry_run', dry ? '1' : '0');

    const res = await fetch(`${API}/import`, {
      method: 'POST',
      headers: authH,
      body: fd,
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      const m =
        json.errors && !Array.isArray(json.errors)
          ? Object.values(json.errors).flat().join(', ')
          : json.message;

      throw new Error(m || 'Import gagal');
    }

    return json;
  };

  const checkFile = async () => {
    try {
      setImpLoading(true);
      setImpMsg(null);

      const result = await sendImport(true);

      setImpPreview(result.data);
    } catch (e) {
      setImpMsg(e.message);
    } finally {
      setImpLoading(false);
    }
  };

  const runImport = async () => {
    try {
      setImpLoading(true);
      setImpMsg(null);

      const json = await sendImport(false);

      setImportOpen(false);
      setNotice(json.message);

      fetchData();
    } catch (e) {
      setImpMsg(e.message);
    } finally {
      setImpLoading(false);
    }
  };

  const isSuspendedForm =
    form.status_choice.startsWith('suspended');

  const impGroup =
    imp.status_choice.startsWith('suspended')
      ? 'suspended'
      : imp.status_choice;

  const lockedRevoked =
    editItem?.status === 'revoked';

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden text-white shadow-xl bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 rounded-2xl p-7">
          <div className="absolute w-56 h-56 rounded-full pointer-events-none -top-10 -right-10 bg-white/5 blur-3xl" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-white/15 rounded-xl">
                <FaBuilding className="text-xl text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-black">
                  Direktori LPK
                </h2>

                <p className="text-white/70 text-sm mt-0.5">
                  Kelola data lembaga penilaian kesesuaian
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={openImport}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl font-bold text-sm transition-all"
              >
                <FaFileImport className="text-xs" />
                Import
              </button>

              <button
                onClick={openTypeModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl font-bold text-sm transition-all"
              >
                <FaTags className="text-xs" />
                Tambah Jenis LPK
              </button>

              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-700 rounded-xl font-bold text-sm hover:bg-white/90 transition-all shadow-lg"
              >
                <FaPlus className="text-xs" />
                Tambah LPK
              </button>
            </div>
          </div>
        </div>

        {notice && (
          <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-xl">
            {notice}

            <button onClick={() => setNotice('')}>
              <FaTimes />
            </button>
          </div>
        )}

        {/* Tab */}
        <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
          {TABS.map(t => {
            const Icon = t.icon;

            return (
              <button
                key={t.key}
                onClick={() => changeTab(t)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-[3px] whitespace-nowrap transition-colors ${t.key === tab.key
                  ? t.cls
                  : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
              >
                <Icon />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="p-5 bg-white border border-gray-200 shadow-sm rounded-2xl">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <FaSearch className="absolute text-sm text-gray-400 -translate-y-1/2 left-3 top-1/2" />

              <input
                type="text"
                placeholder="Cari nama / nomor akreditasi..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className={`${inputCls} pl-9`}
              />
            </div>

            <select
              value={filterType}
              onChange={e => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className={`${inputCls} max-w-xs w-auto`}
            >
              <option value="">Semua Tipe</option>

              {typeOptions.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {(search || filterType) && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterType('');
                  setPage(1);
                }}
                className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl transition-colors"
              >
                <FaTimes className="text-xs" />
                Reset
              </button>
            )}

            {!loading && (
              <span className="self-center ml-auto text-sm font-medium text-gray-400">
                {pagination.total || 0} lembaga
              </span>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
          {loading ? (
            <div className="flex justify-center py-20">
              <FaSpinner className="text-3xl text-primary-600 animate-spin" />
            </div>
          ) : data.length === 0 ? (
            <div className="py-16 text-center">
              <FaBuilding className="mx-auto mb-3 text-4xl text-gray-300" />

              <p className="font-semibold text-gray-500">
                Belum ada data
              </p>

              <div className="flex justify-center gap-4 mt-3 text-sm font-bold">
                <button
                  onClick={openAdd}
                  className="text-primary-600 hover:underline"
                >
                  + Tambah manual
                </button>

                <button
                  onClick={openImport}
                  className="text-primary-600 hover:underline"
                >
                  Import file
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-5 py-3.5 font-bold text-gray-600 w-12">
                        No.
                      </th>

                      {columns.map(c => (
                        <th
                          key={c.label}
                          className="text-left px-5 py-3.5 font-bold text-gray-600"
                        >
                          {c.label}
                        </th>
                      ))}

                      <th className="text-left px-5 py-3.5 font-bold text-gray-600">
                        Tipe LPK
                      </th>

                      <th className="text-right px-5 py-3.5 font-bold text-gray-600">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-50">
                    {data.map((item, idx) => (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-gray-50/80"
                      >
                        <td className="px-5 py-4 text-xs font-medium text-gray-400 align-top">
                          {(pagination.from || 1) + idx}
                        </td>

                        {columns.map(c => (
                          <td
                            key={c.label}
                            className="px-5 py-4 text-gray-600 align-top"
                          >
                            {c.render(item, { hideType: true })}
                          </td>
                        ))}

                        <td className="px-5 py-4 align-top">
                          <span className="inline-block text-xs bg-gray-100 text-gray-600 font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
                            {item.type || '-'}
                          </span>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(item)}
                              title="Edit"
                              className="p-2 transition-colors rounded-lg text-primary-600 hover:bg-primary-50"
                            >
                              <FaEdit className="text-sm" />
                            </button>

                            <button
                              onClick={() => setDeleteConfirm(item)}
                              title="Hapus"
                              className="p-2 text-red-500 transition-colors rounded-lg hover:bg-red-50"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.last_page > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Menampilkan {pagination.from}–{pagination.to} dari{' '}
                    {pagination.total} data
                  </p>

                  <div className="flex gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                      ← Prev
                    </button>

                    <span className="px-3 py-1.5 text-sm font-semibold">
                      {page} / {pagination.last_page}
                    </span>

                    <button
                      disabled={page === pagination.last_page}
                      onClick={() => setPage(p => p + 1)}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Tambah / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {editItem ? 'Edit Data LPK' : 'Tambah LPK Baru'}
                </h3>

                <p className="text-xs text-gray-500 mt-0.5">
                  Isian pembekuan atau pencabutan muncul sesuai status yang dipilih
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-gray-500 rounded-lg hover:bg-gray-100"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {saveMsg && (
                <div
                  className={`px-4 py-3 rounded-xl text-sm font-semibold ${saveMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                    }`}
                >
                  {saveMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div>
                  <label className="block mb-1 text-sm font-bold text-gray-700">
                    Tipe LPK <Req />
                  </label>

                  <select
                    value={form.type}
                    onChange={e => setF('type', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">-- Pilih Tipe --</option>

                    {typeOptions.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-bold text-gray-700">
                    Status <Req />
                  </label>

                  <select
                    value={form.status_choice}
                    onChange={e => handleStatusChange(e.target.value)}
                    disabled={lockedRevoked}
                    className={`${inputCls} disabled:bg-gray-100`}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {lockedRevoked && (
                  <div className="px-3 py-2 text-xs rounded-lg md:col-span-2 text-amber-700 bg-amber-50">
                    LPK ini sudah Dicabut. Statusnya terkunci dan tidak dapat diubah kembali.
                  </div>
                )}

                {form.status_choice === 'revoked' && !lockedRevoked && (
                  <div className="px-3 py-2 text-xs text-red-700 rounded-lg md:col-span-2 bg-red-50">
                    Perhatian: status Dicabut tidak dapat diubah kembali, dan LPK akan hilang dari tab Terakreditasi.
                  </div>
                )}

                <div>
                  <label className="block mb-1 text-sm font-bold text-gray-700">
                    No. Akreditasi <Req />
                  </label>

                  <input
                    value={form.certificate_number}
                    onChange={e => setF('certificate_number', e.target.value)}
                    className={`${inputCls} font-mono`}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-bold text-gray-700">
                    Nama LPK <Req />
                  </label>

                  <input
                    value={form.name}
                    onChange={e => setF('name', e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-bold text-gray-700">
                    Alamat
                  </label>

                  <textarea
                    rows={2}
                    value={form.address}
                    onChange={e => setF('address', e.target.value)}
                    className={`${inputCls} resize-none`}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-bold text-gray-700">
                    Telepon / Fax
                  </label>

                  <input
                    value={form.phone}
                    onChange={e => setF('phone', e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-bold text-gray-700">
                    E-mail
                  </label>

                  <input
                    value={form.email}
                    onChange={e => setF('email', e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-bold text-gray-700">
                    Lingkup
                  </label>

                  <textarea
                    rows={2}
                    value={form.scope}
                    onChange={e => setF('scope', e.target.value)}
                    className={`${inputCls} resize-none`}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-bold text-gray-700">
                    Masa Berlaku (Expired)
                  </label>

                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={e => setF('expiry_date', e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-bold text-gray-700">
                    Link
                  </label>

                  <input
                    value={form.certificate_link}
                    onChange={e => setF('certificate_link', e.target.value)}
                    placeholder="https://..."
                    className={inputCls}
                  />
                </div>

                {isSuspendedForm && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block mb-1 text-sm font-bold text-gray-700">
                        Status Pembekuan{' '}
                        {form.status_choice === 'suspended_partial' &&
                          '(daftar RL yang dibekukan)'}
                      </label>

                      <textarea
                        rows={2}
                        value={form.suspension_status}
                        onChange={e =>
                          setF('suspension_status', e.target.value)
                        }
                        readOnly={form.status_choice === 'suspended_full'}
                        placeholder="Tulis daftar ruang lingkup yang dibekukan"
                        className={`${inputCls} resize-none ${form.status_choice === 'suspended_full'
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : ''
                          }`}
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-bold text-gray-700">
                        Tanggal Dibekukan
                      </label>

                      <input
                        type="date"
                        value={form.suspended_at}
                        onChange={e =>
                          setF('suspended_at', e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                  </>
                )}

                {form.status_choice === 'revoked' && (
                  <div>
                    <label className="block mb-1 text-sm font-bold text-gray-700">
                      Tanggal Dicabut
                    </label>

                    <input
                      type="date"
                      value={form.revoked_at}
                      onChange={e =>
                        setF('revoked_at', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <FaSpinner className="text-xs animate-spin" />
                ) : (
                  <FaSave className="text-xs" />
                )}

                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  Import Data LPK
                </h3>

                <p className="text-xs text-gray-500 mt-0.5">
                  Pilih status, pilih tipe LPK, lalu upload file
                </p>
              </div>

              <button
                onClick={() => setImportOpen(false)}
                className="p-2 text-gray-500 rounded-lg hover:bg-gray-100"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-4">

              {/* Status Import */}
              <div>
                <label className="block mb-1 text-sm font-bold text-gray-700">
                  1. Status <Req />
                </label>

                <select
                  value={imp.status_choice}
                  onChange={e =>
                    updateImp({
                      status_choice: e.target.value,
                    })
                  }
                  className={inputCls}
                >
                  {IMPORT_STATUS_OPTIONS.map(s => (
                    <option
                      key={s.value}
                      value={s.value}
                    >
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipe LPK */}
              <div>
                <label className="block mb-1 text-sm font-bold text-gray-700">
                  2. Tipe LPK <Req />
                </label>

                <select
                  value={imp.type}
                  onChange={e =>
                    updateImp({
                      type: e.target.value,
                    })
                  }
                  className={inputCls}
                >
                  <option value="">
                    -- Pilih Tipe --
                  </option>

                  {typeOptions.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* File */}
              <div>
                <label className="block mb-1 text-sm font-bold text-gray-700">
                  3. File (xlsx / xls / csv) <Req />
                </label>

                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt"
                  onChange={e =>
                    updateImp({
                      file: e.target.files[0] || null,
                    })
                  }
                  className={inputCls}
                />

                <p className="mt-1 text-xs text-gray-500">
                  Kolom di file:{' '}
                  {IMPORT_HINT[impGroup]}
                </p>
              </div>

              {/* Info jika status dari file */}
              <div className="px-3 py-2 text-xs text-gray-600 rounded-lg bg-gray-50">
                {imp.status_choice === 'from_file' ? (
                  <>
                    Status tiap LPK dibaca dari kolom <b>STATUS</b> di file. Nomor akreditasi yang sudah ada akan
                    diperbarui sesuai isi file, bukan diduplikasi. LPK yang sudah Dicabut di database statusnya tetap terkunci.
                    Tipe LPK yang dipilih berlaku untuk semua baris di file ini.
                  </>
                ) : (
                  <>
                    Import <b>Terakreditasi</b> lebih dulu, baru Pembekuan dan Dicabut. Nomor akreditasi yang sudah ada akan
                    diperbarui, bukan diduplikasi. Import Terakreditasi tidak menimpa status LPK yang sudah dibekukan atau dicabut.
                  </>
                )}
              </div>

              {impMsg && (
                <div className="px-4 py-3 text-sm font-semibold text-red-700 bg-red-50 rounded-xl">
                  {impMsg}
                </div>
              )}

              {/* Hasil Cek File */}
              {impPreview && (
                <div className="p-4 space-y-2 text-sm border border-gray-200 rounded-xl bg-gray-50">
                  <p className="font-bold text-gray-800">Hasil pengecekan file</p>

                  <p className="text-gray-600">
                    Baris valid: <b>{impPreview.total}</b> · Baru: <b>{impPreview.new}</b> · Diperbarui: <b>{impPreview.updated}</b>
                  </p>

                  {impPreview.by_status && (
                    <p className="text-gray-600">
                      Terakreditasi: <b>{impPreview.by_status.active}</b> · Pembekuan: <b>{impPreview.by_status.suspended}</b> · Dicabut: <b>{impPreview.by_status.revoked}</b>
                    </p>
                  )}

                  {'scope_column' in impPreview && (
                    <p className="text-xs text-gray-600">
                      {impPreview.scope_column
                        ? <>Kolom Lingkup diambil dari: <b>{impPreview.scope_column}</b></>
                        : <span className="font-semibold text-amber-700">Kolom Lingkup tidak ditemukan, isian Lingkup akan kosong.</span>}
                    </p>
                  )}

                  {impPreview.warning_count > 0 && (
                    <div className="text-amber-700">
                      <p>{impPreview.warning_count} baris perlu dicek (tetap diimpor):</p>
                      <ul className="ml-4 text-xs list-disc">
                        {impPreview.warnings.map((w, i) => <li key={i}>{w.row}: {w.message}</li>)}
                      </ul>
                    </div>
                  )}

                  {impPreview.error_count > 0 && (
                    <div className="text-red-700">
                      <p>{impPreview.error_count} baris dilewati:</p>
                      <ul className="ml-4 text-xs list-disc">
                        {impPreview.errors.map((e, i) => <li key={i}>{e.row}: {e.message}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">

              <button
                onClick={() => setImportOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>

              <button
                onClick={checkFile}
                disabled={!imp.type || !imp.file || impLoading}
                className="px-5 py-2.5 text-sm font-bold border rounded-xl border-primary-600 text-primary-700 hover:bg-primary-50 transition-colors disabled:opacity-40"
              >
                {impLoading && !impPreview
                  ? 'Memeriksa...'
                  : 'Cek File'}
              </button>

              <button
                onClick={runImport}
                disabled={
                  !impPreview ||
                  impPreview.total === 0 ||
                  impLoading
                }
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40"
              >
                {impLoading && impPreview ? (
                  <FaSpinner className="text-xs animate-spin" />
                ) : (
                  <FaFileImport className="text-xs" />
                )}

                Import Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Jenis LPK */}
      {typeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-gray-900">Tambah Jenis LPK</h3>
                <p className="text-xs text-gray-500 mt-0.5">Jenis baru langsung muncul di semua pilihan tipe</p>
              </div>
              <button onClick={() => setTypeModalOpen(false)} className="p-2 text-gray-500 rounded-lg hover:bg-gray-100">
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {typeMsg && (
                <div className="px-4 py-3 text-sm font-semibold text-red-700 bg-red-50 rounded-xl">{typeMsg}</div>
              )}
              <div>
                <label className="block mb-1 text-sm font-bold text-gray-700">Nama Jenis LPK <Req /></label>
                <input
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && newType.trim() && saveType()}
                  placeholder="Contoh: Lembaga Sertifikasi Hasil Hutan"
                  className={inputCls}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setTypeModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={saveType}
                disabled={!newType.trim() || typeSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40"
              >
                {typeSaving ? <FaSpinner className="text-xs animate-spin" /> : <FaSave className="text-xs" />}
                {typeSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-sm p-6 text-center bg-white shadow-2xl rounded-2xl">

            <div className="flex items-center justify-center mx-auto mb-4 bg-red-100 rounded-full w-14 h-14">
              <FaTrash className="text-xl text-red-500" />
            </div>

            <h3 className="mb-2 font-black text-gray-900">
              Hapus Data?
            </h3>

            <p className="mb-6 text-sm text-gray-500">
              <span className="font-semibold text-gray-700">
                {deleteConfirm.name}
              </span>{' '}
              akan dihapus permanen.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 text-sm font-bold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>

              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 py-2.5 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
              >
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