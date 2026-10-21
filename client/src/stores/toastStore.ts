import { create } from 'zustand';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

const TOAST_DURATION_MS = 4500;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = crypto.randomUUID();
    set({ toasts: [...get().toasts.slice(-3), { ...toast, id }] });
    setTimeout(() => get().dismiss(id), TOAST_DURATION_MS);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/** Atalhos: toast.success('Salvo!'), toast.error('Falhou', 'detalhe') */
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().push({ kind: 'success', title, message }),
  error: (title: string, message?: string) =>
    useToastStore.getState().push({ kind: 'error', title, message }),
  info: (title: string, message?: string) => useToastStore.getState().push({ kind: 'info', title, message }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().push({ kind: 'warning', title, message }),
};
