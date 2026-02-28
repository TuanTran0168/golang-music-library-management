import type { Metadata } from "next";
import "./globals.css";

import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Improok Music",
  description: "A modern music library with Liquid Glass UI. Browse, upload, and stream your music collection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(20, 20, 40, 0.9)",
              backdropFilter: "blur(12px)",
              color: "#f0f0f5",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#a855f7", secondary: "#fff" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
          }}
        />
        <div className="gradient-bg" aria-hidden="true" />
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
