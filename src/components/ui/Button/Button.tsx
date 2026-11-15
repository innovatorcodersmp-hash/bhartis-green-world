/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/components/ui/Button/Button.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built the reusable `<Button>` primitive for all interactive actions in the ERP.
 *    - Implemented variants: `primary`, `secondary`, `danger`, and `outline`.
 *    - Integrated loading spinner feedback, icon slots (`leftIcon`, `rightIcon`), and full-width sizing.
 *    - Strictly enforced the minimum 44px x 44px touch target for mobile PWA usability.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 03 Section 1 requirement preventing raw HTML `<button>` usage.
 *    - Provides plain local English labels ('Save', 'Delete', 'Cancel', 'Add Form') across all views.
 *    - Guarantees visual and functional consistency across both handheld devices and desktops.
 * 
 * 3. WHAT WAS USED:
 *    - React 19 forwardRef and ButtonHTMLAttributes.
 *    - SCSS Modules mapped to design tokens (`Button.module.scss`).
 * 
 * 4. HOW IT WORKS:
 *    - Wraps native button functionality with design token styling, accessibility attributes,
 *      and animated spinner logic during async Server Action mutations.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import styles from './Button.module.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'hibiscus' | 'special';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.btn,
      styles[variant],
      styles[size],
      fullWidth ? styles.fullWidth : '',
      className || '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type={type}
        className={classNames}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            <span>Please wait...</span>
          </>
        ) : (
          <>
            {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
