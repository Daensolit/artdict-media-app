import { useState } from 'react';
import { getAvatarColor, getInitials } from '../utils/helpers';

interface AvatarProps {
  name: string;
  avatar?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  imgClassName?: string;
}

export default function Avatar({
  name,
  avatar,
  size = 'md',
  className = '',
  imgClassName = '',
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const isImage =
    !!avatar &&
    (avatar.startsWith('data:image/') ||
      avatar.startsWith('http://') ||
      avatar.startsWith('https://') ||
      avatar.startsWith('blob:')) &&
    !hasError;

  const sizeClasses: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string> = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-20 h-20 text-2xl',
  };

  const dimClass = sizeClasses[size].split(' ').slice(0, 2).join(' ');

  if (isImage) {
    return (
      <img
        src={avatar}
        alt={name}
        onError={() => setHasError(true)}
        className={`${dimClass} rounded-full object-cover shrink-0 shadow-sm ring-1 ring-black/10 dark:ring-white/10 ${imgClassName} ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-sm ${getAvatarColor(
        name
      )} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
