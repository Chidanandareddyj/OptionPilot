import { BadRequestError, parseSymbols, requireUserId, UnauthorizedError } from "@/lib/analysis";
import { auth } from "@/lib/auth/server";
import { getInstrumentId } from "@/upstoxservices/getInstrumentId";
import { getLtp } from "@/upstoxservices/getLtp";
import { NextResponse } from "next/server";

type SearchedInstrument = {
  underlying_key?: string;
  expiry?: string;
  name?: string;
};

export type DerivativeRow = {
  symbol: string;
  available: boolean;
  name: string | null;
  expiry: string | null;
  spot: number | null;
  underlying_key: string | null;
};

function unavailable(symbol: string): DerivativeRow {
  return {
    symbol,
    available: false,
    name: null,
    expiry: null,
    spot: null,
    underlying_key: null,
  };
}

export async function POST(request: Request) {
  try {
    const { data: session } = await auth.getSession();
    requireUserId(session);

    const symbols = parseSymbols(await request.json());
    const lookedUp = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const instruments = (await getInstrumentId(symbol)) as SearchedInstrument[];
          const first = instruments[0];
          const underlying_key = first?.underlying_key;
          const expiry = first?.expiry;
          if (!underlying_key || !expiry) return unavailable(symbol);
          return {
            symbol,
            available: true,
            name: typeof first.name === "string" ? first.name : null,
            expiry: String(expiry),
            spot: null,
            underlying_key: String(underlying_key),
          } satisfies DerivativeRow;
        } catch {
          return unavailable(symbol);
        }
      }),
    );

    const keys = lookedUp.flatMap((row) => (row.underlying_key ? [row.underlying_key] : []));
    let prices = new Map<string, number>();
    if (keys.length > 0) {
      try {
        prices = await getLtp(keys);
      } catch (error) {
        console.error("[/api/derivatives ltp]:", error);
      }
    }

    const derivatives = lookedUp.map((row) => ({
      ...row,
      spot: row.underlying_key ? (prices.get(row.underlying_key) ?? null) : null,
    }));

    return NextResponse.json({ derivatives });
  } catch (error) {
    console.error("[/api/derivatives error]:", error);
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
