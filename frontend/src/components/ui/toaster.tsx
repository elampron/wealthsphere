'use client';

import { useToast } from './use-toast';
import React, { useEffect, useState } from 'react';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function Toaster() {
  const { toasts } = useToast();
  const [mounted, setMounted] = useState(false);

  // Hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4 w-full max-w-sm">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className={`p-4 rounded-lg shadow-lg border ${
            toast.variant === 'destructive' ? 'bg-red-50 border-red-400 text-red-800' : 'bg-white border-gray-200'
          }`}
        >
          {toast.title && <h3 className="font-medium">{toast.title}</h3>}
          {toast.description && <p className="text-sm">{toast.description}</p>}
        </div>
      ))}
    </div>
  );
} 