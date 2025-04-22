'use client';

import React from 'react';

interface ClientJournalDateProps {
  label: string;
  date: Date | string;
}

export function ClientJournalDate({ label, date }: ClientJournalDateProps) {
  const formattedDate = new Date(date).toLocaleDateString();
  
  return (
    <span className="text-sm text-gray-500">
      {label} {formattedDate}
    </span>
  );
}