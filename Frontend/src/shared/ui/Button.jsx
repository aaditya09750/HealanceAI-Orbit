import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants = {
      primary:
        'bg-gradient-to-r from-primary-600 to-secondary-500 text-white hover:opacity-90 shadow-lg shadow-primary-500/30',
      secondary: 'bg-white text-primary-700 border border-primary-200 hover:bg-primary-50',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
      outline: 'bg-transparent border-2 border-white text-white hover:bg-white/10',
      danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20',
      text: 'bg-transparent text-[#506cd7] hover:bg-[#f0f1fc] hover:text-[#4753bf]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-base',
      lg: 'px-8 py-3.5 text-lg',
      icon: 'p-2.5',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#506cd7] focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
