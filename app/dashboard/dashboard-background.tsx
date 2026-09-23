"use client";

import React from "react";

export default function DashboardBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
    >
      {/* Sky Gradient Base (matching landing page .sky palette) */}
      <div className="sky absolute inset-0 h-full w-full" />

      {/* Atmospheric Cloud Accents */}
      <div
        className="cloud absolute"
        style={{
          top: "4%",
          right: "-5%",
          width: "45vw",
          height: "15vh",
          opacity: 0.6,
          filter: "blur(24px)",
        }}
      />
      <div
        className="cloud absolute"
        style={{
          bottom: "10%",
          left: "-10%",
          width: "50vw",
          height: "30vh",
          opacity: 0.5,
          filter: "blur(28px)",
        }}
      />
      <div
        className="cloud absolute"
        style={{
          bottom: "-5%",
          right: "-10%",
          width: "55vw",
          height: "35vh",
          opacity: 0.65,
          filter: "blur(30px)",
        }}
      />

      {/* Mount Everest Image - Blurred & Fitted */}
      <div className="absolute inset-0 h-full w-full overflow-hidden">
        <img
          src="/everest.jpg"
          alt=""
          className="h-full w-full object-cover object-bottom scale-105 filter blur-lg opacity-40 transform-gpu"
        />
      </div>

      {/* Deep Navy Scrim to preserve high contrast for trading tables & charts */}
      <div className="absolute inset-0 bg-[#04153b]/82 backdrop-blur-[2px]" />

      {/* Subtle top-to-bottom vignette gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#03112e]/70 via-transparent to-[#03112e]/85" />
    </div>
  );
}
