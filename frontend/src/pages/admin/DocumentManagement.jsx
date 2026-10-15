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

/* Field yang hanya berlaku untuk tipe "document" */
const documentFieldsReset = {
    file_type: '',
    language: '',
    link: '',
};

const FILE_TYPE_OPTIONS = [
    ['PDF', 'PDF'],
    ['DOC', 'DOC'],
    ['DOCX', 'DOCX'],
    ['XLS', 'XLS'],
    ['XLSX', 'XLSX'],
    ['PPT', 'PPT'],
    ['PPTX', 'PPTX'],
    ['ZIP', 'ZIP'],
    ['Other', 'Lainnya'],
];

const LANGUAGE_OPTIONS = [
    ['Indonesia', 'Indonesia'],
    ['English', 'English'],
    ['Indonesia & English', 'Indonesia & English'],
];

const TABLE_HEADERS = [
    { label: 'Nama', align: 'text-left' },
    { label: 'Tipe', align: 'text-left' },
    { label: 'Info', align: 'text-left' },
    { label: 'Link', align: 'text-left' },
    { label: 'Status', align: 'text-left' },
    { label: 'Aksi', align: 'text-right' },
];

const INPUT_CLASS =
    'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';
const SELECT_CLASS = `${INPUT_CLASS} bg-white`;
const LABEL_CLASS = 'block mb-1 text-sm font-bold text-gray-700';

/*
 * =========================================================
 * HELPER: DATA & TREE
 * =========================================================
 */

const hasValue = (value) => value !== null && value !== undefined;

const findById = (items, id) =>
    items.find((item) => Number(item.id) === Number(id));

/*
 * Daftar parent dari sebuah item (dari yang terdekat ke teratas).
 * Dibatasi 50 level supaya tidak looping tanpa akhir.
 */
const getAncestors = (items, item) => {
    const ancestors = [];
    let parentId = item.parent_id;

    while (hasValue(parentId) && ancestors.length <= 50) {
        const parent = findById(items, parentId);

        if (!parent) break;

        ancestors.push(parent);
        parentId = parent.parent_id;
    }

    return ancestors;
};

const getLevel = (items, item) => getAncestors(items, item).length;

/*
 * Semua turunan dari suatu item. Dipakai supaya saat edit kategori,
 * kategori itu tidak bisa dipindahkan ke bawah dirinya sendiri.
 */
const getDescendantIds = (items, itemId) => {
    const children = items.filter(
        (item) => Number(item.parent_id) === Number(itemId)
    );

    return children.flatMap((child) => [
        child.id,
        ...getDescendantIds(items, child.id),
    ]);
};

const compareItems = (a, b) => {
    const sortA = Number(a.sort_order || 0);
    const sortB = Number(b.sort_order || 0);

    if (sortA !== sortB) {
        return sortA - sortB;
    }

    return a.name.localeCompare(b.name);
};

const sortTree = (nodes) => {
    nodes.sort(compareItems);
    nodes.forEach((node) => sortTree(node.children));
};

/*
 * Mengubah data datar menjadi tree:
 * parent
 * ├── child
 * │   └── child
 * └── child
 */
const buildTree = (items) => {
    const nodeMap = {};
    const roots = [];

    items.forEach((item) => {
        nodeMap[item.id] = { ...item, children: [] };
    });

    items.forEach((item) => {
        const node = nodeMap[item.id];
        const parentNode = hasValue(item.parent_id)
            ? nodeMap[item.parent_id]
            : undefined;

        if (parentNode) {
            parentNode.children.push(node);
        } else {
            roots.push(node);
        }
    });

    sortTree(roots);

    return roots;
};

const matchesKeyword = (item, keyword) =>
    [item.name, item.description, item.file_type, item.language].some(
        (value) => value?.toLowerCase().includes(keyword)
    );

/*
 * Hasil search tetap membawa seluruh parent dari item yang cocok,
 * supaya konteks foldernya tidak hilang.
 */
const filterItems = (items, search) => {
    const keyword = search.toLowerCase();
    const resultIds = new Set();

    items
        .filter((item) => matchesKeyword(item, keyword))
        .forEach((item) => {
            resultIds.add(item.id);
            getAncestors(items, item).forEach((parent) =>
                resultIds.add(parent.id)
            );
        });

    return items.filter((item) => resultIds.has(item.id));
};

