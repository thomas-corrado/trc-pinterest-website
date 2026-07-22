"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

export default function Home() {
  const [images, setImages] = useState<string[]>([]);
  const [quote, setQuote] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const swipeStartX = useRef<number | null>(null);

  useEffect(() => {
    // Moving this inside satisfies the dependency checker completely
    const quotes = [
      `“‘It’s all completely perfect,’ the story will say. ‘It’s just like it is in the pictures.’”\n- Vincenzo Latronico, Perfection`,
    ];

    fetch("/api/images")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setImages(data);
        } else {
          console.error("Expected array from images API, got:", data);
        }
      })
      .catch((err) => console.error("Error loading images:", err));

    fetch("/api/songs")
      .then((res) => res.json())
      .then((data) => {
        if (data.song && audioRef.current) {
          audioRef.current.src = data.song;
          audioRef.current.play().catch((err) => {
            console.warn(
              "Autoplay blocked by browser. Waiting for explicit user click:",
              err,
            );
          });
        }
      })
      .catch((err) => console.error("Error loading sync soundtrack:", err));

    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []); // Empty dependency array is perfectly safe now

  // Navigation handlers
  const openModal = (index: number) => {
    setModalIndex(index);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalIndex(null);
  };

  const showPrev = useCallback(() => {
    if (modalIndex !== null && modalIndex > 0) setModalIndex(modalIndex - 1);
  }, [modalIndex]);

  const showNext = useCallback(() => {
    if (modalIndex !== null && modalIndex < images.length - 1)
      setModalIndex(modalIndex + 1);
  }, [modalIndex, images.length]);

  const handleDelete = async (url: string) => {
    const password = prompt("Enter admin password to delete this image:");
    if (!password) return;

    if (confirm("Are you sure you want to permanently delete this photo?")) {
      try {
        const res = await fetch("/api/images/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, secretToken: password }),
        });

        if (res.ok) {
          setImages((prev) => prev.filter((img) => img !== url));
          closeModal();
          alert("Photo successfully deleted.");
        } else {
          alert("Incorrect password or deletion failed.");
        }
      } catch (err) {
        console.error("Error deleting image:", err);
        alert("An error occurred while deleting.");
      }
    }
  };

  // Modal keyboard listeners
  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen, modalIndex, showNext, showPrev]); // FIX: Added missing dependencies here

  return (
    <>
      {/* Header Display */}
      <div className="w-screen max-w-full flex flex-col items-center mt-4 mb-0">
        <div className="flex flex-col items-center w-full">
          <p className="text-left text-gray-700 text-l max-w-3xl mx-4 whitespace-pre-line font-mono">
            {quote}
          </p>
        </div>
      </div>

      {/* Persistent Audio Loop Structure */}
      <audio ref={audioRef} loop />

      {/* Global Manual Music Deck */}
      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => audioRef.current?.play()}
          className="px-4 py-2 bg-green-500 text-white rounded-md font-mono text-xs shadow-md transition hover:bg-green-600"
        >
          Play Music
        </button>
        <button
          onClick={() => audioRef.current?.pause()}
          className="px-4 py-2 bg-red-500 text-white rounded-md font-mono text-xs shadow-md transition hover:bg-red-600"
        >
          Pause Music
        </button>
      </div>

      {/* Grid Canvas */}
      <div className="grid grid-cols-3 gap-[1px] pt-4 px-[1px] pb-[3px] max-w-4xl mx-auto">
        {images.map((src, index) => (
          <div
            key={src}
            className="aspect-[2/3] overflow-hidden cursor-pointer relative bg-gray-100"
            onClick={() => openModal(index)}
          >
            <Image
              src={src}
              alt={`Grid Image ${index + 1}`}
              fill
              sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
              className="object-cover active:opacity-80 transition-opacity"
              priority={index < 6}
            />
            {index === 0 && (
              <div className="absolute top-0 left-0 bg-black bg-opacity-60 text-white p-1 m-1 text-[10px] font-mono rounded z-10">
                click me :)
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dynamic Pop-out Lightbox */}
      {modalOpen && modalIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
          onClick={closeModal}
        >
          {/* Controls Bar */}
          <div className="absolute top-0 w-full flex justify-between items-center px-4 py-4 text-white font-mono text-sm z-10 bg-gradient-to-b from-black/50 to-transparent">
            <span>
              {modalIndex + 1} / {images.length}
            </span>

            <div className="flex items-center gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Block closing action triggers up the component tree
                  handleDelete(images[modalIndex]);
                }}
                className="text-xs bg-red-600/80 hover:bg-red-600 px-3 py-1 rounded text-white font-mono transition"
              >
                Delete
              </button>

              <button
                onClick={closeModal}
                className="text-2xl font-sans p-1 leading-none hover:text-gray-300"
              >
                &#10005;
              </button>
            </div>
          </div>

          {/* Interactive Core Module */}
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
                if (diff > 0) showPrev();
                else showNext();
              }
            }}
          >
            <div className="relative w-full h-[75vh] flex items-center justify-center">
              <Image
                src={images[modalIndex]}
                alt={`Large View Image ${modalIndex + 1}`}
                fill
                sizes="(max-width: 1200px) 100vw, 800px"
                className="object-contain select-none"
                priority
              />
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-center gap-6 mt-6 w-full z-10">
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
