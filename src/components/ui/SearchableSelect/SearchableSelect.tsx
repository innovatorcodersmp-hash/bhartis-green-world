/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/components/ui/SearchableSelect/SearchableSelect.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built and refactored `<SearchableSelect>` into an enterprise minimalist underline dropdown component.
 *    - Implemented a clean bottom-underline styling (`border: none; border-bottom: 1.5px solid #D1D5DB;`) with transparent background.
 *    - On focus or opening, dynamically transitions to a 2px Forest Green baseline matching `<Input>`.
 *    - Preserved 16px minimum font size on trigger to strictly prevent mobile viewport zoom.
 *    - Maintained a clean, shadow-elevated floating suggestions dropdown popup with instant search filtering.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills the Enterprise Minimalist UI refactor directive for modern, high-density ERP ergonomics.
 *    - Unifies form styling across text fields and searchable select pickers without heavy boxed borders.
 *    - Eliminates modal dialogs in favor of high-density inline controls.
 * 
 * 3. WHAT WAS USED:
 *    - React client hooks (`useState`, `useRef`, `useEffect`, `useMemo`).
 *    - Lucide React icons (`ChevronDown`, `Check`, `Search`, `X`).
 *    - SCSS Modules mapped to design tokens (`SearchableSelect.module.scss`).
 * 
 * 4. HOW IT WORKS:
 *    - Underline trigger activates the elevated suggestions list, filters options dynamically, and updates parent form state.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import styles from './SearchableSelect.module.scss';

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
}

export interface SearchableSelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorMessage?: string;
  required?: boolean;
  disabled?: boolean;
  isClearable?: boolean;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select option...',
  helperText,
  errorMessage,
  required = false,
  disabled = false,
  isClearable = true,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const lower = searchTerm.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(lower) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(lower))
    );
  }, [options, searchTerm]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className={`${styles.container} ${className || ''}`}>
      {label && (
        <div className={styles.labelWrapper}>
          <label className={styles.label}>
            {label}
            {required && <span className={styles.requiredStar}>*</span>}
          </label>
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={[
          styles.trigger,
          isOpen ? styles.open : '',
          disabled ? styles.disabled : '',
          errorMessage ? styles.hasError : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={styles.triggerContent}>
          {selectedOption ? (
            <span>
              {selectedOption.label}
              {selectedOption.subLabel && (
                <small style={{ marginLeft: '0.35rem', color: '#6B7280', fontWeight: 400 }}>
                  ({selectedOption.subLabel})
                </small>
              )}
            </span>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
        </span>

        <span className={styles.triggerIcons}>
          {isClearable && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              className={styles.clearButton}
              onClick={handleClear}
              aria-label="Clear selection"
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown
            size={14}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 150ms ease',
            }}
          />
        </span>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          <div className={styles.searchContainer}>
            <Search size={13} className={styles.searchIcon} />
            <input
              ref={searchInputRef}
              type="text"
              className={styles.searchInput}
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search options"
            />
          </div>

          <div className={styles.optionsList}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    className={`${styles.optionItem} ${
                      isSelected ? styles.selected : ''
                    }`}
                    onClick={() => handleSelect(opt.value)}
                  >
                    <div>
                      <div>{opt.label}</div>
                      {opt.subLabel && (
                        <div style={{ fontSize: '0.6875rem', color: '#6B7280' }}>
                          {opt.subLabel}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check size={14} />}
                  </div>
                );
              })
            ) : (
              <div className={styles.noOptions}>
                <Search size={13} />
                <span>No options found</span>
              </div>
            )}
          </div>
        </div>
      )}

      {errorMessage ? (
        <p className={styles.errorMessage} role="alert">
          {errorMessage}
        </p>
      ) : helperText ? (
        <p style={{ fontSize: '0.6875rem', color: '#6B7280' }}>{helperText}</p>
      ) : null}
    </div>
  );
};
