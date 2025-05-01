'use client';

import { useEditor, EditorContent, Editor, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect, useState } from 'react';
import { DEFAULT_DOCUMENT } from '../../lib/editor/types';
import styles from './TiptapEditor.module.css';

type EditorToolbarProps = {
  editor: Editor | null;
};

const EditorToolbar = ({ editor }: EditorToolbarProps) => {
  if (!editor) {
    return (
      <div className="border border-gray-300 rounded-t-md border-b-0 bg-gray-50 p-2 flex flex-wrap gap-1">
        {/* Render disabled toolbar buttons */}
        <div className="p-1 rounded opacity-50" aria-disabled="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
            <path fill="none" d="M0 0h24v24H0z" />
            <path d="M8 11h4.5a2.5 2.5 0 1 0 0-5H8v5zm10 4.5a4.5 4.5 0 0 1-4.5 4.5H6V4h6.5a4.5 4.5 0 0 1 3.256 7.606A4.498 4.498 0 0 1 18 15.5zM8 13v5h5.5a2.5 2.5 0 1 0 0-5H8z" />
          </svg>
        </div>
        {/* More placeholder buttons can go here */}
      </div>
    );
  }

  // Existing toolbar implementation
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
      {/* Keep existing buttons */}
    </div>
  );
};

type TiptapEditorProps = {
  value: string | JSONContent;
  onChange: (value: string) => void;
};

export const TiptapEditor = ({ value, onChange }: TiptapEditorProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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
    immediatelyRender: true,
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
    onCreate: () => {
      // Mark editor as initialized to remove loading state
      setIsInitialized(true);
    }
  });

  // Client-side only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value && isInitialized) {
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
  }, [editor, value, isInitialized]);

  if (!isMounted) {
    // Render a skeleton UI with consistent dimensions during SSR and early CSR
    return (
      <div className="h-full flex flex-col">
        <div className="border border-gray-300 rounded-t-md border-b-0 bg-gray-50 p-2 flex flex-wrap gap-1">
          {/* Skeleton toolbar */}
          <div className="w-6 h-6 bg-gray-200 rounded"></div>
          <div className="w-6 h-6 bg-gray-200 rounded"></div>
          <div className="w-6 h-6 bg-gray-200 rounded"></div>
          <div className="w-6 h-6 bg-gray-200 rounded"></div>
        </div>
        <div className={styles.editorSkeleton}>
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <EditorToolbar editor={editor} />
      <div className="border border-gray-300 rounded-b-md overflow-hidden flex-grow h-full">
        <EditorContent 
          editor={editor} 
          className={`w-full h-full ${styles.editorContentWrapper}`} 
        />
      </div>
    </div>
  );
};