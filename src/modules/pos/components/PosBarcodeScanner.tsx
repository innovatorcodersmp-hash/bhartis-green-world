/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/modules/pos/components/PosBarcodeScanner.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built `<PosBarcodeScanner>`, a high-speed smartphone camera QR/barcode scanner for the POS Cashier Counter.
 *    - Integrated `html5-qrcode` to interface directly with mobile device video streams (back camera `environment` mode).
 *    - Implemented intelligent barcode matching against loaded botanical inventory (by SKU, Plant ID, Botanical Name, or QR URLs).
 *    - Added synthesized Web Audio API sound effects (880Hz confirmation beep on match, 300Hz buzz on unknown code).
 *    - Provided a 1.2s scan cooldown to prevent rapid repetitive duplicate additions.
 *    - Handled clean camera stream shutdown and unmounting to release device media hardware.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 01: "Mobile PWA Standards" and Specification 08: "Dependency Governance".
 *    - Enables retail cashiers at Bharti's Green World Nursery in Kolhapur to instantly scan pot tags and sapling QR codes
 *      directly with mobile smartphones or counter webcams without purchasing expensive hardware laser guns.
 * 
 * 3. WHAT WAS USED:
 *    - `html5-qrcode` (`Html5Qrcode`).
 *    - Web Audio API (`window.AudioContext`) for instant auditory cashier confirmation.
 *    - Lucide React icons (`Camera`, `X`, `CheckCircle2`, `AlertTriangle`, `Loader2`).
 * 
 * 4. HOW IT WORKS:
 *    - Mounts a camera canvas inside the viewfinder, initializes the video stream, parses QR frames, matches botanical SKUs,
 *      triggers auditory feedback, passes the matched `Plant` to the parent form, and displays a temporary notification.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Plant } from '../types';
import styles from './PosBarcodeScanner.module.scss';

export interface PosBarcodeScannerProps {
  plants: Plant[];
  onPlantScanned: (plant: Plant) => void;
  onClose: () => void;
}

