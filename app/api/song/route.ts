import { put, list } from "@vercel/blob";
import { NextResponse } from "next/server";

const DEFAULT_SONG = "/songs/01 Baxter (These Are My Friends).m4a";

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
    return NextResponse.json({ song: DEFAULT_SONG });
  }
}

export async function POST(request: Request) {
  try {
    const { song, secretToken } = await request.json();

    if (secretToken !== process.env.ADMIN_SECRET_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // FIX: Added `allowOverwrite: true` to permit replacing active-song.json
    await put("active-song.json", JSON.stringify({ song }), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    return NextResponse.json({ success: true, song });
  } catch (error) {
    // Log the exact error to Vercel Functions Logs for debugging
    console.error("FAILED TO UPDATE SONG:", error);

    return NextResponse.json(
      { error: "Failed to update song" },
      { status: 500 },
    );
  }
}
