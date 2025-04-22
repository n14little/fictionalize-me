'use client';

import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';

type RichTextContentProps = {
  content: object | string;
};

export const RichTextContent = ({ content }: RichTextContentProps) => {
  const [isMounted, setIsMounted] = useState(false);
  
  // Default document structure
  const defaultDocument = {
    type: 'doc',
    content: [{ type: 'paragraph' }]
  };
  
  // Process content based on its type
  const getContent = () => {
    if (!content) {
      return defaultDocument;
    }

    // If it's already an object (from JSONB column), use directly
    if (typeof content === 'object') {
      return content;
    }
    
    // Parse string content to JSON
    try {
      return JSON.parse(content as string);
    } catch (e) {
      console.warn('Invalid content format, showing default document');
      return defaultDocument;
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
        } catch (e) {
          editor.commands.setContent(defaultDocument, false);
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