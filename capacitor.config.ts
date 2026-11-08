import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Startline's app is a native shell around the live site. The web app is
 * server-rendered Next.js on Amplify, so there is nothing to bundle: the
 * webview loads startlineau.com, and a web deploy updates the app with no
 * store release. The web app detects the shell through lib/capacitor.ts.
 *
 * Which site the shell loads is fixed at `cap sync` time by CAP_ENV:
 *
 *   dev      the web app's dev server on this machine (cleartext, dev only)
 *   staging  the Amplify branch domain, from CAP_STAGING_URL (internal testing)
 *   prod     https://startlineau.com                     (store builds)
 *
 * Run `pnpm sync:<env>` after changing it; the value is copied into the
 * native projects, not read at runtime.
 */

type AppEnv = "dev" | "staging" | "prod";

const env = (process.env.CAP_ENV ?? "prod") as AppEnv;
if (!["dev", "staging", "prod"].includes(env)) {
  throw new Error(`CAP_ENV must be dev, staging or prod, got "${env}".`);
}

// The Android emulator reaches the host machine on 10.0.2.2. A real phone on
// the same network needs the machine's LAN address: set CAP_DEV_URL.
const DEV_URL = process.env.CAP_DEV_URL ?? "http://10.0.2.2:3000";

// Staging is the Amplify branch domain for the `main` branch; there is no
// staging subdomain. The host carries the Amplify app ID, and this repo is
// public, so the URL is supplied at sync time instead of committed:
//
//   CAP_STAGING_URL=https://<branch>.<app-id>.amplifyapp.com pnpm sync:staging
//
// CI reads the CAP_STAGING_URL repository variable.
const STAGING_URL = process.env.CAP_STAGING_URL ?? "";

// allowNavigation needs the host, and a malformed value should fail here rather
// than produce a staging build that opens every in-site link in the browser.
function stagingHost(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`CAP_STAGING_URL must be a full URL, got "${url}".`);
  }
  if (parsed.protocol !== "https:") {
    throw new Error(`CAP_STAGING_URL must be https, got "${url}".`);
  }
  return parsed.host;
}

const STAGING_HOST = STAGING_URL ? stagingHost(STAGING_URL) : "";
if (env === "staging" && !STAGING_HOST) {
  throw new Error(
    "CAP_ENV=staging needs CAP_STAGING_URL, the Amplify branch URL for the main branch.",
  );
}

const SITE: Record<AppEnv, string> = {
  dev: DEV_URL,
  staging: STAGING_URL,
  prod: "https://startlineau.com",
};

// Pages the webview may navigate to itself. Everything else (Cognito's hosted
// sign-in, Google, Apple, Stripe, maps, mail) is opened in the system browser
// by the web app, so it never takes over the app or trips Google's embedded
// webview block.
const ALLOW_NAVIGATION: Record<AppEnv, string[]> = {
  dev: ["10.0.2.2", "localhost", "*.startlineau.com"],
  staging: STAGING_HOST ? [STAGING_HOST] : [],
  prod: ["startlineau.com", "organiser.startlineau.com"],
};

const BACKGROUND = "#141414";

const config: CapacitorConfig = {
  appId: "com.startlineau.app",
  appName: "Startline",
  // Only the offline fallback lives here; the app itself is the live site.
  webDir: "www",
  backgroundColor: BACKGROUND,
  // Lets the server tell app traffic from a mobile browser.
  appendUserAgent: "StartlineApp",
  server: {
    url: SITE[env],
    cleartext: env === "dev",
    allowNavigation: ALLOW_NAVIGATION[env],
    errorPath: "index.html",
  },
  android: {
    backgroundColor: BACKGROUND,
    allowMixedContent: env === "dev",
  },
  ios: {
    backgroundColor: BACKGROUND,
    // Keeps the site clear of the notch and home indicator without every page
    // having to pad itself with env(safe-area-inset-*).
    contentInset: "automatic",
    // No Safari-style long-press previews: they open pages outside the app.
    allowsLinkPreview: false,
  },
  plugins: {
    SplashScreen: {
      // The web app hides it once the first page has rendered, so the athlete
      // never sees a white flash. The timeout is a safety net if the site is down.
      launchAutoHide: true,
      launchShowDuration: 3000,
      backgroundColor: BACKGROUND,
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: BACKGROUND,
      overlaysWebView: false,
    },
  },
};

export default config;
