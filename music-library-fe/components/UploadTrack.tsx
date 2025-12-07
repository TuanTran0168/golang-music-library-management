"use client";

import { useState, ChangeEvent } from "react";
import { API_BASE } from "@/lib/api";

interface Props {
  onUploadSuccess: () => void;
}

export default function UploadTrack({ onUploadSuccess }: Props) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [genre, setGenre] = useState("");
  const [releaseYear, setReleaseYear] = useState<number | ''>('');
  
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    setFiles(fileList);
  };

  const isUploadDisabled = uploading || !files || files.length === 0 || !artist.trim();

  const handleUpload = async () => {
    if (isUploadDisabled) return;
    
    setUploading(true);
    
    const fd = new FormData();
    const fileToUpload = files![0];
    
    fd.append("file", fileToUpload);
    fd.append("artist", artist);
    
    if (album) fd.append("album", album);
    if (genre) fd.append("genre", genre);
    if (releaseYear) fd.append("release_year", String(releaseYear));

    try {
      await fetch(`${API_BASE}/tracks`, { method: "POST", body: fd });
      alert(`Upload successful for: ${fileToUpload.name}`);
      setFiles(null);
      setArtist('');
      setAlbum('');
      setGenre('');
      setReleaseYear('');
      onUploadSuccess();
    } catch (err) {
      console.error(err);
      alert("Upload failed! Check console for details.");
    } finally {
      setUploading(false);
    }
  };


  return (
    <div className="p-4 bg-gray-800 border-t border-gray-700">
      <h3 className="text-white text-xl font-bold mb-3">Upload New Track</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <input
          type="text"
          placeholder="Artist (Required)"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          className="p-2 rounded-md bg-gray-900 text-white placeholder-gray-500 border border-gray-700 focus:border-green-500"
        />

        <input
          type="text"
          placeholder="Album (Optional)"
          value={album}
          onChange={(e) => setAlbum(e.target.value)}
          className="p-2 rounded-md bg-gray-900 text-white placeholder-gray-500 border border-gray-700 focus:border-green-500"
        />

        <input
          type="text"
          placeholder="Genre (Optional)"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="p-2 rounded-md bg-gray-900 text-white placeholder-gray-500 border border-gray-700 focus:border-green-500"
        />

        <input
          type="number"
          placeholder="Year (Optional)"
          min="1900"
          max={new Date().getFullYear()}
          value={releaseYear}
          onChange={(e) => setReleaseYear(e.target.value ? parseInt(e.target.value) : '')}
          className="p-2 rounded-md bg-gray-900 text-white placeholder-gray-500 border border-gray-700 focus:border-green-500"
        />
      </div>

      <div className="flex items-center justify-between">
        <input
          type="file"
          accept="audio/mp3"
          onChange={handleFileChange}
          className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600 cursor-pointer"
        />

        <button
          onClick={handleUpload}
          disabled={isUploadDisabled}
          className="px-6 py-2 bg-green-500 text-black font-bold rounded-full disabled:opacity-50 transition duration-150 ease-in-out"
        >
          {uploading ? "Uploading..." : `Upload Track ${files && files.length > 0 ? `(${files.length})` : ''}`}
        </button>
      </div>
      {files && files.length > 1 && (
        <p className="text-yellow-400 text-sm mt-2">
          Note: Current upload form sends metadata for the first file only.
        </p>
      )}
    </div>
  );
}