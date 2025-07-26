'use client';

import { useState } from 'react';

export function useDailyWrite() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openDailyWrite = () => {
    setIsModalOpen(true);
  };

  const closeDailyWrite = () => {
    setIsModalOpen(false);
  };

  return {
    isModalOpen,
    openDailyWrite,
    closeDailyWrite,
  };
}
