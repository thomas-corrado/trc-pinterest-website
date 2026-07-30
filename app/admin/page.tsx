"use client";

import React, { useState, useEffect } from "react";
import { upload } from "@vercel/blob/client";

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

  // Bulk Photos State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoStatus, setPhotoStatus] = useState("");

  // Audio State
  const [songFile, setSongFile] = useState<File | null>(null);
  const [uploadingSong, setUploadingSong] = useState(false);
  const [songStatus, setSongStatus] = useState("");
  const [selectedSong, setSelectedSong] = useState("");
  const [savingSong, setSavingSong] = useState(false);
  const [dynamicSongs, setDynamicSongs] = useState<
    Array<{ title: string; file: string }>
  >([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Load music options
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
    if (password.trim().length > 0) setIsAuthenticated(true);
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

      if (res.ok) alert("Active song updated!");
      else alert("Failed to update song. Check password.");
    } catch (err) {
      console.error(err);
      alert("Error updating song.");
    } finally {
      setSavingSong(false);
    }
  };

  // Handler: Bulk File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handler: Bulk Upload Photos
  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    setUploadingPhotos(true);
    setPhotoStatus(`Uploading 0 / ${selectedFiles.length}...`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setPhotoStatus(`Uploading image ${i + 1} of ${selectedFiles.length}...`);

      try {
        const cleanName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const response = await fetch(`/api/upload?filename=${cleanName}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${password}` },
          body: file,
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error("Error uploading file:", file.name, error);
        failCount++;
      }
    }

    setUploadingPhotos(false);

    if (failCount === 0) {
      setPhotoStatus(`Success! Published all ${successCount} photos.`);
      setSelectedFiles([]);
    } else {
      setPhotoStatus(
        `Finished with issues: ${successCount} uploaded, ${failCount} failed.`,
      );
    }
  };

  // Handler: Upload Audio
  const handleSongUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songFile) return;

    setUploadingSong(true);
    setSongStatus("Uploading audio...");

    try {
      const cleanName = `${Date.now()}-${songFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const newBlob = await upload(`songs/${cleanName}`, songFile, {
        access: "public",
        handleUploadUrl: "/api/songs/upload",
      });

      setSongStatus("Success! Song uploaded.");
      setSongFile(null);
      setDynamicSongs((prev) => [
        ...prev,
        { title: cleanName.replace(/_/g, " "), file: newBlob.url },
      ]);
    } catch (error) {
      console.error(error);
      setSongStatus("Error uploading song.");
    } finally {
      setUploadingSong(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 font-mono text-white px-4">
        <div className="w-full max-w-sm bg-neutral-900 p-6 rounded-2xl border border-neutral-800 shadow-xl space-y-4">
          <h1 className="text-sm font-bold uppercase tracking-wider text-white">
            Admin Access
          </h1>
          <p className="text-xs text-neutral-400">
            Enter password to access site controls
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
              placeholder="••••••••"
              autoFocus
              required
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-white text-black font-bold text-xs uppercase rounded-lg hover:bg-neutral-200 transition"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-neutral-950 text-neutral-100 font-mono px-4 py-12">
      <div className="w-full max-w-xl bg-neutral-900 p-6 rounded-2xl border border-neutral-800 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-white">
              Admin Dashboard
            </h1>
            <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-0.5 rounded-full inline-block mt-1">
              ● Session Unlocked
            </span>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-xs text-neutral-400 hover:text-white underline transition"
          >
            Lock
          </button>
        </div>

        {/* SECTION: BULK PHOTO UPLOAD */}
        <div className="space-y-3 text-xs">
          <h2 className="font-bold text-sm uppercase text-white border-b border-neutral-800 pb-2">
            1. Bulk Upload Photos to Grid
          </h2>
          <form onSubmit={handleBulkUpload} className="space-y-4">
            <div className="border border-dashed border-neutral-800 hover:border-neutral-700 p-6 rounded-xl text-center bg-neutral-950/50 transition">
              <input
                type="file"
                accept="image/*"
                multiple
                id="bulk-photo-input"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="bulk-photo-input"
                className="cursor-pointer text-xs font-semibold text-white block space-y-1"
              >
                <p>Click to select photos (Multiple allowed)</p>
                <p className="text-[10px] text-neutral-500 font-normal">
                  PNG, JPG, WEBP, GIF
                </p>
              </label>
            </div>

            {/* Selected File Previews */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                  <span>Selected Photos ({selectedFiles.length})</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles([])}
                    className="text-[10px] text-red-400 hover:underline"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                  {selectedFiles.map((f, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800"
                    >
                      <img
                        src={URL.createObjectURL(f)}
                        alt={f.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="absolute top-1 right-1 bg-black/80 hover:bg-red-900 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={uploadingPhotos || selectedFiles.length === 0}
              className="w-full py-3 bg-white text-black font-bold uppercase rounded-lg text-xs hover:bg-neutral-200 transition disabled:opacity-50"
            >
              {uploadingPhotos
                ? "Uploading..."
                : `Publish ${selectedFiles.length} Photo${selectedFiles.length === 1 ? "" : "s"}`}
            </button>
          </form>

          {photoStatus && (
            <p className="mt-2 text-xs text-center font-medium text-emerald-400 bg-neutral-950 border border-neutral-800 p-2 rounded-lg">
              {photoStatus}
            </p>
          )}
        </div>

        <hr className="border-neutral-800" />

        {/* SECTION: AUDIO UPLOAD */}
        <div className="space-y-3 text-xs">
          <h2 className="font-bold text-sm uppercase text-white border-b border-neutral-800 pb-2">
            2. Upload New Song File
          </h2>
          <form onSubmit={handleSongUpload} className="space-y-4">
            <input
              type="file"
              accept="audio/m4a,audio/mp3,audio/*"
              onChange={(e) => setSongFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 cursor-pointer"
            />
            <button
              type="submit"
              disabled={uploadingSong}
              className="w-full py-3 bg-white text-black font-bold uppercase rounded-lg text-xs hover:bg-neutral-200 transition disabled:opacity-50"
            >
              {uploadingSong ? "Uploading Audio..." : "Save Song to Blob"}
            </button>
          </form>
          {songStatus && (
            <p className="mt-2 text-xs text-center font-medium text-emerald-400 bg-neutral-950 border border-neutral-800 p-2 rounded-lg">
              {songStatus}
            </p>
          )}
        </div>

        <hr className="border-neutral-800" />

        {/* SECTION: MAIN SITE SOUNDTRACK */}
        <div className="space-y-3 text-xs">
          <h2 className="font-bold text-sm uppercase text-white border-b border-neutral-800 pb-2">
            3. Main Site Active Soundtrack
          </h2>
          <select
            value={selectedSong}
            onChange={(e) => handleSongChange(e.target.value)}
            disabled={savingSong}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-white cursor-pointer disabled:opacity-50"
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
