'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

interface ModalProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
  isFullscreen?: boolean;
  disableAutoClose?: boolean;
}

export function Modal({
  children,
  onClose,
  className = '',
  isFullscreen = false,
  disableAutoClose = false,
}: ModalProps) {
  const overlay = useRef<HTMLDivElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  }, [onClose, router]);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      if (
        !disableAutoClose &&
        (e.target === overlay.current || e.target === wrapper.current)
      ) {
        handleClose();
      }
    },
    [disableAutoClose, handleClose, overlay, wrapper]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!disableAutoClose && e.key === 'Escape') handleClose();
    },
    [disableAutoClose, handleClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  // Only render the modal on the client side
  if (typeof window === 'undefined') {
    return null;
  }

  // Find the modal root element
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(
    <div
      ref={overlay}
      className="fixed z-50 left-0 right-0 top-0 bottom-0 mx-auto bg-black/60"
      onClick={onClick}
    >
      <div
        ref={wrapper}
        className={`${
          isFullscreen
            ? 'fixed inset-0 w-full h-full max-w-none rounded-none p-6 md:p-8 overflow-y-auto'
            : 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[42rem] h-[90vh] rounded-lg p-6 overflow-y-auto'
        } bg-white shadow-lg ${className}`}
      >
        {children}
      </div>
    </div>,
    modalRoot
  );
}
