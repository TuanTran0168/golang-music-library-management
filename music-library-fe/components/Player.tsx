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

  if (!track) return null;

  return (
    <div className="flex items-center justify-between p-3">
      <div className="flex-1 min-w-0 pr-4">
        <h3 className="font-semibold text-white truncate">{track.title}</h3>
        <p className="text-sm text-gray-400 truncate">{track.artist}</p>
      </div>

      <div className="flex-grow max-w-lg">
        <audio 
          ref={audioRef} 
          controls 
          className="w-full h-10" 
        />
      </div>

      <div className="flex-1 flex justify-end">
      </div>
    </div>
  );
}