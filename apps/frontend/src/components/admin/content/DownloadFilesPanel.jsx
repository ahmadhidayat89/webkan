import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaDownload, FaFileAlt, FaUpload, FaPencilAlt, FaTrash } from 'react-icons/fa';
import { useConfirm } from '../../../hooks/useConfirm';
import api from '../../../services/api';

const DownloadFilesPanel = ({ pageId, files, onFilesChange }) => {
  const [fileTitle, setFileTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [renameId, setRenameId] = useState(null);
  const [renameTitle, setRenameTitle] = useState('');
  const fileInputRef = useRef(null);
  const { confirm, ConfirmDialog } = useConfirm();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!fileTitle.trim()) {
      toast.error('Isi judul file terlebih dahulu');
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('page_id', pageId);
      fd.append('title', fileTitle.trim());
      fd.append('file', file);
      const res = await api.post('/admin/download-files', fd);
      if (res.data.success) {
        setFileTitle('');
        onFilesChange();
        toast.success('File berhasil diupload');
      } else {
        toast.error(res.data.message || 'Gagal mengupload file');
      }
    } catch {
      toast.error('Terjadi kesalahan saat upload');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirm('Hapus file ini? Tindakan ini tidak dapat dibatalkan.'))) return;
    try {
      const res = await api.delete(`/admin/download-files/${id}`);
      if (res.data.success) {
        onFilesChange();
        toast.success('File berhasil dihapus');
      }
    } catch {
      toast.error('Gagal menghapus file');
    }
  };

  const handleRenameSubmit = async (id) => {
    if (!renameTitle.trim()) return;
    try {
      const res = await api.patch(`/admin/download-files/${id}/rename`, { title: renameTitle.trim() });
      if (res.data.success) {
        setRenameId(null);
        onFilesChange();
        toast.success('Nama file diperbarui');
      }
    } catch {
      toast.error('Gagal mengganti nama');
    }
  };

  return (
    <>
    <ConfirmDialog />
    <div className="pt-6 border-t-2 border-dashed border-rose-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
          <FaDownload className="text-rose-600 text-sm" />
        </div>
        <div>
          <h4 className="text-sm font-black text-gray-800">File yang Dapat Diunduh</h4>
          <p className="text-xs text-gray-400">File yang ditampilkan di halaman publik sebagai daftar unduhan</p>
        </div>
      </div>

      {/* Upload baru */}
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl mb-4">
        <p className="text-xs font-bold text-rose-700 mb-2">Tambah File Baru</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={fileTitle}
            onChange={e => setFileTitle(e.target.value)}
            placeholder="Judul file (misal: Pedoman Akreditasi 2024)"
            className="flex-1 text-sm px-3 py-2 border border-rose-200 rounded-lg focus:outline-none focus:border-rose-400 bg-white"
          />
          <label className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-sm cursor-pointer transition-all whitespace-nowrap ${
            uploading
              ? 'bg-rose-300 text-white cursor-not-allowed'
              : 'bg-rose-600 text-white hover:bg-rose-700'
          }`}>
            {uploading
              ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Mengupload...</>
              : <><FaUpload className="text-xs" /> Pilih File</>
            }
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-xs text-rose-400 mt-1.5">Format: PDF, Word, Excel, PowerPoint, ZIP — Maks. 20MB</p>
      </div>

      {/* Daftar file */}
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-gray-200 rounded-xl">
          <FaFileAlt className="text-gray-300 text-2xl mb-2" />
          <p className="text-sm text-gray-400 font-semibold">Belum ada file</p>
          <p className="text-xs text-gray-300">Upload file di atas untuk mulai menambahkan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl group hover:border-gray-300 transition-all">
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-black text-gray-500 uppercase">{f.file_ext || '?'}</span>
              </div>
              <div className="flex-1 min-w-0">
                {renameId === f.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={renameTitle}
                      onChange={e => setRenameTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(f.id); if (e.key === 'Escape') setRenameId(null); }}
                      autoFocus
                      className="flex-1 text-sm px-2 py-1 border border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <button onClick={() => handleRenameSubmit(f.id)} className="text-xs font-bold text-blue-600 hover:text-blue-700 px-2 py-1 bg-blue-50 rounded-lg">Simpan</button>
                    <button onClick={() => setRenameId(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 bg-gray-50 rounded-lg">Batal</button>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-gray-800 truncate">{f.title}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {f.file_size ? `${(f.file_size / 1024).toFixed(0)} KB` : '—'}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { setRenameId(f.id); setRenameTitle(f.title); }}
                  className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Ganti nama"
                >
                  <FaPencilAlt className="text-xs" />
                </button>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Hapus file"
                >
                  <FaTrash className="text-xs" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
};

export default DownloadFilesPanel;
