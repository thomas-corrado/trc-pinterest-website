"use client";

import React, { useState, useEffect } from "react";
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

const LOCAL_SONGS = [
  {
    title: "Baxter (These Are My Friends)",
    file: "/songs/01 Baxter (These Are My Friends).m4a",
  },
  { title: "Can't Do Without You", file: "/songs/01 Can't Do Without You.m4a" },
  { title: "I Been Young", file: "/songs/01 I Been Young.m4a" },
  {
    title: "Into Dust (Still Falling)",
    file: "/songs/01 Into Dust (Still Falling).m4a",
  },
  {
    title: "Two Thousand and Seventeen",
    file: "/songs/02 Two Thousand and Seventeen.m4a",
  },
  { title: "Blue Spring", file: "/songs/05 Blue Spring.m4a" },
  { title: "Tate (How I Feel)", file: "/songs/06 Tate (How I Feel).m4a" },
  { title: "A World Alone", file: "/songs/10 A World Alone.m4a" },
  { title: "glow", file: "/songs/12 glow.m4a" },
  {
    title: "Billie (Loving Arms) 1",
    file: "/songs/Billie (Loving Arms) 1.m4a",
  },
  {
    title: "Into Dust (Still Falling) trimmed",
    file: "/songs/Into Dust (Still Falling) trimmed.m4a",
  },
  { title: "marea (chicagoEdit)", file: "/songs/marea(chicagoEdit).mp3" },
  { title: "Open Season", file: "/songs/Open Season.m4a" },
];

