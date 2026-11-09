/**
 * Production environment configuration.
 *
 * `angular.json` swaps `environment.ts` for this file during a production
 * build (`ng build`, which defaults to the production configuration here).
 */
import { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  production: true,
  appName: 'LND Platform',
  mockDataBasePath: 'assets/mock/',
  // Never show seeded demo credentials in a production build.
  useDemoAuth: false,
  storagePrefix: 'lnd.',
  completionThresholdPercent: 90,
  // TODO: PLACEHOLDER. Replace with the real production API URL (including
  // /api, no trailing slash) before deploying. This host does not exist.
  apiBaseUrl: 'https://api.example.com/api',
  // No debug logging in production.
  enableDebugLogging: false,
  buildVersion: '0.0.2',
};
