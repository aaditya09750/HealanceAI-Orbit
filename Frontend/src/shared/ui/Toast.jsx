import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const iconMap = {
  success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
  error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  info: { icon: Info, color: 'text-[#506cd7]', bg: 'bg-[#f0f1fc]' },
};

const Toast = ({ toasts, onRemove }) => (
  <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
    <AnimatePresence>
      {toasts.map((t) => {
        const config = iconMap[t.variant] || iconMap.info;
        const Icon = config.icon;
        return (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="pointer-events-auto bg-white rounded-[16px] border border-[#e8eaf9] px-4 py-3 flex items-start gap-3"
            style={{ boxShadow: '0 10px 35px rgba(2, 6, 23, 0.08)' }}
          >
            <div className={`p-1.5 rounded-full ${config.bg} flex-shrink-0 mt-0.5`}>
              <Icon size={16} className={config.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#0b1030]">{t.title}</p>
              {t.description && <p className="text-xs text-[#5f697a] mt-0.5">{t.description}</p>}
            </div>
            <button
              onClick={() => onRemove(t.id)}
              className="p-1 hover:bg-[#f0f1fc] rounded-lg transition-colors flex-shrink-0"
              aria-label="Dismiss notification"
            >
              <X size={14} className="text-[#6a7283]" />
            </button>
          </motion.div>
        );
      })}
    </AnimatePresence>
  </div>
);

export default Toast;
