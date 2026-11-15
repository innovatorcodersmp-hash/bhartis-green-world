/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file next.config.ts
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Configured Next.js framework build options for Bharti's Green World ERP.
 *    - Disabled development tools indicator icon (`devIndicators: false`) to remove the floating black 'N' circle
 *      from the bottom-left corner of the screen during dev and PWA sessions.
 *    - Enabled `images.unoptimized: true` to prevent `/_next/image` proxy failures.
 *    - Configured `allowedDevOrigins` to permit cross-device LAN and Ngrok tunnel access.
 *    - Configured `sassOptions.includePaths` pointing to centralized SASS token directories.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "remove this icon" (the floating black circular 'N' Next.js dev indicator).
 *    - Guarantees an uncluttered, production-grade visual experience across all development and PWA previews.
 * 
 * 3. WHAT WAS USED:
 *    - Next.js `NextConfig` type definition and Node.js `path` resolution.
 * 
 * 4. HOW IT WORKS:
 *    - Instructs Next.js compiler not to inject the dev indicators portal/overlay in the client bundle.
 * 
 * ----------------------------------------------------------------------------
 */

import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '10.21.228.43',
    'suctional-misrely-joni.ngrok-free.dev',
    '*.ngrok-free.dev',
    '*.ngrok-free.app',
  ],
  devIndicators: false,
  images: {
    unoptimized: true,
  },
  sassOptions: {
    includePaths: [
      path.join(__dirname, 'src/styles'),
      path.join(__dirname, 'src/styles/abstract'),
    ],
    silenceDeprecations: ['import'],
  },
};

export default nextConfig;
