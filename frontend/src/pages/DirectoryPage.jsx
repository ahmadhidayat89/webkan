import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  FaHome, FaChevronRight, FaSpinner, FaSearch, FaTimes,
  FaBuilding, FaCheckCircle, FaExclamationCircle, FaBan,
  FaPhone, FaEnvelope, FaGlobe, FaMapMarkerAlt, FaFilter,
  FaCalendarAlt, FaIdCard, FaChevronDown, FaChevronUp, FaThList,
} from 'react-icons/fa';

const TABS = [
  { segment: 'semua',               pageId: 'direktori/semua',               label: 'Semua',         color: 'primary',  status: null },
  { segment: 'terakreditasi',        pageId: 'direktori/terakreditasi',        label: 'Terakreditasi', color: 'emerald',  status: 'active' },
  { segment: 'akreditasi-dibekukan', pageId: 'direktori/akreditasi-dibekukan', label: 'Dibekukan',     color: 'amber',    status: 'suspended' },
  { segment: 'akreditasi-dicabut',   pageId: 'direktori/akreditasi-dicabut',   label: 'Dicabut',       color: 'red',      status: 'revoked' },
];

const STATUS_CFG = {
  active:    { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: FaCheckCircle,       iconCls: 'text-emerald-500', label: 'Terakreditasi' },
  suspended: { badge: 'bg-amber-100 text-amber-700 border-amber-200',      icon: FaExclamationCircle,  iconCls: 'text-amber-500',   label: 'Dibekukan' },
  revoked:   { badge: 'bg-red-100 text-red-700 border-red-200',            icon: FaBan,                iconCls: 'text-red-500',     label: 'Dicabut' },
};

const TAB_STYLE = {
  null:        { active: 'border-primary-600 text-primary-700 bg-primary-50', bar: 'bg-primary-600',  icon: FaThList },
  active:      { active: 'border-emerald-500 text-emerald-700 bg-emerald-50', bar: 'bg-emerald-500',  icon: FaCheckCircle },
  suspended:   { active: 'border-amber-500 text-amber-700 bg-amber-50',       bar: 'bg-amber-500',    icon: FaExclamationCircle },
  revoked:     { active: 'border-red-500 text-red-700 bg-red-50',             bar: 'bg-red-500',      icon: FaBan },
};

