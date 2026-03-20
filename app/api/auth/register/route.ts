import { NextResponse } from "next/server";

// Registration is disabled - this is a single-user blog
export async function POST(req: Request) {
  return NextResponse.json(
    { error: "Registration is disabled. This is a single-user blog." },
    { status: 403 },
  );
}
