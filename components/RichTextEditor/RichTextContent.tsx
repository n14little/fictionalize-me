'use client';

import { useEffect, useState } from 'react';
import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { DEFAULT_DOCUMENT } from '../../lib/editor/types';

type RichTextContentProps = {
  content: JSONContent | string;
};

export const RichTextContent = ({ content }: RichTextContentProps) => {
  const [isMounted, setIsMounted] = useState(false);
  
  // Process content based on its type
  const getContent = (): JSONContent => {
    if (!content) {
      return DEFAULT_DOCUMENT;
    }

    // If it's already an object (from JSONB column), use directly
    if (typeof content === 'object') {
      return content;
    }
    
    // Parse string content to JSON
    try {
      return JSON.parse(content as string);
    } catch {
      console.warn('Invalid content format, showing default document');
      return DEFAULT_DOCUMENT;
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
      }),
    ],
    content: getContent(),
    editable: false,
  });

  // Make sure we're running on the client side before rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // When the content prop changes
  useEffect(() => {
    if (editor && content) {
      if (typeof content === 'object') {
        editor.commands.setContent(content, false);
      } else {
        try {
          const jsonContent = JSON.parse(content as string);
          editor.commands.setContent(jsonContent, false);
        } catch {
          editor.commands.setContent(DEFAULT_DOCUMENT, false);
        }
      }
    }
  }, [editor, content]);

  if (!isMounted) {
    return (
      <div className="min-h-[32px]">
        Loading content...
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none">
      <EditorContent editor={editor} />
    </div>
  );
};