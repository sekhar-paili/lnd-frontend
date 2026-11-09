/**
 * Development environment configuration.
 *
 * This is the DEFAULT file used by `ng build`/`ng serve` in development.
 * For production builds, `angular.json` replaces this file with
 * `environment.prod.ts` via `fileReplacements`.
 *
 * Import it anywhere as:
 *   import { environment } from '../environments/environment';
 */
import { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  production: false,
  appName: 'LND Platform (Dev)',
  // Base path for the bundled JSON fixtures (no backend in this phase).
  mockDataBasePath: 'assets/mock/',
  // Show the seeded demo accounts on the login screen (dev convenience only).
  useDemoAuth: true,
  // localStorage namespace prefix for all demo-only state.
  storagePrefix: 'lnd.',
  // Percent watched at which a video is marked complete.
  completionThresholdPercent: 90,
  // Local backend (backend/ folder, `npm start`). Includes the /api prefix.
  apiBaseUrl: 'http://localhost:3000/api',
  // Verbose logging in development.
  enableDebugLogging: true,
  buildVersion: '0.0.2',
};
