import { useState, useEffect, useMemo } from 'react';
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaSearch,
    FaTimes,
    FaSave,
    FaSpinner,
    FaFolder,
    FaFolderOpen,
    FaFileAlt,
    FaLink,
    FaChevronRight,
    FaExternalLinkAlt,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';

const emptyForm = {
    parent_id: '',
    name: '',
    description: '',
    type: 'category',
    file_type: '',
    language: '',
    link: '',
    sort_order: 0,
    is_active: true,
};

const DocumentManagement = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState(null);

    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const token = localStorage.getItem('token');

    const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem('token');

            // Coba ambil dari endpoint admin
            try {
                const adminRes = await fetch('/api/v1/admin/documents', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                });

                if (adminRes.ok) {
                    const adminJson = await adminRes.json();

                    if (
                        adminJson.success &&
                        Array.isArray(adminJson.data) &&
                        adminJson.data.length > 0
                    ) {
                        setData(adminJson.data);
                        return;
                    }
                }
            } catch (adminError) {
                console.error('Admin documents API error:', adminError);
            }

            // Kalau endpoint admin gagal/kosong,
            // ambil dari endpoint public
            try {
                const publicRes = await fetch('/api/v1/documents', {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                    },
                });

                if (publicRes.ok) {
                    const publicJson = await publicRes.json();

                    if (
                        publicJson.success &&
                        Array.isArray(publicJson.data)
                    ) {
                        setData(publicJson.data);
                        return;
                    }
                }
            } catch (publicError) {
                console.error('Public documents API error:', publicError);
            }

            setData([]);
        } catch (error) {
            console.error('Fetch documents error:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };
    /*
     * Semua kategori yang bisa dijadikan parent.
     */
    const categories = useMemo(() => {
        return data.filter((item) => item.type === 'category');
    }, [data]);

    /*
     * Mencari semua turunan dari suatu item.
     * Dipakai supaya saat edit kategori, kategori tersebut
     * tidak bisa dipindahkan ke bawah dirinya sendiri.
     */
    const getDescendantIds = (itemId) => {
        const descendants = [];

        const findChildren = (parentId) => {
            data
                .filter((item) => Number(item.parent_id) === Number(parentId))
                .forEach((child) => {
                    descendants.push(child.id);
                    findChildren(child.id);
                });
        };

        findChildren(itemId);

        return descendants;
    };

    /*
     * Parent yang tersedia untuk form.
     *
     * Saat tambah:
     * semua category bisa dipilih.
     *
     * Saat edit:
     * dirinya sendiri + semua turunannya dikeluarkan.
     */
    const availableParents = useMemo(() => {
        if (!editItem) {
            return categories;
        }

        const excludedIds = [
            editItem.id,
            ...getDescendantIds(editItem.id),
        ];

        return categories.filter(
            (category) => !excludedIds.includes(category.id)
        );
    }, [categories, editItem, data]);

    /*
     * Membuat nama parent dengan indentasi berdasarkan level.
     */
    const getParentLabel = (item) => {
        const level = getLevel(item);

        return `${'— '.repeat(level)}${item.name}`;
    };

    const getLevel = (item) => {
        let level = 0;
        let currentParentId = item.parent_id;

        while (currentParentId !== null && currentParentId !== undefined) {
            const parent = data.find(
                (dataItem) => Number(dataItem.id) === Number(currentParentId)
            );

            if (!parent) break;

            level += 1;
            currentParentId = parent.parent_id;

            if (level > 50) break;
        }

        return level;
    };

    /*
     * Membuat data menjadi struktur tree agar tampilan admin
     * mengikuti hierarki parent -> child.
     */
    const buildTree = (items) => {
        const itemMap = {};
        const roots = [];

        items.forEach((item) => {
            itemMap[item.id] = {
                ...item,
                children: [],
            };
        });

        items.forEach((item) => {
            if (
                item.parent_id !== null &&
                item.parent_id !== undefined &&
                itemMap[item.parent_id]
            ) {
                itemMap[item.parent_id].children.push(itemMap[item.id]);
            } else {
                roots.push(itemMap[item.id]);
            }
        });

        const sortTree = (items) => {
            items.sort((a, b) => {
                const sortA = Number(a.sort_order || 0);
                const sortB = Number(b.sort_order || 0);

                if (sortA !== sortB) {
                    return sortA - sortB;
                }

                return a.name.localeCompare(b.name);
            });

            items.forEach((item) => {
                sortTree(item.children);
            });
        };

        sortTree(roots);

        return roots;
    };

    const treeData = useMemo(() => {
        let filtered = [...data];

        if (search.trim()) {
            const keyword = search.toLowerCase();

            filtered = filtered.filter((item) => {
                return (
                    item.name?.toLowerCase().includes(keyword) ||
                    item.description?.toLowerCase().includes(keyword) ||
                    item.file_type?.toLowerCase().includes(keyword) ||
                    item.language?.toLowerCase().includes(keyword)
                );
            });
        }

        /*
         * Kalau sedang search, tampilkan hasil yang cocok saja.
         * Kalau tidak search, tampilkan seluruh tree.
         */
        return buildTree(filtered);
    }, [data, search]);

    const openAdd = () => {
        setEditItem(null);
        setForm(emptyForm);
        setSaveMsg(null);
        setModalOpen(true);
    };

    const openAddChild = (parent) => {
        setEditItem(null);

        setForm({
            ...emptyForm,
            parent_id: String(parent.id),
            type: 'category',
        });

        setSaveMsg(null);
        setModalOpen(true);
    };

    const openEdit = (item) => {
        setEditItem(item);

        setForm({
            parent_id:
                item.parent_id !== null && item.parent_id !== undefined
                    ? String(item.parent_id)
                    : '',
            name: item.name || '',
            description: item.description || '',
            type: item.type || 'category',
            file_type: item.file_type || '',
            language: item.language || '',
            link: item.link || '',
            sort_order: item.sort_order ?? 0,
            is_active: Boolean(item.is_active),
        });

        setSaveMsg(null);
        setModalOpen(true);
    };

    const handleFormChange = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const handleTypeChange = (type) => {
        setForm((current) => ({
            ...current,
            type,
            ...(type === 'category'
                ? {
                    file_type: '',
                    language: '',
                    link: '',
                }
                : {}),
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setSaveMsg(null);

            const url = editItem
                ? `/api/v1/admin/documents/${editItem.id}`
                : '/api/v1/admin/documents';

            const method = editItem ? 'PUT' : 'POST';

            let link = form.link?.trim() || null;

            if (link && !/^https?:\/\//i.test(link)) {
                link = `https://${link}`;
            }

            const payload = {
                parent_id: form.parent_id ? Number(form.parent_id) : null,
                name: form.name.trim(),
                description: form.description?.trim() || null,
                type: form.type,
                file_type:
                    form.type === 'document'
                        ? form.file_type?.trim() || null
                        : null,
                language:
                    form.type === 'document'
                        ? form.language?.trim() || null
                        : null,
                link: form.type === 'document' ? link : null,
                sort_order: Number(form.sort_order) || 0,
                is_active: Boolean(form.is_active),
            };

            const res = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            if (res.ok && json.success) {
                setSaveMsg({
                    type: 'success',
                    text: json.message || 'Data berhasil disimpan.',
                });

                await fetchData();

                setTimeout(() => {
                    setModalOpen(false);
                    setSaveMsg(null);
                }, 1000);
            } else {
                const errMsg = json.errors
                    ? Object.values(json.errors).flat().join(', ')
                    : json.message || 'Gagal menyimpan data.';

                setSaveMsg({
                    type: 'error',
                    text: errMsg,
                });
            }
        } catch (error) {
            console.error('Save document error:', error);

            setSaveMsg({
                type: 'error',
                text: 'Gagal terhubung ke server. Pastikan backend Laravel sedang berjalan.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`/api/v1/admin/documents/${id}`, {
                method: 'DELETE',
                headers,
            });

            const json = await res.json();

            if (res.ok && json.success) {
                await fetchData();
                setDeleteConfirm(null);
            } else {
                alert(json.message || 'Gagal menghapus data.');
            }
        } catch (error) {
            console.error('Delete document error:', error);
            alert('Gagal terhubung ke server.');
        }
    };

    /*
     * Recursive row untuk tabel.
     */
    const renderRows = (items, level = 0) => {
        return items.flatMap((item) => {
            const rows = [
                <tr
                    key={item.id}
                    className="transition-colors hover:bg-gray-50"
                >
                    <td className="px-5 py-4">
                        <div
                            className="flex items-center"
                            style={{ paddingLeft: `${level * 28}px` }}
                        >
                            <div
                                className={`flex items-center justify-center flex-shrink-0 w-9 h-9 rounded-lg mr-3 ${item.type === 'category'
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}
                            >
                                {item.type === 'category' ? (
                                    level === 0 ? (
                                        <FaFolderOpen className="text-sm" />
                                    ) : (
                                        <FaFolder className="text-sm" />
                                    )
                                ) : (
                                    <FaFileAlt className="text-sm" />
                                )}
                            </div>

                            <div className="min-w-0">
                                <div className="font-semibold text-gray-900">
                                    {item.name}
                                </div>

                                {item.description && (
                                    <div className="mt-0.5 text-xs text-gray-400 truncate max-w-md">
                                        {item.description}
                                    </div>
                                )}
                            </div>
                        </div>
                    </td>

                    <td className="px-5 py-4">
                        <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${item.type === 'category'
                                ? 'bg-primary-50 text-primary-700'
                                : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            {item.type === 'category' ? 'Kategori' : 'Dokumen'}
                        </span>
                    </td>

                    <td className="px-5 py-4">
                        {item.type === 'document' ? (
                            <div className="space-y-1">
                                {item.file_type && (
                                    <span className="inline-block px-2 py-1 mr-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md">
                                        {item.file_type}
                                    </span>
                                )}

                                {item.language && (
                                    <span className="inline-block px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md">
                                        {item.language}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <span className="text-gray-400">—</span>
                        )}
                    </td>

                    <td className="px-5 py-4">
                        {item.type === 'document' && item.link ? (
                            <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-800 hover:underline"
                            >
                                <FaLink className="text-xs" />
                                Buka
                                <FaExternalLinkAlt className="text-[10px]" />
                            </a>
                        ) : (
                            <span className="text-gray-400">—</span>
                        )}
                    </td>

                    <td className="px-5 py-4">
                        <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${item.is_active
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-500'
                                }`}
                        >
                            {item.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                    </td>

                    <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                            {item.type === 'category' && (
                                <button
                                    onClick={() => openAddChild(item)}
                                    title="Tambah isi"
                                    className="p-2 transition-colors rounded-lg text-emerald-600 hover:bg-emerald-50"
                                >
                                    <FaPlus className="text-sm" />
                                </button>
                            )}

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
                </tr>,
            ];

            if (item.children && item.children.length > 0) {
                rows.push(...renderRows(item.children, level + 1));
            }

            return rows;
        });
    };

    return (
        <AdminLayout>
            <div className="space-y-6">

                {/* Header */}
                <div className="relative overflow-hidden text-white shadow-xl bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 rounded-2xl p-7">
                    <div className="absolute w-56 h-56 rounded-full pointer-events-none -top-10 -right-10 bg-white/5 blur-3xl" />

                    <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 bg-white/15 rounded-xl">
                                <FaFolderOpen className="text-xl text-white" />
                            </div>

                            <div>
                                <h2 className="text-2xl font-black">
                                    Dokumen & Unduh
                                </h2>

                                <p className="text-sm mt-0.5 text-white/70">
                                    Kelola kategori, subkategori, dan dokumen yang tersedia untuk diunduh
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={openAdd}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-700 rounded-xl font-bold text-sm hover:bg-white/90 transition-all shadow-lg"
                        >
                            <FaPlus className="text-xs" />
                            Tambah Data
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-5 bg-white border border-gray-200 shadow-sm rounded-2xl">
                    <div className="relative">
                        <FaSearch className="absolute text-sm text-gray-400 -translate-y-1/2 left-3 top-1/2" />

                        <input
                            type="text"
                            placeholder="Cari kategori atau dokumen..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />

                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute p-1 text-gray-400 -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                            >
                                <FaTimes className="text-xs" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <FaSpinner className="text-3xl text-primary-600 animate-spin" />
                        </div>
                    ) : treeData.length === 0 ? (
                        <div className="py-16 text-center">
                            <FaFolderOpen className="mx-auto mb-3 text-4xl text-gray-300" />

                            <p className="font-semibold text-gray-500">
                                {search
                                    ? 'Data tidak ditemukan'
                                    : 'Belum ada data dokumen'}
                            </p>

                            {!search && (
                                <button
                                    onClick={openAdd}
                                    className="mt-3 text-sm font-bold text-primary-600 hover:underline"
                                >
                                    + Tambah data pertama
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50">
                                        <th className="text-left px-5 py-3.5 font-bold text-gray-700">
                                            Nama
                                        </th>

                                        <th className="text-left px-5 py-3.5 font-bold text-gray-700">
                                            Tipe
                                        </th>

                                        <th className="text-left px-5 py-3.5 font-bold text-gray-700">
                                            Info
                                        </th>

                                        <th className="text-left px-5 py-3.5 font-bold text-gray-700">
                                            Link
                                        </th>

                                        <th className="text-left px-5 py-3.5 font-bold text-gray-700">
                                            Status
                                        </th>

                                        <th className="text-right px-5 py-3.5 font-bold text-gray-700">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-50">
                                    {renderRows(treeData)}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Info */}
                {!loading && data.length > 0 && (
                    <div className="flex items-start gap-3 p-4 border border-primary-100 bg-primary-50 rounded-xl">
                        <FaFolderOpen className="flex-shrink-0 mt-0.5 text-primary-600" />

                        <div className="text-sm text-primary-800">
                            <p className="font-bold">
                                Struktur dokumen
                            </p>

                            <p className="mt-1 text-primary-700">
                                Gunakan tombol <strong>+</strong> pada kategori untuk
                                menambahkan subkategori atau dokumen di dalamnya.
                                Struktur dapat dibuat bertingkat sesuai kebutuhan.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Form */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                            <div>
                                <h3 className="font-black text-gray-900">
                                    {editItem
                                        ? 'Edit Data'
                                        : form.parent_id
                                            ? 'Tambah Data'
                                            : 'Tambah Kategori'}
                                </h3>

                                <p className="mt-1 text-xs text-gray-400">
                                    {editItem
                                        ? 'Perbarui informasi data'
                                        : 'Tambahkan kategori, subkategori, atau dokumen'}
                                </p>
                            </div>

                            <button
                                onClick={() => setModalOpen(false)}
                                className="p-2 text-gray-500 rounded-lg hover:bg-gray-100"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">

                            {/* Message */}
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

                            {/* Parent */}
                            <div>
                                <label className="block mb-1 text-sm font-bold text-gray-700">
                                    Parent / Kategori
                                </label>

                                <select
                                    value={form.parent_id}
                                    onChange={(e) =>
                                        handleFormChange('parent_id', e.target.value)
                                    }
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                >
                                    <option value="">
                                        -- Tidak ada parent / Kategori Utama --
                                    </option>

                                    {availableParents.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {getParentLabel(category)}
                                        </option>
                                    ))}
                                </select>

                                <p className="mt-1.5 text-xs text-gray-400">
                                    Pilih kategori tempat data ini akan berada.
                                </p>
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block mb-1 text-sm font-bold text-gray-700">
                                    Tipe Data *
                                </label>

                                <select
                                    value={form.type}
                                    onChange={(e) =>
                                        handleTypeChange(e.target.value)
                                    }
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                >
                                    <option value="category">
                                        Kategori / Subkategori
                                    </option>

                                    <option value="document">
                                        Dokumen
                                    </option>
                                </select>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block mb-1 text-sm font-bold text-gray-700">
                                    Nama {form.type === 'document' ? 'Dokumen' : 'Kategori'} *
                                </label>

                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) =>
                                        handleFormChange('name', e.target.value)
                                    }
                                    placeholder={
                                        form.type === 'document'
                                            ? 'Contoh: SNI ISO/IEC 17025:2017'
                                            : 'Contoh: Persyaratan Umum'
                                    }
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block mb-1 text-sm font-bold text-gray-700">
                                    Deskripsi
                                </label>

                                <textarea
                                    value={form.description}
                                    onChange={(e) =>
                                        handleFormChange('description', e.target.value)
                                    }
                                    rows={3}
                                    placeholder="Deskripsi singkat..."
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                />
                            </div>

                            {/* Document-specific fields */}
                            {form.type === 'document' && (
                                <>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                                        {/* File Type */}
                                        <div>
                                            <label className="block mb-1 text-sm font-bold text-gray-700">
                                                Tipe File
                                            </label>

                                            <select
                                                value={form.file_type}
                                                onChange={(e) =>
                                                    handleFormChange('file_type', e.target.value)
                                                }
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                            >
                                                <option value="">-- Pilih Tipe File --</option>
                                                <option value="PDF">PDF</option>
                                                <option value="DOC">DOC</option>
                                                <option value="DOCX">DOCX</option>
                                                <option value="XLS">XLS</option>
                                                <option value="XLSX">XLSX</option>
                                                <option value="PPT">PPT</option>
                                                <option value="PPTX">PPTX</option>
                                                <option value="ZIP">ZIP</option>
                                                <option value="Other">Lainnya</option>
                                            </select>
                                        </div>

                                        {/* Language */}
                                        <div>
                                            <label className="block mb-1 text-sm font-bold text-gray-700">
                                                Bahasa
                                            </label>

                                            <select
                                                value={form.language}
                                                onChange={(e) =>
                                                    handleFormChange('language', e.target.value)
                                                }
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                            >
                                                <option value="">-- Pilih Bahasa --</option>
                                                <option value="Indonesia">Indonesia</option>
                                                <option value="English">English</option>
                                                <option value="Indonesia & English">
                                                    Indonesia & English
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Link */}
                                    <div>
                                        <label className="block mb-1 text-sm font-bold text-gray-700">
                                            Link Dokumen *
                                        </label>

                                        <div className="relative">
                                            <FaLink className="absolute text-xs text-gray-400 -translate-y-1/2 left-3 top-1/2" />

                                            <input
                                                type="url"
                                                value={form.link}
                                                onChange={(e) =>
                                                    handleFormChange('link', e.target.value)
                                                }
                                                placeholder="https://..."
                                                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>

                                        <p className="mt-1.5 text-xs text-gray-400">
                                            Link akan dibuka ketika pengunjung menekan
                                            tombol "Buka Dokumen".
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Sort Order */}
                            <div>
                                <label className="block mb-1 text-sm font-bold text-gray-700">
                                    Urutan
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    value={form.sort_order}
                                    onChange={(e) =>
                                        handleFormChange('sort_order', e.target.value)
                                    }
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />

                                <p className="mt-1.5 text-xs text-gray-400">
                                    Semakin kecil angka, semakin awal ditampilkan.
                                </p>
                            </div>

                            {/* Active */}
                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                                <div>
                                    <p className="text-sm font-bold text-gray-700">
                                        Status Data
                                    </p>

                                    <p className="mt-0.5 text-xs text-gray-400">
                                        Data nonaktif tidak akan ditampilkan di website publik.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleFormChange(
                                            'is_active',
                                            !form.is_active
                                        )
                                    }
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active
                                        ? 'bg-primary-600'
                                        : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_active
                                            ? 'translate-x-6'
                                            : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={saving || !form.name.trim()}
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

                        {deleteConfirm.type === 'category' && (
                            <p className="px-3 py-2 mb-5 text-xs rounded-lg text-amber-600 bg-amber-50">
                                Kategori yang masih memiliki isi tidak dapat dihapus.
                            </p>
                        )}

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

export default DocumentManagement;