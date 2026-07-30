import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

export const revalidate = 0; // Disable caching on route level

export async function POST(request: Request) {
  try {
    const { slug, name, status, note } = await request.json();

    if (!slug || !name || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const rsvpFileName = `rsvps-${slug}.json`;

    // 1. Fetch current list without cache
    let rsvps = [];
    try {
      const rsvpBlobs = await list({ prefix: rsvpFileName });
      if (rsvpBlobs.blobs.length > 0) {
        const res = await fetch(rsvpBlobs.blobs[0].url, { cache: "no-store" });
        rsvps = await res.json();
      }
    } catch (e) {
      console.warn("No existing RSVP file found, creating new one.");
    }

    // 2. Upsert user RSVP (prevent duplicates if same person submits again)
    const newEntry = {
      name: name.trim(),
      status, // "yes" | "maybe" | "no"
      note: note ? note.trim() : "",
      createdAt: new Date().toISOString(),
    };

    const existingIndex = rsvps.findIndex(
      (r: any) => r.name.toLowerCase() === name.trim().toLowerCase(),
    );

    if (existingIndex >= 0) {
      rsvps[existingIndex] = newEntry;
    } else {
      rsvps.push(newEntry);
    }

    // 3. Write back to Vercel Blob
    await put(rsvpFileName, JSON.stringify(rsvps), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    return NextResponse.json({ success: true, rsvps });
  } catch (error) {
    console.error("RSVP Error:", error);
    return NextResponse.json(
      { error: "Failed to submit RSVP. Please try again." },
      { status: 500 },
    );
  }
}
