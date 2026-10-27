# OptionPilot mobile

Expo (SDK 58) and Expo Router app for iOS and Android. It shares types and design tokens with the website through `@optionpilot/shared`.

## Run it

Expo SDK 58 needs Node 22.13 or newer.

```bash
npm ci                      # from the repository root
cd apps/mobile
npx expo start              # then press i or a, or scan the QR code with a development build
```

Expo Go does not include every native module used here, so use a development build (`eas build --profile development`) for a real device.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npx expo-doctor
npx expo export --platform ios --platform android --output-dir dist-native
```

`.github/workflows/mobile.yml` runs the same commands.

## Sign-in

Sign-in is email + password, with a one-time code to verify a new account. Google sign-in is not in v1.

- `EXPO_PUBLIC_API_BASE_URL` sets the API base URL (default `https://www.optionpilot.tech`; use `www`, the apex is rejected as an Origin).
- The session token from the `set-auth-token` header is kept in `expo-secure-store`. It is exchanged at `/api/auth/token` for the 15-minute JWT, which stays in memory and is refreshed when under about 60 s remain.
- If the server does not send that header, the app falls back to a cookie session behind the same interface (`lib/auth/strategy.ts`).
- All API calls go through `apiFetch` (`lib/auth/apiFetch.ts`). A 401 or a redirect signs the user out.

## Layout

- `app/` Expo Router routes. `(onboarding)` is shown once, `(app)` holds the four tabs and the Appearance sheet.
- `components/ui` reusable primitives, `components/brand` the logo and splash, `components/navigation` the floating tab bar.
- `lib/api` the typed client for the website's routes and the React Query hooks, `lib/analysis` the analysis model and the analyze flow, `lib/chart` the payoff chart's layout maths (pure, tested apart from the Skia drawing in `components/chart`).
- `lib/theme` the theme provider. Colours come from `@optionpilot/shared` and are mirrored in `global.css`, which `__tests__/global-css.test.ts` keeps in sync.
- `scripts/generate-brand-assets.mjs` draws the app icon, adaptive icon, splash images and favicon from the website logo. Run `npm run icons` after changing the logo or palette.

## Compare and recommend

The analysis screen opens Compare (every strategy, or two views side by side) and Recommend ("Which strategy fits?", a form sheet that scores a view and a loss budget through `POST /api/decide`, then the result screen). Their ranking is the website's: the server ranks (`scoreStrategies`, `rankDecision`), and the order, filters, search, and the saved single or two-view result come from the pure functions in `packages/shared/src/compare.ts`, which the website's strategy explorer uses too. `useDecide` writes the answer into the cached analysis, so every screen shows the new ranking at once. `__tests__/compare-recommend-lib.test.ts` and `packages/shared/src/compare.test.ts` check the same order for the same analysis, with the real scoring on a fixture.

## Styling

Styles use [Uniwind](https://uniwind.dev) (Tailwind v4 classes on React Native components). Theme variables live in `global.css`; `light`, `dark` and `system` are switched at runtime from Settings, Appearance.

## Before a store release

`app.config.ts` and `eas.json` use the bundle id and package `tech.optionpilot.app` and the URL scheme `optionpilot`. The Apple and Google values in `eas.json` (`REPLACE_WITH_...`) are placeholders and must be filled in.

## Preview in a browser

For layout checks only: `npm run setup:web` once (it copies the CanvasKit WebAssembly file the Skia payoff chart needs into `public/`, which git ignores), then `EXPO_PUBLIC_PREVIEW_INSETS="54,34" npx expo export --platform web`. The variable gives the page the top and bottom safe-area insets of a recent iPhone. This is a react-native-web render, not a device.
