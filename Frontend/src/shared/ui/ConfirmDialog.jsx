import React, { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'default',
}) => {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus the confirm button on open
    confirmRef.current?.focus();

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0b1030]/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[20px] w-full max-w-sm p-6"
        style={{ boxShadow: '0 22px 38px rgba(11, 16, 48, 0.11)' }}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`dash-icon-badge flex-shrink-0 ${variant === 'danger' ? 'bg-red-500' : 'bg-[#506cd7]'}`}
          >
            <AlertTriangle size={20} className="text-white" />
          </div>
          <div>
            <h3 id="confirm-title" className="text-base font-heading font-bold text-[#0b1030]">
              {title}
            </h3>
            <p id="confirm-desc" className="text-sm text-[#5f697a] mt-1">
              {description}
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            ref={confirmRef}
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
