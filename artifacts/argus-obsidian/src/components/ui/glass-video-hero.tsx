import { useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

/* ─── Animated line data ─────────────────────────────────────────────────────
   Pure CSS animation — only transform + opacity (GPU composited, zero repaint)
   18 lines total: 11 horizontal drifts + 7 diagonal accents
   ─────────────────────────────────────────────────────────────────────────── */
const H_LINES = [
  { top: "8%",  w: "35%", delay: "0s",    dur: "18s", color: "rgba(153,247,255,0.06)", left: "5%" },
  { top: "15%", w: "20%", delay: "3s",    dur: "22s", color: "rgba(172,137,255,0.05)", left: "60%" },
  { top: "23%", w: "45%", delay: "1.5s",  dur: "26s", color: "rgba(153,247,255,0.04)", left: "20%" },
  { top: "34%", w: "28%", delay: "5s",    dur: "20s", color: "rgba(172,137,255,0.06)", left: "0%" },
  { top: "42%", w: "15%", delay: "2s",    dur: "15s", color: "rgba(153,247,255,0.05)", left: "70%" },
  { top: "55%", w: "38%", delay: "7s",    dur: "24s", color: "rgba(172,137,255,0.04)", left: "10%" },
  { top: "63%", w: "22%", delay: "4s",    dur: "19s", color: "rgba(153,247,255,0.06)", left: "50%" },
  { top: "74%", w: "50%", delay: "0.5s",  dur: "28s", color: "rgba(172,137,255,0.03)", left: "30%" },
  { top: "82%", w: "18%", delay: "6s",    dur: "17s", color: "rgba(153,247,255,0.05)", left: "75%" },
  { top: "90%", w: "32%", delay: "2.5s",  dur: "21s", color: "rgba(172,137,255,0.04)", left: "5%" },
  { top: "48%", w: "12%", delay: "8s",    dur: "16s", color: "rgba(153,247,255,0.07)", left: "85%" },
];

const D_LINES = [
  { top: "10%", left: "15%", dur: "30s", delay: "0s",   angle: "35deg",  color: "rgba(153,247,255,0.04)" },
  { top: "20%", left: "70%", dur: "36s", delay: "4s",   angle: "-25deg", color: "rgba(172,137,255,0.05)" },
  { top: "45%", left: "5%",  dur: "28s", delay: "2s",   angle: "20deg",  color: "rgba(153,247,255,0.03)" },
  { top: "60%", left: "55%", dur: "32s", delay: "6s",   angle: "-40deg", color: "rgba(172,137,255,0.04)" },
  { top: "75%", left: "30%", dur: "24s", delay: "1s",   angle: "30deg",  color: "rgba(153,247,255,0.05)" },
  { top: "30%", left: "85%", dur: "38s", delay: "9s",   angle: "-15deg", color: "rgba(172,137,255,0.03)" },
  { top: "85%", left: "80%", dur: "20s", delay: "3s",   angle: "45deg",  color: "rgba(153,247,255,0.04)" },
];

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
      {/* ── Height toggle ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setFullBleed(!fullBleed)}
        aria-label={fullBleed ? "Switch to fit-to-content" : "Switch to full-bleed"}
        className="absolute top-24 right-5 z-20 p-2 rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/10 hover:border-white/20 transition-all focus:outline-none"
      >
        {fullBleed ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </button>

      {/* ── Animated background ───────────────────────────────────────────── */}
      <div className="hero-bg-animation" aria-hidden="true">

        {/* Central radial glow — single soft light source */}
        <div className="hero-glow-core" />

        {/* Horizontal drifting lines */}
        {H_LINES.map((l, i) => (
          <div
            key={`h${i}`}
            className="hero-line-h"
            style={{
              top: l.top,
              left: l.left,
              width: l.w,
              background: l.color,
              animationDuration: l.dur,
              animationDelay: l.delay,
            }}
          />
        ))}

        {/* Diagonal accent lines */}
        {D_LINES.map((l, i) => (
          <div
            key={`d${i}`}
            className="hero-line-d"
            style={{
              top: l.top,
              left: l.left,
              background: l.color,
              transform: `rotate(${l.angle})`,
              animationDuration: l.dur,
              animationDelay: l.delay,
            }}
          />
        ))}

        {/* Subtle dot-grid overlay */}
        <div className="hero-dot-grid" />
      </div>

      {/* ── Hero content ──────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center text-center mt-36 px-6 pb-24">

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

        {/* Headline
            — Off-white (#dff0f3) with a faint cyan tint reads warmer against #0e0e0e
            — Gradient accent only on "data and AI." for focus                     */}
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

        {/* Subtext — cyan-grey tint, not pure white/grey */}
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
          {/* Primary — cyan fill, matches nav CTA */}
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

          {/* Secondary — border-only, text tinted to match headline */}
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

        {/* Stats — tinted to match typography palette */}
        <div
          className="flex flex-wrap justify-center gap-3 mt-14 hero-fade-in"
          style={{ animationDelay: "0.75s" }}
        >
          {[
            { label: "Accuracy",  value: "99.98%" },
            { label: "Latency",   value: "0.42ms" },
            { label: "Coverage",  value: "10 PII types" },
            { label: "Mode",      value: "Client-Side" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.025]"
            >
              <span
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: "9px",
                  color: "rgba(140,185,195,0.4)",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                {stat.label}
              </span>
              <span className="w-px h-2.5 bg-white/[0.08]" />
              <span
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "rgba(190,228,235,0.75)",
                }}
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
