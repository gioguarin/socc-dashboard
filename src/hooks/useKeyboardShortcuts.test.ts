import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

function makeActions() {
  return {
    onToggleShortcutsModal: vi.fn(),
    onToggleSettingsModal: vi.fn(),
    onNavigate: vi.fn(),
  };
}

function fireKey(key: string, target?: Partial<HTMLElement>) {
  const el = target
    ? Object.assign(document.createElement('div'), target)
    : document.body;
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  Object.defineProperty(event, 'target', { value: el, writable: false });
  document.dispatchEvent(event);
  return event;
}

describe('useKeyboardShortcuts hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers a keydown listener on document mount', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const actions = makeActions();
    renderHook(() => useKeyboardShortcuts(actions));
    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('removes the keydown listener on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const actions = makeActions();
    const { unmount } = renderHook(() => useKeyboardShortcuts(actions));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  describe('shortcut: ? (toggle shortcuts modal)', () => {
    it('calls onToggleShortcutsModal when ? is pressed', () => {
      const actions = makeActions();
      renderHook(() => useKeyboardShortcuts(actions));

      document.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));

      expect(actions.onToggleShortcutsModal).toHaveBeenCalledOnce();
    });
  });

  describe('shortcut: Escape', () => {
    it('calls both toggle callbacks when Escape is pressed on body', () => {
      const actions = makeActions();
      renderHook(() => useKeyboardShortcuts(actions));

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(actions.onToggleShortcutsModal).toHaveBeenCalledOnce();
      expect(actions.onToggleSettingsModal).toHaveBeenCalledOnce();
    });
  });

  describe('number key navigation', () => {
    it.each([
      ['1', 'dashboard'],
      ['2', 'threats'],
      ['3', 'news'],
      ['4', 'stocks'],
      ['5', 'briefings'],
      ['6', 'notes'],
      ['7', 'calendar'],
    ])('key %s navigates to %s', (key, view) => {
      const actions = makeActions();
      renderHook(() => useKeyboardShortcuts(actions));

      document.dispatchEvent(new KeyboardEvent('keydown', { key }));

      expect(actions.onNavigate).toHaveBeenCalledWith(view);
    });
  });

  describe('shortcut: / (focus search)', () => {
    it('dispatches socc-shortcut custom event when / is pressed', () => {
      const actions = makeActions();
      renderHook(() => useKeyboardShortcuts(actions));

      const listener = vi.fn();
      window.addEventListener('socc-shortcut', listener);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));

      expect(listener).toHaveBeenCalledOnce();
      const event = listener.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toBe('focus-search');

      window.removeEventListener('socc-shortcut', listener);
    });
  });

  describe('input element suppression', () => {
    it('does not call actions when keydown fires inside an INPUT', () => {
      const actions = makeActions();
      renderHook(() => useKeyboardShortcuts(actions));

      // Create a real INPUT element and dispatch the event from it
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      input.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }));
      document.body.removeChild(input);

      expect(actions.onToggleShortcutsModal).not.toHaveBeenCalled();
    });

    it('does not call actions when keydown fires inside a TEXTAREA', () => {
      const actions = makeActions();
      renderHook(() => useKeyboardShortcuts(actions));

      const ta = document.createElement('textarea');
      document.body.appendChild(ta);
      ta.focus();
      ta.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
      document.body.removeChild(ta);

      expect(actions.onNavigate).not.toHaveBeenCalled();
    });
  });
});
