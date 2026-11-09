/**
 * Shared, strongly-typed shape for all environment files. Keeping a single
 * interface guarantees dev and prod stay in sync (a missing or mistyped key
 * is a compile error).
 */
export interface AppEnvironment {
  /** True only in production builds. */
  production: boolean;
  /** Display name, useful to distinguish dev vs prod at a glance. */
  appName: string;
  /** Base path for bundled JSON fixtures. */
  mockDataBasePath: string;
  /**
   * Shows the demo-account shortcuts (seeded usernames/passwords) on the login
   * screen. Authentication itself always goes to the backend API; this flag
   * only controls the convenience hints. Keep it false in production.
   */
  useDemoAuth: boolean;
  /** localStorage namespace prefix. */
  storagePrefix: string;
  /** Video completion threshold (percent watched). */
  completionThresholdPercent: number;
  /** Backend API base URL including the /api prefix, with no trailing slash. */
  apiBaseUrl: string;
  /** Enables verbose console logging. */
  enableDebugLogging: boolean;

  buildVersion: string,
}
