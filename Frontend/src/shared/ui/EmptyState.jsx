import React from 'react';
import { motion } from 'framer-motion';
import Button from './Button';

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <motion.div
    className="flex flex-col items-center justify-center py-10 px-4 text-center"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    {Icon && (
      <div className="mb-4">
        <Icon size={48} className="text-[#e8eaf9]" strokeWidth={1.5} />
      </div>
    )}
    <h3 className="dash-heading text-base sm:text-lg mb-2">{title}</h3>
    <p className="text-sm text-[#5f697a] max-w-sm mb-5">{description}</p>
    {action && (
      <Button size="sm" onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </motion.div>
);

export default EmptyState;
