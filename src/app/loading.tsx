/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/app/loading.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Implemented a seamless in-situ card-level skeleton loader for the Live Nursery Command Center.
 *    - Replaces full-screen splash overlays with localized skeleton pulse blocks inside individual dashboard cards.
 *    - Pre-renders layout placeholders for the title telemetry bar, 4 botanical KPI cards,
 *      and dual analytics chart containers.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "If a loading state is needed, make it a seamless skeleton loader
 *      inside the individual dashboard cards rather than a full-screen overlay."
 *    - Completely eliminates the double-splash render on mobile PWA launches.
 *    - Allows the fixed top header and navigation frame to mount instantly while data streams in.
 * 
 * 3. WHAT WAS USED:
 *    - React functional component with scoped CSS pulse animations.
 * 
 * 4. HOW IT WORKS:
 *    - Next.js App Router renders this fallback immediately inside `<PageLayout>` during route streaming.
 *    - As soon as metrics resolve from Prisma, cards transition smoothly to live operational widgets.
 * 
 * ----------------------------------------------------------------------------
 */

import React from 'react';

export default function Loading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        .skeleton-pulse {
          animation: skeletonPulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Top Banner Skeleton */}
      <div
        className="skeleton-pulse"
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          padding: '0.75rem 1rem',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ height: '18px', width: '220px', background: '#E2E8F0', borderRadius: '4px' }} />
        <div style={{ height: '14px', width: '120px', background: '#EDF2F7', borderRadius: '4px' }} />
      </div>

      {/* 4 Botanical KPI Cards Skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '0.5rem',
        }}
      >
        {[
          { border: '#1B4D3E', bg: '#F0F7F4' },
          { border: '#B45309', bg: '#FFFBEB' },
          { border: '#6D28D9', bg: '#F5F3FF' },
          { border: '#BE185D', bg: '#FDF2F8' },
        ].map((item, idx) => (
          <div
            key={idx}
            className="skeleton-pulse"
            style={{
              background: '#ffffff',
              border: '1px solid #E2E8F0',
              borderLeft: `3px solid ${item.border}`,
              borderRadius: '8px',
              padding: '0.75rem 0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '84px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ height: '11px', width: '75px', background: '#E2E8F0', borderRadius: '3px' }} />
              <div style={{ height: '22px', width: '100px', background: '#CBD5E1', borderRadius: '4px' }} />
              <div style={{ height: '10px', width: '60px', background: '#EDF2F7', borderRadius: '3px' }} />
            </div>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: item.bg,
              }}
            />
          </div>
        ))}
      </div>

      {/* Analytics Charts Row Skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '0.75rem',
        }}
      >
        <div
          className="skeleton-pulse"
          style={{
            background: '#ffffff',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '1rem',
            height: '240px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ height: '16px', width: '160px', background: '#E2E8F0', borderRadius: '4px' }} />
          <div style={{ flex: 1, background: '#F8FAF9', borderRadius: '6px' }} />
        </div>

        <div
          className="skeleton-pulse"
          style={{
            background: '#ffffff',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '1rem',
            height: '240px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ height: '16px', width: '150px', background: '#E2E8F0', borderRadius: '4px' }} />
          <div style={{ flex: 1, background: '#F8FAF9', borderRadius: '6px' }} />
        </div>
      </div>
    </div>
  );
}

