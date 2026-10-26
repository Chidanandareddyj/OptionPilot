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

## Derivatives live

The Derivatives tab is the website's board on a phone. `GET /api/derivatives/token` returns the relay URL and a 60 second signed token; `lib/derivatives/stream.ts` opens `{url}/stream?token=` with `react-native-sse` and reads the `universe` and one-second `tick` events. The stream gets a fresh token every time it reconnects: after an error (backoff 3 s, 6 s, 12 s … 30 s (5 s, 10 s … when the token itself fails)), when no tick has come for 15 s, when the app returns from the background, when the phone comes back online, on pull-to-refresh, and every 5 minutes (the XHR transport keeps the whole response in memory). `FeedProvider` holds the stream while any screen that shows prices is mounted and lets go 10 s after the last one, so switching tabs does not reconnect.

What a row is, how it is priced and which rows are stale come from `packages/shared/src/derivativesFeed.ts` and `derivativesBoard.ts` (`buildChain`, `evaluate`, `applyView`, `STALE_AFTER_MS`), which the website's board uses too; `packages/shared/src/derivativesFeed.test.ts` and `__tests__/derivatives-*.test.ts*` cover the same inputs on both sides, and the stream tests run against a fake `EventSource`. The relay host comes from the token endpoint, so `NEXT_PUBLIC_RELAY_URL` on the website must be an `http(s)` URL the phone can reach. Live ticks only exist while NSE is open (9:15 am to 3:30 pm IST, Monday to Friday); outside those hours the board shows the last close.

## Styling

Styles use [Uniwind](https://uniwind.dev) (Tailwind v4 classes on React Native components). Theme variables live in `global.css`; `light`, `dark` and `system` are switched at runtime from Settings, Appearance.

## Before a store release

`app.config.ts` and `eas.json` use the bundle id and package `tech.optionpilot.app` and the URL scheme `optionpilot`. The Apple and Google values in `eas.json` (`REPLACE_WITH_...`) are placeholders and must be filled in.

## Preview in a browser

For layout checks only: `npm run setup:web` once (it copies the CanvasKit WebAssembly file the Skia payoff chart needs into `public/`, which git ignores), then `EXPO_PUBLIC_PREVIEW_INSETS="54,34" npx expo export --platform web`. The variable gives the page the top and bottom safe-area insets of a recent iPhone. This is a react-native-web render, not a device.

## History

The History tab lists saved analyses from `GET /api/analyses` (`useHistory`, an infinite query: 20 a page, the next page by `nextCursor` when the list's end is reached). Pull down to reload from the first page; a failed later page keeps the rows and offers "Try again". A row opens `/analysis/[id]?snapshot=1&back=History`, which shows the saved prices under a "Saved snapshot" banner and a "History" back button.

Slide a row left and tap **Delete** (or use the row's "delete" accessibility action). The row leaves the History and Terminal lists at once and an **Undo** bar stays for 5 seconds. Only then is `DELETE /api/analyses/[id]` sent, because the API has no restore. If the server refuses, the row goes back where it was and the bar says so. A delete still pending when the app goes to the background or the tab unmounts is sent straight away. Only one delete is pending at a time: deleting a second row sends the first. The Terminal's "Resume last analysis" and "Recent symbols" read the same list.
