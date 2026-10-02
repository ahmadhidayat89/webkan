import { useRef, useState } from 'react';
import mammoth from 'mammoth';
import { FaFileWord, FaUpload, FaToggleOn, FaToggleOff, FaTimes, FaCheckCircle } from 'react-icons/fa';
import QuillEditor from './QuillEditor';

const WordImportPanel = ({ value, onChange, onError }) => {
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importedFileName, setImportedFileName] = useState(null);
  const wordInputRef = useRef(null);

  const handleWordImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.match(/\.(docx)$/i)) {
      onError('Hanya file .docx yang didukung');
      e.target.value = '';
      return;
    }
    setImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      if (result.value) {
        onChange(result.value);
        setImportedFileName(file.name);
      } else {
        onError('Dokumen kosong atau tidak dapat dibaca.');
      }
    } catch {
      onError('Gagal mengimport dokumen. Pastikan file tidak rusak.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleClear = () => {
    setImportedFileName(null);
    onChange('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-bold text-gray-800">
          Konten Bahasa Indonesia <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImport((v) => !v)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
              showImport
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
            }`}
          >
            <FaFileWord className="text-sm" />
            Import Word
            {showImport ? <FaToggleOn className="text-base ml-0.5" /> : <FaToggleOff className="text-base ml-0.5" />}
          </button>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md font-mono">HTML</span>
        </div>
      </div>

      {/* Word Import Panel — always in DOM to keep QuillEditor position stable */}
      <div className={`mb-3 p-4 bg-blue-50 border border-blue-200 rounded-xl ${showImport ? '' : 'hidden'}`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FaFileWord className="text-blue-600 text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-blue-800 mb-0.5">Import dari Dokumen Word</p>
            {importedFileName ? (
              <>
                <p className="text-xs text-blue-600 mb-3">Dokumen berhasil diimport. Matikan toggle untuk melihat &amp; mengedit konten.</p>
                <div className="flex items-center gap-3 p-3 bg-white border border-blue-200 rounded-xl">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FaFileWord className="text-white text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{importedFileName}</p>
                    <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                      <FaCheckCircle /> Berhasil diimport
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer border border-blue-200 hover:border-blue-400 px-2.5 py-1.5 rounded-lg transition-all">
                      <FaUpload className="text-xs" /> Ganti
                      <input
                        ref={wordInputRef}
                        type="file"
                        accept=".docx"
                        onChange={handleWordImport}
                        disabled={importing}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="flex items-center justify-center w-7 h-7 text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-lg transition-all"
                      title="Hapus dokumen"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-blue-600 mb-3">Pilih file .docx — isi dokumen akan langsung tampil di editor. Konten yang sudah ada akan <strong>diganti</strong>.</p>
                <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm cursor-pointer transition-all ${
                  importing
                    ? 'bg-blue-300 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                }`}>
                  {importing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Mengimport...
                    </>
                  ) : (
                    <>
                      <FaUpload />
                      Pilih File .docx
                    </>
                  )}
                  <input
                    ref={wordInputRef}
                    type="file"
                    accept=".docx"
                    onChange={handleWordImport}
                    disabled={importing}
                    className="hidden"
                  />
                </label>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={showImport ? 'hidden' : ''}>
        <QuillEditor
          value={value}
          onChange={onChange}
          placeholder="Tulis konten bahasa Indonesia..."
        />
        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
          Mendukung tag HTML: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;a&gt;, dll.
        </p>
      </div>
    </div>
  );
};

export default WordImportPanel;
