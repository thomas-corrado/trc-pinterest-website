"use client";

import React, { useState } from "react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !password) {
      setStatus("Please select a file and enter the password.");
      return;
    }

    setUploading(true);
    setStatus("Uploading...");

    try {
      // 1. Generate a clean timestamped filename to prevent conflicts
      const cleanName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;

      // 2. Send the file raw binary directly to our upload API route
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
        // Reset the file input visually
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 font-mono px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-xl font-bold mb-6 text-gray-900">Upload Photo</h1>

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
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

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
              Select Photo
            </label>
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
    </div>
  );
}
