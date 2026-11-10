export default function ExamTypeSelect({ value, onChange, id = 'exam_type' }) {
    return (
        <div>
            <label htmlFor={id} className="block mb-1 text-xs font-bold text-gray-600 uppercase">Tipe Ujian</label>
            <select
                id={id}
                value={value}
                onChange={event => onChange(event.target.value)}
                aria-describedby={`${id}_help`}
                className="w-full py-2 text-sm border-gray-300 rounded-lg"
            >
                <option value="close_book">Close Book</option>
                <option value="open_book">Open Book</option>
            </select>
            <p id={`${id}_help`} className="mt-1 text-xs font-normal text-gray-500">
                {value === 'open_book'
                    ? 'Boleh membuka referensi dan berpindah tab tanpa wajib layar penuh.'
                    : 'Wajib layar penuh. Keluar layar penuh atau berpindah tab dihitung sebagai pelanggaran; 3 pelanggaran mengirim jawaban otomatis.'}
            </p>
        </div>
    );
}
