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
    `There is a word in Korean. In-Yun (인연). It means "fate". But it's specifically about relationships between people. It's an In-Yun if two strangers even walk by each other in the street and their clothes accidentally brush. Because it means there must have been something between them in their past lives.\n - Past Lives, Greta Lee`,
    `Yesterday is history, tomorrow is a mystery, but today is a gift — that is why it is called it the present.\n- Master Oogway`,
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
      {/* Centered paragraph and new quote button above the image grid, full width */}
      <div className="w-screen max-w-full flex flex-col items-center mt-4 mb-0">
        <div className="flex flex-col items-center w-full">
          <p className="text-left text-gray-700 text-xl max-w-3xl mx-4 mb-2 whitespace-pre-line">
            {quote}
          </p>
          <button
            onClick={() => {
              let newQuote = quote;
              while (newQuote === quote && quotes.length > 1) {
                newQuote = quotes[Math.floor(Math.random() * quotes.length)];
              }
              setQuote(newQuote);
            }}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition-colors"
          >
            New Quote
          </button>
        </div>
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
