This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Backend Architecture

```mermaid
flowchart TD
    Client["Client / app/page.tsx"]
    Route["POST /api/analyze<br/>app/api/analyze/route.ts"]
    Search["getInstrumentId<br/>Upstox instrument search"]
    Chain["getOptions<br/>Upstox option chain"]
    ATM["getAtmStrike<br/>find nearest strike"]
    Strategies["Strategy calculators"]
    Results["JSON response<br/>payoff tables and metadata"]
    Upstox["Upstox API"]

    Client -->|"company"| Route
    Route --> Search
    Search -->|"underlying key<br/>and expiry"| Upstox
    Upstox -->|"option instruments"| Search
    Route --> Chain
    Chain -->|"underlying key + expiry"| Upstox
    Upstox -->|"option chain"| Chain
    Chain --> ATM
    Chain --> Strategies
    ATM --> Strategies
    Strategies --> Results
    Results --> Client
```

The backend flow is:

1. The client sends a company symbol to `POST /api/analyze`.
2. `getInstrumentId` searches Upstox and selects the underlying instrument key and expiry.
3. `getOptions` retrieves the option chain for that underlying and expiry.
4. `getAtmStrike` identifies the strike closest to the underlying spot price.
5. Strategy calculators generate payoff tables for the available strategies.
6. The route returns strategy results, payoff tables, and instrument metadata as JSON.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
