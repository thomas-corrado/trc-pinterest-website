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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState<number | null>(null);
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

  // Modal navigation handlers
  const openModal = (index: number) => {
    setModalIndex(index);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setModalIndex(null);
  };
  const showPrev = () => {
    if (modalIndex !== null && modalIndex > 0) setModalIndex(modalIndex - 1);
  };
  const showNext = () => {
    if (modalIndex !== null && modalIndex < images.length - 1)
      setModalIndex(modalIndex + 1);
  };

  // Close modal on Escape key
  React.useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen, modalIndex]);

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
            className="mt-2 px-4 py-2 bg-black text-white rounded-md shadow hover:bg-gray-900"
          >
            New Quote
          </button>
        </div>
      </div>

      <div className="masonry-container p-4">
        {/* Audio Element */}
        <audio ref={audioRef} src="/01 Into Dust (Still Falling).m4a" loop />

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
          <div
            key={index}
            className="masonry-item overflow-hidden cursor-pointer"
            onClick={() => openModal(index)}
          >
            <img
              src={src}
              alt={`Pinterest Image ${index + 1}`}
              className="w-full h-auto object-cover"
            />
          </div>
        ))}
      </div>

      {/* Modal for image preview */}
      {modalOpen && modalIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80"
          onClick={closeModal}
        >
          <div
            className="relative flex flex-col items-center justify-center"
            style={{ maxWidth: "90vw", maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[modalIndex]}
              alt={`Large Pinterest Image ${modalIndex + 1}`}
              className="max-w-full max-h-[80vh] rounded shadow-lg mb-4"
            />
            <div className="flex items-center justify-center gap-4 mt-2">
              <button
                onClick={showPrev}
                disabled={modalIndex === 0}
                className="px-3 py-2 bg-black text-white rounded hover:bg-gray-900"
              >
                &#8592;
              </button>
              <button
                onClick={closeModal}
                className="px-3 py-2 bg-black text-white rounded hover:bg-gray-900"
              >
                &#10005; Close
              </button>
              <button
                onClick={showNext}
                disabled={modalIndex === images.length - 1}
                className="px-3 py-2 bg-black text-white rounded hover:bg-gray-900"
              >
                &#8594;
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
