"use client";

import React, { useState, useEffect } from "react";

// Local fallback audio tracks from /public/songs
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

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Photo State
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);

  // Audio State
  const [songFile, setSongFile] = useState<File | null>(null);
  const [uploadingSong, setUploadingSong] = useState(false);
  const [songStatus, setSongStatus] = useState("");
  const [selectedSong, setSelectedSong] = useState("");
  const [savingSong, setSavingSong] = useState(false);
  const [dynamicSongs, setDynamicSongs] = useState<
    Array<{ title: string; file: string }>
  >([]);

  // Fetch active song & uploaded song list once authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    fetch("/api/songs")
      .then((res) => res.json())
      .then((data) => {
        if (data.song) setSelectedSong(data.song);
        if (data.uploadedSongs) setDynamicSongs(data.uploadedSongs);
      })
      .catch((err) => console.error("Error fetching songs:", err));
  }, [isAuthenticated]);

  const allAvailableSongs = [...LOCAL_SONGS, ...dynamicSongs];

  // Unlock Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim().length > 0) {
      setIsAuthenticated(true);
    }
  };

  // Handler: Change active soundtrack
  const handleSongChange = async (newSongFile: string) => {
    setSelectedSong(newSongFile);
    setSavingSong(true);

    try {
      const res = await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song: newSongFile, secretToken: password }),
      });

      if (res.ok) {
        alert("Active song updated for all visitors!");
      } else {
        alert("Failed to update song. Incorrect password.");
      }
    } catch (err) {
      console.error("Song change error:", err);
      alert("An error occurred while changing the song.");
    } finally {
      setSavingSong(false);
    }
  };

  // Handler: Upload new photo
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus("Please select an image file first.");
      return;
    }

    setUploading(true);
    setStatus("Uploading photo...");

    try {
      const cleanName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const response = await fetch(`/api/upload?filename=${cleanName}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${password}` },
        body: file,
      });

      if (response.ok) {
        setStatus("Success! Photo published successfully.");
        setFile(null);
        const fileInput = document.getElementById(
          "file-input",
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        const errData = await response.json();
        setStatus(
          `Upload failed: ${errData.error || "Incorrect password or network error"}`,
        );
      }
    } catch (error) {
      console.error(error);
      setStatus("An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  // Handler: Upload new audio file
  const handleSongUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songFile) {
      setSongStatus("Please select an audio file first.");
      return;
    }

    setUploadingSong(true);
    setSongStatus("Uploading audio track...");

    try {
      const cleanName = `${Date.now()}-${songFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const response = await fetch(`/api/songs/upload?filename=${cleanName}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${password}` },
        body: songFile,
      });

      if (response.ok) {
        const uploadedBlob = await response.json();
        setSongStatus("Success! Song uploaded.");
        setSongFile(null);

        const newTrack = {
          title: cleanName.replace(/_/g, " "),
          file: uploadedBlob.url,
        };
        setDynamicSongs((prev) => [...prev, newTrack]);

        const audioInput = document.getElementById(
          "song-file-input",
        ) as HTMLInputElement;
        if (audioInput) audioInput.value = "";
      } else {
        const errData = await response.json();
        setSongStatus(
          `Audio upload failed: ${errData.error || "Incorrect password"}`,
        );
      }
    } catch (error) {
      console.error(error);
      setSongStatus("An error occurred during audio upload.");
    } finally {
      setUploadingSong(false);
    }
  };

  // ==========================================
  // VIEW 1: GATE / PASSWORD LOGIN SCREEN
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 font-mono px-4">
        <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h1 className="text-lg font-bold mb-1 text-gray-900">Admin Portal</h1>
          <p className="text-xs text-gray-500 mb-6">
            Enter password to access site controls
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black text-black text-sm"
                placeholder="••••••••"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-black text-white rounded text-xs font-semibold tracking-wider uppercase hover:bg-gray-800 transition"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: UNLOCKED ADMIN DASHBOARD
  // ==========================================
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 font-mono px-4 py-8">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
        {/* Header & Lock Option */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-[10px] text-green-600 font-semibold">
              ● Session Unlocked
            </p>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-xs text-gray-400 hover:text-black underline"
          >
            Lock
          </button>
        </div>

        {/* Photo Upload Section */}
        <div>
          <h2 className="text-xs font-bold uppercase text-gray-500 mb-3">
            1. Upload Photo
          </h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 cursor-pointer"
              required
            />
            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2 bg-black text-white rounded text-xs font-semibold tracking-wider uppercase hover:bg-gray-800 transition disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Publish Photo"}
            </button>
          </form>
          {status && (
            <p className="mt-3 text-xs text-center font-medium text-gray-700 bg-gray-100 p-2 rounded">
              {status}
            </p>
          )}
        </div>

        <hr className="border-gray-200" />

        {/* Audio Track Upload Section */}
        <div>
          <h2 className="text-xs font-bold uppercase text-gray-500 mb-3">
            2. Upload New Song
          </h2>
          <form onSubmit={handleSongUpload} className="space-y-4">
            <input
              id="song-file-input"
              type="file"
              accept="audio/m4a,audio/mp3,audio/*"
              onChange={(e) => setSongFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 cursor-pointer"
              required
            />
            <button
              type="submit"
              disabled={uploadingSong}
              className="w-full py-2 bg-neutral-800 text-white rounded text-xs font-semibold tracking-wider uppercase hover:bg-black transition disabled:opacity-50"
            >
              {uploadingSong ? "Uploading Audio..." : "Save Song to Blob"}
            </button>
          </form>
          {songStatus && (
            <p className="mt-3 text-xs text-center font-medium text-gray-700 bg-gray-100 p-2 rounded">
              {songStatus}
            </p>
          )}
        </div>

        <hr className="border-gray-200" />

        {/* Soundtrack Selector Section */}
        <div>
          <h2 className="text-xs font-bold uppercase text-gray-500 mb-1">
            3. Select Active Soundtrack
          </h2>
          <p className="text-[10px] text-gray-400 mb-3">
            Applies immediately to site visitors
          </p>

          <select
            value={selectedSong}
            onChange={(e) => handleSongChange(e.target.value)}
            disabled={savingSong}
            className="w-full bg-white border border-gray-300 p-2 text-xs rounded text-black focus:outline-none focus:border-black cursor-pointer disabled:opacity-50"
          >
            <option value="">Choose active track...</option>
            {allAvailableSongs.map((track) => (
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
