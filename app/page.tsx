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
  const [quote, setQuote] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement>(null);

  // Array of quotes
  const quotes = [
    `Ring the bells that still can ring.\nForget your perfect offering.\nThere is a crack in everything.\nThat's how the light gets in.\n- Leonard Cohen`,
    `God, grant me the serenity to accept the things I cannot change,\nCourage to change the things I can,\nAnd wisdom to know the difference.\n- Reinhold Niebuhr`,
    `Life is coming from you, not at you.\n- Timothée Chalamet`,
    `Your worst sin is that you have destroyed and betrayed yourself for nothing.\n- Fyodor Dostoevsky`,
    `And now that you don't have to be perfect, you can be good.\n- John Steinbeck`,
    `I swear to you that to think too much is a disease, a real, actual disease.\n- Fyodor Dostoevsky`,
  ];

  useEffect(() => {
    const generatedImages = Array.from(
      { length: 93 },
      (_, i) => `/trc-pinterest-${(i + 1).toString().padStart(2, "0")}.jpeg`
    );
    const shuffledImages = shuffleArray(generatedImages); // Shuffle images randomly
    setImages(shuffledImages);

    // Pick a random quote
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);

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
    <>
      {/* Centered paragraph above the image grid, full width */}
      <div className="w-screen max-w-full justify-center flex">
        <p className="text-left text-gray-700 text-xl max-w-3xl mx-4 mt-4 mb-0 whitespace-pre-line">
          {quote}
        </p>
      </div>

      <div className="masonry-container p-4">
        {/* Audio Element */}
        <audio ref={audioRef} src="/06 Tate (How I Feel).m4a" loop />

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
    </>
  );
}
