'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type?: ToastType) => addToast(message, type), [addToast]);
  const success = useCallback((message: string) => addToast(message, 'success'), [addToast]);
  const error = useCallback((message: string) => addToast(message, 'error'), [addToast]);
  const info = useCallback((message: string) => addToast(message, 'info'), [addToast]);

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const styles = {
    success: 'border-green-200 bg-green-50',
    error: 'border-red-200 bg-red-50',
    info: 'border-blue-200 bg-blue-50',
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            className={cn(
              'fixed bottom-4 right-4 z-[100] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=open]:slide-in-from-bottom-5 data-[state=closed]:slide-out-to-right-full',
              'data-[state=closed]:fade-out-80',
              styles[t.type]
            )}
            duration={4000}
            onOpenChange={(open) => {
              if (!open) removeToast(t.id);
            }}
          >
            {icons[t.type]}
            <ToastPrimitive.Description className="text-sm font-medium text-slate-900">
              {t.message}
            </ToastPrimitive.Description>
            <ToastPrimitive.Close className="ml-2 rounded-lg p-1 hover:bg-black/5 transition-colors">
              <X className="h-4 w-4 text-slate-500" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
