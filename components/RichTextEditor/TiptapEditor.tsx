'use client';

import { useEditor, EditorContent, Editor, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect, useState } from 'react';
import { DEFAULT_DOCUMENT } from '../../lib/editor/types';

// Custom styles for the editor
const editorStyles = `
  .tiptap {
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0 0 0.375rem 0.375rem;
    min-height: 100%;
    outline: none;
    height: 100%;
    overflow-y: auto;
  }
  
  .tiptap:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }
  
  .tiptap p {
    margin-bottom: 1em;
  }
  
  .tiptap h1 {
    font-size: 1.75rem;
    font-weight: bold;
    margin-bottom: 0.75em;
  }
  
  .tiptap h2 {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 0.75em;
  }
  
  .tiptap h3 {
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 0.5em;
  }
  
  .tiptap ul, .tiptap ol {
    margin-left: 1.5em;
    margin-bottom: 1em;
  }
  
  .tiptap ul li {
    list-style-type: disc;
  }
  
  .tiptap ol li {
    list-style-type: decimal;
  }
  
  .tiptap blockquote {
    border-left: 3px solid #e5e7eb;
    padding-left: 1em;
    font-style: italic;
    margin-left: 0;
    margin-right: 0;
    margin-bottom: 1em;
  }
  
  .tiptap code {
    background-color: #f3f4f6;
    padding: 0.2em 0.4em;
    border-radius: 0.25em;
    font-family: monospace;
  }
  
  .tiptap pre {
    background-color: #f3f4f6;
    padding: 0.75em 1em;
    border-radius: 0.375rem;
    font-family: monospace;
    margin-bottom: 1em;
    overflow-x: auto;
  }
  
  /* Make editor content container fill available height */
  .editor-content-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .editor-content-wrapper .ProseMirror {
    flex-grow: 1;
    height: 100%;
    overflow-y: auto;
  }
`;

type EditorToolbarProps = {
  editor: Editor | null;
};

