'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ModalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const overlay = useRef<HTMLDivElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const onDismiss = useCallback(() => {
    router.back();
  }, [router]);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlay.current || e.target === wrapper.current) {
        if (onDismiss) onDismiss();
      }
    },
    [onDismiss, overlay, wrapper]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    },
    [onDismiss]
  );

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  return (
    <div
      ref={overlay}
      className="fixed z-50 left-0 right-0 top-0 bottom-0 mx-auto bg-black/60"
      onClick={onClick}
    >
      <div
        ref={wrapper}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                 w-full max-w-[42rem] h-[90vh] bg-white rounded-lg shadow-lg 
                 p-6 overflow-y-auto"
        style={{
          // A4 proportions (8.5 x 11 inches) maintained with a max-width
          aspectRatio: '0.7727', // 8.5/11
          margin: '0 auto',
          fontSize: '1rem', // Base font size that respects user settings
          lineHeight: '1.5',
        }}
      >
        {children}
      </div>
    </div>
  );
}