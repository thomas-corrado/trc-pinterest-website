"use client";

import React, { useState } from "react";

// Integrated song list from your public folder structure
const AVAILABLE_SONGS = [
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

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedSong, setSelectedSong] = useState("");
  const [savingSong, setSavingSong] = useState(false);

  const handleSongChange = async (newSongFile: string) => {
    if (!password) {
      alert("Please enter the secret password first.");
      return;
    }

    setSelectedSong(newSongFile);
    setSavingSong(true);

    try {
      const res = await fetch("/api/song", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          song: newSongFile,
          secretToken: password, // FIX: Pass your state variable password
        }),
      });

      if (res.ok) {
        alert("Active song updated for all visitors!");
      } else {
        alert("Failed to update song. Check your admin password.");
      }
    } catch (err) {
      console.error("Song change error:", err);
      alert("An error occurred while changing the song.");
    } finally {
      setSavingSong(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !password) {
      setStatus("Please select a file and enter the password.");
      return;
    }

    setUploading(true);
    setStatus("Uploading...");

    try {
      const cleanName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;

      const response = await fetch(`/api/upload?filename=${cleanName}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${password}`,
        },
        body: file,
      });

      if (response.ok) {
        setStatus("Success! Photo uploaded successfully.");
        setFile(null);
        const fileInput = document.getElementById(
          "file-input",
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        const errData = await response.json();
        setStatus(`Upload failed: ${errData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error(error);
      setStatus("An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 font-mono px-4 py-8">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
        {/* Section 1: Authentication */}
        <div>
          <h1 className="text-xl font-bold mb-4 text-gray-900">
            Admin Controls
          </h1>
          <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
            Secret Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black text-black"
            placeholder="••••••••"
            required
          />
        </div>

        <hr className="border-gray-200" />

        {/* Section 2: Photo Upload Form */}
        <div>
          <h2 className="text-sm font-bold uppercase text-gray-900 mb-3">
            Upload Photo
          </h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 cursor-pointer"
                required
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2.5 bg-black text-white rounded text-sm font-semibold tracking-wider uppercase hover:bg-gray-800 transition disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Publish to Site"}
            </button>
          </form>

          {status && (
            <p className="mt-4 text-xs text-center font-medium text-gray-700 bg-gray-100 p-2 rounded">
              {status}
            </p>
          )}
        </div>

        <hr className="border-gray-200" />

        {/* Section 3: Soundtrack Sync Selection */}
        <div>
          <h2 className="text-sm font-bold uppercase text-gray-900 mb-1">
            Background Soundtrack
          </h2>
          <p className="text-[10px] text-gray-400 mb-3">
            Changes music dynamically for all users
          </p>

          <select
            value={selectedSong}
            onChange={(e) => handleSongChange(e.target.value)}
            disabled={savingSong}
            className="w-full bg-white border border-gray-300 p-2 text-sm rounded text-black focus:outline-none focus:border-black cursor-pointer disabled:opacity-50"
          >
            <option value="">Choose a song layout...</option>
            {AVAILABLE_SONGS.map((track) => (
              <option key={track.file} value={track.file}>
                {track.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
