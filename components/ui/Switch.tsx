'use client';

import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  id,
  label,
  description,
  size = 'md',
  className,
}: SwitchProps) {
  const sizes = {
    sm: {
      track: 'w-8 h-4',
      thumb: 'h-3 w-3',
      thumbTranslate: 'translate-x-4',
      thumbStart: 'translate-x-0.5',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'h-5 w-5',
      thumbTranslate: 'translate-x-5',
      thumbStart: 'translate-x-0.5',
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'h-6 w-6',
      thumbTranslate: 'translate-x-7',
      thumbStart: 'translate-x-0.5',
    },
  };

  const currentSize = sizes[size];

  const handleClick = () => {
    if (!disabled) {
      onCheckedChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const switchElement = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={label && id ? `${id}-label` : undefined}
      aria-describedby={description && id ? `${id}-description` : undefined}
      id={id}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        currentSize.track,
        checked ? 'bg-primary-600' : 'bg-slate-200',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none inline-block transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
          currentSize.thumb,
          checked ? currentSize.thumbTranslate : currentSize.thumbStart
        )}
      />
    </button>
  );

  if (label || description) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          {label && (
            <span
              id={id ? `${id}-label` : undefined}
              className={cn(
                'text-sm font-medium text-slate-900',
                disabled && 'opacity-50'
              )}
            >
              {label}
            </span>
          )}
          {description && (
            <span
              id={id ? `${id}-description` : undefined}
              className={cn('text-sm text-slate-500', disabled && 'opacity-50')}
            >
              {description}
            </span>
          )}
        </div>
        {switchElement}
      </div>
    );
  }

  return switchElement;
}

export default Switch;
