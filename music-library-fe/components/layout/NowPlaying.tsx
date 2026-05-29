"use client";

import { useRef } from "react";
import { usePlayer, togglePlay, seekTo, setShowNowPlaying, nextTrack, prevTrack } from "@/hooks/usePlayer";
import { useTheme } from "@/hooks/useTheme";

const fmt = (s: number) => {
  if (!s || isNaN(s) || s < 0) return "0:00";
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
};

export default function NowPlaying() {
  const { track, isPlaying, currentTime, duration, showNowPlaying, queue, queueIndex } = usePlayer();
  const { isDark } = useTheme();
  const touchStartY = useRef<number | null>(null);

  if (!showNowPlaying || !track) return null;

  const progress    = duration > 0 ? currentTime / duration : 0;
  const hasQueue    = queue.length > 1;
  const hasPrev     = queueIndex > 0 || (queueIndex === 0 && currentTime > 3);
  const hasNext     = queueIndex < queue.length - 1;

  const bg          = isDark
    ? "linear-gradient(160deg, #0a0a1a 0%, #1a0a2e 55%, #0a1222 100%)"
    : "linear-gradient(160deg, #f0eeff 0%, #e8d8ff 45%, #d8eeff 100%)";
  const labelColor  = isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.38)";
  const artistColor = isDark ? "rgba(255,255,255,0.52)" : "rgba(0,0,0,0.52)";
  const btnBg       = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const btnBorder   = isDark ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.12)";
  const btnColor    = isDark ? "#fff" : "#1D1D1F";
  const seekFill    = isDark
    ? `linear-gradient(to right, rgba(255,255,255,0.88) ${progress * 100}%, rgba(255,255,255,0.20) ${progress * 100}%)`
    : `linear-gradient(to right, rgba(0,0,0,0.75) ${progress * 100}%, rgba(0,0,0,0.14) ${progress * 100}%)`;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col now-playing-overlay"
      style={{ background: bg }}
      onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY; }}
      onTouchEnd={(e) => {
        if (touchStartY.current !== null && e.changedTouches[0].clientY - touchStartY.current > 60)
          setShowNowPlaying(false);
        touchStartY.current = null;
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-14 pb-2 flex-shrink-0">
        <button
          onClick={() => setShowNowPlaying(false)}
          className="w-9 h-9 rounded-full flex items-center justify-center transition active:scale-90"
          style={{ background: btnBg, color: btnColor }}
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <div className="text-center">
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: labelColor }}>
            Now Playing
          </p>
          {hasQueue && (
            <p className="text-xs mt-0.5 tabular-nums" style={{ color: labelColor }}>
              {queueIndex + 1} / {queue.length}
            </p>
          )}
        </div>

        <div className="w-9" />
      </div>

      {/* Vinyl Disc */}
      <div className="flex-1 flex items-center justify-center py-4">
        <div
          className={`vinyl-disc${isPlaying ? " vinyl-spinning" : ""}`}
          style={{ width: 220, height: 220 }}
        >
          <div className="vinyl-shimmer" />
        </div>
      </div>

      {/* Track Info */}
      <div className="px-8 pb-4 text-center flex-shrink-0">
        <h2 className="text-xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
          {track.title}
        </h2>
        <p className="text-sm mt-1 truncate" style={{ color: artistColor }}>
          {track.artist}{track.album ? ` · ${track.album}` : ""}
        </p>
      </div>

      {/* Seek Bar */}
      <div className="px-8 pb-2 flex-shrink-0">
        <input
          type="range"
          min={0}
          max={duration || 1}
          value={currentTime}
          step={0.1}
          className="seek-bar w-full"
          style={{ background: seekFill }}
          onChange={(e) => seekTo(Number(e.target.value))}
        />
        <div className="flex justify-between mt-1.5">
          <span className="text-xs tabular-nums" style={{ color: labelColor }}>{fmt(currentTime)}</span>
          <span className="text-xs tabular-nums" style={{ color: labelColor }}>{fmt(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 pb-16 flex-shrink-0">
        {/* Prev */}
        <button
          onClick={prevTrack}
          disabled={!hasPrev}
          className="w-12 h-12 rounded-full flex items-center justify-center transition active:scale-90"
          style={{
            background: btnBg,
            border: `1px solid ${btnBorder}`,
            color: hasPrev ? btnColor : (isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)"),
          }}
          aria-label="Previous"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
          </svg>
        </button>

        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          className="w-16 h-16 rounded-full flex items-center justify-center transition active:scale-90"
          style={{ background: btnBg, border: `1px solid ${btnBorder}`, color: btnColor }}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1.5" />
              <rect x="14" y="4" width="4" height="16" rx="1.5" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Next */}
        <button
          onClick={nextTrack}
          disabled={!hasNext}
          className="w-12 h-12 rounded-full flex items-center justify-center transition active:scale-90"
          style={{
            background: btnBg,
            border: `1px solid ${btnBorder}`,
            color: hasNext ? btnColor : (isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)"),
          }}
          aria-label="Next"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
