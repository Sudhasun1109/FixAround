import React from 'react';
import toast, { Toaster } from 'react-hot-toast';

export function ToastContainer() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className: 'text-sm font-medium shadow-lg rounded-xl border border-slate-100',
        style: {
          background: '#ffffff',
          color: '#1e293b',
          padding: '12px 16px',
        },
        success: {
          iconTheme: {
            primary: '#0d9488',
            secondary: '#ffffff',
          },
          style: {
            borderLeft: '4px solid #0d9488',
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#e11d48',
            secondary: '#ffffff',
          },
          style: {
            borderLeft: '4px solid #e11d48',
          },
        },
      }}
    />
  );
}

export const showToast = {
  success: (msg, opts) => toast.success(msg, opts),
  error: (msg, opts) => toast.error(msg, opts),
  info: (msg, opts) =>
    toast(msg, {
      icon: 'ℹ️',
      ...opts,
    }),
  warning: (msg, opts) =>
    toast(msg, {
      icon: '⚠️',
      ...opts,
    }),
  loading: (msg, opts) => toast.loading(msg, opts),
  dismiss: (id) => toast.dismiss(id),
};

export default ToastContainer;
