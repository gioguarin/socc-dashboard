import { useEffect, useCallback } from 'react';
import type { View } from '../types';

interface KeyboardShortcutActions {
  onToggleShortcutsModal: () => void;
  onToggleSettingsModal: () => void;
  onNavigate: (view: View) => void;
}

/**
 * Global keyboard shortcuts for dashboard navigation.
 * - j/k: scroll to next/prev item in current view
 * - /: focus search bar
 * - ?: toggle keyboard shortcuts modal
 * - Esc: close modals / clear search
 * - 1-5: switch between panels
 */
export function useKeyboardShortcuts(actions: KeyboardShortcutActions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      /* Don't intercept when typing in inputs */
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        /* Still handle Escape in inputs */
        if (e.key === 'Escape') {
          (target as HTMLInputElement).blur();
        }
        return;
      }

      switch (e.key) {
        case '/': {
          e.preventDefault();
          /* Dispatch custom event for search component to listen */
          window.dispatchEvent(
            new CustomEvent('socc-shortcut', { detail: 'focus-search' })
          );
          break;
        }

        case '?': {
          e.preventDefault();
          actions.onToggleShortcutsModal();
          break;
        }

        case 'Escape': {
          /* Close any open modal — handled by modal components */
          actions.onToggleShortcutsModal();
          actions.onToggleSettingsModal();
          break;
        }

        case 'j': {
          e.preventDefault();
          scrollToItem('next');
          break;
        }

        case 'k': {
          e.preventDefault();
          scrollToItem('prev');
          break;
        }

        /* Number keys for panel switching */
        case '1': actions.onNavigate('dashboard'); break;
        case '2': actions.onNavigate('threats'); break;
        case '3': actions.onNavigate('news'); break;
        case '4': actions.onNavigate('stocks'); break;
        case '5': actions.onNavigate('briefings'); break;
        case '6': actions.onNavigate('notes'); break;
        case '7': actions.onNavigate('projects'); break;
      }
    },
    [actions]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Scroll to next/previous item in the current scrollable list.
 * Uses data-item attribute on list items for targeting.
 */
function scrollToItem(direction: 'next' | 'prev') {
  /* Find the scrollable content area */
  const container = document.querySelector('.scrollbar-thin');
  if (!container) return;

  const items = container.querySelectorAll('[data-item]');
  if (items.length === 0) return;

  /* Find the currently focused/highlighted item */
  const current = container.querySelector('[data-item-active="true"]');
  let idx = current ? Array.from(items).indexOf(current) : -1;

  /* Remove current highlight */
  current?.removeAttribute('data-item-active');
  current?.classList.remove('ring-1', 'ring-socc-cyan/40');

  /* Calculate next index */
  if (direction === 'next') {
    idx = Math.min(idx + 1, items.length - 1);
  } else {
    idx = Math.max(idx - 1, 0);
  }

  /* Apply highlight and scroll */
  const target = items[idx];
  if (target) {
    target.setAttribute('data-item-active', 'true');
    target.classList.add('ring-1', 'ring-socc-cyan/40');
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
