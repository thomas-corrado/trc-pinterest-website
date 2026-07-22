import { put, list } from "@vercel/blob";
import { NextResponse } from "next/server";

const DEFAULT_SONG = "/songs/01 Baxter (These Are My Friends).m4a";

// 1. GET: Fetch current active song & list of all uploaded songs
export async function GET() {
  try {
    // List active song preference
    const { blobs } = await list({ prefix: "active-song.json" });
    let currentSong = DEFAULT_SONG;

    if (blobs.length > 0) {
      const res = await fetch(blobs[0].url, { cache: "no-store" });
      const data = await res.json();
      currentSong = data.song || DEFAULT_SONG;
    }

    // List all uploaded audio files from Vercel Blob under 'songs/'
    const allBlobs = await list({ prefix: "songs/" });
    const uploadedSongs = allBlobs.blobs
      .filter((b) => b.pathname.endsWith(".m4a") || b.pathname.endsWith(".mp3"))
      .map((b) => ({
        title: b.pathname.replace("songs/", "").replace(/_/g, " "),
        file: b.url,
      }));

    return NextResponse.json({ song: currentSong, uploadedSongs });
  } catch {
    return NextResponse.json({ song: DEFAULT_SONG, uploadedSongs: [] });
  }
}

// 2. POST: Update active song choice
export async function POST(request: Request) {
  try {
    const { song, secretToken } = await request.json();

    if (secretToken !== process.env.ADMIN_SECRET_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await put("active-song.json", JSON.stringify({ song }), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    return NextResponse.json({ success: true, song });
  } catch (error) {
    console.error("FAILED TO UPDATE SONG:", error);
    return NextResponse.json(
      { error: "Failed to update song" },
      { status: 500 },
    );
  }
}
