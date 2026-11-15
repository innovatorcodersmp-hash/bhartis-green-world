/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/components/ui/MetricCard/MetricCard.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built and refactored the ultra-compact `<MetricCard>` component for dashboard summaries and module KPI bars.
 *    - Introduced botanical flower accent variants: `rose` (coral), `marigold` (amber), `lavender` (violet), and `cornflower` (blue).
 *    - Reduced vertical footprint to 0.5rem 0.75rem padding, 18px counter typography, and 26px x 26px icon badges.
 *    - Structured primary metrics, status badges, directional micro-percentage trends, and secondary descriptions.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "TASK: INTRODUCE BOTANICAL FLOWER ACCENT COLORS ACROSS ERP MODULES".
 *    - Breaks excessive green monochrome saturation across KPI summary rows with balanced botanical accents.
 *    - Standardizes summary metrics into an ultra-low-profile, high-density card.
 * 
 * 3. WHAT WAS USED:
 *    - React 19 functional component.
 *    - Lucide React directional icons (`ArrowUpRight`, `ArrowDownRight`, `Minus`).
 *    - SCSS Modules mapped to design tokens (`MetricCard.module.scss`).
 * 
 * 4. HOW IT WORKS:
 *    - Receives metric values and renders them in slim 18px typography accompanied by status badges and micro trend indicators.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import styles from './MetricCard.module.scss';

export type MetricVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'rose'
  | 'marigold'
  | 'lavender'
  | 'cornflower'
  | 'hibiscus'
  | 'coral'
  | 'sky'
  | 'sunflower';

export interface MetricTrend {
  direction: 'up' | 'down' | 'neutral';
  text: string;
}

export interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  variant?: MetricVariant;
  trend?: MetricTrend;
  description?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  variant = 'default',
  trend,
  description,
  className,
}) => {
  return (
    <div className={`${styles.card} ${styles[variant] || ''} ${className || ''}`}>
      <div className={styles.headerRow}>
        <span className={styles.label}>{label}</span>
        {icon && (
          <div className={`${styles.iconBadge} ${styles[variant] || ''}`} aria-hidden="true">
            {icon}
          </div>
        )}
      </div>

      <div className={styles.value}>{value}</div>

      {(trend || description) && (
        <div className={styles.footerRow}>
          {trend && (
            <span
              className={`${styles.trendBadge} ${
                trend.direction === 'up'
                  ? styles.positive
                  : trend.direction === 'down'
                  ? styles.negative
                  : styles.neutral
              }`}
            >
              {trend.direction === 'up' && <ArrowUpRight size={10} />}
              {trend.direction === 'down' && <ArrowDownRight size={10} />}
              {trend.direction === 'neutral' && <Minus size={10} />}
              <span>{trend.text}</span>
            </span>
          )}
          {description && <span className={styles.description}>{description}</span>}
        </div>
      )}
    </div>
  );
};