const collectExpandableIds = (nodes, ids = new Set()) => {
    nodes.forEach((node) => {
        if (node.type === 'category' && node.children?.length > 0) {
            ids.add(node.id);
            collectExpandableIds(node.children, ids);
        }
    });

    return ids;
};

/* Update Set tanpa mengubah Set lama */
const withAdded = (set, id) => new Set(set).add(id);

const withToggled = (set, id) => {
    const next = new Set(set);

    if (next.has(id)) {
        next.delete(id);
    } else {
        next.add(id);
    }

    return next;
};

const withRemoved = (set, id) => {
    const next = new Set(set);
    next.delete(id);
    return next;
};

/*
 * =========================================================
 * HELPER: API
 * =========================================================
 */

const fetchAdminDocuments = async (token) => {
    try {
        const res = await fetch('/api/v1/admin/documents', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        });

        if (!res.ok) return null;

        const json = await res.json();
        const hasRows =
            json.success && Array.isArray(json.data) && json.data.length > 0;

        return hasRows ? json.data : null;
    } catch (error) {
        console.error('Admin documents API error:', error);
        return null;
    }
};

const fetchPublicDocuments = async () => {
    try {
        const res = await fetch('/api/v1/documents', {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });

        if (!res.ok) return null;

        const json = await res.json();

        return json.success && Array.isArray(json.data) ? json.data : null;
    } catch (error) {
        console.error('Public documents API error:', error);
        return null;
    }
};

/* Coba endpoint admin dulu. Kalau gagal/kosong, pakai endpoint public. */
const loadDocuments = async () => {
    const token = localStorage.getItem('token');

    const adminData = await fetchAdminDocuments(token);
    if (adminData) return adminData;

    const publicData = await fetchPublicDocuments();
    return publicData ?? [];
};

/*
 * =========================================================
 * HELPER: FORM
 * =========================================================
 */

const normalizeLink = (value) => {
    const link = value?.trim() || null;

    if (link && !/^https?:\/\//i.test(link)) {
        return `https://${link}`;
    }

    return link;
};

const buildPayload = (form) => {
    const isDocument = form.type === 'document';

    return {
        parent_id: form.parent_id ? Number(form.parent_id) : null,
        name: form.name.trim(),
        description: form.description?.trim() || null,
        type: form.type,
        file_type: isDocument ? form.file_type?.trim() || null : null,
        language: isDocument ? form.language?.trim() || null : null,
        link: isDocument ? normalizeLink(form.link) : null,
        sort_order: Number(form.sort_order) || 0,
        is_active: Boolean(form.is_active),
    };
};

const formFromItem = (item) => ({
    parent_id: hasValue(item.parent_id) ? String(item.parent_id) : '',
    name: item.name || '',
    description: item.description || '',
    type: item.type || 'category',
    file_type: item.file_type || '',
    language: item.language || '',
    link: item.link || '',
    sort_order: item.sort_order ?? 0,
    is_active: Boolean(item.is_active),
});

const extractErrorMessage = (json) => {
    if (json.errors) {
        return Object.values(json.errors).flat().join(', ');
    }

    return json.message || 'Gagal menyimpan data.';
};

const getModalTitle = (editItem, form) => {
    if (editItem) return 'Edit Data';

    return form.parent_id ? 'Tambah Data' : 'Tambah Kategori';
};

const getChevronTitle = (hasChildren, expanded) => {
    if (!hasChildren) return undefined;

    return expanded ? 'Tutup' : 'Buka';
};

const getItemIcon = (isCategory, expanded) => {
    if (!isCategory) return FaFileAlt;

    return expanded ? FaFolderOpen : FaFolder;
};

/* Membungkus handler supaya klik tombol tidak ikut men-toggle baris */
const stopPropagation = (handler) => (event) => {
    event.stopPropagation();
    handler();
};

/*
 * =========================================================
 * KOMPONEN: BARIS TABEL
 * =========================================================
 */

const Dash = () => <span className="text-gray-400">—</span>;

