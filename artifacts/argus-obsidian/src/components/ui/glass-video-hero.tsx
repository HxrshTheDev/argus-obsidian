import { useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

const HeroSection = ({
  onScrollToDemo,
  onScrollToFeatures,
}: {
  onScrollToDemo?: (e: React.MouseEvent) => void;
  onScrollToFeatures?: (e: React.MouseEvent) => void;
}) => {
  const [fullBleed, setFullBleed] = useState(true);

  const VIDEO_URL =
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260210_031346_d87182fb-b0af-4273-84d1-c6fd17d6bf0f.mp4";

  return (
    <section
      id="hero"
      className={`relative w-full overflow-hidden transition-all duration-500 ease-in-out ${
        fullBleed ? "min-h-screen" : "py-32 lg:py-40"
      }`}
    >
      {/* Height toggle */}
      <button
        onClick={() => setFullBleed(!fullBleed)}
        aria-label={fullBleed ? "Switch to fit-to-content" : "Switch to full-bleed"}
        className="absolute top-24 right-4 z-20 p-2.5 rounded-[10px] backdrop-blur-xl border border-[rgba(153,247,255,0.3)] bg-[rgba(0,30,40,0.5)] text-white hover:bg-[rgba(0,50,60,0.6)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#99f7ff]"
      >
        {fullBleed ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>

      {/* Video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      {/* Dark overlay — keeps ARGUS aesthetic over any video */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#0e0e0e]/80 via-[#0e0e0e]/60 to-[#0e0e0e]/90" />

      {/* Ambient glow orbs */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#99f7ff]/15 blur-[80px] rounded-full" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#ac89ff]/15 blur-[80px] rounded-full" />
      </div>

      {/* Scanline sweep */}
      <div
        className="absolute inset-x-0 h-px z-[3] pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(153,247,255,0.4), transparent)",
          animation: "scanSweep 6s linear 3s infinite",
        }}
      />

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center text-center mt-36 px-6 pb-20">
        {/* Pill badge */}
        <div className="inline-flex items-center gap-2.5 h-[38px] px-3.5 rounded-[10px] backdrop-blur-xl border border-[rgba(153,247,255,0.3)] bg-[rgba(0,30,40,0.5)] shadow-[0_0_20px_rgba(153,247,255,0.1),inset_0_1px_0_rgba(255,255,255,0.06)] mb-8">
          <span
            className="font-bold text-xs px-2.5 py-1 rounded-[6px] shadow-[0_0_8px_rgba(153,247,255,0.3)]"
            style={{
              background: "#99f7ff",
              color: "#003a40",
              fontFamily: "Space Grotesk, sans-serif",
            }}
          >
            Beta
          </span>
          <span
            className="text-sm text-white/80 tracking-wide"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            ARGUS OBSIDIAN — Privacy-First AI Middleware
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-white text-5xl lg:text-[88px] leading-[1.05] tracking-[-0.02em] mt-2 max-w-5xl hero-fade-in"
          style={{ fontFamily: "Manrope, sans-serif", animationDelay: "0.3s" }}
        >
          The invisible layer
          <br className="hidden lg:block" />
          between your{" "}
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(135deg, #99f7ff 0%, #ac89ff 100%)",
            }}
          >
            data and AI.
          </span>
        </h1>

        {/* Subtext */}
        <p
          className="text-lg text-white/50 mt-6 max-w-[620px] leading-relaxed hero-fade-in"
          style={{ fontFamily: "Inter, sans-serif", animationDelay: "0.55s" }}
        >
          Detect sensitive PII in real time, replace it with synthetic tokens,
          and restore the original after your AI responds — 100% client-side,
          zero data stored.
        </p>

        {/* Trust line */}
        <p
          className="text-xs text-white/30 uppercase tracking-[0.3em] mt-4 hero-fade-in"
          style={{ fontFamily: "Space Grotesk, sans-serif", animationDelay: "0.7s" }}
        >
          Prevent data exposure. Stay private. Stay in control.
        </p>

        {/* CTA buttons */}
        <div
          className="flex flex-col sm:flex-row items-center gap-4 mt-10 hero-fade-in"
          style={{ animationDelay: "0.85s" }}
        >
          <a
            href="#demo"
            onClick={onScrollToDemo}
            className="px-10 py-4 rounded-full font-bold text-base tracking-tight transition-all hover:scale-105 active:scale-95 glow-primary-strong inline-block"
            style={{
              fontFamily: "Manrope, sans-serif",
              background: "#99f7ff",
              color: "#00555a",
            }}
          >
            Start Securing
          </a>

          <div className="inline-block group relative bg-gradient-to-b from-white/10 to-black/10 p-px rounded-2xl backdrop-blur-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <a
              href="#features"
              onClick={onScrollToFeatures}
              className="rounded-[1.15rem] px-8 py-4 text-base font-semibold backdrop-blur-md bg-black/80 hover:bg-black/95 text-white transition-all duration-300 group-hover:-translate-y-0.5 border border-white/10 hover:shadow-md hover:shadow-neutral-800/50 inline-block"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                See How It Works
              </span>
              <span className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300 inline-block">
                →
              </span>
            </a>
          </div>
        </div>

        {/* Stat pills */}
        <div
          className="flex flex-wrap justify-center gap-4 mt-12 hero-fade-in"
          style={{ animationDelay: "1s" }}
        >
          {[
            { label: "Threat Index", value: "99.98%" },
            { label: "Latency", value: "0.42ms" },
            { label: "Accuracy", value: "99.98%" },
            { label: "Status", value: "PROTECTION ACTIVE" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl border border-[rgba(153,247,255,0.15)] bg-[rgba(0,20,30,0.5)]"
            >
              <span
                className="text-[10px] text-white/30 uppercase tracking-widest"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                {stat.label}
              </span>
              <span
                className="text-xs font-bold text-[#99f7ff]"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { HeroSection };
