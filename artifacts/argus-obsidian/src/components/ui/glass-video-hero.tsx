import { useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260210_031346_d87182fb-b0af-4273-84d1-c6fd17d6bf0f.mp4";

const HeroSection = ({
  onScrollToDemo,
  onScrollToFeatures,
}: {
  onScrollToDemo?: (e: React.MouseEvent) => void;
  onScrollToFeatures?: (e: React.MouseEvent) => void;
}) => {
  const [fullBleed, setFullBleed] = useState(true);

  return (
    <section
      id="hero"
      className={`relative w-full overflow-hidden transition-all duration-500 ease-in-out bg-[#0e0e0e] ${
        fullBleed ? "min-h-screen" : "py-32 lg:py-40"
      }`}
    >
      {/* Height toggle */}
      <button
        onClick={() => setFullBleed(!fullBleed)}
        aria-label={fullBleed ? "Switch to fit-to-content" : "Switch to full-bleed"}
        className="absolute top-24 right-5 z-20 p-2 rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/10 hover:border-white/20 transition-all focus:outline-none"
      >
        {fullBleed ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </button>

      {/* Video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ filter: "brightness(0.75)" }}
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>


      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[2] pointer-events-none"
        style={{
          height: "220px",
          background: "linear-gradient(to bottom, transparent 0%, #0e0e0e 100%)",
        }}
      />

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center text-center mt-36 px-6 pb-24" style={{ opacity: 0.72 }}>

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] mb-10 hero-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded tracking-widest uppercase"
            style={{
              background: "linear-gradient(135deg, #99f7ff, #7ce8ff)",
              color: "#00292c",
              fontFamily: "Space Grotesk, sans-serif",
            }}
          >
            Beta
          </span>
          <span
            className="text-[11px] tracking-[0.2em] uppercase"
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              color: "rgba(190,220,225,0.45)",
            }}
          >
            Privacy-First AI Middleware
          </span>
        </div>

        {/* Headline */}
        <h1
          className="leading-[1.04] tracking-[-0.03em] hero-fade-in"
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "clamp(2.6rem, 6.5vw, 5.6rem)",
            fontWeight: 800,
            color: "#dff0f3",
            animationDelay: "0.25s",
          }}
        >
          The invisible layer
          <br />
          between your{" "}
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(135deg, #99f7ff 15%, #c4a8ff 85%)",
            }}
          >
            data and AI.
          </span>
        </h1>

        {/* Subtext */}
        <p
          className="mt-6 max-w-[520px] leading-relaxed hero-fade-in"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.975rem",
            color: "rgba(168,200,208,0.55)",
            animationDelay: "0.4s",
          }}
        >
          Detect sensitive PII in real time, replace it with synthetic tokens,
          and restore the original after your AI responds — 100% client-side,
          zero data stored.
        </p>

        {/* Trust line */}
        <p
          className="text-[10px] uppercase tracking-[0.35em] mt-4 hero-fade-in"
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            color: "rgba(140,185,195,0.28)",
            animationDelay: "0.5s",
          }}
        >
          Prevent data exposure · Stay private · Stay in control
        </p>

        {/* CTAs */}
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
              background: "linear-gradient(135deg, #99f7ff 0%, #6fe8f0 100%)",
              color: "#003538",
            }}
          >
            Start Securing
          </a>

          <a
            href="#features"
            onClick={onScrollToFeatures}
            className="px-8 py-3 rounded-full font-semibold text-sm border border-white/[0.1] transition-all duration-300 inline-block hover:border-white/20"
            style={{
              fontFamily: "Manrope, sans-serif",
              color: "rgba(190,220,228,0.6)",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#dff0f3")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(190,220,228,0.6)")}
          >
            See How It Works
            <span className="ml-2 opacity-50 inline-block">→</span>
          </a>
        </div>

        {/* Stats */}
        <div
          className="flex flex-wrap justify-center gap-3 mt-14 hero-fade-in"
          style={{ animationDelay: "0.75s" }}
        >
          {[
            { label: "Accuracy", value: "99.98%" },
            { label: "Latency",  value: "0.42ms" },
            { label: "Coverage", value: "10 PII types" },
            { label: "Mode",     value: "Client-Side" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.025]"
            >
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "9px", color: "rgba(140,185,195,0.4)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                {stat.label}
              </span>
              <span className="w-px h-2.5 bg-white/[0.08]" />
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "11px", fontWeight: 700, color: "rgba(190,228,235,0.75)" }}>
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
