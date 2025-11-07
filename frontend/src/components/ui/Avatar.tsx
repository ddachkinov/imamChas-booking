import { useMemo } from 'react';
import clsx from 'clsx';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className }) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  // Generate initials from name
  const initials = useMemo(() => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [name]);

  // Generate consistent color based on name
  const bgColor = useMemo(() => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }, [name]);

  if (src) {
    return (
      <img
        className={clsx('inline-block rounded-full', sizeClasses[size], className)}
        src={src}
        alt={name}
      />
    );
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-full text-white font-medium',
        bgColor,
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </span>
  );
};