export const PosBarcodeScanner: React.FC<PosBarcodeScannerProps> = ({
  plants,
  onPlantScanned,
  onClose,
}) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedCodeRef = useRef<string | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const noticeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Play synthesized audio tone for instant cashier feedback
  const playBeep = useCallback((isSuccess: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isSuccess ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(isSuccess ? 880 : 300, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isSuccess ? 0.09 : 0.15));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + (isSuccess ? 0.09 : 0.15));
    } catch {
      // Audio playback fails gracefully if blocked by browser policy
    }
  }, []);

  // Match scanned QR/Barcode string against loaded botanical plants
  const matchPlant = useCallback(
    (scannedText: string): Plant | undefined => {
      const clean = scannedText.trim();
      const lower = clean.toLowerCase();

      // 1. Exact ID match
      const byId = plants.find((p) => p.id === clean || p.id.toLowerCase() === lower);
      if (byId) return byId;

      // 2. Exact SKU match (case-insensitive)
      const bySku = plants.find((p) => p.sku && p.sku.toLowerCase() === lower);
      if (bySku) return bySku;

      // 3. Name match (case-insensitive)
      const byName = plants.find((p) => p.name.toLowerCase() === lower);
      if (byName) return byName;

      // 4. Substring / QR URL match (e.g. domain/plants/{id} or ?sku={sku})
      for (const plant of plants) {
        if (clean.includes(plant.id)) return plant;
        if (plant.sku && clean.toLowerCase().includes(plant.sku.toLowerCase())) return plant;
      }

      return undefined;
    },
    [plants]
  );

  // Process decoded barcode text
  const handleDecodedText = useCallback(
    (decodedText: string) => {
      const now = Date.now();
      // Enforce strict 2-second cooldown on identical barcode frames
      if (
        lastScannedCodeRef.current === decodedText &&
        now - lastScannedTimeRef.current < 2000
      ) {
        return;
      }

      lastScannedCodeRef.current = decodedText;
      lastScannedTimeRef.current = now;

      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }

      const matchedPlant = matchPlant(decodedText);

      if (matchedPlant) {
        playBeep(true);
        onPlantScanned(matchedPlant);
        setErrorNotice(null);
        setSuccessNotice(`Added: ${matchedPlant.name} (${matchedPlant.sku}) - ₹${matchedPlant.price}`);

        noticeTimerRef.current = setTimeout(() => {
          setSuccessNotice(null);
        }, 2000);
      } else {
        playBeep(false);
        setSuccessNotice(null);
        setErrorNotice(`Unknown code "${decodedText}". No matching botanical cultivar found.`);

        noticeTimerRef.current = setTimeout(() => {
          setErrorNotice(null);
        }, 4000);
      }
    },
    [matchPlant, onPlantScanned, playBeep]
  );

  useEffect(() => {
    let isMounted = true;
    const scannerElementId = 'pos-barcode-reader';

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(scannerElementId);
        scannerRef.current = html5QrCode;

        const scanConfig = {
          fps: 10,
          qrbox: { width: 200, height: 200 },
          aspectRatio: 1.0,
        };

        // Try environment/back camera first for mobile devices
        try {
          await html5QrCode.start(
            { facingMode: 'environment' },
            scanConfig,
            (decodedText) => {
              if (isMounted) handleDecodedText(decodedText);
            },
            () => {
              // Ignore frame errors
            }
          );
        } catch {
          // Fallback to any available device camera (e.g. desktop webcam)
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            // Pick rear camera or first available
            const selectedCamera = devices[devices.length - 1];
            await html5QrCode.start(
              selectedCamera.id,
              scanConfig,
              (decodedText) => {
                if (isMounted) handleDecodedText(decodedText);
              },
              () => {
                // Ignore frame errors
              }
            );
          } else {
            throw new Error('No video camera detected on this device.');
          }
        }

        if (isMounted) {
          setIsInitializing(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setIsInitializing(false);
          const msg = err instanceof Error ? err.message : 'Unable to access camera.';
          setCameraError(msg);
        }
      }
    };

    // Small delay to ensure DOM element is mounted
    const timeout = setTimeout(startScanner, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => {
              scannerRef.current?.clear();
            }).catch(() => {
              // Silent cleanup
            });
          } else {
            scannerRef.current.clear();
          }
        } catch {
          // Ignore unmount error
        }
      }
    };
  }, [handleDecodedText]);

  const handleStopAndClose = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current?.clear();
          onClose();
        })
        .catch(() => {
          onClose();
        });
    } else {
      onClose();
    }
  };

  return (
    <div className={styles.scannerCard}>
      <div className={styles.scannerHeader}>
        <div className={styles.titleArea}>
          <Camera size={16} />
          <span>Live Plant QR & Barcode Scanner</span>
        </div>

        <button
          type="button"
          className={styles.closeButton}
          onClick={handleStopAndClose}
          aria-label="Close Camera Scanner"
        >
          <X size={15} />
          <span>Close Scanner</span>
        </button>
      </div>

      {cameraError ? (
        <div className={styles.errorFeedback}>
          <AlertTriangle size={16} />
          <span>{cameraError}</span>
        </div>
      ) : (
        <>
          <div className={styles.viewfinderContainer}>
            <div id="pos-barcode-reader" className={styles.qrReaderTarget} />

            {/* Viewfinder reticle and laser sweep overlay */}
            <div className={styles.reticleOverlay}>
              <div className={styles.laserLine} />
            </div>
          </div>

          {isInitializing ? (
            <div className={styles.statusMessage}>
              <Loader2 size={14} className="spin-animation" />
              <span>Starting camera video feed...</span>
            </div>
          ) : (
            <div className={styles.statusMessage}>
              <span>Align plant pot QR code or SKU barcode within the green frame.</span>
            </div>
          )}

          {successNotice && (
            <div className={styles.successFeedback} role="status">
              <CheckCircle2 size={16} />
              <span>{successNotice}</span>
            </div>
          )}

          {errorNotice && (
            <div className={styles.errorFeedback} role="alert">
              <AlertTriangle size={16} />
              <span>{errorNotice}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
