import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      message: "LiveKit provisioning will be implemented in a later phase.",
    },
    { status: 501 },
  );
}
