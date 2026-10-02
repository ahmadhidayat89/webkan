import { FaTimes } from 'react-icons/fa';

const TentangKanForm = ({ data, onChange, onArrayChange, onAddItem, onRemoveItem }) => {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div>
        <h4 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">Deskripsi Hero</h4>
        <textarea
          rows="2"
          value={data.hero_desc || ''}
          onChange={e => onChange('hero_desc', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 resize-none"
        />
      </div>

      {/* Statistik */}
      <div>
        <h4 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">Statistik</h4>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <p className="text-xs font-bold text-gray-500">Statistik {i}</p>
              <input
                type="text"
                placeholder="Angka (cth: 1997)"
                value={data[`stat_${i}_value`] || ''}
                onChange={e => onChange(`stat_${i}_value`, e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Label (cth: Tahun Berdiri)"
                value={data[`stat_${i}_label`] || ''}
                onChange={e => onChange(`stat_${i}_label`, e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Visi */}
      <div>
        <h4 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">Visi</h4>
        <textarea
          rows="3"
          value={data.vision || ''}
          onChange={e => onChange('vision', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 resize-none"
        />
      </div>

      {/* Misi */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
          <h4 className="text-sm font-black text-gray-700 uppercase tracking-wider">Misi</h4>
          <button
            type="button"
            onClick={() => onAddItem('missions', '')}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
          >
            + Tambah Misi
          </button>
        </div>
        <div className="space-y-3">
          {(data.missions || []).map((m, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full text-xs font-black flex items-center justify-center mt-2">{i + 1}</span>
              <textarea
                rows="2"
                value={m}
                onChange={e => onArrayChange('missions', i, null, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 resize-none"
              />
              <button
                type="button"
                onClick={() => onRemoveItem('missions', i)}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all mt-1.5"
                title="Hapus"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
          ))}
          {(data.missions || []).length === 0 && (
            <p className="text-sm text-gray-400 italic">Belum ada misi. Klik "+ Tambah Misi" untuk menambahkan.</p>
          )}
        </div>
      </div>

      {/* Nilai-Nilai */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
          <h4 className="text-sm font-black text-gray-700 uppercase tracking-wider">Nilai-Nilai KAN</h4>
          <button
            type="button"
            onClick={() => onAddItem('values', { label: '', desc: '' })}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
          >
            + Tambah Nilai
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {(data.values || []).map((v, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 relative">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500">Nilai {i + 1}</p>
                <button
                  type="button"
                  onClick={() => onRemoveItem('values', i)}
                  className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Hapus"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Judul nilai"
                value={v.label || ''}
                onChange={e => onArrayChange('values', i, 'label', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500"
              />
              <textarea
                rows="2"
                placeholder="Deskripsi nilai"
                value={v.desc || ''}
                onChange={e => onArrayChange('values', i, 'desc', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          ))}
          {(data.values || []).length === 0 && (
            <p className="text-sm text-gray-400 italic col-span-2">Belum ada nilai. Klik "+ Tambah Nilai" untuk menambahkan.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TentangKanForm;
