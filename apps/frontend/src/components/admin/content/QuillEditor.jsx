import { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const quillModules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'link'],
    ['clean'],
  ],
};

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'blockquote', 'link',
];

const QuillEditor = ({ value, onChange, placeholder }) => {
  const wrapperRef = useRef(null);
  const quillRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!wrapperRef.current || quillRef.current) return;

    const wrapper = wrapperRef.current;
    wrapper.innerHTML = '';
    const editorElement = document.createElement('div');
    wrapper.appendChild(editorElement);

    const quill = new Quill(editorElement, {
      theme: 'snow',
      placeholder,
      modules: quillModules,
      formats: quillFormats,
    });

    quillRef.current = quill;
    quill.on('text-change', () => {
      onChangeRef.current(quill.root.innerHTML);
    });

    return () => {
      wrapper.innerHTML = '';
      quillRef.current = null;
    };
  }, [placeholder]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const nextValue = value || '';
    const currentValue = quill.root.innerHTML;
    if (currentValue === nextValue || (currentValue === '<p><br></p>' && nextValue === '')) return;

    if (!nextValue) {
      quill.setText('', 'silent');
      return;
    }

    quill.clipboard.dangerouslyPasteHTML(nextValue, 'silent');
  }, [value]);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white [&_.ql-editor]:min-h-[320px] [&_.ql-editor]:text-sm">
      <div ref={wrapperRef} />
    </div>
  );
};

export default QuillEditor;
