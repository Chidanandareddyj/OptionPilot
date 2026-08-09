import { getInstrumentId } from "@/upstoxservices/getInstrumentId";
// import { getRealtime } from "@/upstoxservices/getRealtime";
// import { getOptions } from "@/upstoxservices/getOptions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const company = await request.json();
    const instrument_id = await getInstrumentId(company);
    // const realtime = await getRealtime(instrument_id);  
    // const options = await getOptions(instrument_id);
    return NextResponse.json({ instrument_id });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get realtime and options" }, { status: 500 });
  }
}
