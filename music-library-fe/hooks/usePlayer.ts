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
  queue: Track[];
  queueIndex: number;
};

const _serverState: PlayerState = {
  track: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  showNowPlaying: false,
  queue: [],
  queueIndex: -1,
};

let _state: PlayerState = { ..._serverState };
let _audio: HTMLAudioElement | null = null;
let _hasRecorded = false;
let _lastTimeUpdate = 0;
const _listeners = new Set<() => void>();

function _notify() { _listeners.forEach((fn) => fn()); }
function _subscribe(notify: () => void) {
  _listeners.add(notify);
  return () => { _listeners.delete(notify); };
}
function _read(): PlayerState { return _state; }

function _playAt(index: number): void {
  const track = _state.queue[index];
  if (!track || !_audio) return;
  _hasRecorded = false;
  _state = { ..._state, track, isPlaying: false, currentTime: 0, duration: 0, queueIndex: index };
  _notify();
  _audio.src = getStreamURL(track);
  _audio.play().catch(console.error);
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
    // Auto-advance to next track in queue
    const { queueIndex, queue } = _state;
    if (queueIndex < queue.length - 1) _playAt(queueIndex + 1);
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

// Play a single track (queue of 1)
export function playTrack(track: Track): void {
  playQueue([track], 0);
}

// Play a list starting at startIndex
export function playQueue(tracks: Track[], startIndex = 0): void {
  if (!_audio || tracks.length === 0) return;
  _state = { ..._state, queue: tracks };
  _notify();
  _playAt(Math.max(0, Math.min(startIndex, tracks.length - 1)));
}

export function nextTrack(): void {
  const { queueIndex, queue } = _state;
  if (queueIndex < queue.length - 1) _playAt(queueIndex + 1);
}

export function prevTrack(): void {
  if (!_audio) return;
  // If more than 3s played → restart current track
  if (_audio.currentTime > 3) {
    _audio.currentTime = 0;
    _state = { ..._state, currentTime: 0 };
    _notify();
    return;
  }
  const { queueIndex } = _state;
  if (queueIndex > 0) _playAt(queueIndex - 1);
}

export function togglePlay(): void {
  if (!_audio) return;
  if (_audio.paused) _audio.play().catch(console.error);
  else _audio.pause();
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
