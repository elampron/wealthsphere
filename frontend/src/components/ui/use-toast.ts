'use client';

import React, { createContext, useContext, useState, useCallback } from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (data: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((data: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, ...data }]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const value = {
    toasts,
    toast,
    dismiss
  };

  return React.createElement(
    ToastContext.Provider,
    { value },
    children
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    // Return a no-op implementation when used outside provider
    return {
      toasts: [],
      toast: () => "",
      dismiss: () => {}
    };
  }
  
  return context;
} 