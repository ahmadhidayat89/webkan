import { useForm } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import Modal from '@/Components/Modal';
import DangerButton from '@/Components/DangerButton';

export default function DeletePackage({ item, onClose }) {
    const form = useForm({ revision: item.revision });
    function submit(event) {
        event.preventDefault();
        form.delete(route('admin.question-bank.packages.destroy', item.id), {
            preserveScroll: true, onSuccess: onClose,
        });
    }
    return <Modal show maxWidth="lg" closeable={!form.processing} onClose={onClose}>
        <form onSubmit={submit} className="p-6 space-y-5">
            <div className="flex items-center gap-3"><div className="p-3 text-red-600 rounded-full bg-red-50"><AlertTriangle className="w-5 h-5" /></div><h2 className="text-lg font-bold text-navy-900">Hapus Paket Permanen?</h2></div>
            <p className="text-sm leading-relaxed text-gray-600">Paket <strong className="break-words text-navy-900">{item.title}</strong> beserta {item.questions_count} pertanyaan di dalamnya akan dihapus dari Bank Soal. Tindakan ini tidak dapat dibatalkan.</p>
            <p className="p-3 text-sm rounded-lg bg-navy-50 text-navy-700">Kuis yang sudah dibuat dari paket ini, termasuk jawaban dan nilai peserta, tetap tersedia.</p>
            {Object.values(form.errors).length > 0 && <p role="alert" className="p-3 text-sm text-red-700 rounded-lg bg-red-50">{Object.values(form.errors).join(' ')}</p>}
            <div className="flex justify-end gap-3"><button type="button" disabled={form.processing} className="text-sm btn-secondary" onClick={onClose}>Batal</button><DangerButton type="submit" disabled={form.processing}>{form.processing ? 'Menghapus…' : 'Hapus Permanen'}</DangerButton></div>
        </form>
    </Modal>;
}