const ChevronButton = ({ hasChildren, expanded, onToggle }) => {
    const stateClass = hasChildren
        ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 cursor-pointer'
        : 'text-transparent cursor-default';

    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();

                if (hasChildren) {
                    onToggle();
                }
            }}
            disabled={!hasChildren}
            className={`flex items-center justify-center flex-shrink-0 w-6 h-6 mr-1 rounded-md transition-colors ${stateClass}`}
            title={getChevronTitle(hasChildren, expanded)}
        >
            <FaChevronRight
                className={`text-xs transition-transform duration-200 ${
                    expanded ? 'rotate-90' : ''
                }`}
            />
        </button>
    );
};

const ItemIcon = ({ isCategory, expanded }) => {
    const Icon = getItemIcon(isCategory, expanded);
    const tone = isCategory
        ? 'bg-primary-50 text-primary-700'
        : 'bg-gray-100 text-gray-600';

    return (
        <div
            className={`flex items-center justify-center flex-shrink-0 w-9 h-9 rounded-lg mr-3 ${tone}`}
        >
            <Icon className="text-sm" />
        </div>
    );
};

const NameCell = ({ item, level, expanded, hasChildren, onToggle }) => {
    const isCategory = item.type === 'category';

    return (
        <td className="px-5 py-4">
            <div
                className="flex items-center"
                style={{ paddingLeft: `${level * 28}px` }}
            >
                {isCategory ? (
                    <ChevronButton
                        hasChildren={hasChildren}
                        expanded={expanded}
                        onToggle={onToggle}
                    />
                ) : (
                    <div className="w-6 mr-1" />
                )}

                <ItemIcon isCategory={isCategory} expanded={expanded} />

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
    );
};

const TypeBadge = ({ type }) => {
    const isCategory = type === 'category';
    const tone = isCategory
        ? 'bg-primary-50 text-primary-700'
        : 'bg-gray-100 text-gray-700';

    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${tone}`}
        >
            {isCategory ? 'Kategori' : 'Dokumen'}
        </span>
    );
};

const InfoCell = ({ item }) => {
    if (item.type !== 'document') {
        return (
            <td className="px-5 py-4">
                <Dash />
            </td>
        );
    }

    return (
        <td className="px-5 py-4">
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
        </td>
    );
};

const LinkCell = ({ item }) => {
    const hasLink = item.type === 'document' && item.link;

    return (
        <td className="px-5 py-4">
            {hasLink ? (
                <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-800 hover:underline"
                >
                    <FaLink className="text-xs" />
                    Buka
                    <FaExternalLinkAlt className="text-[10px]" />
                </a>
            ) : (
                <Dash />
            )}
        </td>
    );
};

const StatusBadge = ({ active }) => {
    const tone = active
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-gray-100 text-gray-500';

    return (
        <span
            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${tone}`}
        >
            {active ? 'Aktif' : 'Nonaktif'}
        </span>
    );
};

const ActionsCell = ({ item, onAddChild, onEdit, onDelete }) => (
    <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-1">
            {item.type === 'category' && (
                <button
                    onClick={stopPropagation(() => onAddChild(item))}
                    title="Tambah isi"
                    className="p-2 transition-colors rounded-lg text-emerald-600 hover:bg-emerald-50"
                >
                    <FaPlus className="text-sm" />
                </button>
            )}

            <button
                onClick={stopPropagation(() => onEdit(item))}
                title="Edit"
                className="p-2 transition-colors rounded-lg text-primary-600 hover:bg-primary-50"
            >
                <FaEdit className="text-sm" />
            </button>

            <button
                onClick={stopPropagation(() => onDelete(item))}
                title="Hapus"
                className="p-2 text-red-500 transition-colors rounded-lg hover:bg-red-50"
            >
                <FaTrash className="text-sm" />
            </button>
        </div>
    </td>
);

const DocumentRow = ({
    item,
    level,
    expanded,
    hasChildren,
    onToggle,
    onAddChild,
    onEdit,
    onDelete,
}) => {
    const isClickable = item.type === 'category' && hasChildren;

    const handleRowClick = () => {
        if (isClickable) {
            onToggle();
        }
    };

    return (
        <tr
            onClick={handleRowClick}
            className={`transition-colors ${
                isClickable ? 'cursor-pointer hover:bg-gray-50' : ''
            }`}
        >
            <NameCell
                item={item}
                level={level}
                expanded={expanded}
                hasChildren={hasChildren}
                onToggle={onToggle}
            />

            <td className="px-5 py-4">
                <TypeBadge type={item.type} />
            </td>

            <InfoCell item={item} />
            <LinkCell item={item} />

            <td className="px-5 py-4">
                <StatusBadge active={item.is_active} />
            </td>

            <ActionsCell
                item={item}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        </tr>
    );
};

