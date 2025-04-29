'use client';

import { useMemo } from 'react';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { JSONContent } from '../../lib/editor/types';
import DOMPurify from 'isomorphic-dompurify';

// Shared styles for the content display
const contentStyles = `
  .rich-text-content {
    padding: 1rem;
    min-height: 2rem;
  }
  
  .rich-text-content p {
    margin-bottom: 1em;
  }
  
  .rich-text-content h1 {
    font-size: 1.75rem;
    font-weight: bold;
    margin-bottom: 0.75em;
  }
  
  .rich-text-content h2 {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 0.75em;
  }
  
  .rich-text-content h3 {
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 0.5em;
  }
  
  .rich-text-content ul, .rich-text-content ol {
    margin-left: 1.5em;
    margin-bottom: 1em;
  }
  
  .rich-text-content ul li {
    list-style-type: disc;
  }
  
  .rich-text-content ol li {
    list-style-type: decimal;
  }
  
  .rich-text-content blockquote {
    border-left: 3px solid #e5e7eb;
    padding-left: 1em;
    font-style: italic;
    margin-left: 0;
    margin-right: 0;
    margin-bottom: 1em;
  }
  
  .rich-text-content code {
    background-color: #f3f4f6;
    padding: 0.2em 0.4em;
    border-radius: 0.25em;
    font-family: monospace;
  }
  
  .rich-text-content pre {
    background-color: #f3f4f6;
    padding: 0.75em 1em;
    border-radius: 0.375rem;
    font-family: monospace;
    margin-bottom: 1em;
    overflow-x: auto;
  }
  
  .rich-text-content a {
    color: #3b82f6;
    text-decoration: underline;
  }
`;

// Define the extensions for generating HTML from JSON content
const extensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3]
    },
    blockquote: true,
    bold: true,
    italic: true,
    bulletList: true,
    orderedList: true,
    code: true,
    codeBlock: true,
    horizontalRule: true
  }),
  Link.configure({
    HTMLAttributes: {
      rel: 'noopener noreferrer',
      target: '_blank'
    }
  })
];

type RichTextContentProps = {
  content: JSONContent | string;
  className?: string;
};

export const RichTextContent = ({ content, className = '' }: RichTextContentProps) => {
  // Process content based on its type and generate HTML
  const htmlContent = useMemo(() => {
    if (!content) {
      return '<p></p>';
    }

    let jsonContent: JSONContent;

    // If it's already an object, use directly
    if (typeof content === 'object') {
      jsonContent = content;
    } else {
      // Parse string content to JSON
      try {
        jsonContent = JSON.parse(content as string);
      } catch (e) {
        console.warn('Invalid content format, showing empty content', e);
        return '<p></p>';
      }
    }
    
    // Generate HTML from JSON content
    try {
      // Generate HTML from JSON and sanitize it
      const html = generateHTML(jsonContent, extensions);
      return DOMPurify.sanitize(html);
    } catch (e) {
      console.warn('Failed to generate HTML from JSON content', e);
      return '<p>Error displaying content</p>';
    }
  }, [content]);

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <style jsx global>{contentStyles}</style>
      <div 
        className="rich-text-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};