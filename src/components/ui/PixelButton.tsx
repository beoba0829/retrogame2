import { forwardRef, ButtonHTMLAttributes } from 'react';
import { sound } from '@/utils/sound';

type Variant = 'gold' | 'pink' | 'cyan' | 'purple' | 'ghost';

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  silent?: boolean;
}

const variantClass: Record<Variant, string> = {
  gold: '',
  pink: 'pixel-btn-pink',
  cyan: 'pixel-btn-cyan',
  purple: 'pixel-btn-purple',
  ghost: 'pixel-btn-ghost',
};

export const PixelButton = forwardRef<HTMLButtonElement, PixelButtonProps>(
  function PixelButton({ variant = 'gold', silent, className, children, onClick, ...rest }, ref) {
    return (
      <button
        ref={ref}
        className={`pixel-btn ${variantClass[variant]} ${className ?? ''}`}
        onClick={(e) => {
          if (!silent) sound.tap();
          onClick?.(e);
        }}
        onMouseEnter={() => {
          if (!silent) sound.tap();
        }}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
