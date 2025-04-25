'use client';

import { useEffect, useState } from 'react';
import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { DEFAULT_DOCUMENT } from '../../lib/editor/types';

// Shared styles to ensure consistency between edit and view modes
const editorStyles = `
  .tiptap {
    padding: 1rem;
    min-height: 2rem;
    outline: none;
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
  
  .tiptap a {
    color: #3b82f6;
    text-decoration: underline;
  }
`;

type RichTextContentProps = {
  content: JSONContent | string;
  className?: string;
};

export const RichTextContent = ({ content, className = '' }: RichTextContentProps) => {
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
    } catch (e) {
      console.warn('Invalid content format, showing default document', e);
      return DEFAULT_DOCUMENT;
    }
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Configure all StarterKit extensions to ensure proper rendering
        heading: {
          levels: [1, 2, 3]
        },
        blockquote: true,
        boldMark: true,
        italicMark: true,
        bulletList: true,
        orderedList: true,
        code: true,
        codeBlock: true,
        horizontalRule: true
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank'
        }
      })
    ],
    content: getContent(),
    editable: false, // Read-only mode
  });

  // Make sure we're running on the client side before rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // When the content prop changes
  useEffect(() => {
    if (editor && content) {
      try {
        const jsonContent = typeof content === 'object' ? content : JSON.parse(content as string);
        
        // Check if content has changed to avoid unnecessary re-renders
        const currentContent = JSON.stringify(editor.getJSON());
        const newContent = JSON.stringify(jsonContent);
        
        if (currentContent !== newContent) {
          editor.commands.setContent(jsonContent, false);
        }
      } catch (e) {
        console.warn('Failed to update editor with new content', e);
        editor.commands.setContent(DEFAULT_DOCUMENT, false);
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
    <div className={`prose prose-sm max-w-none ${className}`}>
      <style jsx global>{editorStyles}</style>
      <EditorContent editor={editor} />
    </div>
  );
};