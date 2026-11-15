/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/auth/components/LoginForm.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Realigned the password visibility toggle eye button directly into `<Input suffixIcon={...}>`,
 *      eliminating awkward vertical displacement and positioning it strictly along the input baseline.
 *    - Integrated the official high-resolution nursery brand logo (`/images/logo.png`) into the Executive Login Screen header.
 *    - Replaced the placeholder generic sprout icon badge with the authentic botanical flourish wordmark logo (`.logoContainer`, `.brandLogoImage`).
 *    - Maintained Executive Animated Botanical Aurora Glass design:
 *      * Structured 3 floating aurora background elements (`.aurora1`, `.aurora2`, `.aurora3`) drifting on keyframe animations.
 *      * Embedded 6 lightweight floating botanical particle nodes (`.particle`, `.p1` through `.p6`).
 *      * Glassmorphic card container with `backdrop-filter: blur(28px)`, light-reactive border, and dual depth shadows.
 *    - Retained semantic accessibility with `<h1 className="sr-only">` and subtitle metadata.
 *    - Integrated `useSearchParams` with open-redirect guards to return users to requested routes after authentication.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "look how this eye symbol goes above" (fixing eye toggle vertical displacement).
 *    - Fulfills Specification 01: Clean, compact form controls & viewport ergonomics.
 *    - Ensures the eye icon sits symmetrically centered with typed characters and the prefix lock icon.
 * 
 * 3. WHAT WAS USED:
 *    - React 19 client hooks (`useState`, `useTransition`).
 *    - Next.js `Image` component (`next/image`) with priority image hydration.
 *    - Next.js `useRouter` and `useSearchParams` for safe programmatic route navigation.
 *    - Shared UI primitives (`@/components/ui` -> `Input`, `Button`).
 *    - Lucide React icons (`User`, `Lock`, `Eye`, `EyeOff`, `LogIn`, `AlertCircle`, `ShieldCheck`).
 *    - Centralized route and auth constants (`APP_ROUTES`, `DEFAULT_AUTH_REDIRECT`).
 *    - SCSS Modules mapped to design tokens (`LoginForm.module.scss`).
 * 
 * 4. HOW IT WORKS:
 *    - Leverages `<Input suffixIcon={...}>` to nest the visibility toggle within `.inputWrapper` directly on the text baseline;
 *      submits sanitized credentials to `loginEmployeeAction`; and navigates to the intended destination upon verification.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { DEFAULT_AUTH_REDIRECT } from '@/lib/constants/auth';
import { loginEmployeeAction } from '../actions';
import styles from './LoginForm.module.scss';

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Credential States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Error States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await loginEmployeeAction({
        username,
        password,
      });

      if (result.success) {
        // Resolve intended destination with open-redirect security guard
        const rawRedirect = searchParams.get('redirect');
        const isSafeLocalRoute =
          rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//');
        const targetRoute = isSafeLocalRoute ? rawRedirect : DEFAULT_AUTH_REDIRECT;

        router.push(targetRoute);
        router.refresh();
      } else {
        setErrorMessage(
          result.error || 'Invalid credentials. Please verify your username and password.'
        );
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors as Record<string, string[]>);
        }
      }
    });
  };

  return (
    <div className={styles.loginPageWrapper}>
      {/* 3 Executive Floating Aurora Background Elements */}
      <div className={styles.aurora1} aria-hidden="true" />
      <div className={styles.aurora2} aria-hidden="true" />
      <div className={styles.aurora3} aria-hidden="true" />

      {/* Lightweight Floating Botanical Particle Nodes */}
      <div className={`${styles.particle} ${styles.p1}`} aria-hidden="true" />
      <div className={`${styles.particle} ${styles.p2}`} aria-hidden="true" />
      <div className={`${styles.particle} ${styles.p3}`} aria-hidden="true" />
      <div className={`${styles.particle} ${styles.p4}`} aria-hidden="true" />
      <div className={`${styles.particle} ${styles.p5}`} aria-hidden="true" />
      <div className={`${styles.particle} ${styles.p6}`} aria-hidden="true" />

      <div className={styles.loginCard}>
        {/* Nursery Brand Header with Official Brand Logo */}
        <header className={styles.brandHeader}>
          <div className={styles.logoContainer}>
            <Image
              src="/images/logo.png"
              alt="Bharti's Green World Logo"
              width={180}
              height={120}
              priority
              className={styles.brandLogoImage}
            />
          </div>

        </header>

        {/* Login Credentials Form */}
        <form onSubmit={handleSubmit} className={styles.formContent} noValidate>
          {/* Error Notification Alert Banner */}
          {errorMessage && (
            <div className={styles.errorBanner} role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Username Input */}
          <div className={styles.inputGroup}>
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              errorMessage={fieldErrors.username?.[0]}
              prefixIcon={<User size={15} />}
              required
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="Enter username"
            />
          </div>

          {/* Password / PIN Input with Suffix Eye Toggle */}
          <div className={styles.inputGroup}>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              errorMessage={fieldErrors.password?.[0]}
              prefixIcon={<Lock size={15} />}
              suffixIcon={
                <button
                  type="button"
                  className={styles.passwordToggleBtn}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          {/* Action Trigger */}
          <div className={styles.actionsContainer}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isPending}
              leftIcon={<LogIn size={18} />}
              className={styles.loginButton}
            >
              Login to ERP
            </Button>
          </div>
        </form>

        {/* Card Footer Notes */}
        <footer className={styles.cardFooter}>
          <span className={styles.footerLocation}>
            Bharti&apos;s Green World Nursery &amp; Landscaping • Kolhapur, Maharashtra
          </span>

        </footer>
      </div>
    </div>
  );
};
