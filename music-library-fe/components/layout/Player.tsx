"use client";

import { useRef, useEffect } from "react";
import { registerAudio, usePlayer, togglePlay, nextTrack, prevTrack, setShowNowPlaying } from "@/hooks/usePlayer";
import NowPlaying from "./NowPlaying";

export default function Player() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { track, isPlaying, currentTime, duration, queue, queueIndex } = usePlayer();
  const progress  = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasPrev   = queueIndex > 0 || (queueIndex === 0 && currentTime > 3);
  const hasNext   = queueIndex < queue.length - 1;

  useEffect(() => {
    if (audioRef.current) registerAudio(audioRef.current);
  }, []);

  return (
    <>
      <audio ref={audioRef} hidden />
      <NowPlaying />

      <div
        className="glass flex-shrink-0"
        style={{ borderTop: "1px solid var(--separator)" }}
      >
        {/* Thin progress line */}
        {track && duration > 0 && (
          <div className="h-0.5" style={{ background: "var(--separator)" }}>
            <div
              className="h-full"
              style={{ width: `${progress}%`, background: "var(--accent)", transition: "width 0.25s linear" }}
            />
          </div>
        )}

        <div
          className="flex items-center gap-2 px-4 py-2.5 max-w-screen-xl mx-auto cursor-pointer select-none"
          onClick={() => track && setShowNowPlaying(true)}
        >
          {track ? (
            <>
              {/* Mini vinyl disc */}
              <div className={`vinyl-disc w-8 h-8 flex-shrink-0${isPlaying ? " vinyl-spinning" : ""}`}>
                <div className="vinyl-shimmer" />
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{track.title}</p>
                <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{track.artist}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={prevTrack}
                  disabled={!hasPrev}
                  className="btn-sm"
                  style={{ opacity: hasPrev ? 1 : 0.3 }}
                  aria-label="Previous"
                >
                  ⏮
                </button>
                <button
                  onClick={togglePlay}
                  className="btn-sm"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? "⏸" : "▶"}
                </button>
                <button
                  onClick={nextTrack}
                  disabled={!hasNext}
                  className="btn-sm"
                  style={{ opacity: hasNext ? 1 : 0.3 }}
                  aria-label="Next"
                >
                  ⏭
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs py-0.5" style={{ color: "var(--text-muted)" }}>
              Select a track to play
            </p>
          )}

          <span className="hidden md:block text-[11px] ml-auto pl-4 flex-shrink-0" style={{ color: "var(--text-muted)" }}>
            © 2026 Trần Đăng Tuấn
          </span>
        </div>
      </div>
    </>
  );
}
