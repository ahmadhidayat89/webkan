import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { PackagePlus, X } from 'lucide-react';
import Modal from '@/Components/Modal';

export default function SaveQuizPackage({ quiz }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ title: quiz.title || 'Paket kuis', description: '' });
    function submit(event) {
        event.preventDefault();
        form.post(route('admin.question-bank.packages.store', quiz.id), { preserveScroll: true, onSuccess: () => setOpen(false) });
    }
    return <>
        <button type="button" disabled={!quiz.questions.length} onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 text-xs btn-gold disabled:opacity-50"><PackagePlus className="w-4 h-4" /> Simpan Paket Kuis</button>
        {form.recentlySuccessful && <output className="block w-full text-xs text-green-700">Paket kuis lengkap tersimpan dan bisa diimpor ke modul lain.</output>}
        <Modal show={open} onClose={() => setOpen(false)} maxWidth="lg">
            <form onSubmit={submit}>
                <div className="flex items-center justify-between p-5 border-b border-gray-100"><h2 className="font-bold text-navy-900">Simpan paket kuis ke bank</h2><button type="button" onClick={() => setOpen(false)} aria-label="Tutup simpan paket" className="text-gray-400"><X className="w-5 h-5" /></button></div>
                <div className="p-5 space-y-4">
                    <p className="text-sm text-gray-500">Simpan seluruh pertanyaan, pilihan jawaban, kunci, gambar, pengaturan penilaian, dan kelompok acak sebagai satu paket.</p>
                    <label className="block space-y-1 text-xs font-semibold text-gray-600">Nama paket kuis<input required maxLength={255} value={form.data.title} onChange={event => form.setData('title', event.target.value)} className="w-full text-sm border-gray-200 rounded-lg" /></label>
                    <label className="block space-y-1 text-xs font-semibold text-gray-600">Deskripsi paket (opsional)<textarea rows="3" maxLength={2000} value={form.data.description} onChange={event => form.setData('description', event.target.value)} className="w-full text-sm border-gray-200 rounded-lg" /></label>
                    <p className="p-3 text-xs rounded-lg bg-navy-50 text-navy-700">Jawaban dan nilai peserta tidak disertakan. Jadwal kuis akan diatur kembali pada modul tujuan.</p>
                    {!!Object.keys(form.errors).length && <p role="alert" className="text-sm text-red-600">{Object.values(form.errors).join(' ')}</p>}
                </div>
                <div className="flex justify-end gap-2 p-5 border-t border-gray-100"><button type="button" onClick={() => setOpen(false)} className="text-sm btn-secondary">Batal</button><button disabled={form.processing} className="text-sm btn-gold disabled:opacity-50">{form.processing ? 'Menyimpan…' : 'Simpan paket'}</button></div>
            </form>
        </Modal>
    </>;
}
