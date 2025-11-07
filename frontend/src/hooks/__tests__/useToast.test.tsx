import { renderHook, act } from '@testing-library/react';
import { useToast, useToastStore } from '../useToast';

describe('useToastStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useToastStore.setState({ toasts: [] });
  });

  describe('Initial State', () => {
    it('initializes with empty toasts array', () => {
      const { result } = renderHook(() => useToastStore());

      expect(result.current.toasts).toEqual([]);
    });
  });

  describe('addToast', () => {
    it('adds a toast to the store', () => {
      const { result } = renderHook(() => useToastStore());

      act(() => {
        result.current.addToast({
          type: 'success',
          title: 'Success!',
          message: 'Operation completed',
        });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        type: 'success',
        title: 'Success!',
        message: 'Operation completed',
      });
      expect(result.current.toasts[0].id).toMatch(/^toast-/);
    });

    it('adds multiple toasts', () => {
      const { result } = renderHook(() => useToastStore());

      act(() => {
        result.current.addToast({
          type: 'success',
          title: 'First toast',
        });
        result.current.addToast({
          type: 'error',
          title: 'Second toast',
        });
        result.current.addToast({
          type: 'info',
          title: 'Third toast',
        });
      });

      expect(result.current.toasts).toHaveLength(3);
      expect(result.current.toasts[0].title).toBe('First toast');
      expect(result.current.toasts[1].title).toBe('Second toast');
      expect(result.current.toasts[2].title).toBe('Third toast');
    });

    it('generates unique IDs for each toast', () => {
      const { result } = renderHook(() => useToastStore());

      act(() => {
        result.current.addToast({ type: 'success', title: 'Toast 1' });
        result.current.addToast({ type: 'success', title: 'Toast 2' });
      });

      const ids = result.current.toasts.map((t) => t.id);
      expect(ids[0]).not.toBe(ids[1]);
      expect(new Set(ids).size).toBe(2); // All IDs are unique
    });

    it('preserves toast order', () => {
      const { result } = renderHook(() => useToastStore());

      const titles = ['First', 'Second', 'Third', 'Fourth'];

      act(() => {
        titles.forEach((title) => {
          result.current.addToast({ type: 'info', title });
        });
      });

      expect(result.current.toasts.map((t) => t.title)).toEqual(titles);
    });

    it('adds toast without message', () => {
      const { result } = renderHook(() => useToastStore());

      act(() => {
        result.current.addToast({
          type: 'info',
          title: 'Just a title',
        });
      });

      expect(result.current.toasts[0]).toMatchObject({
        type: 'info',
        title: 'Just a title',
      });
      expect(result.current.toasts[0].message).toBeUndefined();
    });
  });

  describe('removeToast', () => {
    it('removes a toast by ID', () => {
      const { result } = renderHook(() => useToastStore());

      let toastId: string;

      act(() => {
        result.current.addToast({ type: 'success', title: 'Toast 1' });
        result.current.addToast({ type: 'success', title: 'Toast 2' });
        result.current.addToast({ type: 'success', title: 'Toast 3' });
        toastId = result.current.toasts[1].id!; // Get middle toast ID
      });

      expect(result.current.toasts).toHaveLength(3);

      act(() => {
        result.current.removeToast(toastId);
      });

      expect(result.current.toasts).toHaveLength(2);
      expect(result.current.toasts.find((t) => t.id === toastId)).toBeUndefined();
      expect(result.current.toasts[0].title).toBe('Toast 1');
      expect(result.current.toasts[1].title).toBe('Toast 3');
    });

    it('removes the first toast', () => {
      const { result } = renderHook(() => useToastStore());

      let firstId: string;

      act(() => {
        result.current.addToast({ type: 'success', title: 'First' });
        result.current.addToast({ type: 'success', title: 'Second' });
        firstId = result.current.toasts[0].id!;
      });

      act(() => {
        result.current.removeToast(firstId);
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Second');
    });

    it('removes the last toast', () => {
      const { result } = renderHook(() => useToastStore());

      let lastId: string;

      act(() => {
        result.current.addToast({ type: 'success', title: 'First' });
        result.current.addToast({ type: 'success', title: 'Last' });
        lastId = result.current.toasts[1].id!;
      });

      act(() => {
        result.current.removeToast(lastId);
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('First');
    });

    it('does nothing when removing non-existent ID', () => {
      const { result } = renderHook(() => useToastStore());

      act(() => {
        result.current.addToast({ type: 'success', title: 'Toast 1' });
        result.current.addToast({ type: 'success', title: 'Toast 2' });
      });

      const toastCount = result.current.toasts.length;

      act(() => {
        result.current.removeToast('non-existent-id');
      });

      expect(result.current.toasts).toHaveLength(toastCount);
    });

    it('handles removing from empty store', () => {
      const { result } = renderHook(() => useToastStore());

      expect(() => {
        act(() => {
          result.current.removeToast('any-id');
        });
      }).not.toThrow();

      expect(result.current.toasts).toHaveLength(0);
    });

    it('removes all toasts one by one', () => {
      const { result } = renderHook(() => useToastStore());

      const ids: string[] = [];

      act(() => {
        result.current.addToast({ type: 'success', title: 'Toast 1' });
        result.current.addToast({ type: 'success', title: 'Toast 2' });
        result.current.addToast({ type: 'success', title: 'Toast 3' });
        ids.push(...result.current.toasts.map((t) => t.id!));
      });

      expect(result.current.toasts).toHaveLength(3);

      ids.forEach((id) => {
        act(() => {
          result.current.removeToast(id);
        });
      });

      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('Toast Types', () => {
    it('handles success toasts', () => {
      const { result } = renderHook(() => useToastStore());

      act(() => {
        result.current.addToast({
          type: 'success',
          title: 'Success',
          message: 'All good',
        });
      });

      expect(result.current.toasts[0].type).toBe('success');
    });

    it('handles error toasts', () => {
      const { result } = renderHook(() => useToastStore());

      act(() => {
        result.current.addToast({
          type: 'error',
          title: 'Error',
          message: 'Something went wrong',
        });
      });

      expect(result.current.toasts[0].type).toBe('error');
    });

    it('handles info toasts', () => {
      const { result } = renderHook(() => useToastStore());

      act(() => {
        result.current.addToast({
          type: 'info',
          title: 'Info',
          message: 'Just so you know',
        });
      });

      expect(result.current.toasts[0].type).toBe('info');
    });
  });

  describe('Concurrent Operations', () => {
    it('handles add and remove in quick succession', () => {
      const { result } = renderHook(() => useToastStore());

      let toastId: string;

      act(() => {
        result.current.addToast({ type: 'success', title: 'Quick toast' });
        toastId = result.current.toasts[0].id!;
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.removeToast(toastId);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('handles multiple adds and removes', () => {
      const { result } = renderHook(() => useToastStore());

      act(() => {
        result.current.addToast({ type: 'success', title: 'Toast 1' });
        result.current.addToast({ type: 'success', title: 'Toast 2' });
      });

      const id1 = result.current.toasts[0].id!;

      act(() => {
        result.current.addToast({ type: 'success', title: 'Toast 3' });
        result.current.removeToast(id1);
        result.current.addToast({ type: 'success', title: 'Toast 4' });
      });

      expect(result.current.toasts).toHaveLength(3);
      expect(result.current.toasts[0].title).toBe('Toast 2');
      expect(result.current.toasts[1].title).toBe('Toast 3');
      expect(result.current.toasts[2].title).toBe('Toast 4');
    });
  });
});

describe('useToast hook', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  describe('Initialization', () => {
    it('returns toast helper methods', () => {
      const { result } = renderHook(() => useToast());

      expect(result.current).toHaveProperty('success');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('info');
      expect(typeof result.current.success).toBe('function');
      expect(typeof result.current.error).toBe('function');
      expect(typeof result.current.info).toBe('function');
    });
  });

  describe('Success method', () => {
    it('adds success toast with title only', () => {
      const { result: toastResult } = renderHook(() => useToast());
      const { result: storeResult } = renderHook(() => useToastStore());

      act(() => {
        toastResult.current.success('Operation successful');
      });

      expect(storeResult.current.toasts).toHaveLength(1);
      expect(storeResult.current.toasts[0]).toMatchObject({
        type: 'success',
        title: 'Operation successful',
      });
    });

    it('adds success toast with title and message', () => {
      const { result: toastResult } = renderHook(() => useToast());
      const { result: storeResult } = renderHook(() => useToastStore());

      act(() => {
        toastResult.current.success('Success!', 'Your changes have been saved');
      });

      expect(storeResult.current.toasts).toHaveLength(1);
      expect(storeResult.current.toasts[0]).toMatchObject({
        type: 'success',
        title: 'Success!',
        message: 'Your changes have been saved',
      });
    });

    it('adds multiple success toasts', () => {
      const { result: toastResult } = renderHook(() => useToast());
      const { result: storeResult } = renderHook(() => useToastStore());

      act(() => {
        toastResult.current.success('First success');
        toastResult.current.success('Second success');
        toastResult.current.success('Third success');
      });

      expect(storeResult.current.toasts).toHaveLength(3);
      expect(storeResult.current.toasts.every((t) => t.type === 'success')).toBe(true);
    });
  });

  describe('Error method', () => {
    it('adds error toast with title only', () => {
      const { result: toastResult } = renderHook(() => useToast());
      const { result: storeResult } = renderHook(() => useToastStore());

      act(() => {
        toastResult.current.error('Operation failed');
      });

      expect(storeResult.current.toasts).toHaveLength(1);
      expect(storeResult.current.toasts[0]).toMatchObject({
        type: 'error',
        title: 'Operation failed',
      });
    });

    it('adds error toast with title and message', () => {
      const { result: toastResult } = renderHook(() => useToast());
      const { result: storeResult } = renderHook(() => useToastStore());

      act(() => {
        toastResult.current.error('Error!', 'Please try again later');
      });

      expect(storeResult.current.toasts).toHaveLength(1);
      expect(storeResult.current.toasts[0]).toMatchObject({
        type: 'error',
        title: 'Error!',
        message: 'Please try again later',
      });
    });
  });

  describe('Info method', () => {
    it('adds info toast with title only', () => {
      const { result: toastResult } = renderHook(() => useToast());
      const { result: storeResult } = renderHook(() => useToastStore());

      act(() => {
        toastResult.current.info('New feature available');
      });

      expect(storeResult.current.toasts).toHaveLength(1);
      expect(storeResult.current.toasts[0]).toMatchObject({
        type: 'info',
        title: 'New feature available',
      });
    });

    it('adds info toast with title and message', () => {
      const { result: toastResult } = renderHook(() => useToast());
      const { result: storeResult } = renderHook(() => useToastStore());

      act(() => {
        toastResult.current.info('Info', 'Check out the new calendar view');
      });

      expect(storeResult.current.toasts).toHaveLength(1);
      expect(storeResult.current.toasts[0]).toMatchObject({
        type: 'info',
        title: 'Info',
        message: 'Check out the new calendar view',
      });
    });
  });

  describe('Mixed Toast Types', () => {
    it('adds different toast types in sequence', () => {
      const { result: toastResult } = renderHook(() => useToast());
      const { result: storeResult } = renderHook(() => useToastStore());

      act(() => {
        toastResult.current.info('Info message');
        toastResult.current.success('Success message');
        toastResult.current.error('Error message');
      });

      expect(storeResult.current.toasts).toHaveLength(3);
      expect(storeResult.current.toasts[0].type).toBe('info');
      expect(storeResult.current.toasts[1].type).toBe('success');
      expect(storeResult.current.toasts[2].type).toBe('error');
    });
  });

  describe('Integration with Store', () => {
    it('toasts appear in store immediately', () => {
      const { result: toastResult } = renderHook(() => useToast());
      const { result: storeResult } = renderHook(() => useToastStore());

      expect(storeResult.current.toasts).toHaveLength(0);

      act(() => {
        toastResult.current.success('Test');
      });

      expect(storeResult.current.toasts).toHaveLength(1);
    });

    it('multiple hooks share same store', () => {
      const { result: toast1 } = renderHook(() => useToast());
      const { result: toast2 } = renderHook(() => useToast());
      const { result: storeResult } = renderHook(() => useToastStore());

      act(() => {
        toast1.current.success('From hook 1');
        toast2.current.error('From hook 2');
      });

      expect(storeResult.current.toasts).toHaveLength(2);
    });
  });
});
