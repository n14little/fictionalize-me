/**
 * Shared types and constants for the rich text editor components
 */
import { JSONContent } from '@tiptap/react';

// Re-export Tiptap's JSONContent type for use throughout the app
export type { JSONContent };

// Default empty document
export const DEFAULT_DOCUMENT: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }]
};