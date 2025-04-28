'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

interface ModalProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Modal({ children, onClose, className = '' }: ModalProps) {
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
      if (e.target === overlay.current || e.target === wrapper.current) {
        handleClose();
      }
    },
    [handleClose, overlay, wrapper]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    },
    [handleClose]
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
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                 w-full max-w-[42rem] h-[90vh] bg-white rounded-lg shadow-lg 
                 p-6 overflow-y-auto ${className}`}
      >
        {children}
      </div>
    </div>,
    modalRoot
  );
}