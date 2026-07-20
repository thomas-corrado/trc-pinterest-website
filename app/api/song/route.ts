import { put, list } from "@vercel/blob";
import { NextResponse } from "next/server";

// Fallback path matching your exact folder routing structure
const DEFAULT_SONG = "/songs/01 Baxter (These Are My Friends).m4a";

// 1. GET: Fetch the currently active song for visitors
export async function GET() {
  try {
    const { blobs } = await list({ prefix: "active-song.json" });
    if (blobs.length === 0) {
      return NextResponse.json({ song: DEFAULT_SONG });
    }

    // Explicitly add { cache: 'no-store' } to prevent Vercel/Next.js edge caching
    // from serving an old song preference to visitors.
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (_error) {
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

    // Overwrite the active-song.json file in Blob storage
    await put("active-song.json", JSON.stringify({ song }), {
      access: "public",
      addRandomSuffix: false, // Keeps the filename constant so it overwrites smoothly
    });

    return NextResponse.json({ success: true, song });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to update song" },
      { status: 500 },
    );
  }
}
