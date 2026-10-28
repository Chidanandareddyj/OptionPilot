# OptionPilot store listing

Name: OptionPilot

Subtitle: Options built to withstand any volatility

Short description: See the worst case of an NSE options strategy before you decide. Payoff, breakeven, and a live F&O board.

Full description:

OptionPilot is a calculator for NSE equity options. Search a symbol, compare strategies, and read the max profit, max loss, and breakevens from the prices at that moment. The derivatives board prices every F&O name for twelve strategies while the market is open. History keeps the snapshots you save. Alerts are off until you turn them on.

OptionPilot does not place orders.

Privacy policy: https://www.optionpilot.tech/privacy

Bundle id and Android package: tech.optionpilot.app

URL scheme: optionpilot

## Still needed before TestFlight or Play

These stay placeholders. Do not invent them.

- Apple ID, App Store Connect app id, and Apple team id in `eas.json` (`REPLACE_WITH_APPLE_ID_EMAIL`, `REPLACE_WITH_APP_STORE_CONNECT_APP_ID`, `REPLACE_WITH_APPLE_TEAM_ID`)
- Google Play service account JSON at the path named in `eas.json`
- Expo account access to project `5fda50b0-5603-4df3-a515-2ed60efbca8a`
- APNs key and FCM credentials on that Expo project, or pushes cannot be delivered
- `CRON_SECRET` and `UPSTOX_API_KEY` on the website
- `NEON_API_KEY`, `NEON_PROJECT_ID`, and `NEON_BRANCH_ID` on the website, and delete-user plus change-email enabled in Neon Auth, for full account deletion

The Vercel cron is `*/15 3-10 * * 1-5` (about 9:00–15:30 IST, weekdays). A Hobby plan only allows a daily cron; the route still sends nothing outside NSE hours.

Do not run `eas submit` until the values above are real.
