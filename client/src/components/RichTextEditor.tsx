import { useEffect, useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  editorId: string;
}

declare global {
  interface Window {
    tinymce: any;
  }
}

export default function RichTextEditor({ value, onChange, editorId }: RichTextEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const prevValueRef = useRef<string>(value);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js';
    script.referrerPolicy = 'origin';
    document.head.appendChild(script);

    script.onload = () => {
      if (!editorRef.current) return;

      window.tinymce.init({
        selector: `#${editorId}`,
        plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
        toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
        menubar: false,
        setup: (editor: any) => {
          editor.on('change', function () {
            onChange(editor.getContent());
          });
          
          // Set initial content when the editor is ready
          editor.on('init', function () {
            editor.setContent(value);
          });
        }
      });
    };

    return () => {
      if (window.tinymce) {
        window.tinymce.remove(`#${editorId}`);
      }
      document.head.removeChild(script);
    };
  }, [editorId]);

  // Update editor content if value prop changes externally
  useEffect(() => {
    if (value !== prevValueRef.current && window.tinymce) {
      const editor = window.tinymce.get(editorId);
      if (editor) {
        editor.setContent(value);
        prevValueRef.current = value;
      }
    }
  }, [value, editorId]);

  return (
    <textarea
      id={editorId}
      ref={editorRef}
      className="hidden"
      defaultValue={value}
    />
  );
}