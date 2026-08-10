import { getInstrumentId } from "@/upstoxservices/getInstrumentId";
import { getOptions } from "@/upstoxservices/getOptions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { company } = await request.json();
    const instrument_id = await getInstrumentId(company);
    const options = await getOptions(instrument_id);
    console.log("=== Options Data ===");
    console.log(JSON.stringify(options, null, 2));
    console.log("=== End ===");
    return NextResponse.json({ instrument_id, options });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