const EditorToolbar = ({ editor }: EditorToolbarProps) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 rounded-t-md border-b-0 bg-gray-50 p-2 flex flex-wrap gap-1">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1 rounded ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
        title="Bold"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path fill="none" d="M0 0h24v24H0z" />
          <path d="M8 11h4.5a2.5 2.5 0 1 0 0-5H8v5zm10 4.5a4.5 4.5 0 0 1-4.5 4.5H6V4h6.5a4.5 4.5 0 0 1 3.256 7.606A4.498 4.498 0 0 1 18 15.5zM8 13v5h5.5a2.5 2.5 0 1 0 0-5H8z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1 rounded ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
        title="Italic"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path fill="none" d="M0 0h24v24H0z" />
          <path d="M15 20H7v-2h2.927l2.116-12H9V4h8v2h-2.927l-2.116 12H15z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
        title="Heading 1"
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
        title="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-1 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}
        title="Heading 3"
      >
        H3
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
        title="Bullet List"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path fill="none" d="M0 0h24v24H0z" />
          <path d="M8 4h13v2H8V4zM4.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 6.9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM8 11h13v2H8v-2zm0 7h13v2H8v-2z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1 rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
        title="Ordered List"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path fill="none" d="M0 0h24v24H0z" />
          <path d="M8 4h13v2H8V4zM5 3v3h1v1H3V6h1V4H3V3h2zm-2 9v-1h3v4H3v-1h2v-.5H4v-1h1V12H3zm2 5.5H4V16H3v-1h3v1H5v.5zM8 11h13v2H8v-2zm0 7h13v2H8v-2z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1 rounded ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
        title="Blockquote"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path fill="none" d="M0 0h24v24H0z" />
          <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804 .167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804 .167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="p-1 rounded"
        title="Horizontal Line"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path fill="none" d="M0 0h24v24H0z" />
          <path d="M2 11h2v2H2v-2zm4 0h12v2H6v-2zm14 0h2v2h-2v-2z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => {
          const url = window.prompt('Enter URL:');
          if (url) {
            // Ensure URL has protocol
            const safeUrl = url.startsWith('http') ? url : `https://${url}`;
            editor.chain().focus().setLink({ href: safeUrl }).run();
          }
        }}
        className={`p-1 rounded ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
        title="Add Link"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path fill="none" d="M0 0h24v24H0z" />
          <path d="M18.364 15.536L16.95 14.12l1.414-1.414a5 5 0 1 0-7.071-7.071L9.879 7.05 8.464 5.636 9.88 4.222a7 7 0 0 1 9.9 9.9l-1.415 1.414zm-2.828 2.828l-1.415 1.414a7 7 0 0 1-9.9-9.9l1.415-1.414L7.05 9.88l-1.414 1.414a5 5 0 1 0 7.071 7.071l1.414-1.414 1.415 1.414zm-.708-10.607l1.415 1.415-7.071 7.07-1.415-1.414 7.071-7.07z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1 rounded"
        title="Undo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path fill="none" d="M0 0h24v24H0z" />
          <path d="M5.828 7l2.536 2.536L6.95 10.95 2 6l4.95-4.95 1.414 1.414L5.828 5H13a8 8 0 1 1 0 16H4v-2h9a6 6 0 1 0 0-12H5.828z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1 rounded"
        title="Redo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path fill="none" d="M0 0h24v24H0z" />
          <path d="M18.172 7H11a6 6 0 1 0 0 12h9v2h-9a8 8 0 1 1 0-16h7.172l-2.536-2.536L17.05 1.05 22 6l-4.95 4.95-1.414-1.414L18.172 7z" />
        </svg>
      </button>
    </div>
  );
};

type TiptapEditorProps = {
  value: string | JSONContent;
  onChange: (value: string) => void;
};

export const TiptapEditor = ({ value, onChange }: TiptapEditorProps) => {
  const [isMounted, setIsMounted] = useState(false);

  // Parse JSON content, with fallback to default document
  const getInitialContent = (): JSONContent => {
    if (!value) {
      return DEFAULT_DOCUMENT;
    }

    try {
      // If value is already an object, return it directly
      if (typeof value === 'object') {
        return value;
      }
      // Otherwise parse it as JSON
      return JSON.parse(value);
    } catch (e) {
      console.warn('Invalid JSON content, using default document', e);
      return DEFAULT_DOCUMENT;
    }
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        validate: (url) => {
          try {
            const parsedUrl = new URL(url);
            return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
          } catch {
            return false;
          }
        },
      }),
    ],
    content: getInitialContent(),
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange(JSON.stringify(json));
    },
  });

  // Client-side only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value) {
      try {
        // Store current selection before updating content
        const { from, to } = editor.state.selection;

        // If value is already an object, use it directly
        const parsedContent = typeof value === 'object' ? value : JSON.parse(value);
        
        // Only update content if it actually changed
        const currentContent = JSON.stringify(editor.getJSON());
        const newContent = JSON.stringify(parsedContent);
        
        if (currentContent !== newContent) {
          // Update content without resetting selection
          editor.commands.setContent(parsedContent, false);

          // Restore cursor position if it was previously set
          if (from !== undefined && to !== undefined) {
            editor.commands.setTextSelection({ from, to });
          }
        }
      } catch {
        console.warn('Failed to update editor with new content');
        editor.commands.setContent(DEFAULT_DOCUMENT, false);
      }
    }
  }, [editor, value]);

  if (!isMounted) {
    return (
      <div className="border border-gray-300 rounded-md p-4 h-full">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <style jsx global>{editorStyles}</style>
      <EditorToolbar editor={editor} />
      <div className="border border-gray-300 rounded-b-md overflow-hidden flex-grow h-full">
        <EditorContent editor={editor} className="w-full h-full editor-content-wrapper" />
      </div>
    </div>
  );
};