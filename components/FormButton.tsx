'use client';

import React from 'react';
import { useFormStatus } from 'react-dom';

interface FormButtonProps {
  children: React.ReactNode;
  className?: string;
}

export function FormButton({ children, className = '' }: FormButtonProps) {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
        pending ? 'opacity-70 cursor-not-allowed' : ''
      } ${className}`}
    >
      {pending ? 'Saving...' : children}
    </button>
  );
}