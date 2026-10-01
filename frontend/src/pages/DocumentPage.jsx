import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  FaHome,
  FaChevronRight,
  FaArrowRight,
  FaFileAlt,
  FaBook,
  FaNewspaper,
  FaGlobe,
  FaClipboardList,
  FaFolderOpen,
  FaBalanceScale,
  FaArrowLeft,
  FaExternalLinkAlt,
  FaFlask,
  FaSearch,
} from 'react-icons/fa';

const DocumentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // =========================================================
  // FETCH DATA DARI API
  // =========================================================

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('/api/v1/documents', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(
            json.message || 'Gagal mengambil data dokumen.'
          );
        }

        setDocuments(Array.isArray(json.data) ? json.data : []);
      } catch (err) {
        console.error('Fetch public documents error:', err);
        setError('Gagal memuat data dokumen.');
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // =========================================================
  // HELPER
  // =========================================================

  const getIcon = (document) => {
    const name = (document?.name || '').toLowerCase();

    if (name.includes('internasional')) {
      return FaGlobe;
    }

    if (name.includes('artikel')) {
      return FaNewspaper;
    }

    if (name.includes('materi')) {
      return FaBook;
    }

    if (name.includes('pertemuan') || name.includes('lab')) {
      return FaFlask;
    }

    if (name.includes('pedoman')) {
      return FaBook;
    }

    if (name.includes('kebijakan')) {
      return FaBalanceScale;
    }

    if (name.includes('persyaratan khusus')) {
      return FaClipboardList;
    }

    if (name.includes('persyaratan umum')) {
      return FaFolderOpen;
    }

    return FaFolderOpen;
  };

  const getDefaultDescription = (document) => {
    const name = (document?.name || '').toLowerCase();

    if (name === 'dokumen akreditasi') {
      return 'Dokumen persyaratan, pedoman, dan kebijakan yang berkaitan dengan proses akreditasi.';
    }

    if (name === 'materi kegiatan') {
      return 'Materi dan dokumen yang digunakan dalam berbagai kegiatan KAN.';
    }

    if (name === 'artikel penilaian kesesuaian') {
      return 'Kumpulan artikel dan informasi mengenai penilaian kesesuaian.';
    }

    if (name === 'dokumen internasional') {
      return 'Dokumen dan referensi internasional yang berkaitan dengan akreditasi dan penilaian kesesuaian.';
    }

    return 'Akses dokumen dan informasi yang tersedia pada kategori ini.';
  };

  const getDescription = (document) => {
    return document?.description?.trim()
      ? document.description
      : getDefaultDescription(document);
  };

  // =========================================================
  // FLATTEN TREE
  // =========================================================

  const flattenTree = (items, result = []) => {
    items.forEach((item) => {
      result.push(item);

      if (Array.isArray(item.children) && item.children.length > 0) {
        flattenTree(item.children, result);
      }
    });

    return result;
  };

  const allDocuments = useMemo(() => {
    return flattenTree(documents);
  }, [documents]);

  // =========================================================
  // CARI NODE BERDASARKAN PATH
  // =========================================================

  const pathSegments = location.pathname
    .replace(/^\/unduh\/?/, '')
    .split('/')
    .filter(Boolean);

  const currentNode = useMemo(() => {
    if (pathSegments.length === 0) {
      return null;
    }

    let currentItems = documents;
    let foundNode = null;

    for (const segment of pathSegments) {
      foundNode = currentItems.find(
        (item) => item.slug === segment
      );

      if (!foundNode) {
        return null;
      }

      currentItems = Array.isArray(foundNode.children)
        ? foundNode.children
        : [];
    }

    return foundNode;
  }, [documents, pathSegments]);

  // =========================================================
  // CURRENT CHILDREN
  // =========================================================

  const currentChildren = useMemo(() => {
    if (!currentNode) {
      return documents;
    }

    return Array.isArray(currentNode.children)
      ? currentNode.children
      : [];
  }, [currentNode, documents]);

  const currentCategories = useMemo(() => {
    return currentChildren.filter(
      (item) => item.type === 'category'
    );
  }, [currentChildren]);

  const currentDocumentItems = useMemo(() => {
    return currentChildren.filter(
      (item) => item.type === 'document'
    );
  }, [currentChildren]);

  // =========================================================
  // BIKIN PATH NODE
  // =========================================================

  const findPathToNode = (items, targetId, parents = []) => {
    for (const item of items) {
      const currentPath = [...parents, item];

      if (Number(item.id) === Number(targetId)) {
        return currentPath;
      }

      if (Array.isArray(item.children) && item.children.length > 0) {
        const result = findPathToNode(
          item.children,
          targetId,
          currentPath
        );

        if (result) {
          return result;
        }
      }
    }

    return null;
  };

  // =========================================================
  // BREADCRUMB
  // =========================================================

  const breadcrumbs = useMemo(() => {
    const result = [
      {
        label: 'Unduh',
        path: '/unduh',
      },
    ];

    if (!currentNode) {
      return result;
    }

    const nodePath = findPathToNode(
      documents,
      currentNode.id
    );

    if (!nodePath) {
      return result;
    }

    let accumulatedPath = '/unduh';

    nodePath.forEach((item) => {
      accumulatedPath += `/${item.slug}`;

      result.push({
        label: item.name,
        path: accumulatedPath,
      });
    });

    return result;
  }, [documents, currentNode]);

  // =========================================================
  // HERO
  // =========================================================

  const heroContent = useMemo(() => {
    if (!currentNode) {
      return {
        title: 'Unduh',
        description:
          'Akses berbagai dokumen, materi, dan informasi yang tersedia untuk mendukung kegiatan akreditasi dan penilaian kesesuaian.',
      };
    }

    return {
      title: currentNode.name,
      description: getDescription(currentNode),
    };
  }, [currentNode]);

  // =========================================================
  // CATEGORY CARD
  // =========================================================

  const CategoryCard = ({ category, path }) => {
    const Icon = getIcon(category);

    return (
      <button
        type="button"
        onClick={() => navigate(path)}
        className="relative w-full p-6 overflow-hidden text-left transition-all duration-300 bg-white border border-gray-200 cursor-pointer group rounded-2xl md:p-7 hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl"
      >
        <div className="absolute w-32 h-32 transition-all duration-500 rounded-full -right-12 -top-12 bg-primary-50 group-hover:scale-125" />

        <div className="relative z-10">
          <div className="flex items-center justify-center mb-6 transition-all duration-300 w-14 h-14 rounded-xl bg-primary-50 text-primary-700 group-hover:bg-primary-700 group-hover:text-white">
            <Icon className="text-xl" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 transition-colors group-hover:text-primary-700">
            {category.name}
          </h3>

          <p className="mt-3 text-sm leading-relaxed text-gray-500 md:text-base">
            {getDescription(category)}
          </p>

          <div className="flex items-center gap-2 mt-6 text-sm font-semibold transition-all text-primary-700 group-hover:gap-3">
            <span>Lihat</span>
            <FaArrowRight className="text-xs transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </button>
    );
  };

  // =========================================================
  // DOCUMENT CARD
  // =========================================================

  const DocumentCard = ({ document }) => {
    return (
      <div className="relative overflow-hidden transition-all duration-300 bg-white border border-gray-200 rounded-2xl hover:border-primary-300 hover:shadow-lg">
        <div className="p-5 md:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center justify-center flex-shrink-0 w-14 h-14 rounded-xl bg-primary-50 text-primary-700">
              <FaFileAlt className="text-xl" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 md:text-lg">
                {document.name}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {document.description ||
                  'Dokumen yang tersedia untuk diakses.'}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                {document.file_type && (
                  <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600">
                    {document.file_type}
                  </span>
                )}

                {document.language && (
                  <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600">
                    {document.language}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-shrink-0">
              {document.link ? (
                <a
                  href={document.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 rounded-lg bg-primary-700 hover:bg-primary-800"
                >
                  <span>Buka Dokumen</span>
                  <FaExternalLinkAlt className="text-xs" />
                </a>
              ) : (
                <span className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-gray-400 bg-gray-100 rounded-lg">
                  Dokumen belum tersedia
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleResetSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) {
      return currentDocumentItems;
    }

    const keyword = searchQuery.toLowerCase().trim();

    return currentDocumentItems.filter((document) => {
      return (
        document.name?.toLowerCase().includes(keyword) ||
        document.description?.toLowerCase().includes(keyword) ||
        document.file_type?.toLowerCase().includes(keyword) ||
        document.language?.toLowerCase().includes(keyword)
      );
    });
  }, [currentDocumentItems, searchQuery]);

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto border-4 rounded-full border-primary-200 border-t-primary-700 animate-spin" />

            <p className="mt-4 text-sm text-gray-500">
              Memuat dokumen...
            </p>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="px-5 py-20 mx-auto max-w-7xl md:px-8">
          <div className="px-6 py-16 text-center bg-white border border-gray-200 rounded-2xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto text-red-500 rounded-full bg-red-50">
              <FaFileAlt className="text-xl" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-gray-900">
              Gagal memuat dokumen
            </h3>

            <p className="max-w-md mx-auto mt-2 text-sm leading-relaxed text-gray-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 mt-6 text-sm font-semibold text-white transition-all duration-300 rounded-lg bg-primary-700 hover:bg-primary-800"
            >
              Coba Lagi
            </button>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  const isMainPage = !currentNode;

  const showCategories =
    currentCategories.length > 0;

  const showDocuments =
    currentDocumentItems.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
        <div className="absolute inset-0">
          <div className="absolute rounded-full w-72 h-72 -top-32 -right-20 bg-white/5" />
          <div className="absolute rounded-full w-96 h-96 -bottom-48 -left-32 bg-white/5" />
        </div>

        <div className="relative z-10 px-5 pt-32 pb-12 mx-auto max-w-7xl md:px-8 md:pt-40 md:pb-14">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-2 text-sm mb-7 text-white/70">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 transition-colors hover:text-white"
            >
              <FaHome className="text-xs" />
              <span>Beranda</span>
            </button>

            {breadcrumbs.map((breadcrumb, index) => (
              <div
                key={`${breadcrumb.path}-${index}`}
                className="flex items-center gap-2"
              >
                <FaChevronRight className="text-[10px] text-white/40" />

                <button
                  type="button"
                  onClick={() => navigate(breadcrumb.path)}
                  disabled={
                    index === breadcrumbs.length - 1
                  }
                  className={`transition-colors ${
                    index === breadcrumbs.length - 1
                      ? 'text-white font-medium cursor-default'
                      : 'hover:text-white'
                  }`}
                >
                  {breadcrumb.label}
                </button>
              </div>
            ))}
          </div>

          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
              {heroContent.title}
            </h1>

            <p className="max-w-2xl mt-5 text-base leading-relaxed text-white/75 md:text-lg">
              {heroContent.description}
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTENT
      ===================================================== */}
      <main className="px-5 py-12 mx-auto max-w-7xl md:px-8 md:py-16">
        {/* Back Button */}
        {!isMainPage && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 mb-8 text-sm font-semibold transition-colors text-primary-700 hover:text-primary-900"
          >
            <FaArrowLeft className="text-xs" />
            <span>Kembali</span>
          </button>
        )}

        {/* =================================================
            CATEGORY LIST
        ================================================= */}
        {showCategories && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                {isMainPage
                  ? 'Pilih Kategori'
                  : currentNode.name}
              </h2>

              <p className="max-w-2xl mt-2 text-sm leading-relaxed text-gray-500 md:text-base">
                {isMainPage
                  ? 'Pilih kategori dokumen yang ingin Anda akses.'
                  : 'Pilih kategori dokumen yang ingin Anda akses.'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {currentCategories.map((category) => {
                const categoryPath = isMainPage
                  ? `/unduh/${category.slug}`
                  : `${location.pathname}/${category.slug}`;

                return (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    path={categoryPath}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* =================================================
            DOCUMENT LIST
        ================================================= */}
        {showDocuments && (
          <div className={showCategories ? 'mt-12' : ''}>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                {currentNode?.name || 'Dokumen'}
              </h2>

              <p className="max-w-2xl mt-2 text-sm leading-relaxed text-gray-500 md:text-base">
                Temukan dan akses dokumen yang tersedia pada kategori
                ini.
              </p>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="flex w-full gap-3">
                <div className="relative flex-1">
                  <FaSearch className="absolute text-sm text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />

                  <input
                    type="text"
                    value={searchInput}
                    onChange={(event) =>
                      setSearchInput(event.target.value)
                    }
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Cari dokumen berdasarkan nama atau deskripsi..."
                    className="w-full py-3.5 pl-11 pr-4 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSearch}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 rounded-xl bg-primary-700 hover:bg-primary-800"
                >
                  <FaSearch className="text-xs" />
                  <span>Cari</span>
                </button>
              </div>
            </div>

            {/* Search Result Info */}
            {searchQuery.trim() && (
              <div className="flex items-center justify-between gap-4 mb-5">
                <p className="text-sm text-gray-500">
                  Menampilkan{' '}
                  <span className="font-semibold text-gray-700">
                    {filteredDocuments.length}
                  </span>{' '}
                  dokumen untuk pencarian "{searchQuery}"
                </p>

                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="flex-shrink-0 text-sm font-semibold transition-colors text-primary-700 hover:text-primary-900"
                >
                  Reset
                </button>
              </div>
            )}

            {/* Documents */}
            {filteredDocuments.length > 0 ? (
              <div className="space-y-4">
                {filteredDocuments.map((document) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                  />
                ))}
              </div>
            ) : (
              <div className="px-6 py-16 text-center bg-white border border-gray-200 rounded-2xl">
                <div className="flex items-center justify-center w-16 h-16 mx-auto text-gray-400 bg-gray-100 rounded-full">
                  <FaSearch className="text-xl" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  Dokumen tidak ditemukan
                </h3>

                <p className="max-w-md mx-auto mt-2 text-sm leading-relaxed text-gray-500">
                  Belum ada dokumen yang tersedia pada kategori ini.
                </p>

                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={handleResetSearch}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 mt-6 text-sm font-semibold text-white transition-all duration-300 rounded-lg bg-primary-700 hover:bg-primary-800"
                  >
                    <FaArrowLeft className="text-xs" />
                    <span>Reset Pencarian</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* =================================================
            EMPTY CATEGORY
        ================================================= */}
        {!showCategories &&
          !showDocuments &&
          !isMainPage && (
            <div className="px-6 py-16 text-center bg-white border border-gray-200 rounded-2xl">
              <div className="flex items-center justify-center w-16 h-16 mx-auto text-gray-400 bg-gray-100 rounded-full">
                <FaFolderOpen className="text-xl" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                Belum ada dokumen
              </h3>

              <p className="max-w-md mx-auto mt-2 text-sm leading-relaxed text-gray-500">
                Belum ada dokumen atau subkategori yang tersedia
                pada kategori ini.
              </p>
            </div>
        )}
    </main>

        <Footer />
    </div>
    );
};

export default DocumentPage;