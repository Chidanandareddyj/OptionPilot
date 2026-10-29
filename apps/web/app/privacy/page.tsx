import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy · OptionPilot",
  description: "What OptionPilot stores, and how to delete it.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-16 text-foreground">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
      <p className="text-muted-foreground">
        OptionPilot is an options calculator. It does not take trades and it does not sell your information.
      </p>
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Account</h2>
        <p>
          Signing in stores your name, email address, and password with Neon Auth. An optional avatar is a photo you choose. Organizations you create are stored with that same account.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Saved analyses</h2>
        <p>
          When you analyse a symbol, OptionPilot saves the result: the company, the option prices at that time, and any recommendation you asked for. These are snapshots. They are not a live feed of your holdings, and OptionPilot does not know which trades you place.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Market data</h2>
        <p>
          Prices come from Upstox. The live derivatives board opens a short-lived stream. Quote requests send the symbol you asked about. OptionPilot does not send your account to Upstox.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Alerts</h2>
        <p>
          Push alerts are off until you turn them on. The phone then sends an Expo push token and the platform (iOS or Android). During NSE market hours the server may notify you when a saved analysis moves more than 2% from the price you saved, or crosses one of its breakevens. Turning alerts off, signing out, or deleting the account removes the token.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Deletion</h2>
        <p>
          Delete account, at the bottom of Settings, removes your saved analyses and your push tokens. When the server is configured for it, it also removes the sign-in account. You can delete a single saved analysis from History.
        </p>
      </section>
    </main>
  );
}
