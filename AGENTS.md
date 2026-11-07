# Startline mobile app

Capacitor 8 shell around the live Startline site. Read `README.md` first.

## The rules that matter

- **The app is the website.** `server.url` in `capacitor.config.ts` loads
  startlineau.com (or staging, or a dev server) at runtime. Product changes
  belong in `startline-web-app`; native behaviour is driven from there through
  `lib/capacitor.ts`, which only runs when `Capacitor.isNativePlatform()`.
- **Never let a third-party page take over the webview.**
  - `server.allowNavigation` lists Startline hosts only.
  - Cognito, Google, Apple, Stripe and maps open in the system browser.
  - Google blocks OAuth in embedded webviews (`disallowed_useragent`), so
    social sign-in in particular must stay in the system browser.
- **The callback scheme is fixed.** `com.startlineau.app://auth/callback` is
  registered in:
  - `AndroidManifest.xml`
  - `ios/App/App/Info.plist` (`CFBundleURLTypes`)
  - both Cognito app clients' callback and logout URLs (`startline-infra`)

  Change one and all three must change.
- **Deep-link hosts are listed twice:** `ios/App/App/App.entitlements` and the
  `autoVerify` intent filter. The web app's `/.well-known` files must match
  both.
- **Run `pnpm sync:<env>` after changing `capacitor.config.ts` or a plugin.**
  The generated `capacitor.config.json` files in the native projects are
  ignored by git and must not be edited.
- **App ID `com.startlineau.app` is permanent** once a build is in a store.

## Commands

```
pnpm install
pnpm typecheck
pnpm sync:dev | sync:staging | sync:prod
pnpm open:android | open:ios
pnpm assets              # regenerate icons and splash from assets/
```

Android needs Java 21 and Android SDK 36. iOS builds run on the macOS runner in
`.github/workflows/ios.yml`.

## Secrets

PR workflows read no secrets. Signing keys, the Play service account and the
App Store Connect key are repo secrets used only by the `release` and
`testflight` jobs on `main`, and those jobs stay off until
`ANDROID_RELEASE_ENABLED` / `IOS_RELEASE_ENABLED` are set to `true`.

## Commit authorship

Commits are authored by a person, with the identity configured in this repo.
No agent or bot identities, and no `-c user.name=` overrides.

## Design

Dark only, `#141414` background, signal green `#B3E153` as the only accent, no
emoji. The web app's `design/design.md` is authoritative.
