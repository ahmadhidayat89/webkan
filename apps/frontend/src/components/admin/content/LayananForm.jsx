const LayananForm = ({ data, onChange }) => {
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

      {/* Kartu Layanan */}
      <div>
        <h4 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">Kartu Layanan</h4>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <p className="text-xs font-bold text-gray-500">Layanan {i}</p>
              <input
                type="text"
                placeholder="Judul layanan"
                value={data[`card_${i}_title`] || ''}
                onChange={e => onChange(`card_${i}_title`, e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500"
              />
              <textarea
                rows="2"
                placeholder="Deskripsi layanan"
                value={data[`card_${i}_desc`] || ''}
                onChange={e => onChange(`card_${i}_desc`, e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Proses Akreditasi */}
      <div>
        <h4 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">Proses Akreditasi</h4>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <p className="text-xs font-bold text-gray-500">Langkah {i}</p>
              <input
                type="text"
                placeholder="Judul langkah"
                value={data[`step_${i}_title`] || ''}
                onChange={e => onChange(`step_${i}_title`, e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500"
              />
              <textarea
                rows="2"
                placeholder="Deskripsi langkah"
                value={data[`step_${i}_desc`] || ''}
                onChange={e => onChange(`step_${i}_desc`, e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Manfaat Akreditasi */}
      <div>
        <h4 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">Manfaat Akreditasi</h4>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <input
              key={i}
              type="text"
              placeholder={`Manfaat ${i}`}
              value={data[`benefit_${i}`] || ''}
              onChange={e => onChange(`benefit_${i}`, e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500"
            />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div>
        <h4 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">Ajakan Bertindak (CTA)</h4>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Judul CTA"
            value={data.cta_title || ''}
            onChange={e => onChange('cta_title', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500"
          />
          <textarea
            rows="2"
            placeholder="Deskripsi CTA"
            value={data.cta_desc || ''}
            onChange={e => onChange('cta_desc', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default LayananForm;
