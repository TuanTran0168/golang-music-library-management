import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Navbar, Player } from "@/components/layout";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "Improok Music",
  description: "A music library with Apple-inspired Liquid Glass UI. Browse, upload, and stream your collection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={plusJakartaSans.variable}>
      <head>
        {/* Inline script: apply saved theme BEFORE first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('improok-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.setAttribute('data-theme','dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(24px) saturate(180%)",
              color: "#1D1D1F",
              border: "1px solid rgba(0,0,0,0.07)",
              borderRadius: "16px",
              fontSize: "14px",
              fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
              fontWeight: 500,
              boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.9) inset",
            },
            success: {
              iconTheme: { primary: "#0071E3", secondary: "#fff" },
            },
            error: {
              iconTheme: { primary: "#FF3B30", secondary: "#fff" },
            },
          }}
        />

        {/* Apple iPhone Air gradient background — 4 iris blobs */}
        <div className="gradient-bg" aria-hidden="true">
          <div className="iris-lavender" />
          <div className="iris-pink" />
        </div>

        <div className="relative z-10 flex flex-col overflow-hidden" style={{ height: "100dvh" }}>
          <Navbar />
          {children}
          <Player />
        </div>
      </body>
    </html>
  );
}