/*
 * =========================================================
 * KOMPONEN: HALAMAN
 * =========================================================
 */

const DocumentsHeader = ({ onAdd }) => (
    <div className="relative overflow-hidden text-white shadow-xl bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 rounded-2xl p-7">
        <div className="absolute w-56 h-56 rounded-full pointer-events-none -top-10 -right-10 bg-white/5 blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 bg-white/15 rounded-xl">
                    <FaFolderOpen className="text-xl text-white" />
                </div>

                <div>
                    <h2 className="text-2xl font-black">Dokumen & Unduh</h2>

                    <p className="text-sm mt-0.5 text-white/70">
                        Kelola kategori, subkategori, dan dokumen yang tersedia
                        untuk diunduh
                    </p>
                </div>
            </div>

            <button
                onClick={onAdd}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-700 rounded-xl font-bold text-sm hover:bg-white/90 transition-all shadow-lg"
            >
                <FaPlus className="text-xs" />
                Tambah Data
            </button>
        </div>
    </div>
);

const SearchBox = ({ value, onChange }) => (
    <div className="p-5 bg-white border border-gray-200 shadow-sm rounded-2xl">
        <div className="relative">
            <FaSearch className="absolute text-sm text-gray-400 -translate-y-1/2 left-3 top-1/2" />

            <input
                type="text"
                aria-label="Cari kategori atau dokumen"
                placeholder="Cari kategori atau dokumen..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />

            {value && (
                <button
                    onClick={() => onChange('')}
                    aria-label="Hapus pencarian"
                    className="absolute p-1 text-gray-400 -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                >
                    <FaTimes className="text-xs" />
                </button>
            )}
        </div>
    </div>
);

const LoadingState = () => (
    <div className="flex justify-center py-20">
        <FaSpinner className="text-3xl text-primary-600 animate-spin" />
    </div>
);

const EmptyState = ({ searching, onAdd }) => (
    <div className="py-16 text-center">
        <FaFolderOpen className="mx-auto mb-3 text-4xl text-gray-300" />

        <p className="font-semibold text-gray-500">
            {searching ? 'Data tidak ditemukan' : 'Belum ada data dokumen'}
        </p>

        {!searching && (
            <button
                onClick={onAdd}
                className="mt-3 text-sm font-bold text-primary-600 hover:underline"
            >
                + Tambah data pertama
            </button>
        )}
    </div>
);

