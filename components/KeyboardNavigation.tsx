'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';

interface KeyboardNavigationContextType {
  activeColumn: 'entries' | 'tasks';
  setActiveColumn: (column: 'entries' | 'tasks') => void;
  activeItemIndex: number;
  setActiveItemIndex: (index: number) => void;
  itemCount: number;
  setItemCount: (count: number) => void;
  registerItem: (
    id: string,
    element: HTMLElement,
    column: 'entries' | 'tasks'
  ) => void;
  unregisterItem: (id: string) => void;
  focusItem: (index: number, targetColumn?: 'entries' | 'tasks') => void;
  isNavigationActive: boolean;
  setNavigationActive: (active: boolean) => void;
}

const KeyboardNavigationContext =
  createContext<KeyboardNavigationContextType | null>(null);

export function useKeyboardNavigation() {
  const context = useContext(KeyboardNavigationContext);
  if (!context) {
    throw new Error(
      'useKeyboardNavigation must be used within a KeyboardNavigationProvider'
    );
  }
  return context;
}

interface KeyboardNavigationProviderProps {
  children: React.ReactNode;
  onDailyWrite?: () => void;
}

export function KeyboardNavigationProvider({
  children,
  onDailyWrite,
}: KeyboardNavigationProviderProps) {
  const [activeColumn, setActiveColumn] = useState<'entries' | 'tasks'>(
    'entries'
  );
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [isNavigationActive, setNavigationActive] = useState(false);
  const itemsRef = useRef<
    Map<string, { element: HTMLElement; column: 'entries' | 'tasks' }>
  >(new Map());

  const registerItem = useCallback(
    (id: string, element: HTMLElement, column: 'entries' | 'tasks') => {
      itemsRef.current.set(id, { element, column });
    },
    []
  );

  const unregisterItem = useCallback((id: string) => {
    itemsRef.current.delete(id);
  }, []);

  const focusItem = useCallback(
    (index: number, targetColumn?: 'entries' | 'tasks') => {
      // Use targetColumn if provided, otherwise use activeColumn
      const columnToUse = targetColumn || activeColumn;

      // Filter items by the specified column
      const items = Array.from(itemsRef.current.entries()).filter(
        ([, { column }]) => column === columnToUse
      );

      const sortedItems = items.sort((a, b) => {
        const aEl = a[1].element;
        const bEl = b[1].element;
        const aRect = aEl.getBoundingClientRect();
        const bRect = bEl.getBoundingClientRect();
        return aRect.top - bRect.top;
      });

      if (sortedItems[index]) {
        const element = sortedItems[index][1].element;
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    },
    [activeColumn]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if a modal is currently open by looking for the modal overlay
      const modalOverlay = document.querySelector(
        '.fixed.z-50[class*="bg-black"]'
      );
      const isModalOpen = modalOverlay !== null;

      // If a modal is open, only allow the daily write shortcut and escape key
      if (isModalOpen) {
        // Still allow daily write shortcut when modal is open
        if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
          event.preventDefault();
          onDailyWrite?.();
          return;
        }

        // Allow escape to work in modals
        if (event.key === 'Escape') {
          // Let the modal handle escape - don't prevent default
          return;
        }

        // For all other keys, do nothing when modal is open
        return;
      }

      // Daily write shortcut (Ctrl+D or Cmd+D)
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        onDailyWrite?.();
        return;
      }

      // Only handle navigation if we're not in an input field
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'e':
          event.preventDefault();
          setActiveColumn('entries');
          setActiveItemIndex(0);
          setNavigationActive(true);
          setTimeout(() => focusItem(0, 'entries'), 0);
          break;

        case 't':
          event.preventDefault();
          setActiveColumn('tasks');
          setActiveItemIndex(0);
          setNavigationActive(true);
          setTimeout(() => focusItem(0, 'tasks'), 0);
          break;

        case 'arrowup':
          event.preventDefault();
          setNavigationActive(true);
          if (activeItemIndex > 0) {
            const newIndex = activeItemIndex - 1;
            setActiveItemIndex(newIndex);
            focusItem(newIndex);
          }
          break;

        case 'arrowdown':
          event.preventDefault();
          setNavigationActive(true);
          if (activeItemIndex < itemCount - 1) {
            const newIndex = activeItemIndex + 1;
            setActiveItemIndex(newIndex);
            focusItem(newIndex);
          }
          break;

        case 'escape':
          event.preventDefault();
          setNavigationActive(false);
          (document.activeElement as HTMLElement)?.blur();
          break;

        case 'enter':
          if (isNavigationActive) {
            event.preventDefault();
            // Filter items by active column
            const items = Array.from(itemsRef.current.entries()).filter(
              ([, { column }]) => column === activeColumn
            );

            const sortedItems = items.sort((a, b) => {
              const aEl = a[1].element;
              const bEl = b[1].element;
              const aRect = aEl.getBoundingClientRect();
              const bRect = bEl.getBoundingClientRect();
              return aRect.top - bRect.top;
            });

            if (sortedItems[activeItemIndex]) {
              const element = sortedItems[activeItemIndex][1].element;

              if (activeColumn === 'entries') {
                // For entries, find the button inside the NavigableItem and click it
                const entryElement = element;
                const entryButton = entryElement.querySelector(
                  'button'
                ) as HTMLButtonElement;
                if (entryButton) {
                  entryButton.click();
                } else {
                  // Fallback: click the element itself
                  element.click();
                }
              } else if (activeColumn === 'tasks') {
                // For tasks, find the toggle completion button and click it
                const taskElement = element;
                const toggleButton = taskElement.querySelector(
                  'button[type="submit"]'
                ) as HTMLButtonElement;
                if (
                  toggleButton &&
                  toggleButton.getAttribute('aria-label')?.includes('Mark as')
                ) {
                  toggleButton.click();
                } else {
                  // Fallback: click the element itself
                  element.click();
                }
              }
            }
          }
          break;

        case ' ':
          if (isNavigationActive) {
            event.preventDefault();
            // Space always clicks the element regardless of column
            const items = Array.from(itemsRef.current.entries()).filter(
              ([, { column }]) => column === activeColumn
            );

            const sortedItems = items.sort((a, b) => {
              const aEl = a[1].element;
              const bEl = b[1].element;
              const aRect = aEl.getBoundingClientRect();
              const bRect = bEl.getBoundingClientRect();
              return aRect.top - bRect.top;
            });

            if (sortedItems[activeItemIndex]) {
              sortedItems[activeItemIndex][1].element.click();
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeColumn,
    activeItemIndex,
    itemCount,
    isNavigationActive,
    focusItem,
    onDailyWrite,
  ]);

  return (
    <KeyboardNavigationContext.Provider
      value={{
        activeColumn,
        setActiveColumn,
        activeItemIndex,
        setActiveItemIndex,
        itemCount,
        setItemCount,
        registerItem,
        unregisterItem,
        focusItem,
        isNavigationActive,
        setNavigationActive,
      }}
    >
      {children}
    </KeyboardNavigationContext.Provider>
  );
}

interface NavigableItemProps {
  id: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  column?: 'entries' | 'tasks';
}

export function NavigableItem({
  id,
  children,
  onClick,
  className = '',
  ariaLabel,
  column = 'entries',
}: NavigableItemProps) {
  const { registerItem, unregisterItem, isNavigationActive } =
    useKeyboardNavigation();
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (element) {
      registerItem(id, element, column);
      return () => unregisterItem(id);
    }
  }, [id, registerItem, unregisterItem, column]);

  const handleClick = () => {
    onClick?.();
  };

  return (
    <div
      ref={elementRef}
      className={`${className} ${
        isNavigationActive
          ? 'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
          : ''
      }`}
      onClick={handleClick}
      tabIndex={-1}
      role="button"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

export function NavigableColumn({
  column,
  children,
  itemCount,
}: {
  column: 'entries' | 'tasks';
  children: React.ReactNode;
  itemCount: number;
}) {
  const { activeColumn, setItemCount: setGlobalItemCount } =
    useKeyboardNavigation();

  useEffect(() => {
    if (activeColumn === column) {
      setGlobalItemCount(itemCount);
    }
  }, [activeColumn, column, itemCount, setGlobalItemCount]);

  return <>{children}</>;
}
