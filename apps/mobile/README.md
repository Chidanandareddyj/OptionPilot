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

## Layout

- `app/` Expo Router routes. `(onboarding)` is shown once, `(app)` holds the four tabs and the Appearance sheet.
- `components/ui` reusable primitives, `components/brand` the logo and splash, `components/navigation` the floating tab bar.
- `lib/theme` the theme provider. Colours come from `@optionpilot/shared` and are mirrored in `global.css`, which `__tests__/global-css.test.ts` keeps in sync.
- `scripts/generate-brand-assets.mjs` draws the app icon, adaptive icon, splash images and favicon from the website logo. Run `npm run icons` after changing the logo or palette.

## Styling

Styles use [Uniwind](https://uniwind.dev) (Tailwind v4 classes on React Native components). Theme variables live in `global.css`; `light`, `dark` and `system` are switched at runtime from Settings, Appearance.

## Before a store release

`app.config.ts` and `eas.json` use the bundle id and package `tech.optionpilot.app` and the URL scheme `optionpilot`. The Apple and Google values in `eas.json` (`REPLACE_WITH_...`) are placeholders and must be filled in.

## Preview in a browser

For layout checks only: `EXPO_PUBLIC_PREVIEW_INSETS="54,34" npx expo export --platform web`. The variable gives the page the top and bottom safe-area insets of a recent iPhone. This is a react-native-web render, not a device.
