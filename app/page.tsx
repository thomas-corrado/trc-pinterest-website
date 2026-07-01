"use client";

import React, { useState, useEffect, useRef } from "react";

// Images are shown in sequential order (no shuffling)

export default function Home() {
  const [images, setImages] = useState<string[]>([]);
  const [quote, setQuote] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  // List of available songs in public folder
  // const songs = [
  //   "01 Baxter (These Are My Friends).m4a",
  //   "01 Can't Do Without You.m4a",
  //   "05 Blue Spring.m4a",
  //   "Billie (Loving Arms) 1.m4a",
  //   "Open Season.m4a",
  //   "06 Tate (How I Feel).m4a",
  // ];
  const swipeStartX = useRef<number | null>(null);

  // Array of quotes
  const quotes = [
    `“‘It’s all completely perfect,’ the story will say. ‘It’s just like it is in the pictures.’”\n- Vincenzo Latronico, Perfection`,
  ];

  useEffect(() => {
    const generatedImages = Array.from(
      { length: 120 },
      (_, i) => `/trc-pinterest-${i + 1}.jpeg`,
    );
    setImages(generatedImages);

    // Pick a random quote
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);

    // Attempt to play audio
    if (audioRef.current) {
      console.log("Audio element reference:", audioRef.current);
      audioRef.current.play().catch((err) => {
        console.warn(
          "Audio playback failed. Waiting for user interaction:",
          err,
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
          <p className="text-left text-gray-700 text-l max-w-3xl mx-4 whitespace-pre-line font-mono">
            {quote}
          </p>
          {/* <button
            onClick={() => {
              let newQuote = quote;
              while (newQuote === quote && quotes.length > 1) {
                newQuote = quotes[Math.floor(Math.random() * quotes.length)];
              }
              setQuote(newQuote);
            }}
            className="mt-2 px-4 py-2 bg-black text-white rounded-md shadow hover:bg-gray-900 font-mono"
          >
            New Quote
          </button> */}
        </div>
      </div>

      {/* Audio Element */}
      <audio ref={audioRef} src="01 Baxter (These Are My Friends).m4a" loop />

      {/* Manual Play Controls */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => {
            if (audioRef.current) {
              const randomSong = "10 A World Alone.m4a";
              if (
                audioRef.current.src !==
                window.location.origin + "/" + randomSong
              ) {
                audioRef.current.src = randomSong;
              }
              audioRef.current.play();
            }
          }}
          className="px-4 py-2 bg-green-500 text-white rounded-md font-mono"
        >
          Play Music
        </button>
        <button
          onClick={() => audioRef.current?.pause()}
          className="px-4 py-2 bg-red-500 text-white rounded-md ml-2 font-mono"
        >
          Pause Music
        </button>
      </div>

      {/* RECTANGLE INSTAGRAM GRID:
        - Fixed strict 3-columns across ALL device screens (grid-cols-3)
        - Changed aspect-square to aspect-[2/3] for a beautiful tall portrait rectangle look
      */}
      <div className="grid grid-cols-3 gap-[1px] pt-4 px-[3px] pb-[3px] max-w-4xl mx-auto">
        {images.map((src, index) => (
          <div
            key={index}
            className="aspect-[2/3] overflow-hidden cursor-pointer relative bg-gray-100"
            onClick={() => openModal(index)}
          >
            <img
              src={src}
              alt={`Instagram Grid Image ${index + 1}`}
              className="w-full h-full object-cover active:opacity-80 transition-opacity"
            />
            {index === 0 && (
              <div className="absolute top-0 left-0 bg-black bg-opacity-60 text-white p-1 m-1 text-[10px] font-mono rounded">
                click me :)
              </div>
            )}
          </div>
        ))}
      </div>

      {/* INSTAGRAM MODAL VIEW */}
      {modalOpen && modalIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
          onClick={closeModal}
        >
          {/* Top navigation header for standard mobile overlay feel */}
          <div className="absolute top-0 w-full flex justify-between items-center px-4 py-4 text-white font-mono text-sm z-10 bg-gradient-to-b from-black/50 to-transparent">
            <span>
              {modalIndex + 1} / {images.length}
            </span>
            <button
              onClick={closeModal}
              className="text-2xl font-sans p-1 leading-none hover:text-gray-300"
            >
              &#10005;
            </button>
          </div>

          <div
            className="relative w-full max-w-2xl flex flex-col items-center justify-center px-2"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              if (e.touches.length === 1) {
                swipeStartX.current = e.touches[0].clientX;
              }
            }}
            onTouchEnd={(e) => {
              if (swipeStartX.current === null) return;
              const endX = e.changedTouches[0].clientX;
              const diff = endX - swipeStartX.current;
              swipeStartX.current = null;
              if (Math.abs(diff) > 50) {
                if (diff > 0) {
                  showPrev();
                } else {
                  showNext();
                }
              }
            }}
          >
            {/* The Image scales up natively to fit the container bounds while preserving aspect ratio */}
            <img
              src={images[modalIndex]}
              alt={`Large View Image ${modalIndex + 1}`}
              className="max-w-full max-h-[75vh] object-contain select-none shadow-2xl"
            />

            {/* Navigation buttons */}
            <div className="flex items-center justify-center gap-6 mt-6 w-full">
              <button
                onClick={showPrev}
                disabled={modalIndex === 0}
                className="px-4 py-2 bg-neutral-900 text-white border border-neutral-800 disabled:opacity-30 rounded-full hover:bg-neutral-800 font-mono transition"
              >
                &#8592; Prev
              </button>
              <button
                onClick={showNext}
                disabled={modalIndex === images.length - 1}
                className="px-4 py-2 bg-neutral-900 text-white border border-neutral-800 disabled:opacity-30 rounded-full hover:bg-neutral-800 font-mono transition"
              >
                Next &#8594;
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
