import { FaLink } from 'react-icons/fa';

export const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const txt = (v) => (v === null || v === undefined || v === '') ? '-' : v;

/* Warna pill: isi penuh, teks putih semua.
   Dibekukan seluruh RL = kuning tua, sebagian RL = kuning lebih soft. */
const STATUS_STYLE = {
    'Terakreditasi': 'bg-emerald-600',
    'Pembekuan Seluruh RL': 'bg-yellow-500',   // kuning pekat
    'Pembekuan Sebagian RL': 'bg-yellow-300',  // kuning lebih soft
    'Pembekuan': 'bg-yellow-300',
    'Dicabut': 'bg-red-600',
};

/* Status LPK -> segment tab tujuan saat pill diklik */
export const STATUS_TARGET = {
    active: 'terakreditasi',
    suspended: 'akreditasi-dibekukan',
    revoked: 'akreditasi-dicabut',
};

export const StatusPill = ({ item, onClick }) => {
    const label = item.status_label || 'Terakreditasi';
    const cls = STATUS_STYLE[label] || STATUS_STYLE['Terakreditasi'];
    const base = `inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold text-white whitespace-nowrap ${cls}`;

    if (!onClick) return <span className={base}>{label}</span>;

    return (
        <button
            type="button"
            onClick={() => onClick(item)}
            title="Lihat di tab status ini"
            className={`${base} cursor-pointer transition-opacity hover:opacity-80`}
        >
            {label}
        </button>
    );
};

/*
  opts yang dipakai:
  - hideType     : sembunyikan label tipe di bawah nama (dipakai admin)
  - showPill     : tampilkan pill Dibekukan di bawah nama (khusus tab Terakreditasi)
  - onPillClick  : fungsi yang dipanggil saat pill diklik
*/
const nameCell = (item, opts = {}) => (
    <div>
        <div className="font-bold text-gray-900">{item.name}</div>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {item.type && !opts.hideType && (
                <span className="inline-block text-[11px] bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full">
                    {item.type}
                </span>
            )}
            {opts.showPill && item.status === 'suspended' && (
                <StatusPill item={item} onClick={opts.onPillClick} />
            )}
        </div>
    </div>
);

const certCell = (item) => (
    <span className="font-mono text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
        {txt(item.certificate_number)}
    </span>
);

export const LPK_COLUMNS = {
    'semua': [
        { label: 'No. Akreditasi', render: certCell },
        { label: 'Nama LPK', render: (i, o = {}) => nameCell(i, { ...o, showPill: false }) },
        { label: 'Status', render: (i, o = {}) => <StatusPill item={i} onClick={o.onPillClick} /> },
    ],
    'terakreditasi': [
        { label: 'No. Akreditasi', render: certCell },
        { label: 'Nama LPK', render: (i, o = {}) => nameCell(i, { ...o, showPill: true }) },
        { label: 'Alamat', render: (i) => txt(i.address) },
        { label: 'Telepon / Fax', render: (i) => txt(i.phone) },
        { label: 'E-mail', render: (i) => txt(i.email) },
        { label: 'Lingkup', render: (i) => txt(i.scope) },
        { label: 'Masa Berlaku (Expired)', render: (i) => fmtDate(i.expiry_date) },
        {
            label: 'Link',
            render: (i) => i.certificate_link ? (
                <a href={i.certificate_link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-8 h-8 transition-colors rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100">
                    <FaLink className="text-xs" />
                </a>
            ) : <span className="text-xs text-gray-300">—</span>,
        },
    ],
    'akreditasi-dibekukan': [
        { label: 'No. Akreditasi', render: certCell },
        { label: 'Nama LPK', render: (i, o = {}) => nameCell(i, { ...o, showPill: false }) },
        { label: 'Status Pembekuan', render: (i) => txt(i.suspension_status) },
        { label: 'Tanggal Dibekukan', render: (i) => fmtDate(i.suspended_at) },
    ],
    'akreditasi-dicabut': [
        { label: 'No. Akreditasi', render: certCell },
        { label: 'Nama LPK', render: (i, o = {}) => nameCell(i, { ...o, showPill: false }) },
        { label: 'Tanggal Dicabut', render: (i) => fmtDate(i.revoked_at) },
    ],
};