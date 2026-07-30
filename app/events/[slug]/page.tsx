"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";

interface EventItem {
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

interface RSVP {
  id: string;
  name: string;
  status: "in" | "out" | "maybe";
  plusOnes: number;
  note?: string;
  createdAt: string;
}

export default function SingleEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [status, setStatus] = useState<"in" | "out" | "maybe">("in");
  const [plusOnes, setPlusOnes] = useState(0);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch(`/api/events?slug=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.event) {
          setEvent(data.event);
          setRsvps(data.rsvps || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load event details:", err);
        setLoading(false);
      });
  }, [slug]);

  const handleCopyAddress = () => {
    if (!event?.location) return;
    navigator.clipboard.writeText(event.location);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, status, plusOnes, note }),
      });

      if (res.ok) {
        const data = await res.json();
        setRsvps((prev) => [data.rsvp, ...prev]);
        setSubmitted(true);
      } else {
        alert("Failed to submit RSVP.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting RSVP.");
    } finally {
      setSubmitting(false);
    }
  };

  const goingCount = rsvps
    .filter((r) => r.status === "in")
    .reduce((acc, r) => acc + 1 + (Number(r.plusOnes) || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 font-mono text-white text-xs">
        Loading event details...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 font-mono text-white text-xs space-y-4">
        <p>Event not found.</p>
        <Link href="/events" className="underline text-neutral-400">
          ← Back to all events
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-mono px-4 py-12 flex flex-col items-center">
      {event.activeSong && (
        <audio ref={audioRef} src={event.activeSong} loop preload="auto" />
      )}

      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl space-y-6 pb-8">
        {/* Back Button & Flyer */}
        <div className="relative w-full aspect-[4/3] bg-neutral-800 flex items-center justify-center overflow-hidden">
          <Link
            href="/events"
            className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] px-3 py-1.5 rounded-full hover:bg-black/80 transition"
          >
            ← All Events
          </Link>

          {event.flyerUrl ? (
            <img
              src={event.flyerUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-neutral-500 text-xs uppercase tracking-widest">
              [ Event Flyer ]
            </div>
          )}

          {event.activeSong && (
            <button
              onClick={toggleMusic}
              className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] px-3 py-1.5 rounded-full hover:bg-black/80 transition"
            >
              {isPlaying ? "Pause Sound ♫" : "Play Sound ♫"}
            </button>
          )}
        </div>

        {/* Details & RSVP */}
        <div className="px-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
              {event.title}
            </h1>
            <p className="text-xs text-neutral-400 whitespace-pre-line leading-relaxed">
              {event.description}
            </p>
          </div>

          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-neutral-500 uppercase font-semibold">
                Date & Time
              </span>
              <span className="text-neutral-200 text-right">
                {event.date} — {event.time}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-500 uppercase font-semibold">
                Location
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-neutral-200 text-right truncate max-w-[160px]">
                  {event.location}
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] px-2 py-1 rounded transition"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">
              RSVP
            </h2>

            {event.rsvpLocked ? (
              <div className="text-center py-4 bg-neutral-950 rounded-xl border border-neutral-800 text-xs text-neutral-400">
                RSVPs are now closed for this event.
              </div>
            ) : submitted ? (
              <div className="text-center py-6 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-xs text-emerald-400 space-y-1">
                <p className="font-bold text-sm">You&apos;re on the list!</p>
                <p className="text-emerald-500/80">See you there.</p>
              </div>
            ) : (
              <form onSubmit={handleRsvpSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white transition"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(["in", "maybe", "out"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`py-2 rounded-lg font-bold text-[11px] uppercase border transition ${
                        status === s
                          ? "bg-white text-black border-white"
                          : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      {s === "in"
                        ? "I'm In"
                        : s === "maybe"
                          ? "Maybe"
                          : "Can't"}
                    </button>
                  ))}
                </div>

                {status === "in" && (
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-500 mb-1">
                      Plus Ones
                    </label>
                    <select
                      value={plusOnes}
                      onChange={(e) => setPlusOnes(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white transition cursor-pointer"
                    >
                      <option value={0}>Just me (+0)</option>
                      <option value={1}>+1 Person</option>
                      <option value={2}>+2 People</option>
                      <option value={3}>+3 People</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 mb-1">
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Bringing drinks!"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-white text-black font-bold uppercase rounded-lg text-xs tracking-wider hover:bg-neutral-200 transition disabled:opacity-50"
                >
                  {submitting ? "Confirming..." : "Submit RSVP"}
                </button>
              </form>
            )}
          </div>

          <div className="border-t border-neutral-800 pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Guest List
              </h2>
              <span className="text-[11px] text-emerald-400 font-medium">
                ● {goingCount} Attending
              </span>
            </div>

            {rsvps.length === 0 ? (
              <p className="text-[11px] text-neutral-600 italic">
                Be the first to RSVP!
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {rsvps.map((rsvp) => (
                  <div
                    key={rsvp.id}
                    className="flex items-center justify-between bg-neutral-950/40 p-2.5 rounded-lg border border-neutral-800/60 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-neutral-200">
                        {rsvp.name}
                      </span>
                      {rsvp.plusOnes > 0 && rsvp.status === "in" && (
                        <span className="text-[10px] text-neutral-500 ml-1.5">
                          (+{rsvp.plusOnes})
                        </span>
                      )}
                      {rsvp.note && (
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {rsvp.note}
                        </p>
                      )}
                    </div>

                    <span
                      className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${
                        rsvp.status === "in"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800/50"
                          : rsvp.status === "maybe"
                            ? "bg-amber-950 text-amber-400 border border-amber-800/50"
                            : "bg-neutral-800 text-neutral-500"
                      }`}
                    >
                      {rsvp.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
