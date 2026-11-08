# Startline mobile app

Startline for iOS and Android. It's a [Capacitor](https://capacitorjs.com) shell
around the live site: the app opens startlineau.com in a native webview, so a
web deploy updates the app with no store release. Store releases are only
needed for native changes (icons, permissions, plugins, the config in this repo).

| | |
|---|---|
| App ID | `com.startlineau.app` |
| Capacitor | 8 |
| Web app | [startline-web-app](https://github.com/StartlineAU/startline-web-app), which detects the shell through `lib/capacitor.ts` |

## Environments

`capacitor.config.ts` picks the site at sync time from `CAP_ENV`:

| Command | Loads | Use |
|---|---|---|
| `pnpm sync:dev` | your local web dev server (`http://10.0.2.2:3000` from the Android emulator) | development |
| `pnpm sync:staging` | `$CAP_STAGING_URL` (the Amplify branch URL) | internal testing |
| `pnpm sync:prod` | https://startlineau.com | store builds |

The value is copied into the native projects, so run a `sync` after switching.
For a real phone in dev, point it at your machine's LAN address:
`CAP_DEV_URL=http://192.168.x.x:3000 pnpm sync:dev`, and start the web app with
`pnpm dev -H 0.0.0.0`.

Production is in waitlist mode until launch, so use staging for testing.

Staging is the Amplify branch domain for `main`, not a `staging.` subdomain:
that name was never delegated and does not resolve. The host carries the
Amplify app ID, and this repo is public, so it is not committed. Set it for a
staging sync:

```bash
CAP_STAGING_URL=https://<branch>.<app-id>.amplifyapp.com pnpm sync:staging
```

CI reads the `CAP_STAGING_URL` repository variable, so releases keep working.
Ask a maintainer for the value.

## Setup

- Node 22+ and pnpm 11 (`corepack enable`)
- **Android:** a current Android Studio (it bundles the Java 21 Capacitor 8 needs) with Android SDK 36
- **iOS:** a Mac with Xcode 16+, or let CI build it (below)

```bash
pnpm install
CAP_STAGING_URL=https://<branch>.<app-id>.amplifyapp.com pnpm sync:staging
pnpm open:android        # or: pnpm run:android to pick an emulator or device
pnpm open:ios            # Mac only
```

## How the app talks to the site

Native behaviour lives in the web app, because that's the code the webview runs:

- **External links:** `components/NativeLinkHandler.tsx` sends links to other
  sites to the system browser.
- **Back button, status bar, splash screen:** set up by the web app when it
  detects the shell.
- **Social sign-in:** Google refuses OAuth inside embedded webviews, so Cognito's
  hosted page opens in the system browser (SFSafariViewController / Custom Tabs).
  It returns to `com.startlineau.app://auth/callback`, which both native projects
  register, and the web app finishes sign-in in the webview.
- **Deep links:** startlineau.com links to events, Activity, check-in and the
  organiser portal open the app. iOS checks `applinks:` in
  `ios/App/App/App.entitlements` against `/.well-known/apple-app-site-association`;
  Android checks the `autoVerify` intent filter in `AndroidManifest.xml` against
  `/.well-known/assetlinks.json`. The web app serves both files.

## Icons and splash

`assets/` holds the source art. `scripts/make-icons.py` draws it from the
Startline mark's vector coordinates. To change it:

```bash
python scripts/make-icons.py   # rewrite assets/*.png
pnpm assets                    # every iOS and Android size
```

## Releases

CI builds every PR without secrets: an Android debug APK (downloadable from the
run) and an unsigned iOS simulator build. Signed builds run on `main` only,
behind repo variables, so nothing tries to upload before the store accounts exist.

### Android: Play internal track
1. Create the app `com.startlineau.app` in the Play Console.
2. Create an upload keystore (`keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`) and keep it somewhere safe outside the repo.
3. Add repo secrets `ANDROID_KEYSTORE_BASE64` (the keystore, base64), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` and `ANDROID_KEY_PASSWORD`, plus `PLAY_SERVICE_ACCOUNT_JSON` for a service account with release access.
4. Upload the first bundle by hand. Play requires it before the API can publish.
5. Set the repo variable `ANDROID_RELEASE_ENABLED=true`. Optionally set `ANDROID_RELEASE_ENV=prod`; it defaults to staging.
6. Put Play App Signing's SHA-256 certificate fingerprint into the web app's `public/.well-known/assetlinks.json`.

### iOS: TestFlight
1. Join the Apple Developer Program and create the App ID `com.startlineau.app` with the **Associated Domains** capability.
2. Create the app in App Store Connect.
3. Create an App Store Connect API key (App Manager role). Add repo secrets `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8` (the `.p8` contents) and `APPLE_TEAM_ID`.
4. Set the repo variable `IOS_RELEASE_ENABLED=true`. Optionally set `IOS_RELEASE_ENV=prod`.
5. Put the Team ID into the web app's `public/.well-known/apple-app-site-association`.

Build numbers come from the CI run number. The version name is in
`package.json`, `android/app/build.gradle` and the Xcode project's `MARKETING_VERSION`.
