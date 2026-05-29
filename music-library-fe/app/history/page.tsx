"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth";
import { getMyHistory, getMyStats } from "@/lib/api";
import { PlayHistoryResponse, UserStatsResponse } from "@/types/stats";

export default function HistoryPage() {
    return (
        <RoleGuard roles={["admin", "artist", "user"]}>
            <HistoryDashboard />
        </RoleGuard>
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

    useEffect(() => {
        getMyStats().then(setStats).catch(() => undefined);
    }, []);

    useEffect(() => {
        getMyHistory(page, limit)
            .then(setHistory)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [page]);

    const totalPages = history ? Math.max(1, Math.ceil(history.total_count / limit)) : 1;
    const topTrack = stats?.top_tracks[0];
    const chartData = stats?.top_tracks.slice(0, 5).map((item) => ({
        title: item.track.title,
        artist: item.track.artist,
        play_count: item.play_count,
    })) ?? [];
    const maxTopTrackPlays = chartData[0]?.play_count ?? 1;

    return (
        <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto pb-10">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gradient">Play History</h1>
                        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                            {history ? `${history.total_count.toLocaleString()} plays recorded` : "Your listening activity"}
                        </p>
                    </div>
                    <Link href="/" className="btn-sm" style={{ textDecoration: "none" }}>Back</Link>
                </div>

                {stats && (
                    <div className="glass-card rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 fade-in">
                        <div className="text-center sm:w-28 flex-shrink-0">
                            <p className="text-2xl font-bold text-gradient">{stats.total_plays.toLocaleString()}</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total Plays</p>
                        </div>
                        {topTrack && (
                            <div className="flex-1 min-w-0 sm:border-l sm:pl-6" style={{ borderColor: "var(--separator)" }}>
                                <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                                    Your Top Track
                                </p>
                                <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                                    {topTrack.track.title}
                                </p>
                                <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                                    {topTrack.track.artist} - {topTrack.play_count.toLocaleString()} plays
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {chartData.length > 0 && (
                    <div className="glass-card rounded-2xl p-4 sm:p-5 mb-6 fade-in overflow-hidden">
                        <h2 className="text-base font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                            Your Top Tracks
                        </h2>
                        <div className="space-y-4">
                            {chartData.map((item, index) => {
                                const width = Math.max(12, Math.round((item.play_count / maxTopTrackPlays) * 100));
                                return (
                                    <div key={`${item.title}-${index}`} className="min-w-0">
                                        <div className="flex items-start justify-between gap-3 mb-1.5 min-w-0">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                                                    {item.title}
                                                </p>
                                                <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                                                    {item.artist}
                                                </p>
                                            </div>
                                            <span className="text-xs font-semibold tabular-nums flex-shrink-0" style={{ color: "var(--accent)" }}>
                                                {item.play_count.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${width}%`,
                                                    background: index === 0
                                                        ? "linear-gradient(90deg, #2997FF, #BF5AF2)"
                                                        : "rgba(41,151,255,0.45)",
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        Loading history...
                    </div>
                ) : history?.data.length === 0 ? (
                    <div className="glass-card rounded-2xl p-8 text-center">
                        <p className="text-4xl mb-3">♪</p>
                        <p className="font-semibold">No plays yet</p>
                        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                            Start listening to build your history
                        </p>
                        <Link href="/" className="btn-sm btn-sm-accent mt-4" style={{ textDecoration: "none" }}>Browse Music</Link>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            {history?.data.map((item) => (
                                <div key={item.event_id} className="glass-card rounded-xl p-3 flex items-center gap-3 fade-in">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                                            {item.track.title}
                                        </p>
                                        <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                                            {item.track.artist}
                                            {item.track.genre && <span className="ml-2 opacity-60">{item.track.genre}</span>}
                                        </p>
                                    </div>
                                    <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                                        {timeAgo(item.played_at)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 py-6">
                                <button className="pagination-btn !w-auto px-4" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                                    Prev
                                </button>
                                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                    {page} / {totalPages}
                                </span>
                                <button className="pagination-btn !w-auto px-4" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
