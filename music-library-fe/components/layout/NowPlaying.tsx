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

  const progress = duration > 0 ? currentTime / duration : 0;
  const hasQueue = queue.length > 1;
  const hasPrev  = queueIndex > 0 || (queueIndex === 0 && currentTime > 3);
  const hasNext  = queueIndex < queue.length - 1;

  // ── Backgrounds ───────────────────────────────────────────
  const bg = isDark
    ? "linear-gradient(165deg, #07071a 0%, #130830 50%, #070e1e 100%)"
    : "linear-gradient(165deg, #fce8ff 0%, #eeddff 42%, #ddf0ff 100%)";

  // ── Seek bar gradient fill ────────────────────────────────
  const pct      = `${progress * 100}%`;
  const seekFill = isDark
    ? `linear-gradient(to right, #adc6ff ${pct}, rgba(255,255,255,0.14) ${pct})`
    : `linear-gradient(to right, #6366f1 ${pct}, rgba(0,0,0,0.09) ${pct})`;

  // ── Text ──────────────────────────────────────────────────
  const labelColor  = isDark ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.32)";
  const artistColor = isDark ? "rgba(255,255,255,0.56)" : "rgba(30,10,60,0.50)";
  const titleColor  = isDark ? "#F5F5F7" : "#1D1D1F";

  // ── Close button ──────────────────────────────────────────
  const closeBg    = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)";
  const closeColor = isDark ? "#fff" : "#1D1D1F";

  // ── Nav buttons ⏮ ⏭ ─────────────────────────────────────
  const navBg     = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
  const navBorder = isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.09)";
  const navActive = isDark ? "#F5F5F7" : "#1D1D1F";
  const navMuted  = isDark ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.16)";

  // ── Play / Pause button ───────────────────────────────────
  const playBg     = isDark ? "rgba(245,245,247,0.96)" : "#1D1D1F";
  const playColor  = isDark ? "#07071a" : "#F5F5F7";
  const playShadow = isDark
    ? "0 6px 28px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.24) inset"
    : "0 6px 22px rgba(0,0,0,0.24), 0 1px 0 rgba(255,255,255,0.50) inset";

  // ── Secondary actions ─────────────────────────────────────
  const secColor = isDark ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.26)";

  // ── Vinyl glow ────────────────────────────────────────────
  const vinylGlow = isDark
    ? "drop-shadow(0 24px 56px rgba(90,50,200,0.48))"
    : "drop-shadow(0 22px 50px rgba(100,60,180,0.22))";

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
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 pt-14 pb-2 flex-shrink-0">
        <button
          onClick={() => setShowNowPlaying(false)}
          className="w-9 h-9 rounded-full flex items-center justify-center transition active:scale-90"
          style={{ background: closeBg, color: closeColor }}
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

      {/* ── Vinyl Disc ── */}
      <div className="flex-1 flex items-center justify-center py-4">
        <div
          className={`vinyl-disc${isPlaying ? " vinyl-spinning" : ""}`}
          style={{ width: 240, height: 240, filter: vinylGlow }}
        >
          <div className="vinyl-shimmer" />
        </div>
      </div>

      {/* ── Track Info ── */}
      <div className="px-8 pb-3 text-center flex-shrink-0">
        <h2 className="text-xl font-bold leading-snug truncate" style={{ color: titleColor }}>
          {track.title}
        </h2>
        <p className="text-sm mt-1.5 truncate" style={{ color: artistColor }}>
          {track.artist}{track.album ? ` · ${track.album}` : ""}
        </p>
      </div>

      {/* ── Seek Bar ── */}
      <div className="px-8 pb-3 flex-shrink-0">
        <input
          type="range"
          min={0}
          max={duration || 1}
          value={currentTime}
          step={0.1}
          className="seek-bar-np w-full"
          style={{ background: seekFill }}
          onChange={(e) => seekTo(Number(e.target.value))}
        />
        <div className="flex justify-between mt-1.5">
          <span className="text-xs tabular-nums" style={{ color: labelColor }}>{fmt(currentTime)}</span>
          <span className="text-xs tabular-nums" style={{ color: labelColor }}>{fmt(duration)}</span>
        </div>
      </div>

      {/* ── Main Controls ── */}
      <div className="flex items-center justify-center gap-7 pb-5 flex-shrink-0">
        {/* Prev */}
        <button
          onClick={prevTrack}
          disabled={!hasPrev}
          className="w-12 h-12 rounded-full flex items-center justify-center transition active:scale-90"
          style={{ background: navBg, border: `1px solid ${navBorder}`, color: hasPrev ? navActive : navMuted }}
          aria-label="Previous"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
          </svg>
        </button>

        {/* Play / Pause — prominent solid disc */}
        <button
          onClick={togglePlay}
          className="w-[72px] h-[72px] rounded-full flex items-center justify-center transition active:scale-90"
          style={{ background: playBg, boxShadow: playShadow, color: playColor }}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1.5" />
              <rect x="14" y="4" width="4" height="16" rx="1.5" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Next */}
        <button
          onClick={nextTrack}
          disabled={!hasNext}
          className="w-12 h-12 rounded-full flex items-center justify-center transition active:scale-90"
          style={{ background: navBg, border: `1px solid ${navBorder}`, color: hasNext ? navActive : navMuted }}
          aria-label="Next"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
          </svg>
        </button>
      </div>

      {/* ── Secondary Actions ── */}
      <div className="flex items-center justify-between px-12 pb-16 flex-shrink-0">
        {/* Favorite */}
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 hover:scale-110"
          style={{ color: secColor }}
          aria-label="Favorite"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Shuffle */}
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 hover:scale-110"
          style={{ color: secColor }}
          aria-label="Shuffle"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
          </svg>
        </button>

        {/* Repeat */}
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 hover:scale-110"
          style={{ color: secColor }}
          aria-label="Repeat"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        </button>

        {/* Queue */}
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 hover:scale-110"
          style={{ color: secColor }}
          aria-label="Queue"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
