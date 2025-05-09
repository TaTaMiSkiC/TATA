import { useEffect, useRef } from "react";
import "tinymce/skins/ui/oxide/skin.css";
import "tinymce/skins/ui/oxide/content.css";
import "tinymce/skins/content/default/content.css";

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
    // Učitavanje TinyMCE skripte iz lokalno instaliranog paketa
    if (!window.tinymce) {
      // Import tinymce
      import("tinymce").then(() => {
        // Import additional plugins and skins
        import("tinymce/themes/silver/theme").catch(() => {});
        import("tinymce/icons/default/icons").catch(() => {});
        import("tinymce/models/dom/model").catch(() => {});
        
        // Import plugins
        import("tinymce/plugins/advlist").catch(() => {});
        import("tinymce/plugins/autolink").catch(() => {});
        import("tinymce/plugins/lists").catch(() => {});
        import("tinymce/plugins/link").catch(() => {});
        import("tinymce/plugins/image").catch(() => {});
        import("tinymce/plugins/charmap").catch(() => {});
        import("tinymce/plugins/preview").catch(() => {});
        import("tinymce/plugins/anchor").catch(() => {});
        import("tinymce/plugins/searchreplace").catch(() => {});
        import("tinymce/plugins/visualblocks").catch(() => {});
        import("tinymce/plugins/code").catch(() => {});
        import("tinymce/plugins/fullscreen").catch(() => {});
        import("tinymce/plugins/insertdatetime").catch(() => {});
        import("tinymce/plugins/media").catch(() => {});
        import("tinymce/plugins/table").catch(() => {});
        import("tinymce/plugins/help").catch(() => {});
        import("tinymce/plugins/wordcount").catch(() => {});
        
        initEditor();
      });
    } else {
      initEditor();
    }
    
    // Funkcija za inicijalizaciju editora
    function initEditor() {
      const init = {
        selector: `#${editorId}`,
        height: 400,
        menubar: true,
        skin: 'oxide',
        // Putanja za resurse u node_modules
        base_url: '/node_modules/tinymce',
        suffix: '.min',
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