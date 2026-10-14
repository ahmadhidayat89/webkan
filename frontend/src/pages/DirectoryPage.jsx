import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { LPK_COLUMNS, StatusPill, STATUS_TARGET } from '../components/lpk/LpkColumns';
import {
  FaHome, FaChevronRight, FaSpinner, FaSearch, FaTimes,
  FaBuilding, FaCheckCircle, FaExclamationCircle, FaBan, FaThList,
  FaFilter, FaChevronDown, FaChevronUp,
} from 'react-icons/fa';

const TABS = [
  { segment: 'semua', pageId: 'direktori/semua', label: 'Semua', icon: FaThList, border: 'border-primary-600' },
  { segment: 'terakreditasi', pageId: 'direktori/terakreditasi', label: 'Terakreditasi', icon: FaCheckCircle, border: 'border-emerald-500' },
  { segment: 'akreditasi-dibekukan', pageId: 'direktori/akreditasi-dibekukan', label: 'Dibekukan', icon: FaExclamationCircle, border: 'border-amber-500' },
  { segment: 'akreditasi-dicabut', pageId: 'direktori/akreditasi-dicabut', label: 'Dicabut', icon: FaBan, border: 'border-red-500' },
];

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
  const [typeOptions, setTypeOptions] = useState([]);
  const [highlightId, setHighlightId] = useState(null);
  const focusRef = useRef(null); // nomor akreditasi yang harus dicari (dari klik pill)

  const pageId = location.pathname.substring(1);
  const activeTab = TABS.find(t => t.pageId === pageId) || TABS[0];
  const columns = LPK_COLUMNS[activeTab.segment];

  // Klik pill -> buka tab sesuai status, langsung ke halaman yang memuat LPK itu
  const handlePillClick = (item) => {
    const target = STATUS_TARGET[item.status] || 'terakreditasi';
    navigate(`/direktori/${target}?focus=${encodeURIComponent(item.certificate_number)}`);
  };
  const renderOpts = { onPillClick: handlePillClick };

  useEffect(() => {
    setPage(1); setData([]); setSearch(''); setSearchInput('');
    setFilterType(''); setExpandedId(null); setHighlightId(null);
    focusRef.current = new URLSearchParams(location.search).get('focus');
  }, [pageId, location.search]);

  useEffect(() => { fetchData(); }, [activeTab.segment, search, filterType, page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page });
      if (search) params.set('search', search);
      if (filterType) params.set('type', filterType);
      if (focusRef.current) params.set('focus', focusRef.current);

      const res = await fetch(`/api/v1/directory/${activeTab.segment}?${params}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data.data || []);
        setPagination(json.data);
        setTypeOptions(json.types || []);
        if (focusRef.current) {
          setPage(json.data.current_page);
          setHighlightId(json.focus_id || null);
          focusRef.current = null;
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Scroll ke baris yang dituju lalu sorot beberapa detik
  useEffect(() => {
    if (!highlightId || loading) return;
    const el = [
      document.getElementById(`lpk-row-${highlightId}`),
      document.getElementById(`lpk-card-${highlightId}`),
    ].find(e => e && e.offsetParent !== null);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const t = setTimeout(() => setHighlightId(null), 4000);
    return () => clearTimeout(t);
  }, [highlightId, loading]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const resetAll = () => { setSearch(''); setSearchInput(''); setFilterType(''); setPage(1); };

  const hlRow = (id) => highlightId === id ? 'bg-yellow-50 ring-2 ring-inset ring-yellow-300' : 'hover:bg-gray-50/80';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute rounded-full -top-24 -right-24 w-96 h-96 bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 rounded-full left-1/3 w-72 h-72 bg-primary-600/20 blur-3xl" />
        </div>
        <div className="container relative z-10 px-4 mx-auto lg:px-8">
          <div className="pt-32 pb-3 border-b lg:pt-40 border-white/10">
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors font-medium">
                <FaHome className="text-xs" /><span>Beranda</span>
              </button>
              <FaChevronRight className="text-[10px] text-white/30" />
              <span className="font-semibold text-white/80">Direktori LPK</span>
            </nav>
          </div>
          <div className="py-8">
            <h1 className="text-3xl font-black leading-tight text-white md:text-4xl">
              Lembaga Penilaian Kesesuaian
            </h1>
            <p className="mt-2 text-sm text-white/50">
              Daftar lembaga yang telah mendapatkan akreditasi dari Komite Akreditasi Nasional (KAN)
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="container relative z-10 px-4 mx-auto lg:px-8">
          <div className="flex gap-1 pb-0 overflow-x-auto">
            {TABS.map(tab => {
              const isActive = tab.segment === activeTab.segment;
              const TIcon = tab.icon;
              return (
                <button
                  key={tab.pageId}
                  onClick={() => navigate(`/${tab.pageId}`)}
                  className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-t-xl transition-all border-t-[3px] ${isActive
                    ? `bg-white text-gray-900 ${tab.border}`
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border-transparent'}`}
                >
                  <TIcon className="text-sm" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container px-4 py-6 mx-auto lg:px-8">

        {/* Toolbar */}
        <div className="p-4 mb-5 bg-white border border-gray-200 shadow-sm rounded-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <form onSubmit={handleSearch} className="flex flex-1 gap-2 min-w-60">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Cari nama lembaga atau nomor akreditasi..."
                  className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {searchInput && (
                  <button type="button" onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                    className="absolute text-gray-400 -translate-y-1/2 right-3 top-1/2 hover:text-gray-600">
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
                <span className="truncate max-w-40">{filterType || 'Semua Tipe'}</span>
                {typeOpen ? <FaChevronUp className="ml-1 text-xs" /> : <FaChevronDown className="ml-1 text-xs" />}
              </button>
              {typeOpen && (
                <div className="absolute right-0 z-20 w-64 py-1 mt-1 overflow-y-auto bg-white border border-gray-200 shadow-lg top-full rounded-xl max-h-72">
                  <button
                    onClick={() => { setFilterType(''); setPage(1); setTypeOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${!filterType ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    Semua Tipe
                  </button>
                  {typeOptions.map(t => (
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
              <button onClick={resetAll}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-red-500 hover:text-red-700 border border-red-200 rounded-xl bg-red-50 transition-colors">
                <FaTimes className="text-[10px]" /> Reset
              </button>
            )}

            {!loading && (
              <span className="ml-auto text-sm font-medium text-gray-400">
                {pagination.total || 0} lembaga
              </span>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-24">
              <FaSpinner className="text-3xl text-primary-500 animate-spin" />
              <p className="text-sm text-gray-400">Memuat data...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="py-20 text-center">
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full">
                <FaBuilding className="text-3xl text-gray-300" />
              </div>
              <p className="mb-1 font-bold text-gray-500">Tidak ada data ditemukan</p>
              <p className="text-sm text-gray-400">Coba ubah kata kunci pencarian atau filter</p>
              {(search || filterType) && (
                <button onClick={resetAll} className="mt-4 text-sm font-bold text-primary-600 hover:underline">
                  Reset pencarian
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-5 py-3.5 font-bold text-gray-600 w-12">No.</th>
                      {columns.map(c => (
                        <th key={c.label} className="text-left px-5 py-3.5 font-bold text-gray-600">{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.map((item, idx) => (
                      <tr key={item.id} id={`lpk-row-${item.id}`} className={`transition-colors ${hlRow(item.id)}`}>
                        <td className="px-5 py-4 text-xs font-medium text-gray-400 align-top">{(pagination.from || 1) + idx}</td>
                        {columns.map(c => (
                          <td key={c.label} className="px-5 py-4 text-gray-600 align-top">{c.render(item, renderOpts)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="divide-y divide-gray-100 md:hidden">
                {data.map((item, idx) => {
                  const showMobilePill = activeTab.segment === 'semua'
                    || (activeTab.segment === 'terakreditasi' && item.status === 'suspended');
                  return (
                    <div key={item.id} id={`lpk-card-${item.id}`}
                      className={`p-4 transition-colors ${highlightId === item.id ? 'bg-yellow-50 ring-2 ring-inset ring-yellow-300' : ''}`}>
                      <div
                        className="flex items-start justify-between gap-3 cursor-pointer"
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-gray-400">#{(pagination.from || 1) + idx}</span>
                          <h3 className="text-sm font-bold leading-snug text-gray-900">{item.name}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{item.type}</p>
                          {showMobilePill && (
                            <span className="inline-block mt-1.5" onClick={e => e.stopPropagation()}>
                              <StatusPill item={item} onClick={handlePillClick} />
                            </span>
                          )}
                        </div>
                        <div className="flex-shrink-0 pt-1">
                          {expandedId === item.id
                            ? <FaChevronUp className="text-xs text-gray-400" />
                            : <FaChevronDown className="text-xs text-gray-400" />}
                        </div>
                      </div>
                      {expandedId === item.id && (
                        <div className="pt-3 mt-3 space-y-2 border-t border-gray-100">
                          {columns.filter(c => c.label !== 'Nama LPK' && c.label !== 'Status').map(c => (
                            <div key={c.label} className="flex items-start gap-2 text-xs">
                              <span className="w-32 text-gray-500 shrink-0">{c.label}</span>
                              <span className="text-gray-700 break-words">{c.render(item, renderOpts)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.last_page > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-gray-100">
                  <p className="text-sm text-gray-400">
                    Menampilkan{' '}
                    <span className="font-semibold text-gray-700">{pagination.from}–{pagination.to}</span>{' '}
                    dari{' '}
                    <span className="font-semibold text-gray-700">{pagination.total}</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <button disabled={page === 1} onClick={() => setPage(1)}
                      className="flex items-center justify-center text-sm transition-colors border border-gray-200 rounded-lg w-9 h-9 disabled:opacity-30 hover:bg-gray-50">«</button>
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                      className="flex items-center justify-center px-3 text-sm font-medium transition-colors border border-gray-200 rounded-lg h-9 disabled:opacity-30 hover:bg-gray-50">‹ Prev</button>
                    {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                      let p;
                      if (pagination.last_page <= 5) p = i + 1;
                      else if (page <= 3) p = i + 1;
                      else if (page >= pagination.last_page - 2) p = pagination.last_page - 4 + i;
                      else p = page - 2 + i;
                      return (
                        <button key={p} onClick={() => setPage(p)}
                          className={`w-9 h-9 flex items-center justify-center text-sm rounded-lg font-semibold transition-colors ${p === page ? 'bg-primary-600 text-white border border-primary-600' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{p}</button>
                      );
                    })}
                    <button disabled={page === pagination.last_page} onClick={() => setPage(p => p + 1)}
                      className="flex items-center justify-center px-3 text-sm font-medium transition-colors border border-gray-200 rounded-lg h-9 disabled:opacity-30 hover:bg-gray-50">Next ›</button>
                    <button disabled={page === pagination.last_page} onClick={() => setPage(pagination.last_page)}
                      className="flex items-center justify-center text-sm transition-colors border border-gray-200 rounded-lg w-9 h-9 disabled:opacity-30 hover:bg-gray-50">»</button>
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