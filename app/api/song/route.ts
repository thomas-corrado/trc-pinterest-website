import { put, list } from "@vercel/blob";
import { NextResponse } from "next/server";

const DEFAULT_SONG = "/songs/01 Baxter (These Are My Friends).m4a";

// 1. GET: Fetch the currently active song for visitors
export async function GET() {
  try {
    const { blobs } = await list({ prefix: "active-song.json" });
    if (blobs.length === 0) {
      return NextResponse.json({ song: DEFAULT_SONG });
    }

    const res = await fetch(blobs[0].url, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // FIX: Removed '_error' variable entirely to satisfy ESLint
    return NextResponse.json({ song: DEFAULT_SONG });
  }
}

// 2. POST: Update the active song from your Admin panel
export async function POST(request: Request) {
  try {
    const { song, secretToken } = await request.json();

    if (secretToken !== process.env.ADMIN_SECRET_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await put("active-song.json", JSON.stringify({ song }), {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({ success: true, song });
  } catch {
    // FIX: Removed '_error' variable entirely to satisfy ESLint
    return NextResponse.json(
      { error: "Failed to update song" },
      { status: 500 },
    );
  }
}
