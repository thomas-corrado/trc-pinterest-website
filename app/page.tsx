"use client";

import React, { useState, useEffect, useRef } from "react";

// Utility function to shuffle an array
const shuffleArray = (array: string[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function Home() {
  const [images, setImages] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const generatedImages = Array.from(
      { length: 88 },
      (_, i) => `/trc-pinterest-${(i + 1).toString().padStart(2, "0")}.jpg`
    );
    const shuffledImages = shuffleArray(generatedImages); // Shuffle images randomly
    setImages(shuffledImages);

    // Attempt to play audio
    if (audioRef.current) {
      console.log("Audio element reference:", audioRef.current);
      audioRef.current.play().catch((err) => {
        console.warn(
          "Audio playback failed. Waiting for user interaction:",
          err
        );
      });
    }
  }, []);

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="masonry-container p-4">
      {/* Audio Element */}
      <audio ref={audioRef} src="/Billie (Loving Arms) 1.m4a" loop />

      {/* Manual Play Controls */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => audioRef.current?.play()}
          className="px-4 py-2 bg-green-500 text-white rounded-md"
        >
          Play Music
        </button>
        <button
          onClick={() => audioRef.current?.pause()}
          className="px-4 py-2 bg-red-500 text-white rounded-md ml-2"
        >
          Pause Music
        </button>
      </div>

      {/* Masonry Grid */}
      {images.map((src, index) => (
        <div key={index} className="masonry-item overflow-hidden">
          <img
            src={src}
            alt={`Pinterest Image ${index + 1}`}
            className="w-full h-auto object-cover"
          />
        </div>
      ))}
    </div>
  );
}
