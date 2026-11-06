"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import "./ipod.css";

interface Song {
  title: string;
  file: string;
}

type Screen = "music" | "now-playing";

function displayTitle(title: string) {
  return title
    .replace(/\.(m4a|mp3)$/i, "")
    .replace(/^\d{10,}-/, "")
    .replace(/_/g, " ");
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function AlbumArtwork() {
  return (
    <div className="ipod-artwork" aria-hidden="true">
      <span className="ipod-artwork-sun" />
      <span className="ipod-artwork-horizon" />
      <span className="ipod-artwork-label">trc</span>
    </div>
  );
}

export default function IpodPage() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [screen, setScreen] = useState<Screen>("music");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [playbackError, setPlaybackError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.75);

  const selectedSong = songs[selectedIndex];

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/songs", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load your music.");
        return (await response.json()) as {
          song?: string;
          uploadedSongs?: Song[];
        };
      })
      .then((data) => {
        const uploadedSongs = Array.isArray(data.uploadedSongs)
          ? data.uploadedSongs
          : [];
        setSongs(uploadedSongs);
        const activeSongIndex = uploadedSongs.findIndex(
          (song) => song.file === data.song,
        );
        setSelectedIndex(activeSongIndex >= 0 ? activeSongIndex : 0);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setLoadError("Your music could not be loaded. Please try again.");
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const playTrack = (index: number) => {
    const song = songs[index];
    const audio = audioRef.current;
    if (!song || !audio) return;

    setSelectedIndex(index);
    setScreen("now-playing");
    setPlaybackError("");
    setCurrentTime(0);
    audio.src = song.file;
    audio.currentTime = 0;
    audio.volume = volume;
    audio.play().catch(() => {
      setIsPlaying(false);
      setPlaybackError("This file could not be played. Try another track.");
    });
  };

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio || !selectedSong) return;

    if (!audio.src || audio.currentSrc === "") {
      playTrack(selectedIndex);
    } else if (audio.paused) {
      audio.play().catch(() => {
        setPlaybackError("This file could not be played. Try another track.");
      });
    } else {
      audio.pause();
    }
  };

  const playRelativeTrack = (offset: number) => {
    if (songs.length === 0) return;
    const nextIndex = (selectedIndex + offset + songs.length) % songs.length;
    playTrack(nextIndex);
  };

  const seek = (value: string) => {
    const nextTime = Number(value);
    if (audioRef.current) audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return (
    <main className="ipod-page">
      <header className="ipod-page-header">
        <Link className="ipod-back-link" href="/">
          <span aria-hidden="true">←</span> back to trc
        </Link>
      </header>

      <section className="ipod-device" aria-label="iPod music player">
        <div className="ipod-device-top">
          <span className="ipod-brand">iPod</span>
        </div>

        <div className="ipod-screen-frame">
          <div className="ipod-screen">
            <div className="ipod-status-bar">
              <span className="ipod-status-right">
                {isPlaying && <span className="ipod-playing-dot" />}
                <span aria-label={`${Math.round(volume * 100)} percent volume`}>
                  {volume === 0 ? "◖" : "◖))"}
                </span>
                <input
                  className="ipod-volume-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  aria-label="Volume"
                />
                <span className="ipod-battery" aria-label="Battery full">
                  <span />
                </span>
              </span>
            </div>

            {screen === "music" ? (
              <div className="ipod-library">
                <div className="ipod-list-heading">
                  <strong>Music</strong>
                  <span>{songs.length} SONGS</span>
                </div>
                <div className="ipod-library-art">
                  <AlbumArtwork />
                </div>
                {isLoading ? (
                  <p className="ipod-empty-message">Loading your music…</p>
                ) : loadError ? (
                  <p className="ipod-empty-message">{loadError}</p>
                ) : songs.length === 0 ? (
                  <p className="ipod-empty-message">
                    No uploaded songs yet. Add music in the admin dashboard and
                    it will show up here.
                  </p>
                ) : (
                  <ul className="ipod-song-list" aria-label="Uploaded songs">
                    {songs.map((song, index) => (
                      <li key={`${song.file}-${index}`}>
                        <button
                          className={`ipod-song-row${index === selectedIndex ? " is-selected" : ""}`}
                          onClick={() => playTrack(index)}
                          aria-current={
                            index === selectedIndex ? "true" : undefined
                          }
                        >
                          <span className="ipod-song-index">
                            {isPlaying && index === selectedIndex
                              ? "♫"
                              : String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="ipod-song-title">
                            {displayTitle(song.title)}
                          </span>
                          <span className="ipod-song-arrow" aria-hidden="true">
                            ›
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="ipod-now-playing">
                <AlbumArtwork />
                <div className="ipod-track-info">
                  <p className="ipod-track-kicker">NOW PLAYING</p>
                  <p className="ipod-track-name">
                    {selectedSong ? displayTitle(selectedSong.title) : "Choose a song"}
                  </p>
                </div>
                <div className="ipod-progress">
                  <input
                    aria-label="Seek through song"
                    type="range"
                    min="0"
                    max={duration || 1}
                    step="1"
                    value={Math.min(currentTime, duration || 1)}
                    onChange={(event) => seek(event.target.value)}
                    disabled={!selectedSong}
                  />
                  <div className="ipod-time-labels">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            )}
            {playbackError && (
              <p className="ipod-playback-error" role="status">
                {playbackError}
              </p>
            )}
          </div>
        </div>

        <div className="ipod-wheel" aria-label="Player controls">
          <button
            className="ipod-wheel-button ipod-wheel-menu"
            onClick={() => setScreen("music")}
            aria-label="Show music list"
          >
            MENU
          </button>
          <button
            className="ipod-wheel-button ipod-wheel-previous"
            onClick={() => playRelativeTrack(-1)}
            aria-label="Previous track"
          >
            <svg
              className="ipod-skip-icon"
              viewBox="0 0 20 12"
              aria-hidden="true"
            >
              <path d="M1 2h2v8H1zM12 1 5 6l7 5zM19 1l-7 5 7 5z" />
            </svg>
          </button>
          <button
            className="ipod-wheel-button ipod-wheel-next"
            onClick={() => playRelativeTrack(1)}
            aria-label="Next track"
          >
            <svg
              className="ipod-skip-icon"
              viewBox="0 0 20 12"
              aria-hidden="true"
            >
              <path d="M17 2h2v8h-2zM8 1l7 5-7 5zM1 1l7 5-7 5z" />
            </svg>
          </button>
          <button
            className="ipod-wheel-button ipod-wheel-play"
            onClick={togglePlayback}
            disabled={!selectedSong}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <span className="ipod-play-icon" aria-hidden="true" />
            <span className="ipod-pause-icon" aria-hidden="true" />
          </button>
          <button
            className="ipod-wheel-center"
            onClick={() =>
              setScreen((currentScreen) =>
                currentScreen === "music" ? "now-playing" : "music",
              )
            }
              aria-label="Toggle music list and now playing"
            />
        </div>
        <div className="ipod-device-bottom" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>

      {selectedSong && isPlaying && (
        <p className="ipod-caption">
          Now spinning: {displayTitle(selectedSong.title)}
        </p>
      )}
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) =>
          setDuration(event.currentTarget.duration || 0)
        }
        onEnded={() => playRelativeTrack(1)}
      />
    </main>
  );
}
