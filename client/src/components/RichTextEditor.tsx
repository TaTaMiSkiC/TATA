import { useEffect, useRef } from "react";

declare global {
  interface Window {
    tinymce: any;
  }
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  editorId: string;
}

export default function RichTextEditor({ value, onChange, editorId }: RichTextEditorProps) {
  const editorRef = useRef<any>(null);
  
  useEffect(() => {
    // Učitavanje TinyMCE skripte ako još nije učitana
    if (!window.tinymce) {
      const script = document.createElement("script");
      script.src = "https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js";
      script.referrerPolicy = "origin";
      document.head.appendChild(script);
      
      script.onload = initEditor;
      return () => {
        document.head.removeChild(script);
      };
    } else {
      initEditor();
    }
    
    // Funkcija za inicijalizaciju editora
    function initEditor() {
      const init = {
        selector: `#${editorId}`,
        height: 400,
        menubar: true,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | bold italic forecolor | ' +
          'alignleft aligncenter alignright alignjustify | ' +
          'bullist numlist outdent indent | removeformat | help',
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
        setup: (editor: any) => {
          editorRef.current = editor;
          
          // Postavlja inicijalni sadržaj
          editor.on('init', () => {
            editor.setContent(value || '');
          });
          
          // Ažurira sadržaj prilikom promjene
          editor.on('change', () => {
            onChange(editor.getContent());
          });
        }
      };
      
      window.tinymce.init(init);
    }
    
    // Čišćenje prilikom uništavanja komponente
    return () => {
      if (window.tinymce && editorRef.current) {
        window.tinymce.remove(editorRef.current);
      }
    };
  }, [editorId]); // Ne dodajemo value i onChange u dependency array da bismo izbjegli re-inicijalizaciju
  
  // Ručno ažuriramo sadržaj editora kada se promijeni props.value
  useEffect(() => {
    if (editorRef.current && editorRef.current.initialized) {
      const currentContent = editorRef.current.getContent();
      if (currentContent !== value) {
        editorRef.current.setContent(value || '');
      }
    }
  }, [value]);
  
  return (
    <div className="rich-text-editor">
      <textarea
        id={editorId}
        className="hidden"
        defaultValue={value}
      />
    </div>
  );
}