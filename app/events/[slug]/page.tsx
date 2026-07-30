"use client";

import React, { useState, useEffect, use } from "react";
import Image from "next/image";
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
  const [submittedStatus, setSubmittedStatus] = useState<
    "in" | "out" | "maybe"
  >("in");
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

  const getConfirmationMessage = (rsvpStatus: "in" | "out" | "maybe") => {
    switch (rsvpStatus) {
      case "in":
        return {
          title: "You're on the list! 🎉",
          subtitle: "See you there.",
          containerStyle: "bg-emerald-100 border-emerald-200 text-emerald-700",
          subStyle: "text-emerald-700/90",
        };
      case "maybe":
        return {
          title: "RSVP Received 🤞",
          subtitle: "Hope you can make it!",
          containerStyle: "bg-amber-100 border-amber-200 text-amber-700",
          subStyle: "text-amber-700/90",
        };
      case "out":
        return {
          title: "Thanks for letting us know 🙏",
          subtitle: "We'll catch you at the next one!",
          containerStyle: "bg-slate-100 border-slate-200 text-slate-700",
          subStyle: "text-slate-500",
        };
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
        setSubmittedStatus(status);
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
      <div className="flex items-center justify-center min-h-screen bg-gray-100 font-mono text-slate-900 text-xs">
        Loading event details...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 font-mono text-slate-900 text-xs space-y-4">
        <p>Event not found.</p>
        <Link href="/events" className="underline text-slate-600">
          ← Back to all events
        </Link>
      </div>
    );
  }

  const confirmation = getConfirmationMessage(submittedStatus);

  return (
    <div className="min-h-screen bg-gray-100 text-slate-900 font-mono px-4 py-12 flex flex-col items-center">
      {event.activeSong && (
        <audio ref={audioRef} src={event.activeSong} loop preload="auto" />
      )}

      {/* Global Manual Music Deck */}
      {event.activeSong && (
        <div className="fixed bottom-4 right-4 z-50 flex gap-2">
          <button
            onClick={toggleMusic}
            className="px-4 py-2 bg-green-500 text-white rounded-md font-mono text-xs shadow-md transition hover:bg-green-600"
          >
            Play Music
          </button>
          <button
            onClick={toggleMusic}
            className="px-4 py-2 bg-red-500 text-white rounded-md font-mono text-xs shadow-md transition hover:bg-red-600"
          >
            Pause Music
          </button>
        </div>
      )}

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl space-y-6 pb-8">
        {/* Back Button & Flyer */}
        <div className="relative w-full aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden">
          <Link
            href="/events"
            className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md border border-slate-200 text-slate-900 text-[11px] px-3 py-1.5 rounded-full hover:bg-slate-50 transition"
          >
            ← All Events
          </Link>

          {event.flyerUrl ? (
            <Image
              src={event.flyerUrl}
              alt={event.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="text-neutral-500 text-xs uppercase tracking-widest">
              [ Event Flyer ]
            </div>
          )}

        </div>

        {/* Details & RSVP */}
        <div className="px-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
              {event.title}
            </h1>
            <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
              {event.description}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 uppercase font-semibold">
                Date
              </span>
              <span className="text-slate-700 text-right">
                {event.date}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 uppercase font-semibold">
                Time
              </span>
              <span className="text-slate-700 text-right">
                {event.time}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 uppercase font-semibold">
                Location
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-slate-700 text-right truncate max-w-[160px]">
                  {event.location}
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] px-2 py-1 rounded transition"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              RSVP
            </h2>

            {event.rsvpLocked ? (
              <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                RSVPs are now closed for this event.
              </div>
            ) : submitted ? (
              <div
                className={`text-center py-6 border rounded-xl text-xs space-y-1 ${confirmation.containerStyle}`}
              >
                <p className="font-bold text-sm">{confirmation.title}</p>
                <p className={confirmation.subStyle}>{confirmation.subtitle}</p>
              </div>
            ) : (
              <form onSubmit={handleRsvpSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400 transition"
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
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
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
                    <label className="block text-[10px] uppercase text-slate-500 mb-1">
                      Plus Ones
                    </label>
                    <select
                      value={plusOnes}
                      onChange={(e) => setPlusOnes(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400 transition cursor-pointer"
                    >
                      <option value={0}>Just me (+0)</option>
                      <option value={1}>+1 Person</option>
                      <option value={2}>+2 People</option>
                      <option value={3}>+3 People</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase text-slate-500 mb-1">
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Bringing drinks!"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-white text-black font-bold uppercase rounded-lg text-xs tracking-wider hover:bg-slate-100 transition disabled:opacity-50"
                >
                  {submitting ? "Confirming..." : "Submit RSVP"}
                </button>
              </form>
            )}
          </div>

          <div className="border-t border-slate-200 pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Guest List
              </h2>
              <span className="text-[11px] text-emerald-600 font-medium">
                ● {goingCount} Attending
              </span>
            </div>

            {rsvps.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">
                Be the first to RSVP!
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {rsvps.map((rsvp) => (
                  <div
                    key={rsvp.id}
                    className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">
                        {rsvp.name}
                      </span>
                      {rsvp.plusOnes > 0 && rsvp.status === "in" && (
                        <span className="text-[10px] text-slate-500 ml-1.5">
                          (+{rsvp.plusOnes})
                        </span>
                      )}
                      {rsvp.note && (
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          {rsvp.note}
                        </p>
                      )}
                    </div>

                    <span
                      className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${
                        rsvp.status === "in"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : rsvp.status === "maybe"
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
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
