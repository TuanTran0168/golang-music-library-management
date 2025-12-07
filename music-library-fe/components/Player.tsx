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
    <div className="p-4 border-t border-gray-300">
      <h3 className="font-bold">{track.title} - {track.artist}</h3>
      <audio ref={audioRef} controls className="w-full mt-2" />
    </div>
  );
}
