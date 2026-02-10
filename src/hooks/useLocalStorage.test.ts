import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    expect(result.current[0]).toBe('initial');
  });

  it('returns stored value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored'));

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    expect(result.current[0]).toBe('stored');
  });

  it('updates state and localStorage when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('updated'));
  });

  it('supports function updater', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
    expect(localStorage.getItem('counter')).toBe(JSON.stringify(1));

    act(() => {
      result.current[1]((prev) => prev + 5);
    });

    expect(result.current[0]).toBe(6);
  });

  it('handles complex objects', () => {
    const complexObject = {
      name: 'Test',
      nested: { value: 42 },
      array: [1, 2, 3],
    };

    const { result } = renderHook(() =>
      useLocalStorage('object-key', complexObject)
    );

    const updatedObject = {
      ...complexObject,
      name: 'Updated',
    };

    act(() => {
      result.current[1](updatedObject);
    });

    expect(result.current[0]).toEqual(updatedObject);
    expect(JSON.parse(localStorage.getItem('object-key')!)).toEqual(updatedObject);
  });

  it('handles arrays', () => {
    const { result } = renderHook(() =>
      useLocalStorage<number[]>('array-key', [])
    );

    act(() => {
      result.current[1]([1, 2, 3]);
    });

    expect(result.current[0]).toEqual([1, 2, 3]);

    act(() => {
      result.current[1]((prev) => [...prev, 4]);
    });

    expect(result.current[0]).toEqual([1, 2, 3, 4]);
  });

  it('returns initial value when localStorage has invalid JSON', () => {
    localStorage.setItem('test-key', 'invalid-json{');

    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));

    expect(result.current[0]).toBe('fallback');
  });

  it('handles different data types', () => {
    // String
    const { result: stringResult } = renderHook(() =>
      useLocalStorage('string', 'hello')
    );
    expect(stringResult.current[0]).toBe('hello');

    // Number
    const { result: numberResult } = renderHook(() =>
      useLocalStorage('number', 42)
    );
    expect(numberResult.current[0]).toBe(42);

    // Boolean
    const { result: boolResult } = renderHook(() =>
      useLocalStorage('bool', true)
    );
    expect(boolResult.current[0]).toBe(true);

    // Null
    const { result: nullResult } = renderHook(() =>
      useLocalStorage<null>('null', null)
    );
    expect(nullResult.current[0]).toBe(null);
  });

  it('maintains separate state for different keys', () => {
    const { result: result1 } = renderHook(() =>
      useLocalStorage('key1', 'value1')
    );
    const { result: result2 } = renderHook(() =>
      useLocalStorage('key2', 'value2')
    );

    expect(result1.current[0]).toBe('value1');
    expect(result2.current[0]).toBe('value2');

    act(() => {
      result1.current[1]('updated1');
    });

    expect(result1.current[0]).toBe('updated1');
    expect(result2.current[0]).toBe('value2'); // Unchanged
  });

  it('silently fails on localStorage quota exceeded', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    // Mock setItem to throw quota exceeded error
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new DOMException('QuotaExceededError');
    };

    // Should not throw, just silently fail
    expect(() => {
      act(() => {
        result.current[1]('new-value');
      });
    }).not.toThrow();

    // State should still update even though localStorage failed
    expect(result.current[0]).toBe('new-value');

    // Restore original
    Storage.prototype.setItem = originalSetItem;
  });

  it('uses callback memoization correctly', () => {
    const { result, rerender } = renderHook(
      ({ key }) => useLocalStorage(key, 'initial'),
      { initialProps: { key: 'test-key' } }
    );

    const firstSetter = result.current[1];

    // Rerender with same key
    rerender({ key: 'test-key' });
    const secondSetter = result.current[1];

    // Setter should be the same function (memoized)
    expect(firstSetter).toBe(secondSetter);

    // Rerender with different key
    rerender({ key: 'different-key' });
    const thirdSetter = result.current[1];

    // Setter should be different for different key
    expect(firstSetter).not.toBe(thirdSetter);
  });

  it('persists across hook re-renders', () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage('persist-key', 'initial')
    );

    act(() => {
      result.current[1]('persisted');
    });

    expect(result.current[0]).toBe('persisted');

    // Rerender
    rerender();

    // Value should persist
    expect(result.current[0]).toBe('persisted');
  });
});
