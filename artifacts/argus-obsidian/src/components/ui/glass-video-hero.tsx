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
      className={`relative w-full overflow-hidden transition-all duration-500 ease-in-out bg-[#0e0e0e] ${
        fullBleed ? "min-h-screen" : "py-32 lg:py-40"
      }`}
    >
      {/* Height toggle — matches nav/card glass treatment */}
      <button
        onClick={() => setFullBleed(!fullBleed)}
        aria-label={fullBleed ? "Switch to fit-to-content" : "Switch to full-bleed"}
        className="absolute top-24 right-5 z-20 p-2 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all focus:outline-none"
      >
        {fullBleed ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </button>

      {/* Base fill — exact match to page bg */}
      <div className="absolute inset-0 z-[1] bg-[#0e0e0e]" />

      {/* Single centered radial glow — one light source, intentional focal point */}
      <div
        className="absolute z-[2] pointer-events-none"
        style={{
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "900px",
          height: "600px",
          background:
            "radial-gradient(ellipse at center, rgba(153,247,255,0.07) 0%, rgba(172,137,255,0.04) 40%, transparent 70%)",
          filter: "blur(1px)",
        }}
      />

      {/* Subtle noise/grid texture */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center text-center mt-36 px-6 pb-24">

        {/* Badge — same surface treatment as nav and cards */}
        <div
          className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] mb-10 hero-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded tracking-widest uppercase"
            style={{
              background: "#99f7ff",
              color: "#003538",
              fontFamily: "Space Grotesk, sans-serif",
            }}
          >
            Beta
          </span>
          <span
            className="text-xs text-white/50 tracking-widest uppercase"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Privacy-First AI Middleware
          </span>
        </div>

        {/* Headline — clean white hierarchy, gradient only on accent phrase */}
        <h1
          className="text-white leading-[1.04] tracking-[-0.03em] hero-fade-in"
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "clamp(2.8rem, 7vw, 6rem)",
            fontWeight: 800,
            animationDelay: "0.25s",
          }}
        >
          The invisible layer
          <br />
          between your{" "}
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(135deg, #99f7ff 20%, #ac89ff 80%)",
            }}
          >
            data and AI.
          </span>
        </h1>

        {/* Subtext — same opacity as page body copy */}
        <p
          className="text-white/40 mt-6 max-w-[540px] leading-relaxed hero-fade-in"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "1rem",
            animationDelay: "0.4s",
          }}
        >
          Detect sensitive PII in real time, replace it with synthetic tokens,
          and restore the original after your AI responds — 100% client-side,
          zero data stored.
        </p>

        {/* Trust line */}
        <p
          className="text-[11px] text-white/20 uppercase tracking-[0.3em] mt-4 hero-fade-in"
          style={{ fontFamily: "Space Grotesk, sans-serif", animationDelay: "0.5s" }}
        >
          Prevent data exposure · Stay private · Stay in control
        </p>

        {/* CTAs — primary matches nav CTA exactly, secondary uses border-only glass */}
        <div
          className="flex flex-col sm:flex-row items-center gap-3 mt-10 hero-fade-in"
          style={{ animationDelay: "0.6s" }}
        >
          <a
            href="#demo"
            onClick={onScrollToDemo}
            className="px-8 py-3 rounded-full font-bold text-sm tracking-tight transition-all hover:scale-105 active:scale-95 glow-primary inline-block"
            style={{
              fontFamily: "Manrope, sans-serif",
              background: "#99f7ff",
              color: "#005f64",
            }}
          >
            Start Securing
          </a>

          <a
            href="#features"
            onClick={onScrollToFeatures}
            className="px-8 py-3 rounded-full font-semibold text-sm text-white/60 border border-white/10 hover:border-white/20 hover:text-white transition-all duration-300 inline-block"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            See How It Works
            <span className="ml-2 opacity-60 group-hover:translate-x-1 transition-transform inline-block">→</span>
          </a>
        </div>

        {/* Stats — same border/bg token as badge and cards, no teal tint */}
        <div
          className="flex flex-wrap justify-center gap-3 mt-14 hero-fade-in"
          style={{ animationDelay: "0.75s" }}
        >
          {[
            { label: "Accuracy", value: "99.98%" },
            { label: "Latency", value: "0.42ms" },
            { label: "Coverage", value: "10 PII types" },
            { label: "Mode", value: "100% Client-Side" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03]"
            >
              <span
                className="text-[10px] text-white/30 uppercase tracking-widest"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                {stat.label}
              </span>
              <span
                className="w-px h-3 bg-white/10"
              />
              <span
                className="text-[11px] font-bold text-white/70"
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
