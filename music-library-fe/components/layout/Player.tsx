"use client";

import { useRef, useEffect } from "react";
import { registerAudio, usePlayer, togglePlay, nextTrack, prevTrack, seekTo, setShowNowPlaying } from "@/hooks/usePlayer";
import NowPlaying from "./NowPlaying";

const fmt = (s: number) => {
  if (!s || isNaN(s) || s < 0) return "0:00";
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
};

export default function Player() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { track, isPlaying, currentTime, duration, queue, queueIndex } = usePlayer();
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasPrev  = queueIndex > 0 || (queueIndex === 0 && currentTime > 3);
  const hasNext  = queueIndex < queue.length - 1;

  useEffect(() => {
    if (audioRef.current) registerAudio(audioRef.current);
  }, []);

  return (
    <>
      <audio ref={audioRef} hidden />
      <NowPlaying />

      <footer
        className="glass flex-shrink-0"
        style={{ borderTop: "1px solid var(--separator)", height: 80 }}
      >
        <div className="flex items-center h-full px-4 md:px-8 gap-4 max-w-screen-2xl mx-auto">
          {track ? (
            <>
              {/* ── LEFT: vinyl + track info — click opens NowPlaying ── */}
              <div
                className="flex items-center gap-3 cursor-pointer select-none flex-shrink-0 min-w-0"
                style={{ width: "clamp(120px, 30%, 260px)" }}
                onClick={() => setShowNowPlaying(true)}
              >
                <div
                  className={`vinyl-disc flex-shrink-0${isPlaying ? " vinyl-spinning" : ""}`}
                  style={{ width: 44, height: 44 }}
                >
                  <div className="vinyl-shimmer" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm leading-tight truncate">{track.title}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {track.artist}
                  </p>
                </div>
              </div>

              {/* ── CENTER: controls + seek bar ── */}
              <div
                className="flex-1 flex flex-col items-center justify-center gap-1.5 min-w-0"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Control buttons */}
                <div className="flex items-center gap-3 md:gap-5">
                  <button
                    onClick={prevTrack}
                    disabled={!hasPrev}
                    aria-label="Previous"
                    style={{
                      fontSize: 13, background: "none", border: "none",
                      cursor: hasPrev ? "pointer" : "default",
                      color: "var(--text-secondary)", opacity: hasPrev ? 1 : 0.3,
                    }}
                  >⏮</button>

                  <button
                    onClick={togglePlay}
                    aria-label={isPlaying ? "Pause" : "Play"}
                    style={{
                      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                      background: "var(--accent)", color: "#fff", border: "none",
                      cursor: "pointer", fontSize: 13,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 2px 12px var(--accent-glow)",
                    }}
                  >
                    {isPlaying ? "⏸" : "▶"}
                  </button>

                  <button
                    onClick={nextTrack}
                    disabled={!hasNext}
                    aria-label="Next"
                    style={{
                      fontSize: 13, background: "none", border: "none",
                      cursor: hasNext ? "pointer" : "default",
                      color: "var(--text-secondary)", opacity: hasNext ? 1 : 0.3,
                    }}
                  >⏭</button>
                </div>

                {/* Seek bar + timestamps — desktop only */}
                {duration > 0 && (
                  <div className="hidden md:flex items-center gap-2.5 w-full max-w-sm">
                    <span className="text-[10px] tabular-nums flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                      {fmt(currentTime)}
                    </span>
                    <div
                      className="flex-1 relative rounded-full overflow-visible"
                      style={{ height: 6, background: "var(--separator)" }}
                    >
                      {/* Gradient fill */}
                      <div
                        className="absolute inset-y-0 left-0 rounded-full pointer-events-none"
                        style={{
                          width: `${progress}%`,
                          background: "linear-gradient(90deg, var(--accent), #bf5af2)",
                          transition: "width 0.25s linear",
                        }}
                      />
                      {/* Thumb dot */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none"
                        style={{
                          left: `${progress}%`,
                          transform: `translateX(-50%) translateY(-50%)`,
                          background: "#fff",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
                        }}
                      />
                      {/* Invisible range input for interaction */}
                      <input
                        type="range"
                        min={0} max={duration} value={currentTime} step={0.1}
                        className="absolute inset-0 w-full cursor-pointer"
                        style={{ opacity: 0, height: "100%", margin: 0 }}
                        onChange={(e) => seekTo(Number(e.target.value))}
                      />
                    </div>
                    <span className="text-[10px] tabular-nums flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                      {fmt(duration)}
                    </span>
                  </div>
                )}
              </div>

              {/* ── RIGHT: copyright (desktop) ── */}
              <div
                className="hidden md:flex items-center justify-end flex-shrink-0"
                style={{ width: "clamp(120px, 25%, 240px)" }}
              >
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  © 2026 Trần Đăng Tuấn
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Select a track to play
            </p>
          )}
        </div>
      </footer>
    </>
  );
}
