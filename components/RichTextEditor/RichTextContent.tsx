'use client';

import { useMemo, useState, useEffect } from 'react';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { JSONContent } from '../../lib/editor/types';
import DOMPurify from 'isomorphic-dompurify';
import styles from './RichTextContent.module.css';

// Define the extensions for generating HTML from JSON content
const extensions = [
  StarterKit,
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
  // Track whether component is mounted to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  
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

  // Set mounted state after hydration is complete
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // If not mounted yet, return null to prevent any content flash during hydration
  if (!isMounted) {
    return null;
  }

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <div className={styles.contentWrapper}>
        <div 
          className={styles.richTextContent}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
};