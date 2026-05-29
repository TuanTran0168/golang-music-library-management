"use client";

import { useRef, useEffect } from "react";
import { registerAudio, usePlayer, togglePlay, setShowNowPlaying } from "@/hooks/usePlayer";
import NowPlaying from "./NowPlaying";

export default function Player() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { track, isPlaying, currentTime, duration } = usePlayer();
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

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
          className="flex items-center gap-3 px-4 py-2.5 max-w-screen-xl mx-auto cursor-pointer select-none"
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

              {/* Play/Pause */}
              <button
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="btn-sm flex-shrink-0"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
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
