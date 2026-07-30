import type { Metadata } from "next";
import { headers } from "next/headers";
import { list } from "@vercel/blob";
import React from "react";

const EVENTS_FILE = "events-list.json";

interface EventItem {
  slug: string;
  title: string;
  description: string;
  flyerUrl: string;
}

async function getEvent(slug: string): Promise<EventItem | null> {
  try {
    const { blobs } = await list({ prefix: EVENTS_FILE });
    if (blobs.length === 0) return null;

    const res = await fetch(blobs[0].url, { cache: "no-store" });
    const events: EventItem[] = await res.json();
    return events.find((e) => e.slug === slug) || null;
  } catch (err) {
    console.error("Failed to load event for metadata:", err);
    return null;
  }
}

async function buildEventUrl(slug: string): Promise<string> {
  try {
    const headersList = await headers();
    const host = headersList.get("host");
    if (host) {
      const protocol = host.includes("localhost") ? "http" : "https";
      return `${protocol}://${host}/events/${slug}`;
    }
  } catch {
    // headers() may not be available during static generation
  }
  return `/events/${slug}`;
}

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  const url = await buildEventUrl(slug);

  if (!event) {
    return {
      title: "Event Not Found",
    };
  }

  return {
    title: event.title,
    description: event.description,
    openGraph: {
      title: event.title,
      description: event.description,
      url,
      images: [
        {
          url: event.flyerUrl,
          alt: `${event.title} flyer`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description: event.description,
      images: [event.flyerUrl],
    },
  };
}

export default async function EventLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