const DocumentTable = ({ children }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                    {TABLE_HEADERS.map((header) => (
                        <th
                            key={header.label}
                            className={`${header.align} px-5 py-3.5 font-bold text-gray-700`}
                        >
                            {header.label}
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">{children}</tbody>
        </table>
    </div>
);

const DocumentListCard = ({
    loading,
    treeData,
    searching,
    onAdd,
    renderRows,
}) => {
    let content;

    if (loading) {
        content = <LoadingState />;
    } else if (treeData.length === 0) {
        content = <EmptyState searching={searching} onAdd={onAdd} />;
    } else {
        content = <DocumentTable>{renderRows(treeData)}</DocumentTable>;
    }

    return (
        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
            {content}
        </div>
    );
};

const StructureInfo = () => (
    <div className="flex items-start gap-3 p-4 border border-primary-100 bg-primary-50 rounded-xl">
        <FaFolderOpen className="flex-shrink-0 mt-0.5 text-primary-600" />

        <div className="text-sm text-primary-800">
            <p className="font-bold">Struktur dokumen</p>

            <p className="mt-1 text-primary-700">
                Klik baris kategori atau ikon panah untuk membuka dan menutup
                isinya. Gunakan tombol <strong>+</strong> untuk menambahkan
                subkategori atau dokumen.
            </p>
        </div>
    </div>
);

/*
 * =========================================================
 * KOMPONEN: MODAL FORM
 * =========================================================
 */

const Field = ({ id, label, hint, children }) => (
    <div>
        <label htmlFor={id} className={LABEL_CLASS}>
            {label}
        </label>

        {children}

        {hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
    </div>
);

const SelectField = ({ id, label, hint, value, onChange, placeholder, options }) => (
    <Field id={id} label={label} hint={hint}>
        <select
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={SELECT_CLASS}
        >
            <option value="">{placeholder}</option>

            {options.map(([optionValue, optionLabel]) => (
                <option key={optionValue} value={optionValue}>
                    {optionLabel}
                </option>
            ))}
        </select>
    </Field>
);

const ModalHeader = ({ title, subtitle, onClose }) => (
    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div>
            <h3 className="font-black text-gray-900">{title}</h3>
            <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
        </div>

        <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 text-gray-500 rounded-lg hover:bg-gray-100"
        >
            <FaTimes />
        </button>
    </div>
);

const FormMessage = ({ message }) => {
    if (!message) return null;

    const tone =
        message.type === 'success'
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-red-50 text-red-700';

    return (
        <div className={`px-4 py-3 rounded-xl text-sm font-semibold ${tone}`}>
            {message.text}
        </div>
    );
};

const DocumentFields = ({ form, onChange }) => (
    <>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
                id="doc_file_type"
                label="Tipe File"
                value={form.file_type}
                onChange={(value) => onChange('file_type', value)}
                placeholder="-- Pilih Tipe File --"
                options={FILE_TYPE_OPTIONS}
            />

            <SelectField
                id="doc_language"
                label="Bahasa"
                value={form.language}
                onChange={(value) => onChange('language', value)}
                placeholder="-- Pilih Bahasa --"
                options={LANGUAGE_OPTIONS}
            />
        </div>

        <Field
            id="doc_link"
            label="Link Dokumen *"
            hint='Link akan dibuka ketika pengunjung menekan tombol "Buka Dokumen".'
        >
            <div className="relative">
                <FaLink className="absolute text-xs text-gray-400 -translate-y-1/2 left-3 top-1/2" />

                <input
                    id="doc_link"
                    type="url"
                    value={form.link}
                    onChange={(e) => onChange('link', e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>
        </Field>
    </>
);

const StatusToggle = ({ active, onToggle }) => {
    const trackTone = active ? 'bg-primary-600' : 'bg-gray-300';
    const knobPosition = active ? 'translate-x-6' : 'translate-x-1';

    return (
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
                <p
                    id="doc_status_label"
                    className="text-sm font-bold text-gray-700"
                >
                    Status Data
                </p>

                <p className="mt-0.5 text-xs text-gray-400">
                    Data nonaktif tidak akan ditampilkan di website publik.
                </p>
            </div>

            <button
                type="button"
                role="switch"
                aria-checked={active}
                aria-labelledby="doc_status_label"
                onClick={onToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${trackTone}`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${knobPosition}`}
                />
            </button>
        </div>
    );
};

const ModalFooter = ({ saving, canSave, onSave, onClose }) => (
    <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
            Batal
        </button>

        <button
            onClick={onSave}
            disabled={saving || !canSave}
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
);

const DocumentFormModal = ({
    editItem,
    form,
    saveMsg,
    saving,
    parentOptions,
    onChange,
    onTypeChange,
    onSave,
    onClose,
}) => {
    const isDocument = form.type === 'document';
    const nameLabel = `Nama ${isDocument ? 'Dokumen' : 'Kategori'} *`;
    const namePlaceholder = isDocument
        ? 'Contoh: SNI ISO/IEC 17025:2017'
        : 'Contoh: Persyaratan Umum';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <ModalHeader
                    title={getModalTitle(editItem, form)}
                    subtitle={
                        editItem
                            ? 'Perbarui informasi data'
                            : 'Tambahkan kategori, subkategori, atau dokumen'
                    }
                    onClose={onClose}
                />

                <div className="p-6 space-y-4">
                    <FormMessage message={saveMsg} />

                    <Field
                        id="doc_parent_id"
                        label="Parent / Kategori"
                        hint="Pilih kategori tempat data ini akan berada."
                    >
                        <select
                            id="doc_parent_id"
                            value={form.parent_id}
                            onChange={(e) =>
                                onChange('parent_id', e.target.value)
                            }
                            className={SELECT_CLASS}
                        >
                            <option value="">
                                -- Tidak ada parent / Kategori Utama --
                            </option>

                            {parentOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field id="doc_type" label="Tipe Data *">
                        <select
                            id="doc_type"
                            value={form.type}
                            onChange={(e) => onTypeChange(e.target.value)}
                            className={SELECT_CLASS}
                        >
                            <option value="category">
                                Kategori / Subkategori
                            </option>
                            <option value="document">Dokumen</option>
                        </select>
                    </Field>

                    <Field id="doc_name" label={nameLabel}>
                        <input
                            id="doc_name"
                            type="text"
                            value={form.name}
                            onChange={(e) => onChange('name', e.target.value)}
                            placeholder={namePlaceholder}
                            className={INPUT_CLASS}
                        />
                    </Field>

                    <Field id="doc_description" label="Deskripsi">
                        <textarea
                            id="doc_description"
                            value={form.description}
                            onChange={(e) =>
                                onChange('description', e.target.value)
                            }
                            rows={3}
                            placeholder="Deskripsi singkat..."
                            className={`${INPUT_CLASS} resize-none`}
                        />
                    </Field>

                    {isDocument && (
                        <DocumentFields form={form} onChange={onChange} />
                    )}

                    <Field
                        id="doc_sort_order"
                        label="Urutan"
                        hint="Semakin kecil angka, semakin awal ditampilkan."
                    >
                        <input
                            id="doc_sort_order"
                            type="number"
                            min="0"
                            value={form.sort_order}
                            onChange={(e) =>
                                onChange('sort_order', e.target.value)
                            }
                            onWheel={(e) => e.currentTarget.blur()}
                            className={INPUT_CLASS}
                        />
                    </Field>

                    <StatusToggle
                        active={form.is_active}
                        onToggle={() => onChange('is_active', !form.is_active)}
                    />
                </div>

                <ModalFooter
                    saving={saving}
                    canSave={Boolean(form.name.trim())}
                    onSave={onSave}
                    onClose={onClose}
                />
            </div>
        </div>
    );
};

const DeleteConfirmModal = ({ item, onCancel, onConfirm }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="w-full max-w-sm p-6 text-center bg-white shadow-2xl rounded-2xl">
            <div className="flex items-center justify-center mx-auto mb-4 bg-red-100 rounded-full w-14 h-14">
                <FaTrash className="text-xl text-red-500" />
            </div>

            <h3 className="mb-2 font-black text-gray-900">Hapus Data?</h3>

            <p className="mb-6 text-sm text-gray-500">
                <span className="font-semibold text-gray-700">{item.name}</span>{' '}
                akan dihapus permanen.
            </p>

            {item.type === 'category' && (
                <p className="px-3 py-2 mb-5 text-xs rounded-lg text-amber-600 bg-amber-50">
                    Kategori yang masih memiliki isi tidak dapat dihapus.
                </p>
            )}

            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 py-2.5 text-sm font-bold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                    Batal
                </button>

                <button
                    onClick={onConfirm}
                    className="flex-1 py-2.5 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl"
                >
                    Hapus
                </button>
            </div>
        </div>
    </div>
);

/*
 * =========================================================
 * KOMPONEN UTAMA
 * =========================================================
 */

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

    // ID kategori/subkategori yang sedang dibuka
    const [expandedIds, setExpandedIds] = useState(new Set());

    const token = localStorage.getItem('token');

    const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
    };

    useEffect(() => {
        // Tandai Promise sebagai sengaja dijalankan tanpa await di dalam useEffect.
        void fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setData(await loadDocuments());
        } catch (error) {
            console.error('Fetch documents error:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    /* Semua kategori yang bisa dijadikan parent */
    const categories = useMemo(
        () => data.filter((item) => item.type === 'category'),
        [data]
    );

    const availableParents = useMemo(() => {
        if (!editItem) {
            return categories;
        }

        const excludedIds = [editItem.id, ...getDescendantIds(data, editItem.id)];

        return categories.filter(
            (category) => !excludedIds.includes(category.id)
        );
    }, [categories, editItem, data]);

    /* Opsi parent dengan indentasi sesuai level */
    const parentOptions = useMemo(
        () =>
            availableParents.map((category) => ({
                id: category.id,
                label: `${'— '.repeat(getLevel(data, category))}${category.name}`,
            })),
        [availableParents, data]
    );

    const treeData = useMemo(() => {
        const items = search.trim() ? filterItems(data, search) : [...data];

        return buildTree(items);
    }, [data, search]);

    /* Buka semua parent saat search aktif supaya hasilnya langsung terlihat */
    useEffect(() => {
        if (!search.trim()) {
            return;
        }

        const idsToExpand = collectExpandableIds(treeData);

        setExpandedIds((current) => new Set([...current, ...idsToExpand]));
    }, [search, treeData]);

    const toggleExpanded = (id) => {
        setExpandedIds((current) => withToggled(current, id));
    };

    /* ADD / EDIT */

    const openModal = (item, nextForm) => {
        setEditItem(item);
        setForm(nextForm);
        setSaveMsg(null);
        setModalOpen(true);
    };

    const openAdd = () => openModal(null, emptyForm);

    const openAddChild = (parent) => {
        openModal(null, {
            ...emptyForm,
            parent_id: String(parent.id),
            type: 'category',
        });

        // Pastikan parent terbuka setelah menambah child
        setExpandedIds((current) => withAdded(current, parent.id));
    };

    const openEdit = (item) => openModal(item, formFromItem(item));

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
            ...(type === 'category' ? documentFieldsReset : {}),
        }));
    };

    /* SAVE */

    const handleSave = async () => {
        try {
            setSaving(true);
            setSaveMsg(null);

            const url = editItem
                ? `/api/v1/admin/documents/${editItem.id}`
                : '/api/v1/admin/documents';

            const res = await fetch(url, {
                method: editItem ? 'PUT' : 'POST',
                headers,
                body: JSON.stringify(buildPayload(form)),
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
                setSaveMsg({
                    type: 'error',
                    text: extractErrorMessage(json),
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

    /* DELETE */

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
                setExpandedIds((current) => withRemoved(current, id));
            } else {
                alert(json.message || 'Gagal menghapus data.');
            }
        } catch (error) {
            console.error('Delete document error:', error);

            alert('Gagal terhubung ke server.');
        }
    };

    /* RENDER TREE */

    const renderRows = (items, level = 0) =>
        items.flatMap((item) => {
            const hasChildren = item.children?.length > 0;
            const expanded =
                item.type === 'category' && expandedIds.has(item.id);

            const row = (
                <DocumentRow
                    key={item.id}
                    item={item}
                    level={level}
                    expanded={expanded}
                    hasChildren={hasChildren}
                    onToggle={() => toggleExpanded(item.id)}
                    onAddChild={openAddChild}
                    onEdit={openEdit}
                    onDelete={setDeleteConfirm}
                />
            );

            // Anak hanya dirender kalau parent sedang dibuka
            if (!hasChildren || !expanded) {
                return [row];
            }

            return [row, ...renderRows(item.children, level + 1)];
        });

    return (
        <AdminLayout>
            <div className="space-y-6">
                <DocumentsHeader onAdd={openAdd} />

                <SearchBox value={search} onChange={setSearch} />

                <DocumentListCard
                    loading={loading}
                    treeData={treeData}
                    searching={Boolean(search)}
                    onAdd={openAdd}
                    renderRows={renderRows}
                />

                {!loading && data.length > 0 && <StructureInfo />}
            </div>

            {modalOpen && (
                <DocumentFormModal
                    editItem={editItem}
                    form={form}
                    saveMsg={saveMsg}
                    saving={saving}
                    parentOptions={parentOptions}
                    onChange={handleFormChange}
                    onTypeChange={handleTypeChange}
                    onSave={handleSave}
                    onClose={() => setModalOpen(false)}
                />
            )}

            {deleteConfirm && (
                <DeleteConfirmModal
                    item={deleteConfirm}
                    onCancel={() => setDeleteConfirm(null)}
                    onConfirm={() => handleDelete(deleteConfirm.id)}
                />
            )}
        </AdminLayout>
    );
};

export default DocumentManagement;
