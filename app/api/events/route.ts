import { put, list } from "@vercel/blob";
import { NextResponse } from "next/server";

const EVENTS_FILE = "events-list.json";
const RSVP_FILE_PREFIX = "event-rsvps-";

export interface EventItem {
  slug: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  flyerUrl: string;
  activeSong?: string;
  rsvpLocked?: boolean;
}

export interface RSVP {
  id: string;
  name: string;
  status: "in" | "out" | "maybe";
  plusOnes: number;
  note?: string;
  createdAt: string;
}

// 1. GET: Fetch events list or specific event + RSVPs
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    let events: EventItem[] = [];
    try {
      const eventBlobs = await list({ prefix: EVENTS_FILE });
      if (eventBlobs.blobs.length > 0) {
        const res = await fetch(eventBlobs.blobs[0].url, { cache: "no-store" });
        events = await res.json();
      }
    } catch (blobErr) {
      console.warn("No events file found or error reading blob:", blobErr);
    }

    if (slug) {
      const event = events.find((e) => e.slug === slug);
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      let rsvps: RSVP[] = [];
      try {
        const rsvpFileName = `${RSVP_FILE_PREFIX}${slug}.json`;
        const rsvpBlobs = await list({ prefix: rsvpFileName });
        if (rsvpBlobs.blobs.length > 0) {
          const res = await fetch(rsvpBlobs.blobs[0].url, {
            cache: "no-store",
          });
          rsvps = await res.json();
        }
      } catch (rsvpErr) {
        console.warn("Could not load RSVPs from blob:", rsvpErr);
      }

      return NextResponse.json({ event, rsvps });
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error loading events data:", error);
    return NextResponse.json({ events: [] }, { status: 500 });
  }
}

// 2. POST: Submit RSVP for a specific event
export async function POST(request: Request) {
  try {
    const { slug, name, status, plusOnes, note } = await request.json();

    if (!slug || !name || !status) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    const rsvpFileName = `${RSVP_FILE_PREFIX}${slug}.json`;
    const rsvpBlobs = await list({ prefix: rsvpFileName });
    let currentRsvps: RSVP[] = [];
    if (rsvpBlobs.blobs.length > 0) {
      const res = await fetch(rsvpBlobs.blobs[0].url, { cache: "no-store" });
      currentRsvps = await res.json();
    }

    const newEntry: RSVP = {
      id: Date.now().toString(),
      name,
      status,
      plusOnes: Number(plusOnes) || 0,
      note: note || "",
      createdAt: new Date().toISOString(),
    };

    const updatedRsvps = [newEntry, ...currentRsvps];

    await put(rsvpFileName, JSON.stringify(updatedRsvps), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    return NextResponse.json({ success: true, rsvp: newEntry });
  } catch (error) {
    console.error("Error saving RSVP:", error);
    return NextResponse.json(
      { error: "Failed to submit RSVP." },
      { status: 500 },
    );
  }
}

// 3. PUT: Create / Update / Delete events
export async function PUT(request: Request) {
  try {
    const { secretToken, newEvent, deleteSlug, clearRsvpSlug, originalSlug } =
      await request.json();

    if (secretToken !== process.env.ADMIN_SECRET_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventBlobs = await list({ prefix: EVENTS_FILE });
    let events: EventItem[] = [];
    if (eventBlobs.blobs.length > 0) {
      const res = await fetch(eventBlobs.blobs[0].url, { cache: "no-store" });
      events = await res.json();
    }

    if (deleteSlug) {
      events = events.filter((e) => e.slug !== deleteSlug);
    }

    if (newEvent) {
      // If editing an existing event, match against originalSlug
      // Otherwise, check if newEvent.slug already exists
      const targetSlug = originalSlug || newEvent.slug;
      const index = events.findIndex((e) => e.slug === targetSlug);

      if (index >= 0) {
        events[index] = newEvent;
      } else {
        events.unshift(newEvent);
      }
    }

    await put(EVENTS_FILE, JSON.stringify(events), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    if (clearRsvpSlug) {
      const rsvpFileName = `${RSVP_FILE_PREFIX}${clearRsvpSlug}.json`;
      await put(rsvpFileName, JSON.stringify([]), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    }

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error("Error updating event settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings." },
      { status: 500 },
    );
  }
}
