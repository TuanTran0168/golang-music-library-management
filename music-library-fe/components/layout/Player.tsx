"use client";

import { useRef, useEffect } from "react";
import { Track } from "@/types/music";
import { getStreamURL } from "@/lib/api";

interface Props {
  track: Track | null;
}

export default function Player({ track }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (track && audioRef.current) {
      audioRef.current.src = getStreamURL(track);
      audioRef.current.play().catch(console.error);
    }
  }, [track]);

  return (
    <div className="glass border-t border-white/10 flex-shrink-0">
      <div className="flex items-center gap-4 p-3 md:p-4 max-w-screen-xl mx-auto">
        {track ? (
          <>
            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{track.title}</h3>
              <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                {track.artist}
              </p>
            </div>

            {/* Audio Player */}
            <div className="flex-grow max-w-md md:max-w-lg">
              <audio ref={audioRef} controls className="w-full h-9" />
            </div>
          </>
        ) : (
          <div className="flex-1 min-w-0">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Select a track to play
            </p>
          </div>
        )}

        {/* Owner */}
        <div className="hidden md:flex items-center justify-end">
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            © 2026 Trần Đăng Tuấn
          </span>
        </div>
      </div>
    </div>
  );
}