import { useState, useEffect, useRef, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import {
    MessageCircle, Send, Paperclip, X, FileText,
    Download, Trash2, Shield, GraduationCap, Loader2,
} from 'lucide-react';

// ─── Format file size ─────────────────────────────────────────────────────────
function fmtSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mimeType) {
    return mimeType && mimeType.startsWith('image/');
}

// ─── File Preview Badge ───────────────────────────────────────────────────────
function FileAttachment({ msg, own }) {
    if (!msg.file_path) return null;
    const img = isImage(msg.file_type);

    return (
        <div className={`mt-2 rounded-xl overflow-hidden border ${own ? 'border-white/20' : 'border-gray-200'}`}>
            {img ? (
                <a href={msg.file_path} target="_blank" rel="noreferrer">
                    <img src={msg.file_path} alt={msg.file_name}
                        className="max-w-[220px] max-h-48 object-cover rounded-xl" />
                </a>
            ) : (
                <a href={msg.file_path} download={msg.file_name} target="_blank" rel="noreferrer"
                    className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium rounded-xl transition-colors
                        ${own ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'}`}>
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate max-w-[160px]">{msg.file_name}</span>
                    <span className="opacity-60 flex-shrink-0">{fmtSize(msg.file_size)}</span>
                    <Download className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                </a>
            )}
        </div>
    );
}

// ─── Single Bubble ────────────────────────────────────────────────────────────
function Bubble({ msg, onDelete, currentUserId, isAdmin }) {
    const own = msg.is_own;
    const senderIsAdmin = msg.user.is_admin;

    return (
        <div className={`flex gap-2.5 group ${own ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className="flex-shrink-0 mt-auto">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold
                    ${senderIsAdmin
                        ? 'bg-gradient-to-br from-gold-500 to-gold-700'
                        : 'bg-gradient-to-br from-navy-400 to-navy-600'}`}>
                    {msg.user.initial}
                </div>
            </div>

            {/* Content */}
            <div className={`max-w-[75%] ${own ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* Sender label */}
                <div className={`flex items-center gap-1.5 mb-1 text-[10px] font-semibold
                    ${own ? 'flex-row-reverse' : 'flex-row'} text-gray-500`}>
                    <span>{own ? 'Saya' : msg.user.name}</span>
                    {senderIsAdmin && (
                        <span className="flex items-center gap-0.5 text-gold-600 bg-gold-50 border border-gold-200 px-1.5 py-0.5 rounded-full text-[9px]">
                            <Shield className="w-2.5 h-2.5" /> Pengajar
                        </span>
                    )}
                </div>

                {/* Bubble */}
                <div className={`relative px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                    ${own
                        ? 'bg-navy-600 text-white rounded-br-sm'
                        : senderIsAdmin
                            ? 'bg-gradient-to-br from-gold-50 to-amber-50 border border-gold-200 text-gray-800 rounded-bl-sm'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}`}>
                    {msg.message && <p className="whitespace-pre-wrap">{msg.message}</p>}
                    <FileAttachment msg={msg} own={own} />

                    {/* Delete button */}
                    {(own || isAdmin) && (
                        <button
                            onClick={() => onDelete(msg.id)}
                            className={`absolute -top-2 ${own ? 'left-[-28px]' : 'right-[-28px]'}
                                opacity-0 group-hover:opacity-100 transition-opacity
                                w-6 h-6 rounded-full flex items-center justify-center
                                bg-red-100 hover:bg-red-200 text-red-500`}
                            title="Hapus pesan"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-gray-400 mt-1">{msg.time_ago}</span>
            </div>
        </div>
    );
}

// ─── Main Discussion Component ────────────────────────────────────────────────
export default function DiscussionPanel({ lessonId, lessonTitle }) {
    const { auth } = usePage().props;
    const currentUser = auth?.user;
    const isAdmin = currentUser?.role === 'admin';

    const [messages, setMessages]       = useState([]);
    const [loading, setLoading]         = useState(true);
    const [sending, setSending]         = useState(false);
    const [text, setText]               = useState('');
    const [file, setFile]               = useState(null);
    const [error, setError]             = useState('');
    const [open, setOpen]               = useState(false);

    const bottomRef  = useRef(null);
    const fileRef    = useRef(null);
    const textRef    = useRef(null);

    // ── Fetch messages ──
    const fetchMessages = useCallback(async () => {
        try {
            const res = await fetch(route('discussions.index', { lesson: lessonId }), {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = await res.json();
            setMessages(Array.isArray(data) ? data : []);
        } catch {
            setMessages([]);
        } finally {
            setLoading(false);
        }
    }, [lessonId]);

    useEffect(() => {
        if (open) {
            setLoading(true);
            void fetchMessages();
        }
    }, [open, fetchMessages]);

    // Auto scroll to bottom
    useEffect(() => {
        if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, open]);

    // ── Send message ──
    const handleSend = async (e) => {
        e.preventDefault();
        if ((!text.trim() && !file) || sending) return;

        setSending(true);
        setError('');

        const fd = new FormData();
        if (text.trim()) fd.append('message', text.trim());
        if (file) fd.append('file', file);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            const res = await fetch(route('discussions.store', { lesson: lessonId }), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: fd,
            });

            if (!res.ok) {
                const err = await res.json();
                setError(err.error || 'Gagal mengirim pesan.');
                return;
            }

            const newMsg = await res.json();
            setMessages(prev => [...prev, newMsg]);
            setText('');
            setFile(null);
            if (fileRef.current) fileRef.current.value = '';
        } catch {
            setError('Koneksi bermasalah, coba lagi.');
        } finally {
            setSending(false);
            textRef.current?.focus();
        }
    };

    // ── Delete message ──
    const handleDelete = async (id) => {
        if (!confirm('Hapus pesan ini?')) return;
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        await fetch(route('discussions.destroy', { lesson: lessonId, discussion: id }), {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        });
        setMessages(prev => prev.filter(m => m.id !== id));
    };

    const unread = messages.length;

    return (
        <div className="mt-8">
            {/* Toggle Button */}
            <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-2.5 px-5 py-3 bg-navy-600 hover:bg-navy-700 text-white rounded-2xl text-sm font-semibold transition-all shadow-sm w-full sm:w-auto"
            >
                <MessageCircle className="w-4 h-4" />
                Diskusi Modul
                {!open && unread > 0 && (
                    <span className="ml-auto bg-white text-navy-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unread}
                    </span>
                )}
                <span className={`ml-auto text-xs opacity-60 transition-transform ${open ? 'rotate-180' : ''}`}>▲</span>
            </button>

            {open && (
                <div className="mt-4 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">💬 Diskusi — {lessonTitle}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{messages.length} pesan · Ajukan pertanyaan atau diskusi materi</p>
                        </div>
                        <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="h-80 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50/30">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-6 h-6 text-navy-500 animate-spin" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <MessageCircle className="w-10 h-10 text-gray-200 mb-2" />
                                <p className="text-sm font-semibold text-gray-400">Belum ada diskusi</p>
                                <p className="text-xs text-gray-300 mt-0.5">Jadilah yang pertama bertanya!</p>
                            </div>
                        ) : (
                            messages.map(msg => (
                                <Bubble
                                    key={msg.id}
                                    msg={msg}
                                    onDelete={handleDelete}
                                    currentUserId={currentUser?.id}
                                    isAdmin={isAdmin}
                                />
                            ))
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* File preview */}
                    {file && (
                        <div className="flex items-center gap-2 px-5 py-2 border-t border-gray-100 bg-blue-50">
                            <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span className="text-xs text-blue-700 font-medium truncate flex-1">{file.name}</span>
                            <span className="text-xs text-blue-400">{fmtSize(file.size)}</span>
                            <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                                className="p-1 hover:bg-blue-100 rounded text-blue-400">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="px-5 py-2 bg-red-50 border-t border-red-100">
                            <p className="text-xs text-red-500">{error}</p>
                        </div>
                    )}

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="flex items-end gap-2 px-4 py-3 border-t border-gray-100 bg-white">
                        {/* File upload */}
                        <input
                            type="file"
                            ref={fileRef}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg"
                            onChange={e => setFile(e.target.files[0] || null)}
                        />
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="p-2.5 text-gray-400 hover:text-navy-600 hover:bg-navy-50 rounded-xl transition-colors flex-shrink-0"
                            title="Lampirkan file"
                        >
                            <Paperclip className="w-4 h-4" />
                        </button>

                        {/* Text input */}
                        <textarea
                            ref={textRef}
                            value={text}
                            onChange={e => setText(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(e); }
                            }}
                            placeholder={isAdmin ? 'Tulis respons sebagai Pengajar...' : 'Tulis pertanyaan atau komentar...'}
                            rows={1}
                            className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:border-navy-400 focus:ring-navy-400 bg-gray-50 max-h-28 overflow-y-auto"
                            style={{ minHeight: '42px' }}
                        />

                        {/* Send */}
                        <button
                            type="submit"
                            disabled={sending || (!text.trim() && !file)}
                            className="p-2.5 bg-navy-600 hover:bg-navy-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex-shrink-0"
                        >
                            {sending
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Send className="w-4 h-4" />}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
