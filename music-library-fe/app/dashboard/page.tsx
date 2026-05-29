"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { getSummary, getTopTracks } from "@/lib/api";
import { SummaryResponse, TopTracksResponse } from "@/types/stats";
import { playQueue } from "@/hooks/usePlayer";

const GENRE_COLORS = ["var(--accent)", "#e9b3ff", "#ffb2b7", "#30D158", "#FF9F0A", "#BF5AF2", "#FF453A"];

const PODIUM = [
  { trackIdx: 1, rank: 2, color: "#94A3B8", bg: "linear-gradient(180deg, rgba(148,163,184,0.32), rgba(148,163,184,0.08))", border: "rgba(148,163,184,0.34)" },
  { trackIdx: 0, rank: 1, color: "#FFD60A", bg: "linear-gradient(180deg, rgba(255,214,10,0.38), rgba(255,214,10,0.10))", border: "rgba(255,214,10,0.50)" },
  { trackIdx: 2, rank: 3, color: "#CD7F32", bg: "linear-gradient(180deg, rgba(205,127,50,0.34), rgba(205,127,50,0.08))", border: "rgba(205,127,50,0.34)" },
];

export default function DashboardPage() {
  return <ChartsDashboard />;
}

function ChartsDashboard() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [topTracks, setTopTracks] = useState<TopTracksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  useEffect(() => {
    Promise.all([getSummary(), getTopTracks(10)])
      .then(([s, t]) => { setSummary(s); setTopTracks(t); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const tracks = topTracks?.data ?? [];
  const hasTracks = tracks.length > 0;
  const maxPlays = tracks[0]?.play_count ?? 1;
  const genreData = summary?.top_genres.map((g) => ({ name: g.genre, value: g.play_count })) ?? [];
  const totalGenrePlays = genreData.reduce((sum, g) => sum + g.value, 0) || 1;
  const topGenreName = genreData[0]?.name ?? null;

  function podiumHeight(trackIdx: number): number {
    const plays = tracks[trackIdx]?.play_count ?? 0;
    return Math.max(68, Math.round((plays / maxPlays) * 200));
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(135deg, var(--accent) 0%, #e9b3ff 100%)" }}>
              Charts
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Global top tracks on Improok Music
            </p>
          </div>
          <Link href="/" className="btn-sm" style={{ textDecoration: "none" }}>Back</Link>
        </div>

        {/* Stats cards */}
        {summary && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="glass-card rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center group cursor-default">
              <p className="text-5xl md:text-6xl font-black" style={{ color: "var(--accent)" }}>
                {summary.total_plays.toLocaleString()}
              </p>
              <p className="text-xs font-bold uppercase tracking-widest mt-2" style={{ color: "var(--text-muted)" }}>
                Total Plays
              </p>
            </div>
            <div className="glass-card rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center group cursor-default">
              <p className="text-5xl md:text-6xl font-black" style={{ color: "#e9b3ff" }}>
                {summary.total_tracks.toLocaleString()}
              </p>
              <p className="text-xs font-bold uppercase tracking-widest mt-2" style={{ color: "var(--text-muted)" }}>
                Tracks
              </p>
            </div>
          </div>
        )}

        {/* Top 3 Podium */}
        {hasTracks && (
          <div className="glass-card rounded-2xl p-5 sm:p-6 mb-6 overflow-hidden">
            <div className="flex items-center justify-between gap-3 mb-6">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Top 3</h2>
              <span className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider"
                style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: "var(--text-muted)", border: "1px solid var(--glass-border)" }}>
                Leaderboard
              </span>
            </div>

            <div className="flex items-end gap-2 sm:gap-4" style={{ height: 290 }}>
              {PODIUM.map(({ trackIdx, rank, color, bg, border }) => {
                const item = tracks[trackIdx];
                if (!item) return null;
                return (
                  <div key={trackIdx} className="flex-1 flex flex-col min-w-0 h-full">
                    <div className="flex-1 flex flex-col items-center justify-end text-center pb-3 px-1 min-w-0">
                      <span
                        className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-black mb-2"
                        style={{ color, background: bg, border: `1px solid ${border}`, boxShadow: `0 8px 24px ${color}20` }}
                      >
                        #{rank}
                      </span>
                      <p className="font-bold text-xs sm:text-sm leading-snug truncate w-full" style={{ color: "var(--text-primary)" }}>
                        {item.track.title}
                      </p>
                      <p className="text-[10px] sm:text-xs truncate w-full mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        {item.track.artist}
                      </p>
                      <p className="text-xs sm:text-sm font-bold mt-2" style={{ color }}>
                        {item.play_count.toLocaleString()}
                        <span className="font-normal ml-1 text-[9px] sm:text-[10px]" style={{ opacity: 0.65 }}>plays</span>
                      </p>
                    </div>
                    <div
                      className="w-full rounded-t-2xl transition-[height] duration-500"
                      style={{
                        height: podiumHeight(trackIdx),
                        background: bg, border: `1px solid ${border}`, borderBottom: "none",
                        boxShadow: `inset 0 1px 0 ${color}22, 0 -8px 28px ${color}12`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top 10 + Genre Breakdown */}
        <div className={`grid gap-6 ${genreData.length > 0 ? "lg:grid-cols-2" : ""}`}>

          {/* Top 10 */}
          <div className="glass-card rounded-2xl p-5 min-w-0 overflow-hidden">
            <h2 className="text-base font-bold mb-5" style={{ color: "var(--text-primary)" }}>Top 10</h2>
            {!hasTracks ? (
              <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                <p className="text-4xl mb-3">♪</p>
                <p className="font-semibold text-sm">No plays recorded yet</p>
                <p className="text-xs mt-1">Be the first to listen!</p>
                <Link href="/" className="btn-sm btn-sm-accent mt-4 inline-flex" style={{ textDecoration: "none" }}>Browse Music</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {tracks.map((item, index) => (
                  <div
                    key={item.track.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer group"
                    style={{ borderRadius: 12 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={() => playQueue([item.track], 0)}
                  >
                    <span
                      className="text-sm font-black w-6 text-center flex-shrink-0 tabular-nums"
                      style={{ color: index < 3 ? "var(--accent)" : "var(--text-muted)" }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                        {item.track.title}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                        {item.track.artist}
                        {item.track.genre && <span className="ml-2 opacity-55">{item.track.genre}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold tabular-nums" style={{ color: "var(--accent)" }}>
                        {item.play_count.toLocaleString()}
                      </span>
                      <button
                        className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "var(--accent)", color: "#fff", fontSize: 11, border: "none", cursor: "pointer" }}
                        onClick={(e) => { e.stopPropagation(); playQueue([item.track], 0); }}
                        aria-label="Play"
                      >▶</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Genre Breakdown — horizontal bars */}
          {genreData.length > 0 && (
            <div className="glass-card rounded-2xl p-5 min-w-0 overflow-hidden">
              <h2 className="text-base font-bold mb-6" style={{ color: "var(--text-primary)" }}>Genre Breakdown</h2>
              <div className="space-y-5">
                {genreData.map((genre, index) => {
                  const pct = Math.round((genre.value / totalGenrePlays) * 100);
                  const color = GENRE_COLORS[index % GENRE_COLORS.length];
                  return (
                    <div key={genre.name}>
                      <div className="flex items-end justify-between mb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
                          {genre.name}
                        </span>
                        <span className="text-xs font-black tabular-nums" style={{ color }}>
                          {pct}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary card */}
              {topGenreName && (
                <div
                  className="mt-8 p-4 rounded-2xl"
                  style={{
                    background: isDark
                      ? "linear-gradient(135deg, rgba(41,151,255,0.10), rgba(233,179,255,0.08))"
                      : "linear-gradient(135deg, rgba(41,151,255,0.07), rgba(191,90,242,0.06))",
                    border: "1px solid rgba(41,151,255,0.12)",
                  }}
                >
                  <p className="text-sm leading-snug" style={{ color: "var(--text-secondary)" }}>
                    Your music leans heavily towards{" "}
                    <span className="font-bold" style={{ color: "var(--accent)" }}>{topGenreName}</span>{" "}
                    this month.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
