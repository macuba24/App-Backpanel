import { NextResponse } from "next/server";

import { pushKeysReady, vapidPublicKey } from "@/lib/web-push";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export function GET() {
  if (!pushKeysReady()) {
    return NextResponse.json({ error: "Push ist noch nicht eingerichtet." }, { status: 503, headers: corsHeaders });
  }
  return NextResponse.json({ publicKey: vapidPublicKey() }, { headers: corsHeaders });
}
