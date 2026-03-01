"use client";

import { useState, ChangeEvent } from "react";
import toast from "react-hot-toast";
import api, { API_BASE } from "@/lib/api";

interface Props {
  onUploadSuccess: () => void;
}

export default function UploadTrack({ onUploadSuccess }: Props) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [genre, setGenre] = useState("");
  const [releaseYear, setReleaseYear] = useState<number | "">("");
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
    if (!expanded && e.target.files && e.target.files.length > 0) setExpanded(true);
  };

  const isUploadDisabled = uploading || !files || files.length === 0 || !artist.trim();

  const handleUpload = async () => {
    if (isUploadDisabled) return;
    setUploading(true);

    const fd = new FormData();
    fd.append("file", files![0]);
    fd.append("artist", artist);
    if (album) fd.append("album", album);
    if (genre) fd.append("genre", genre);
    if (releaseYear) fd.append("release_year", String(releaseYear));

    try {
      await api.post("/tracks", fd);
      toast.success(`Uploaded: ${files![0].name}`);
      setFiles(null);
      setArtist("");
      setAlbum("");
      setGenre("");
      setReleaseYear("");
      setExpanded(false);
      onUploadSuccess();
    } catch {
      toast.error("Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass px-4 md:px-6 py-3 flex-shrink-0" style={{ borderTop: "1px solid var(--separator)" }}>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm font-semibold flex items-center gap-2"
        >
          <span className="text-gradient">⬆ Upload Track</span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {expanded ? "▾" : "▸"}
          </span>
        </button>
      </div>

      {expanded && (
        <div className="fade-in space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <input type="text" placeholder="Artist *" value={artist} onChange={(e) => setArtist(e.target.value)} className="glass-input p-2.5 text-sm" />
            <input type="text" placeholder="Album" value={album} onChange={(e) => setAlbum(e.target.value)} className="glass-input p-2.5 text-sm" />
            <input type="text" placeholder="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} className="glass-input p-2.5 text-sm" />
            <input type="number" placeholder="Year" min="1900" max={new Date().getFullYear()} value={releaseYear} onChange={(e) => setReleaseYear(e.target.value ? parseInt(e.target.value) : "")} className="glass-input p-2.5 text-sm" />
          </div>

          <div className="flex items-center justify-between gap-3">
            <input
              type="file"
              accept="audio/mp3"
              onChange={handleFileChange}
              className="text-xs file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold cursor-pointer"
              style={{
                color: "var(--text-secondary)",
                ['--tw-prose-file-btn' as string]: "var(--glass-border)"
              }}
            />
            <button onClick={handleUpload} disabled={isUploadDisabled} className="btn-accent text-sm !py-2 !px-5 flex-shrink-0">
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}