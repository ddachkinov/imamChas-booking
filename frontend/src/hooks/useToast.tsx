import { create } from 'zustand';
import { ToastProps, ToastType } from '@/components/ui/Toast';

interface Toast extends Omit<ToastProps, 'onClose'> {}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: `toast-${Date.now()}-${Math.random()}` }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export const useToast = () => {
  const { addToast } = useToastStore();

  const toast = {
    success: (title: string, message?: string) => {
      addToast({ type: 'success', title, message });
    },
    error: (title: string, message?: string) => {
      addToast({ type: 'error', title, message });
    },
    info: (title: string, message?: string) => {
      addToast({ type: 'info', title, message });
    },
  };

  return toast;
};
