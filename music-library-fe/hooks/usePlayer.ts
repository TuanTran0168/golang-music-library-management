"use client";

import { useSyncExternalStore } from "react";
import { Track } from "@/types/music";
import { getStreamURL, recordPlay } from "@/lib/api";

const PLAY_THRESHOLD = Number(process.env.NEXT_PUBLIC_PLAY_THRESHOLD_SECONDS) || 10;

type PlayerState = {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  showNowPlaying: boolean;
};

const _serverState: PlayerState = {
  track: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  showNowPlaying: false,
};

let _state: PlayerState = { ..._serverState };
let _audio: HTMLAudioElement | null = null;
let _hasRecorded = false;
let _lastTimeUpdate = 0;
const _listeners = new Set<() => void>();

function _notify() {
  _listeners.forEach((fn) => fn());
}

function _subscribe(notify: () => void) {
  _listeners.add(notify);
  return () => { _listeners.delete(notify); };
}

function _read(): PlayerState {
  return _state;
}

export function registerAudio(el: HTMLAudioElement | null) {
  if (_audio === el) return;
  _audio = el;
  if (!el) return;

  el.addEventListener("play", () => {
    _state = { ..._state, isPlaying: true };
    _notify();
  });
  el.addEventListener("pause", () => {
    _state = { ..._state, isPlaying: false };
    _notify();
  });
  el.addEventListener("ended", () => {
    _state = { ..._state, isPlaying: false };
    _notify();
  });
  el.addEventListener("loadedmetadata", () => {
    _state = { ..._state, duration: el.duration || 0 };
    _notify();
  });
  el.addEventListener("timeupdate", () => {
    const now = Date.now();
    if (now - _lastTimeUpdate < 250) return;
    _lastTimeUpdate = now;
    const ct = el.currentTime;
    if (!_hasRecorded && ct >= PLAY_THRESHOLD && _state.track) {
      _hasRecorded = true;
      recordPlay(_state.track.id).catch(() => {});
    }
    _state = { ..._state, currentTime: ct };
    _notify();
  });
}

export function playTrack(track: Track): void {
  if (!_audio) return;
  _hasRecorded = false;
  _state = { ..._state, track, isPlaying: false, currentTime: 0, duration: 0 };
  _notify();
  _audio.src = getStreamURL(track);
  _audio.play().catch(console.error);
}

export function togglePlay(): void {
  if (!_audio) return;
  if (_audio.paused) {
    _audio.play().catch(console.error);
  } else {
    _audio.pause();
  }
}

export function seekTo(seconds: number): void {
  if (!_audio) return;
  _audio.currentTime = seconds;
  _state = { ..._state, currentTime: seconds };
  _notify();
}

export function setShowNowPlaying(show: boolean): void {
  _state = { ..._state, showNowPlaying: show };
  _notify();
}

export function usePlayer(): PlayerState {
  return useSyncExternalStore(_subscribe, _read, () => _serverState);
}
