"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Navbar } from "@/components/layout";
import { RoleGuard } from "@/components/auth";
import { useTheme } from "@/hooks/useTheme";
import { getMyHistory, getMyStats } from "@/lib/api";
import { PlayHistoryResponse, UserStatsResponse } from "@/types/stats";

export default function HistoryPage() {
    return (
        <div className="flex flex-col h-screen">
            <Navbar />
            <RoleGuard roles={["admin", "artist", "user"]}>
                <HistoryDashboard />
            </RoleGuard>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TrackTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div style={{
            background: "rgba(28,28,30,0.96)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            padding: "8px 12px",
            backdropFilter: "blur(20px)",
        }}>
            <p style={{ color: "#fff", fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{d.fullTitle}</p>
            <p style={{ color: "#2997FF", fontSize: 13, fontWeight: 600 }}>
                {d.play_count.toLocaleString()} plays
            </p>
        </div>
    );
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

function HistoryDashboard() {
    const [history, setHistory] = useState<PlayHistoryResponse | null>(null);
    const [stats, setStats] = useState<UserStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const limit = 20;
    const { isDark } = useTheme();
    const textColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)";
    const gridColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

    useEffect(() => {
        getMyStats().then(setStats).catch(() => {});
    }, []);

    useEffect(() => {
        setLoading(true);
        getMyHistory(page, limit)
            .then(setHistory)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [page]);

    const totalPages = history ? Math.max(1, Math.ceil(history.total_count / limit)) : 1;

    return (
        <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gradient">Play History</h1>
                        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                            {history ? `${history.total_count.toLocaleString()} plays recorded` : ""}
                        </p>
                    </div>
                    <Link href="/" className="btn-glass text-sm !py-2 !px-4">← Back to Home</Link>
                </div>

                {/* Personal stats card */}
                {stats && (
                    <div className="glass-card rounded-2xl p-4 mb-6 flex items-center gap-6 fade-in">
                        <div className="text-center flex-shrink-0">
                            <p className="text-2xl font-bold text-gradient">{stats.total_plays.toLocaleString()}</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total Plays</p>
                        </div>
                        {stats.top_tracks.length > 0 && (
                            <div className="flex-1 min-w-0 border-l pl-6" style={{ borderColor: "var(--separator)" }}>
                                <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                                    Your Top Track
                                </p>
                                <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                                    {stats.top_tracks[0].track.title}
                                </p>
                                <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                                    {stats.top_tracks[0].track.artist} · {stats.top_tracks[0].play_count} plays
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Bar chart: user's top tracks */}
                {stats && stats.top_tracks.length > 0 && (() => {
                    const chartData = stats.top_tracks.slice(0, 5).map((item) => ({
                        title: item.track.title.length > 18 ? item.track.title.slice(0, 16) + "…" : item.track.title,
                        fullTitle: item.track.title,
                        play_count: item.play_count,
                    }));
                    return (
                        <div className="glass-card rounded-2xl p-5 mb-6 fade-in">
                            <h2 className="text-base font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                                Your Top Tracks
                            </h2>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 8 }}>
                                    <XAxis
                                        type="number"
                                        tick={{ fill: textColor, fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v) => v.toLocaleString()}
                                        style={{ userSelect: "none" }}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="title"
                                        width={100}
                                        tick={{ fill: textColor, fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                        style={{ userSelect: "none" }}
                                    />
                                    <Tooltip content={<TrackTooltip />} cursor={{ fill: gridColor }} />
                                    <Bar dataKey="play_count" radius={[0, 6, 6, 0]} maxBarSize={20}>
                                        {chartData.map((_, i) => (
                                            <Cell
                                                key={i}
                                                fill={i === 0 ? "#2997FF" : isDark ? "rgba(41,151,255,0.45)" : "rgba(41,151,255,0.35)"}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    );
                })()}

                {/* History list */}
                {loading ? (
                    <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        Loading history...
                    </div>
                ) : (
                    <>
                        {history?.data.length === 0 ? (
                            <div className="glass-card rounded-xl p-8 text-center">
                                <p className="text-4xl mb-3">🎵</p>
                                <p className="font-semibold">No plays yet</p>
                                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                                    Start listening to build your history
                                </p>
                                <Link href="/" className="btn-accent inline-block mt-4 text-sm !py-2 !px-5">
                                    Browse Music
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {history?.data.map((item) => (
                                    <div key={item.event_id} className="glass-card rounded-xl p-3 flex items-center gap-3 fade-in">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                                                {item.track.title}
                                            </p>
                                            <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                                                {item.track.artist}
                                                {item.track.genre && (
                                                    <span className="ml-2 opacity-60">{item.track.genre}</span>
                                                )}
                                            </p>
                                        </div>
                                        <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                                            {timeAgo(item.played_at)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 py-6">
                                <button
                                    className="pagination-btn"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                >
                                    ‹
                                </button>
                                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                    {page} / {totalPages}
                                </span>
                                <button
                                    className="pagination-btn"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                >
                                    ›
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