const TYPE_OPTIONS = [
  'Laboratorium Pengujian','Laboratorium Kalibrasi','Laboratorium Medis',
  'Lembaga Inspeksi','Lembaga Sertifikasi Produk','Lembaga Sertifikasi Personel',
  'Lembaga Sertifikasi Sistem Manajemen','Penyelenggara Uji Profisiensi',
  'Produsen Bahan Acuan','Lembaga Verifikasi & Validasi GRK',
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const StatusBadge = ({ status }) => {
  if (!status || !STATUS_CFG[status]) return null;
  const cfg = STATUS_CFG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.badge}`}>
      <Icon className={`text-[10px] ${cfg.iconCls}`} />
      {cfg.label}
    </span>
  );
};

const DirectoryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [typeOpen, setTypeOpen] = useState(false);

  const pageId = location.pathname.substring(1);
  const activeTab = TABS.find(t => t.pageId === pageId) || TABS[0];
  const tabStyleKey = activeTab.status === null ? 'null' : activeTab.status;
  const tabStyle = TAB_STYLE[tabStyleKey] || TAB_STYLE['null'];

  useEffect(() => {
    setPage(1); setData([]); setSearch(''); setSearchInput('');
    setFilterType(''); setExpandedId(null);
  }, [pageId]);

  useEffect(() => { fetchData(); }, [activeTab.segment, search, filterType, page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ per_page: 20, page });
      if (search) params.set('search', search);
      if (filterType) params.set('type', filterType);
      const res = await fetch(`/api/v1/directory/${activeTab.segment}?${params}`);
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

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const tabLabel = (tab) => tab.label;

  const isAllTab = activeTab.status === null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          {/* Breadcrumb */}
          <div className="pt-32 lg:pt-40 pb-3 border-b border-white/10">
            <nav className="flex items-center gap-2 text-sm flex-wrap">
              <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors font-medium">
                <FaHome className="text-xs" /><span>Beranda</span>
              </button>
              <FaChevronRight className="text-[10px] text-white/30" />
              <span className="text-white/80 font-semibold">Direktori LPK</span>
            </nav>
          </div>

          {/* Title */}
          <div className="py-8">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1">
                <FaBuilding className="text-white text-xl" />
              </div>
              <div>
                <span className="inline-block px-3 py-1 bg-white/10 text-white/70 text-xs font-bold rounded-full uppercase tracking-wider mb-3 border border-white/20">
                  Direktori LPK
                </span>
                <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                  Lembaga Penilaian Kesesuaian
                </h1>
                <p className="text-white/50 text-sm mt-2">
                  Daftar lembaga yang telah mendapatkan akreditasi dari Komite Akreditasi Nasional (KAN)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="flex gap-1 overflow-x-auto pb-0">
            {TABS.map(tab => {
              const isActive = tab.pageId === pageId;
              const tStyleKey = tab.status === null ? 'null' : tab.status;
              const tStyle = TAB_STYLE[tStyleKey] || TAB_STYLE['null'];
              const TIcon = tStyle.icon;
              return (
                <button
                  key={tab.pageId}
                  onClick={() => navigate(`/${tab.pageId}`)}
                  className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-t-xl transition-all border-t-2 ${
                    isActive
                      ? `bg-white text-gray-900 ${tStyle.active.includes('border') ? '' : ''} border-t-[3px] ${
                          tab.status === null ? 'border-primary-600' :
                          tab.status === 'active' ? 'border-emerald-500' :
                          tab.status === 'suspended' ? 'border-amber-500' : 'border-red-500'
                        }`
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border-transparent'
                  }`}
                >
                  <TIcon className="text-sm" />
                  {tabLabel(tab)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-8 py-6">

        {/* Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-5">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 min-w-60 flex gap-2">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Cari nama lembaga atau nomor sertifikat..."
                  className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {searchInput && (
                  <button type="button" onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <FaTimes className="text-xs" />
                  </button>
                )}
              </div>
              <button type="submit"
                className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl transition-colors">
                Cari
              </button>
            </form>

            {/* Type Filter */}
            <div className="relative">
              <button
                onClick={() => setTypeOpen(o => !o)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-semibold transition-colors ${filterType ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'}`}
              >
                <FaFilter className="text-xs" />
                <span className="max-w-40 truncate">{filterType || 'Semua Tipe'}</span>
                {typeOpen ? <FaChevronUp className="text-xs ml-1" /> : <FaChevronDown className="text-xs ml-1" />}
              </button>
              {typeOpen && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 max-h-72 overflow-y-auto">
                  <button
                    onClick={() => { setFilterType(''); setPage(1); setTypeOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${!filterType ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    Semua Tipe
                  </button>
                  {TYPE_OPTIONS.map(t => (
                    <button key={t}
                      onClick={() => { setFilterType(t); setPage(1); setTypeOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${filterType === t ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {(search || filterType) && (
              <button
                onClick={() => { setSearch(''); setSearchInput(''); setFilterType(''); setPage(1); }}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-red-500 hover:text-red-700 border border-red-200 rounded-xl bg-red-50 transition-colors"
              >
                <FaTimes className="text-[10px]" /> Reset
              </button>
            )}

            {!loading && (
              <span className="ml-auto text-sm text-gray-400 font-medium">
                {pagination.total || 0} lembaga
              </span>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="py-24 flex flex-col items-center gap-3">
              <FaSpinner className="text-primary-500 text-3xl animate-spin" />
              <p className="text-sm text-gray-400">Memuat data...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBuilding className="text-gray-300 text-3xl" />
              </div>
              <p className="font-bold text-gray-500 mb-1">Tidak ada data ditemukan</p>
              <p className="text-sm text-gray-400">Coba ubah kata kunci pencarian atau filter</p>
              {(search || filterType) && (
                <button onClick={() => { setSearch(''); setSearchInput(''); setFilterType(''); setPage(1); }}
                  className="mt-4 text-sm text-primary-600 font-bold hover:underline">
                  Reset pencarian
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3.5 font-bold text-gray-600 w-12">No.</th>
                      <th className="text-left px-5 py-3.5 font-bold text-gray-600">Nama Lembaga</th>
                      <th className="text-left px-5 py-3.5 font-bold text-gray-600">Tipe LPK</th>
                      <th className="text-left px-5 py-3.5 font-bold text-gray-600">No. Sertifikat</th>
                      <th className="text-left px-5 py-3.5 font-bold text-gray-600">Tgl Akreditasi</th>
                      <th className="text-left px-5 py-3.5 font-bold text-gray-600">Berlaku s/d</th>
                      <th className="text-left px-5 py-3.5 font-bold text-gray-600">Status</th>
                      <th className="text-left px-5 py-3.5 font-bold text-gray-600">Kontak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-5 py-4 text-gray-400 text-xs font-medium">
                          {(pagination.from || 1) + idx}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-gray-900 group-hover:text-primary-700 transition-colors">{item.name}</div>
                          {item.address && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                              <FaMapMarkerAlt className="flex-shrink-0 text-[10px]" />
                              <span className="truncate max-w-56">{item.address}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-block text-xs bg-gray-100 text-gray-600 font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
                            {item.type}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                            {item.certificate_number}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <FaCalendarAlt className="text-gray-300 text-[10px]" />
                            {fmtDate(item.accreditation_date)}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <FaCalendarAlt className="text-gray-300 text-[10px]" />
                            {fmtDate(item.expiry_date)}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {item.phone && (
                              <a href={`tel:${item.phone}`} title={item.phone}
                                className="w-7 h-7 flex items-center justify-center bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors">
                                <FaPhone className="text-[10px]" />
                              </a>
                            )}
                            {item.email && (
                              <a href={`mailto:${item.email}`} title={item.email}
                                className="w-7 h-7 flex items-center justify-center bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors">
                                <FaEnvelope className="text-[10px]" />
                              </a>
                            )}
                            {item.website && (
                              <a href={item.website} target="_blank" rel="noopener noreferrer" title={item.website}
                                className="w-7 h-7 flex items-center justify-center bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors">
                                <FaGlobe className="text-[10px]" />
                              </a>
                            )}
                            {!item.phone && !item.email && !item.website && (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {data.map((item, idx) => (
                  <div key={item.id} className="p-4">
                    <div
                      className="flex items-start justify-between gap-3 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs text-gray-400 font-medium">#{(pagination.from || 1) + idx}</span>
                          <StatusBadge status={item.status} />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm leading-snug">{item.name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{item.type}</p>
                      </div>
                      <div className="flex-shrink-0 pt-1">
                        {expandedId === item.id
                          ? <FaChevronUp className="text-gray-400 text-xs" />
                          : <FaChevronDown className="text-gray-400 text-xs" />}
                      </div>
                    </div>

                    {expandedId === item.id && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <FaIdCard className="text-gray-300 flex-shrink-0" />
                          <span className="text-gray-500">No. Sertifikat:</span>
                          <span className="font-mono font-bold text-gray-700">{item.certificate_number}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <FaCalendarAlt className="text-gray-300 flex-shrink-0" />
                          <span className="text-gray-500">Akreditasi:</span>
                          <span className="text-gray-700">{fmtDate(item.accreditation_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <FaCalendarAlt className="text-gray-300 flex-shrink-0" />
                          <span className="text-gray-500">Berlaku s/d:</span>
                          <span className="text-gray-700">{fmtDate(item.expiry_date)}</span>
                        </div>
                        {item.address && (
                          <div className="flex items-start gap-2 text-xs">
                            <FaMapMarkerAlt className="text-gray-300 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-600">{item.address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {item.phone && (
                            <a href={`tel:${item.phone}`} className="flex items-center gap-1.5 text-xs text-primary-600 font-semibold hover:underline">
                              <FaPhone className="text-[10px]" />{item.phone}
                            </a>
                          )}
                          {item.email && (
                            <a href={`mailto:${item.email}`} className="flex items-center gap-1.5 text-xs text-primary-600 font-semibold hover:underline">
                              <FaEnvelope className="text-[10px]" />{item.email}
                            </a>
                          )}
                          {item.website && (
                            <a href={item.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary-600 font-semibold hover:underline">
                              <FaGlobe className="text-[10px]" />Website
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.last_page > 1 && (
                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                  <p className="text-sm text-gray-400">
                    Menampilkan{' '}
                    <span className="font-semibold text-gray-700">{pagination.from}–{pagination.to}</span>{' '}
                    dari{' '}
                    <span className="font-semibold text-gray-700">{pagination.total}</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <button disabled={page === 1} onClick={() => setPage(1)}
                      className="w-9 h-9 flex items-center justify-center text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors">«</button>
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                      className="px-3 h-9 flex items-center justify-center text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors font-medium">‹ Prev</button>
                    {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                      let p;
                      if (pagination.last_page <= 5) p = i + 1;
                      else if (page <= 3) p = i + 1;
                      else if (page >= pagination.last_page - 2) p = pagination.last_page - 4 + i;
                      else p = page - 2 + i;
                      return (
                        <button key={p} onClick={() => setPage(p)}
                          className={`w-9 h-9 flex items-center justify-center text-sm rounded-lg font-semibold transition-colors ${
                            p === page ? 'bg-primary-600 text-white border border-primary-600' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}>{p}</button>
                      );
                    })}
                    <button disabled={page === pagination.last_page} onClick={() => setPage(p => p + 1)}
                      className="px-3 h-9 flex items-center justify-center text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors font-medium">Next ›</button>
                    <button disabled={page === pagination.last_page} onClick={() => setPage(pagination.last_page)}
                      className="w-9 h-9 flex items-center justify-center text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors">»</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DirectoryPage;
