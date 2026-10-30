import { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import './RichTextInput.css';

export default function RichTextInput({
  value,
  onChange,
  placeholder = 'Tulis pertanyaan',
  autoFocus = false,
}) {
  const wrapRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const wrap = wrapRef.current;
    const host = document.createElement('div');
    wrap.appendChild(host);

    const quill = new Quill(host, {
      theme: 'snow',
      placeholder,
      formats: ['bold', 'italic', 'underline', 'link', 'list'],
      modules: {
        toolbar: [['bold', 'italic', 'underline', 'link'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean']],
      },
    });
    quill.root.setAttribute('role', 'textbox');
    quill.root.setAttribute('aria-label', placeholder);
    quill.root.setAttribute('aria-multiline', 'true');

    if (value) {
      const decoder = document.createElement('textarea');
      decoder.innerHTML = value;
      quill.clipboard.dangerouslyPasteHTML(decoder.value);
    }
    if (autoFocus) quill.focus();

    quill.on('text-change', (_delta, _old, source) => {
      if (source !== 'user') return;
      const html = quill.root.innerHTML;
      onChangeRef.current(html === '<p><br></p>' ? '' : html);
    });

    // Bersihkan saat unmount (mencegah toolbar dobel di React StrictMode)
    return () => {
      wrap.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={wrapRef} className="rt-input" />;
}
