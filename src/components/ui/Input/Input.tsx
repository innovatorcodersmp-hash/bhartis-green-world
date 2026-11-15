/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/components/ui/Input/Input.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built and refactored `<Input>` into an enterprise minimalist baseline component.
 *    - Implemented a clean bottom-underline styling (`border: none; border-bottom: 1.5px solid #D1D5DB;`) with transparent background.
 *    - On focus, dynamically transitions to a 2px Forest Green baseline.
 *    - Strictly preserved 16px minimum font size to eliminate iOS Safari/Android focus auto-zoom.
 *    - Supported top label, required asterisks, helper notes, error messaging, and prefix/suffix icon slots.
 * 
 * 2. WHY IT WAS DONE:
 *    - Complies with the Enterprise Minimalist UI refactor directive for modern, high-density ERP ergonomics.
 *    - Delivers a sleek aesthetic that blends seamlessly into card surfaces without heavy box borders.
 *    - Replaces raw HTML controls across all module forms (`<PlantForm>`, `<CustomerForm>`, etc.).
 * 
 * 3. WHAT WAS USED:
 *    - React 19 forwardRef and InputHTMLAttributes.
 *    - SCSS Modules mapped to design tokens (`Input.module.scss`).
 * 
 * 4. HOW IT WORKS:
 *    - Renders the structured label, underline input wrapper, and validation feedback with appropriate ARIA accessibility attributes.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { forwardRef, InputHTMLAttributes, useId } from 'react';
import styles from './Input.module.scss';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      prefixIcon,
      suffixIcon,
      required,
      id,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const inputClasses = [
      styles.input,
      prefixIcon ? styles.hasPrefix : '',
      suffixIcon ? styles.hasSuffix : '',
      errorMessage ? styles.hasError : '',
      className || '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={styles.container}>
        {label && (
          <div className={styles.labelWrapper}>
            <label htmlFor={inputId} className={styles.label}>
              {label}
              {required && <span className={styles.requiredStar}>*</span>}
            </label>
          </div>
        )}

        <div className={styles.inputWrapper}>
          {prefixIcon && <span className={styles.prefixIcon}>{prefixIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            className={inputClasses}
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={
              errorMessage ? errorId : helperText ? helperId : undefined
            }
            {...props}
          />
          {suffixIcon && <span className={styles.suffixIcon}>{suffixIcon}</span>}
        </div>

        {errorMessage ? (
          <p id={errorId} className={styles.errorMessage} role="alert">
            {errorMessage}
          </p>
        ) : helperText ? (
          <p id={helperId} className={styles.helperText}>
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
