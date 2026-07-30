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

  // Editing vs Creating Trackers
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  // Event Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newFlyerUrl, setNewFlyerUrl] = useState("");
  const [newActiveSong, setNewActiveSong] = useState("");
  const [saving, setSaving] = useState(false);

  // File Upload State
  const [uploadingFlyer, setUploadingFlyer] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (showEventModal) {
      fetch("/api/songs")
        .then((res) => res.json())
        .then((data) => {
          if (data.uploadedSongs) setDynamicSongs(data.uploadedSongs);
        })
        .catch((err) => console.error("Error fetching songs:", err));
    }
  }, [showEventModal]);

  const allAvailableSongs = [...LOCAL_SONGS, ...dynamicSongs];

  const fetchEvents = () => {
    fetch("/api/events")
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
    e.preventDefault(); // Stop navigation to single event page
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
    // Auto-generate slug only if creating a new event
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
          originalSlug: editingSlug, // Informs backend if this is an update to an existing event
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
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 font-mono text-white text-xs">
        Loading events...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-mono px-4 py-12 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="border-b border-neutral-800 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-wider uppercase text-white">
              Events
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Select an event to view details & RSVP
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {adminToken ? (
              <button
                onClick={handleOpenCreateModal}
                className="bg-white text-black font-bold text-xs px-3 py-1.5 rounded-full hover:bg-neutral-200 transition"
              >
                ＋ Add Event
              </button>
            ) : (
              <button
                onClick={() => setShowAdminModal(true)}
                className="text-xs bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full text-neutral-400 hover:text-white transition"
              >
                🔒 Admin Login
              </button>
            )}
          </div>
        </div>

        {/* Card Grid */}
        {events.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900/50 border border-neutral-800/80 rounded-2xl text-xs text-neutral-500 space-y-3">
            <p>No upcoming events right now.</p>
            {adminToken && (
              <button
                onClick={handleOpenCreateModal}
                className="underline text-white font-bold"
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
                  className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl overflow-hidden transition duration-200 flex flex-col h-full"
                >
                  <div className="w-full aspect-[16/9] bg-neutral-800 overflow-hidden relative">
                    {event.flyerUrl ? (
                      <img
                        src={event.flyerUrl}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600 text-[10px] uppercase tracking-widest">
                        [ Flyer Image ]
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-neutral-300 font-semibold border border-white/10">
                      RSVP Open →
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h2 className="text-lg font-bold text-white group-hover:text-neutral-200 transition">
                        {event.title}
                      </h2>
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                      <span>{event.date}</span>
                      <span>{event.time}</span>
                    </div>
                  </div>
                </Link>

                {/* Admin Actions */}
                {adminToken && (
                  <div className="absolute top-3 left-3 z-10 flex items-center space-x-1.5">
                    <button
                      onClick={(e) => handleOpenEditModal(event, e)}
                      className="bg-neutral-900/90 hover:bg-black border border-neutral-700 text-white text-[10px] px-2.5 py-1 rounded-full backdrop-blur-md transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => handleDeleteEvent(event.slug, e)}
                      className="bg-red-950/80 hover:bg-red-900 border border-red-800/50 text-red-300 text-[10px] px-2.5 py-1 rounded-full backdrop-blur-md transition"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Admin Authentication
            </h2>
            <form onSubmit={handleAdminLogin} className="space-y-3">
              <input
                type="password"
                placeholder="Enter secret token..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
                required
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-white text-black font-bold text-xs rounded-lg hover:bg-neutral-200"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-lg space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                {editingSlug ? "Edit Event" : "Create New Event"}
              </h2>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  resetForm();
                }}
                className="text-neutral-500 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Rooftop Hangout"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    placeholder="e.g. rooftop-hangout"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    placeholder="e.g. Friday, Aug 15"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="e.g. 7:00 PM - 11:00 PM"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-neutral-500 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. 123 Main St, Apt 4"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-neutral-500 mb-1">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Event details, BYOB info, etc."
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white"
                />
              </div>

              {/* Flyer Image File Upload */}
              <div>
                <label className="block text-[10px] uppercase text-neutral-500 mb-1">
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
                    className="w-full text-xs text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 cursor-pointer"
                  />
                  {uploadingFlyer && (
                    <p className="text-[10px] text-amber-400">
                      Uploading flyer to storage...
                    </p>
                  )}
                  {newFlyerUrl && (
                    <div className="relative aspect-video w-32 bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800 mt-2">
                      <img
                        src={newFlyerUrl}
                        alt="Flyer Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Active Song Selector Dropdown */}
              <div>
                <label className="block text-[10px] uppercase text-neutral-500 mb-1">
                  Event Active Soundtrack (Optional)
                </label>
                <select
                  value={newActiveSong}
                  onChange={(e) => setNewActiveSong(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-white cursor-pointer"
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
                  className="px-4 py-2 text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingFlyer}
                  className="px-5 py-2 bg-white text-black font-bold uppercase rounded-lg hover:bg-neutral-200 transition disabled:opacity-50"
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
