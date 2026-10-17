import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  const icons = {
    danger: <AlertTriangle className="w-6 h-6 text-rose-600" />,
    warning: <AlertCircle className="w-6 h-6 text-amber-600" />,
    info: <Info className="w-6 h-6 text-fixblue-800" />,
  };

  const iconBg = {
    danger: 'bg-rose-100',
    warning: 'bg-amber-100',
    info: 'bg-indigo-100',
  };

  const buttonVariants = {
    danger: 'danger',
    warning: 'primary',
    info: 'secondary',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={!loading}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl shrink-0 ${iconBg[variant] || iconBg.danger}`}>
          {icons[variant] || icons.danger}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={loading}
          size="md"
        >
          {cancelText}
        </Button>
        <Button
          variant={buttonVariants[variant] || 'danger'}
          onClick={onConfirm}
          loading={loading}
          size="md"
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
