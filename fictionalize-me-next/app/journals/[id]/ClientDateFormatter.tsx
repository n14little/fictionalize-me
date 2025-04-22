'use client';

import React from 'react';

interface ClientDateFormatterProps {
  date: Date | string;
}

export function ClientDateFormatter({ date }: ClientDateFormatterProps) {
  const formattedDate = new Date(date).toLocaleDateString();
  
  return (
    <span className="text-sm text-gray-500">
      {formattedDate}
    </span>
  );
}