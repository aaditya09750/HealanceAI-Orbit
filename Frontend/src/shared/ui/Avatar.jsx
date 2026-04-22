import React, { useState } from 'react';
import { cn } from '../../lib/utils';

const getInitials = (name) => {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
};

const isDefaultAvatar = (url) => {
  if (!url) return true;
  return (
    url.includes('unsplash.com') ||
    url.includes('via.placeholder') ||
    url.includes('placeholder.com') ||
    url.includes('gravatar.com/avatar/?') ||
    url.endsWith('/default.png') ||
    url.endsWith('/default.jpg')
  );
};

const Avatar = ({ src, name, size = 40, className = '' }) => {
  const [errored, setErrored] = useState(false);
  const hasImage = src && !isDefaultAvatar(src) && !errored;
  const initials = getInitials(name);

  const dimensionStyle = { width: `${size}px`, height: `${size}px` };
  const fontSize = Math.max(12, Math.round(size * 0.4));

  if (hasImage) {
    return (
      <img
        src={src}
        alt={name || 'User avatar'}
        onError={() => setErrored(true)}
        className={cn('rounded-full object-cover flex-shrink-0', className)}
        style={dimensionStyle}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#506cd7] to-[#4753bf] text-white font-heading font-bold select-none',
        className
      )}
      style={{ ...dimensionStyle, fontSize: `${fontSize}px` }}
      aria-label={name || 'User avatar'}
    >
      {initials}
    </div>
  );
};

export default Avatar;
