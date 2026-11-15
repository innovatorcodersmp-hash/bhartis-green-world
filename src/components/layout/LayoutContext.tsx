/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/components/layout/LayoutContext.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented the reactive LayoutContext and LayoutProvider for Bharti's Green World ERP.
 *    - Enabled dynamic page title, subtitle, and primaryAction registration from route client shells.
 *    - Created custom hook `useSetPageHeader` for seamless header metadata injection.
 * 
 * 2. WHY IT WAS DONE:
 *    - Allows the master `<PageLayout>` in root layout to dynamically display feature-specific
 *      titles (e.g. 'Plant Nursery') and primary action buttons (e.g. '+ Add Plant') without double headers.
 *    - Keeps route pages lightweight (under 50-80 lines) conforming to Section 1.2 of Frontend Architecture guidelines.
 * 
 * 3. WHAT WAS USED:
 *    - React Context API (`createContext`, `useContext`, `useState`, `useEffect`).
 * 
 * 4. HOW IT WORKS:
 *    - `<LayoutProvider>` wraps the root shell.
 *    - Child pages invoke `useSetPageHeader({ title, subtitle, primaryAction })` to update the top action bar.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface LayoutHeaderConfig {
  title?: string;
  subtitle?: string;
  primaryAction?: ReactNode;
}

interface LayoutContextValue extends LayoutHeaderConfig {
  setHeaderConfig: (config: LayoutHeaderConfig) => void;
  resetHeaderConfig: () => void;
}

const LayoutContext = createContext<LayoutContextValue | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<LayoutHeaderConfig>({});

  const setHeaderConfig = (newConfig: LayoutHeaderConfig) => {
    setConfig(newConfig);
  };

  const resetHeaderConfig = () => {
    setConfig({});
  };

  return (
    <LayoutContext.Provider
      value={{
        title: config.title,
        subtitle: config.subtitle,
        primaryAction: config.primaryAction,
        setHeaderConfig,
        resetHeaderConfig,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayoutContext = (): LayoutContextValue => {
  const context = useContext(LayoutContext);
  if (!context) {
    return {
      title: undefined,
      subtitle: undefined,
      primaryAction: undefined,
      setHeaderConfig: () => {},
      resetHeaderConfig: () => {},
    };
  }
  return context;
};

export const useSetPageHeader = (config: LayoutHeaderConfig) => {
  const { setHeaderConfig, resetHeaderConfig } = useLayoutContext();

  React.useEffect(() => {
    setHeaderConfig(config);
    return () => {
      resetHeaderConfig();
    };
  }, [config.title, config.subtitle, config.primaryAction]);
};