export default function EventsFeedPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin state
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showEventModal, setShowEventModal] = useState(false);

  // Available Songs State
  const [dynamicSongs, setDynamicSongs] = useState<
    Array<{ title: string; file: string }>
  >([]);

  // Form State
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newFlyerUrl, setNewFlyerUrl] = useState("");
  const [newActiveSong, setNewActiveSong] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingFlyer, setUploadingFlyer] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (showEventModal) {
      fetch("/api/songs", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (data.uploadedSongs) setDynamicSongs(data.uploadedSongs);
        })
        .catch((err) => console.error("Error fetching songs:", err));
    }
  }, [showEventModal]);

  const allAvailableSongs = [...LOCAL_SONGS, ...dynamicSongs];

  const fetchEvents = () => {
    // Force no-store to ensure freshly created/edited events appear instantly
    fetch("/api/events", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching events:", err);
        setLoading(false);
      });
  };

  const resetForm = () => {
    setEditingSlug(null);
    setNewTitle("");
    setNewSlug("");
    setNewDate("");
    setNewTime("");
    setNewLocation("");
    setNewDescription("");
    setNewFlyerUrl("");
    setNewActiveSong("");
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowEventModal(true);
  };

  const handleOpenEditModal = (event: EventItem, e: React.MouseEvent) => {
    e.preventDefault();
    setEditingSlug(event.slug);
    setNewTitle(event.title);
    setNewSlug(event.slug);
    setNewDate(event.date || "");
    setNewTime(event.time || "");
    setNewLocation(event.location || "");
    setNewDescription(event.description || "");
    setNewFlyerUrl(event.flyerUrl || "");
    setNewActiveSong(event.activeSong || "");
    setShowEventModal(true);
  };

  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    if (!editingSlug) {
      const autoSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");
      setNewSlug(autoSlug);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    setAdminToken(passwordInput.trim());
    setShowAdminModal(false);
    setPasswordInput("");
  };

  const handleFlyerFileUpload = async (file: File) => {
    setUploadingFlyer(true);

    try {
      const cleanName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const response = await fetch(`/api/upload?filename=${cleanName}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: file,
      });

      if (response.ok) {
        const data = await response.json();
        setNewFlyerUrl(data.url);
      } else {
        alert("Failed to upload flyer image.");
      }
    } catch (error) {
      console.error("Flyer upload error:", error);
      alert("Error uploading flyer image.");
    } finally {
      setUploadingFlyer(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSlug || !adminToken) return;

    setSaving(true);
    const eventPayload: EventItem = {
      title: newTitle,
      slug: newSlug,
      date: newDate,
      time: newTime,
      location: newLocation,
      description: newDescription,
      flyerUrl: newFlyerUrl,
      activeSong: newActiveSong,
      rsvpLocked: false,
    };

    try {
      const res = await fetch("/api/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secretToken: adminToken,
          newEvent: eventPayload,
          originalSlug: editingSlug,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setShowEventModal(false);
        resetForm();
      } else {
        alert("Invalid password or failed to save event.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving event.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (
    slugToDelete: string,
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    if (!adminToken) return;
    if (!confirm(`Are you sure you want to delete "${slugToDelete}"?`)) return;

    try {
      const res = await fetch("/api/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secretToken: adminToken,
          deleteSlug: slugToDelete,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      } else {
        alert("Failed to delete event.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting event.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 font-mono text-slate-900 text-xs">
        Loading events...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-slate-900 font-mono px-4 py-8 sm:py-12 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header - Fixed layout for mobile screen sizes */}
        <div className="border-b border-slate-200 pb-4 flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-wider uppercase text-slate-900">
              EVENTS
            </h1>
            <p className="text-xs text-slate-500">
              Select an event to view details & RSVP
            </p>
          </div>

          <div className="shrink-0 pt-0.5">
            {adminToken ? (
              <button
                onClick={handleOpenCreateModal}
                className="bg-white text-black font-bold text-xs px-3 py-1.5 rounded-full hover:bg-slate-50 transition whitespace-nowrap"
              >
                ＋ Add Event
              </button>
            ) : (
              <button
                onClick={() => setShowAdminModal(true)}
                className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-full text-slate-900 hover:bg-slate-50 transition whitespace-nowrap flex items-center gap-1.5"
              >
                <span>🔒</span> <span>Admin Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Card Grid */}
        {events.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl text-xs text-slate-500 space-y-3 shadow-sm">
            <p>No upcoming events right now.</p>
            {adminToken && (
              <button
                onClick={handleOpenCreateModal}
                className="underline text-slate-900 font-bold"
              >
                Create your first event →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => (
              <div key={event.slug} className="relative group">
                <Link
                  href={`/events/${event.slug}`}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden transition duration-200 flex flex-col h-full shadow-sm"
                >
                  <div className="w-full aspect-[16/9] bg-slate-100 overflow-hidden relative">
                    {event.flyerUrl ? (
                      <img
                        src={event.flyerUrl}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px] uppercase tracking-widest">
                        [ Flyer Image ]
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-slate-700 font-semibold border border-slate-200">
                      RSVP Open →
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 group-hover:text-slate-700 transition">
                        {event.title}
                      </h2>
                      {event.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {/* Stacked Details Rows: Date, Time, Location */}
                    <div className="pt-3 border-t border-slate-200 space-y-1.5 text-[11px] text-slate-500">
                      {event.date && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 uppercase text-[9px]">
                            Date
                          </span>
                          <span>{event.date}</span>
                        </div>
                      )}
                      {event.time && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 uppercase text-[9px]">
                            Time
                          </span>
                          <span>{event.time}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="pt-1 border-t border-slate-200">
                          <span className="text-slate-400 uppercase text-[9px] block mb-0.5">
                            Location
                          </span>
                          <span className="text-slate-900 break-words block">
                            {event.location}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Admin Actions */}
                {adminToken && (
                  <div className="absolute top-3 left-3 z-10 flex items-center space-x-1.5">
                    <button
                      onClick={(e) => handleOpenEditModal(event, e)}
                      className="bg-white/95 hover:bg-slate-50 border border-slate-200 text-slate-900 text-[10px] px-2.5 py-1 rounded-full backdrop-blur-md transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => handleDeleteEvent(event.slug, e)}
                      className="bg-red-100 hover:bg-red-200 border border-red-200 text-red-700 text-[10px] px-2.5 py-1 rounded-full backdrop-blur-md transition"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Password Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Admin Authentication
            </h2>
            <form onSubmit={handleAdminLogin} className="space-y-3">
              <input
                type="password"
                placeholder="Enter secret token..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                required
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-white text-slate-900 font-bold text-xs rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg space-y-4 my-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                {editingSlug ? "Edit Event" : "Create New Event"}
              </h2>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  resetForm();
                }}
                className="text-slate-500 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Rooftop Hangout"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    placeholder="e.g. rooftop-hangout"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    placeholder="e.g. Saturday, Aug 1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="e.g. 11:00 AM - 1:00 PM"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-slate-500 mb-1">
                  Location / Address
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. 123 Main St, Apt 4B"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-slate-500 mb-1">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Event details, BYOB info, etc."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-slate-500 mb-1">
                  Flyer Image
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFlyerFileUpload(file);
                    }}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-900 hover:file:bg-slate-200 cursor-pointer"
                  />
                  {uploadingFlyer && (
                    <p className="text-[10px] text-amber-500">
                      Uploading flyer to storage...
                    </p>
                  )}
                  {newFlyerUrl && (
                    <div className="relative aspect-video w-32 bg-slate-50 rounded-lg overflow-hidden border border-slate-200 mt-2">
                      <img
                        src={newFlyerUrl}
                        alt="Flyer Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-slate-500 mb-1">
                  Event Active Soundtrack (Optional)
                </label>
                <select
                  value={newActiveSong}
                  onChange={(e) => setNewActiveSong(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 cursor-pointer"
                >
                  <option value="">No custom track (use default)</option>
                  {allAvailableSongs.map((track) => (
                    <option key={track.file} value={track.file}>
                      {track.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEventModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingFlyer}
                  className="px-5 py-2 bg-white text-black font-bold uppercase rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingSlug
                      ? "Update Event"
                      : "Publish Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
