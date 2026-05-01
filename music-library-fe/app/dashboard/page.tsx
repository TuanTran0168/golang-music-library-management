"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Navbar } from "@/components/layout";
import { useTheme } from "@/hooks/useTheme";
import { getSummary, getTopTracks } from "@/lib/api";
import { SummaryResponse, TopTracksResponse } from "@/types/stats";

const GENRE_COLORS = ["#2997FF", "#30D158", "#FF9F0A", "#BF5AF2", "#FF453A", "#64D2FF", "#FFD60A"];

const PODIUM = [
    {
        trackIdx: 1,
        rank: 2,
        color: "#94A3B8",
        bg: "linear-gradient(180deg, rgba(148,163,184,0.32), rgba(148,163,184,0.08))",
        border: "rgba(148,163,184,0.34)",
    },
    {
        trackIdx: 0,
        rank: 1,
        color: "#FFD60A",
        bg: "linear-gradient(180deg, rgba(255,214,10,0.38), rgba(255,214,10,0.10))",
        border: "rgba(255,214,10,0.50)",
    },
    {
        trackIdx: 2,
        rank: 3,
        color: "#CD7F32",
        bg: "linear-gradient(180deg, rgba(205,127,50,0.34), rgba(205,127,50,0.08))",
        border: "rgba(205,127,50,0.34)",
    },
];

export default function DashboardPage() {
    return (
        <div className="flex flex-col h-screen">
            <Navbar />
            <ChartsDashboard />
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GenreTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;

    return (
        <div
            style={{
                background: "rgba(28,28,30,0.96)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                padding: "8px 12px",
                backdropFilter: "blur(20px)",
            }}
        >
            <p style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{payload[0].name}</p>
            <p style={{ color: "#2997FF", fontSize: 13, fontWeight: 600 }}>
                {payload[0].value.toLocaleString()} plays
            </p>
        </div>
    );
}

function ChartsDashboard() {
    const [summary, setSummary] = useState<SummaryResponse | null>(null);
    const [topTracks, setTopTracks] = useState<TopTracksResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const { isDark } = useTheme();
    const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.38)";

    useEffect(() => {
        Promise.all([getSummary(), getTopTracks(10)])
            .then(([summaryData, tracksData]) => {
                setSummary(summaryData);
                setTopTracks(tracksData);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const tracks = topTracks?.data ?? [];
    const hasTracks = tracks.length > 0;
    const maxPlays = tracks[0]?.play_count ?? 1;
    const genreData = summary?.top_genres.map((genre) => ({ name: genre.genre, value: genre.play_count })) ?? [];

    function podiumHeight(trackIdx: number): number {
        const plays = tracks[trackIdx]?.play_count ?? 0;
        return Math.max(68, Math.round((plays / maxPlays) * 200));
    }

    return (
        <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gradient">Charts</h1>
                        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                            Global top tracks on Improok Music
                        </p>
                    </div>
                    <Link href="/" className="btn-glass text-sm !py-2 !px-4">
                        Back to Home
                    </Link>
                </div>

                {summary && (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="glass-card rounded-2xl p-4 md:p-5 text-center">
                            <p className="text-2xl md:text-3xl font-bold text-gradient">
                                {summary.total_plays.toLocaleString()}
                            </p>
                            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                Total Plays
                            </p>
                        </div>
                        <div className="glass-card rounded-2xl p-4 md:p-5 text-center">
                            <p className="text-2xl md:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                                {summary.total_tracks.toLocaleString()}
                            </p>
                            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                Tracks
                            </p>
                        </div>
                    </div>
                )}

                {hasTracks && (
                    <div className="glass-card rounded-2xl p-4 sm:p-5 mb-6 overflow-hidden">
                        <div className="flex items-center justify-between gap-3 mb-5">
                            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                                Top 3
                            </h2>
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
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
                                                style={{
                                                    color,
                                                    background: bg,
                                                    border: `1px solid ${border}`,
                                                    boxShadow: `0 10px 28px ${color}1F`,
                                                }}
                                            >
                                                #{rank}
                                            </span>
                                            <p
                                                className="font-bold text-xs sm:text-sm leading-snug truncate w-full"
                                                title={item.track.title}
                                                style={{ color: "var(--text-primary)" }}
                                            >
                                                {item.track.title}
                                            </p>
                                            <p
                                                className="text-[10px] sm:text-xs truncate w-full mt-0.5"
                                                title={item.track.artist}
                                                style={{ color: "var(--text-secondary)" }}
                                            >
                                                {item.track.artist}
                                            </p>
                                            <p className="text-xs sm:text-sm font-bold mt-2" style={{ color }}>
                                                {item.play_count.toLocaleString()}
                                                <span className="font-normal ml-1 text-[9px] sm:text-[10px]" style={{ opacity: 0.65 }}>
                                                    plays
                                                </span>
                                            </p>
                                        </div>

                                        <div
                                            className="w-full rounded-t-2xl transition-[height] duration-500"
                                            style={{
                                                height: podiumHeight(trackIdx),
                                                background: bg,
                                                border: `1px solid ${border}`,
                                                borderBottom: "none",
                                                boxShadow: `inset 0 1px 0 ${color}22, 0 -10px 34px ${color}14`,
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className={`grid gap-6 ${genreData.length > 0 ? "lg:grid-cols-2" : ""}`}>
                    <div className="glass-card rounded-2xl p-5">
                        <h2 className="text-base font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                            Top 10
                        </h2>
                        {!hasTracks ? (
                            <div className="text-center py-8">
                                <p className="text-4xl mb-3">♪</p>
                                <p className="font-semibold">No plays recorded yet</p>
                                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                                    Be the first to listen!
                                </p>
                                <Link href="/" className="btn-accent inline-block mt-4 text-sm !py-2 !px-5">
                                    Browse Music
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tracks.map((item, index) => (
                                    <div key={item.track.id} className="flex items-center gap-3 min-w-0">
                                        <span
                                            className={`text-sm font-bold w-6 text-center flex-shrink-0 tabular-nums ${index < 3 ? "text-gradient" : ""}`}
                                            style={index >= 3 ? { color: "var(--text-muted)" } : undefined}
                                        >
                                            {index + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                                                {item.track.title}
                                            </p>
                                            <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                                                {item.track.artist}
                                                {item.track.genre && (
                                                    <span className="ml-2 opacity-55">{item.track.genre}</span>
                                                )}
                                            </p>
                                        </div>
                                        <span
                                            className="text-sm font-semibold flex-shrink-0 tabular-nums"
                                            style={{ color: "var(--accent)" }}
                                        >
                                            {item.play_count.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {genreData.length > 0 && (
                        <div className="glass-card rounded-2xl p-5">
                            <h2 className="text-base font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                                Genre Breakdown
                            </h2>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={genreData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="42%"
                                        outerRadius="66%"
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {genreData.map((genre, index) => (
                                            <Cell key={genre.name} fill={GENRE_COLORS[index % GENRE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<GenreTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>

                            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-3">
                                {genreData.map((genre, index) => (
                                    <div key={genre.name} className="flex items-center gap-1.5">
                                        <span
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ background: GENRE_COLORS[index % GENRE_COLORS.length] }}
                                        />
                                        <span className="text-xs whitespace-nowrap" style={{ color: textMuted }}>
                                            {genre.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
