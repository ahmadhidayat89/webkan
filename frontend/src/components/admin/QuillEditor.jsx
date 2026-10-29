import { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const BUTTONS = [
  { key: 'bold', label: 'B', title: 'Tebal', className: 'font-black' },
  { key: 'italic', label: 'I', title: 'Miring', className: 'italic' },
  { key: 'underline', label: 'U', title: 'Garis bawah', className: 'underline' },
  { key: 'ordered', label: '1.', title: 'Daftar angka' },
  { key: 'bullet', label: '•', title: 'Daftar poin' },
  { key: 'align-left', label: '⇤', title: 'Rata kiri' },
  { key: 'align-center', label: '↔', title: 'Rata tengah' },
  { key: 'align-right', label: '⇥', title: 'Rata kanan' },
  { key: 'align-justify', label: '☰', title: 'Rata kiri-kanan' },
  { key: 'link', label: 'Link', title: 'Tautan' },
  { key: 'clean', label: 'Tx', title: 'Hapus format' },
];

const applyLinkFormat = (quill, range, current) => {
  if (current.link) {
    quill.format('link', false);
    return;
  }
  const url = window.prompt('Masukkan URL (contoh: https://example.com)');
  if (!url) return;
  if (range.length === 0) quill.insertText(range.index, url, 'link', url);
  else quill.format('link', url);
};

const clearFormat = (quill, range) => {
  if (range.length > 0) {
    quill.removeFormat(range.index, range.length);
    return;
  }
  ['bold', 'italic', 'underline', 'link'].forEach((format) => quill.format(format, false));
};

const applyFormatAction = (quill, range, current, key) => {
  if (['bold', 'italic', 'underline'].includes(key)) {
    quill.format(key, !current[key]);
  } else if (key === 'ordered' || key === 'bullet') {
    const list = key === 'ordered' ? 'ordered' : 'bullet';
    quill.format('list', current.list === list ? false : list);
  } else if (key.startsWith('align-')) {
    const align = key.replace('align-', '');
    // Quill: rata kiri = default (false), lainnya = 'center' | 'right' | 'justify'
    quill.format('align', align === 'left' || current.align === align ? false : align);
  } else if (key === 'link') {
    applyLinkFormat(quill, range, current);
  } else if (key === 'clean') {
    clearFormat(quill, range);
  }
};

const QuillEditor = ({ value, onChange, placeholder }) => {
  const wrapperRef = useRef(null);
  const quillRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const lastHtmlRef = useRef(value || '');
  const [formats, setFormats] = useState({});

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Inisialisasi Quill (aman untuk React StrictMode)
  useEffect(() => {
    const wrapper = wrapperRef.current;

    if (!wrapper) {
      return;
    }

    const container = document.createElement('div');
    container.className = 'min-h-[180px] text-sm';
    wrapper.appendChild(container);

    const quill = new Quill(container, {
      theme: 'snow',
      placeholder,
      modules: { toolbar: false },
    });

    quillRef.current = quill;

    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value, 'silent');
      lastHtmlRef.current = quill.root.innerHTML;
    }

    const refreshFormats = () => {
      const range = quill.getSelection();
      setFormats(range ? quill.getFormat(range) : {});
    };

    const handleTextChange = () => {
      const html = quill.root.innerHTML;
      lastHtmlRef.current = html;
      onChangeRef.current(html);
      refreshFormats();
    };

    quill.on('text-change', handleTextChange);
    quill.on('selection-change', refreshFormats);

    return () => {
      quill.off('text-change', handleTextChange);
      quill.off('selection-change', refreshFormats);
      quillRef.current = null;
      wrapper.innerHTML = '';
    };
  }, []);

  // Sinkronisasi value dari luar (mis. saat edit data)
  useEffect(() => {
    const quill = quillRef.current;

    if (!quill || value === lastHtmlRef.current) {
      return;
    }

    lastHtmlRef.current = value || '';
    quill.clipboard.dangerouslyPasteHTML(value || '', 'silent');
  }, [value]);

  const applyFormat = (key) => {
    const quill = quillRef.current;
    if (!quill) return;
    quill.focus();
    const range = quill.getSelection(true);
    const current = quill.getFormat(range);
    applyFormatAction(quill, range, current, key);
    setFormats(quill.getFormat(quill.getSelection() || range));
  };

  const isActive = (key) => {
    if (key === 'ordered') return formats.list === 'ordered';
    if (key === 'bullet') return formats.list === 'bullet';
    if (key.startsWith('align-')) {
      const align = key.replace('align-', '');
      return align === 'left' ? !formats.align : formats.align === align;
    }
    return Boolean(formats[key]);
  };

  return (
    <div className="overflow-hidden bg-white border border-blue-200 rounded-xl">
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50">
        {BUTTONS.map((btn) => (
          <button
            key={btn.key}
            type="button"
            title={btn.title}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyFormat(btn.key)}
            className={`min-w-[32px] rounded-md px-2 py-1 text-xs transition-colors ${btn.className || 'font-bold'
              } ${isActive(btn.key)
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
              }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div ref={wrapperRef} />
    </div>
  );
};

export default QuillEditor;
