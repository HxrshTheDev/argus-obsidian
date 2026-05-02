import { useEffect, useRef, useState, useCallback } from "react";
import { HeroSection } from "@/components/ui/glass-video-hero";
import { GlowCard } from "@/components/ui/glow-card";

function generateFloatingPathsSVG(position: number): string {
  let paths = "";
  for (let i = 0; i < 8; i++) {
    const d = `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`;

    const duration = 20 + Math.random() * 10;
    const delayVal = Math.random() * -30;
    const strokeWidth = 0.5 + i * 0.03;
    const strokeOpacity = 0.1 + i * 0.03;

    paths += `<path d="${d}" stroke="white" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}" fill="none" class="floating-path" style="animation: floatingPath ${duration}s linear ${delayVal}s infinite"/>`;
  }
  return `<svg class="w-full h-full" viewBox="0 0 696 316" fill="none">${paths}</svg>`;
}

const PII_RULES = [
  { type: "API_KEY", regex: /\b[A-Za-z0-9_-]{20,}\b|\bsk-[A-Za-z0-9]{20,}\b|\bpk_[A-Za-z0-9]{20,}\b|\b(?:api[-]?key|token|secret)\s*[:=]\s*[A-Za-z0-9-]{10,}\b/gi },
  { type: "TOKEN", regex: /\bBearer\s+[A-Za-z0-9-._~+/]+=*\b/gi },
  { type: "PASSWORD", regex: /\b(?:password|pwd|pass)\s*[:=]\s*\S+\b/gi },
  { type: "CARD", regex: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g },
  { type: "URL_CRED", regex: /https?:\/\/[^\s:@]+:[^\s:@]+@[^\s/:]+(?::\d+)?(?:\/[^\s]*)?/gi },
  { type: "EMAIL", regex: /[\w.-]+@[\w.-]+/g },
  { type: "PHONE", regex: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|\b\d{10}\b/g },
  { type: "ADDRESS", regex: /\b\d{1,5}\s\w+\s(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Blvd)\b/gi },
  { type: "ID", regex: /\b\d{6,}\b/g },
  { type: "NAME", regex: /\b[A-Z][a-z]+\s[A-Z][a-z]+\b/g },
];

interface MaskResult {
  total: number;
  text: string;
  counters: Record<string, number>;
}

function applyMasking(text: string): MaskResult {
  const matches: { type: string; value: string; start: number; end: number }[] = [];
  const ranges: { start: number; end: number }[] = [];
  const counters: Record<string, number> = {};

  PII_RULES.forEach((rule) => {
    let match;
    rule.regex.lastIndex = 0;
    while ((match = rule.regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      const isOverlapping = ranges.some(
        (r) => (start >= r.start && start < r.end) || (end > r.start && end <= r.end)
      );

      let isFalsePositive = false;
      if (rule.type === "NAME" && isOverlapping) isFalsePositive = true;
      if (rule.type === "NAME") {
        const commonCities = ["New", "San", "Los", "Santa"];
        if (commonCities.includes(match[0].split(" ")[0])) isFalsePositive = true;
      }

      if (!isOverlapping && !isFalsePositive) {
        ranges.push({ start, end });
        matches.push({ type: rule.type, value: match[0], start, end });
      }
    }
  });

  matches.sort((a, b) => a.start - b.start);

  let newText = text;
  let textShift = 0;

  matches.forEach((m) => {
    counters[m.type] = (counters[m.type] || 0) + 1;
    const token = `[${m.type}_${counters[m.type]}]`;
    const idx = m.start + textShift;
    newText = newText.slice(0, idx) + token + newText.slice(idx + m.value.length);
    textShift += token.length - m.value.length;
  });

  const tokenRegex = /\[(API_KEY|TOKEN|PASSWORD|CARD|URL_CRED|EMAIL|PHONE|ADDRESS|ID|NAME)_\d+\]/g;
  const total = (newText.match(tokenRegex) || []).length;

  return { total, text: newText, counters };
}

export default function Home() {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [detectionText, setDetectionText] = useState("SCANNER_ACTIVE_STANDBY");
  const [maskedOutput, setMaskedOutput] = useState("STREAM_NOT_ESTABLISHED");
  const [finalOutput, setFinalOutput] = useState("READY_FOR_AI_VERIFICATION");
  const [riskWidth, setRiskWidth] = useState("0%");
  const [riskColor, setRiskColor] = useState("#fff");
  const [riskLabel, setRiskLabel] = useState("IDLE");
  const [isSafeMode, setIsSafeMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastOutput, setLastOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  const handleInput = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const text = inputRef.current?.value || "";
      const result = applyMasking(text);

      setDetectionText(`${result.total} SENSITIVE_UNITS_SECURED`);
      setMaskedOutput(result.text || "STREAM_NOT_ESTABLISHED");

      if (result.total === 0) {
        setRiskWidth("15%");
        setRiskColor("#22c55e");
        setRiskLabel("IDLE");
      } else if (result.total <= 3) {
        setRiskWidth("45%");
        setRiskColor("#facc15");
        setRiskLabel("ELEVATED_RISK");
      } else {
        setRiskWidth("85%");
        setRiskColor("#ef4444");
        setRiskLabel("CRITICAL_RISK");
      }
    }, 250);
  }, []);

  const handleProcess = useCallback(async () => {
    const text = inputRef.current?.value || "";
    if (!text.trim()) {
      setFinalOutput("⚠️ Please enter some data.");
      return;
    }

    if (!isSafeMode) setIsSafeMode(true);

    setIsLoading(true);
    try {
      setFinalOutput("ESTABLISHING_TLS_OBSIDIAN_HANDSHAKE...");
      await new Promise((r) => setTimeout(r, 400));
      setFinalOutput("PROTOCOL_ACTIVE_STREAM_NEUTRALIZED...");
      await new Promise((r) => setTimeout(r, 400));
      setFinalOutput("FINALIZING_SECURE_OUTPUT...");

      const API_URL = "/api";
      const response = await fetch(`${API_URL}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error(`API_RESPONSE_FAIL: ${response.status}`);

      const data = await response.json();
      const resultText = data.improved || data.masked || text;
      setFinalOutput(resultText);
      setLastOutput(resultText);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setFinalOutput(`⚠️ SECURITY_HANDSHAKE_FAILED: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [isSafeMode]);

  const handleCopy = useCallback(() => {
    if (!lastOutput) return;
    navigator.clipboard.writeText(lastOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [lastOutput]);

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="dark">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0e0e0e]/60 backdrop-blur-[20px] border-b border-white/10">
        <div className="flex justify-between items-center px-8 py-4 max-w-screen-2xl mx-auto">
          <div className="text-xl tracking-widest font-bold text-white" style={{ fontFamily: "Manrope, sans-serif" }}>
            ARGUS OBSIDIAN
          </div>
          <div className="hidden md:flex items-center gap-10">
            {["features", "demo", "trust", "future"].map((s) => (
              <a
                key={s}
                href={`#${s}`}
                onClick={scrollTo(s)}
                className="text-white/70 hover:text-[#99f7ff] transition-all duration-300 text-sm uppercase tracking-wider"
                style={{ fontFamily: "Space Grotesk, sans-serif", color: s === "features" ? "#99f7ff" : undefined }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </a>
            ))}
          </div>
          <a
            href="#demo"
            onClick={scrollTo("demo")}
            className="scale-95 active:scale-90 transition-transform bg-[#99f7ff] text-[#005f64] px-6 py-2 rounded-full font-bold text-sm tracking-tight glow-primary inline-block"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Get Started
          </a>
        </div>
      </nav>

      <main>
        <HeroSection
          onScrollToDemo={scrollTo("demo")}
          onScrollToFeatures={scrollTo("features")}
        />

        {/* Features Section */}
        <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "radar",
                title: "Detect",
                color: "#99f7ff",
                glowColor: "lightblue",
                borderHover: "hover:border-[#99f7ff]/30",
                text: "Real-time heuristic scanning identifies sensitive PII and trade secrets before they ever reach the Large Language Model.",
              },
              {
                icon: "visibility_off",
                title: "Mask",
                color: "#ac89ff",
                glowColor: "lightblue",
                borderHover: "hover:border-[#ac89ff]/30",
                text: "Autonomous synthetic data replacement ensures LLM functionality remains intact while keeping your actual values hidden.",
              },
              {
                icon: "sync_alt",
                title: "Restore",
                color: "#00f1fe",
                glowColor: "lightblue",
                borderHover: "hover:border-[#00f1fe]/30",
                text: "Seamless reverse-remapping decodes AI responses back to your local environment with absolute precision.",
              },
            ].map((card) => (
              <GlowCard
                key={card.title}
                glowColor={card.glowColor as 'blue' | 'purple' | 'green' | 'red' | 'orange'}
                customSize
                className="p-10 group transition-all duration-500 w-full"
              >
                <div className="w-12 h-12 mb-8" style={{ color: card.color }}>
                  <span
                    className="material-symbols-outlined text-4xl"
                    style={{ fontVariationSettings: "'FILL' 0" }}
                  >
                    {card.icon}
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white" style={{ fontFamily: "Manrope, sans-serif" }}>
                  {card.title}
                </h3>
                <p className="text-[#adaaaa] leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                  {card.text}
                </p>
              </GlowCard>
            ))}
          </div>
        </section>

        {/* Demo Section */}
        <section id="demo" className="py-32 px-6 bg-[#050505] relative overflow-hidden">
          <div className="scanline" />
          <div className="max-w-7xl mx-auto relative z-20">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
              <div>
                <div
                  className={`inline-flex items-center px-3 py-1 rounded mb-6 border text-[10px] font-bold tracking-[0.3em] transition-all duration-400 ${
                    isSafeMode
                      ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                      : "bg-cyan-400/10 text-cyan-400 border-cyan-400/20"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-2 shadow-[0_0_8px_currentColor] ${
                      isSafeMode ? "bg-emerald-400 animate-pulse" : "bg-cyan-400"
                    }`}
                  />
                  {isSafeMode ? "AI_SAFE_MODE_ENABLED" : "STREAM_LISTENER_ACTIVE"}
                </div>
                <h2
                  className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-4 uppercase"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  Argus Intercept
                </h2>
                <p className="text-white/40 text-lg max-w-xl border-l border-cyan-400/30 pl-6" style={{ fontFamily: "Inter, sans-serif" }}>
                  Autonomous privacy filtering for neural outbound streams. Neutralize data leaks before they reach the cloud.
                </p>
              </div>
              <div className="flex flex-col gap-2 text-right">
                <span className="stream-label">ENCRYPTION_STATUS</span>
                <span className="text-sm font-bold text-white tracking-widest" style={{ fontFamily: "Manrope, sans-serif" }}>
                  TLS_OBSIDIAN_1.3
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-1 mb-8 border border-white/10 rounded-2xl overflow-hidden terminal-window">
              {/* Left: Raw Input */}
              <div className="lg:col-span-6 flex flex-col bg-[#080808] border-r border-white/10">
                <div className="px-6 py-4 flex justify-between items-center border-b border-white/5 bg-white/[0.02]">
                  <span className="stream-label flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                    RAW_UNSECURED_STREAM
                  </span>
                  <span className="text-[9px] text-white/20 font-bold tracking-widest">PORT: 8080</span>
                </div>
                <div className="p-8 flex-1">
                  <textarea
                    ref={inputRef}
                    onInput={handleInput}
                    className="w-full h-full min-h-[350px] bg-transparent border-none text-white font-mono text-sm leading-relaxed placeholder:text-white/5 resize-none focus:outline-none"
                    placeholder="// Inject outbound data stream for interception..."
                  />
                </div>
              </div>

              {/* Right: Processed Output */}
              <div className="lg:col-span-6 flex flex-col bg-[#000000]">
                <div className="px-6 py-4 flex justify-between items-center border-b border-white/5 bg-white/[0.01]">
                  <span className="stream-label flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-cyan-400" />
                    SECURED_OBSIDIAN_STREAM
                  </span>
                  <span className="text-[9px] text-cyan-400/50 font-bold tracking-widest">ENCRYPTED</span>
                </div>
                <div className="p-8 flex-1 terminal-text">
                  <div className="space-y-10">
                    <div>
                      <p className="stream-label mb-4">PII_DETECTION_ENGINE</p>
                      <div className="p-6 rounded-lg bg-white/[0.02] border border-white/5">
                        <p className="text-white text-base font-bold mb-4 tracking-tight">{detectionText}</p>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-white/30 tracking-widest uppercase">{riskLabel}</span>
                            <span className="text-[9px] font-black text-white/20 tracking-tighter uppercase">Threat Index</span>
                          </div>
                          <div className="risk-bar-container">
                            <div
                              className="risk-bar-fill h-full"
                              style={{ width: riskWidth, background: riskColor }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-8">
                      <div>
                        <p className="stream-label mb-3">MASKED_TRANSFORMATION</p>
                        <p className="text-cyan-400/70 font-mono text-xs leading-relaxed italic border-l-2 border-white/10 pl-4 py-2 transition-all duration-300">
                          {maskedOutput}
                        </p>
                      </div>
                      <div>
                        <p className="stream-label mb-3">REFINED_SECURE_STREAM</p>
                        <p
                          className="text-white/80 font-mono text-xs leading-relaxed italic border-l-2 border-cyan-400/20 pl-4 py-2 cursor-pointer"
                          onClick={handleCopy}
                        >
                          {copied ? "STREAM_COPIED_TO_BUFFER" : finalOutput}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats + Button */}
            <GlowCard glowColor="lightblue" customSize className="flex flex-col md:flex-row gap-8 items-center justify-between p-8 w-full">
              <div className="flex flex-wrap gap-10">
                {[
                  { label: "LATENCY", value: "0.42ms" },
                  { label: "ACCURACY", value: "99.98%" },
                  { label: "PROTECTION", value: "ACTIVE", cyan: true },
                ].map((stat) => (
                  <div key={stat.label} className={`flex flex-col gap-1 ${stat.cyan ? "text-cyan-400" : ""}`}>
                    <span className={`stream-label ${stat.cyan ? "text-cyan-400/50" : ""}`}>{stat.label}</span>
                    <span className="text-lg font-bold" style={{ fontFamily: "Manrope, sans-serif" }}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleProcess}
                disabled={isLoading}
                className="w-full md:w-auto bg-cyan-400 text-black px-12 py-5 rounded font-black text-xs uppercase tracking-[0.3em] hover:bg-white transition-all transform active:scale-95 shadow-[0_0_30px_rgba(34,211,238,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                {isLoading ? "PROCESSING..." : "Intercept & Secure"}
              </button>
            </GlowCard>
          </div>
        </section>

        {/* Trust Section */}
        <section id="trust" className="py-40 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-20">
            <div className="lg:w-1/2">
              <h2
                className="text-5xl md:text-6xl font-extrabold tracking-tighter leading-tight mb-8"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Built for a world where{" "}
                <span style={{ color: "#99f7ff" }}>AI sees everything</span>.
              </h2>
              <p className="text-xl text-[#adaaaa] max-w-lg mb-12" style={{ fontFamily: "Inter, sans-serif" }}>
                We don't just secure your data; we architected a new paradigm of intelligence privacy that scales with the evolution of neural networks.
              </p>
              <div className="flex items-center gap-8">
                {[
                  { val: "0.4ms", label: "Latency" },
                  { val: "100%", label: "Client-Side" },
                  { val: "AES-256", label: "Encryption" },
                ].map((stat, i) => (
                  <div key={stat.label} className="flex items-center gap-8">
                    {i > 0 && <div className="w-px h-12 bg-white/10" />}
                    <div className="text-center">
                      <div className="text-4xl font-bold text-white mb-1" style={{ fontFamily: "Manrope, sans-serif" }}>
                        {stat.val}
                      </div>
                      <div className="text-[10px] text-white/40 uppercase tracking-widest" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div id="future" className="lg:w-1/2 grid grid-cols-1 gap-12">
              {[
                {
                  icon: "api",
                  title: "Invisible Integration",
                  color: "#99f7ff",
                  borderColor: "border-[#99f7ff]/20",
                  text: "Deploy as a browser extension, a proxy, or an SDK. Your workflow remains untouched while your safety is guaranteed.",
                },
                {
                  icon: "security",
                  title: "The Sentinel Protocol",
                  color: "#ac89ff",
                  borderColor: "border-[#ac89ff]/20",
                  text: "Our proprietary protocol creates a temporary 'shadow' of your data, allowing the AI to learn without ever seeing the core truth.",
                },
                {
                  icon: "auto_graph",
                  title: "Future Proof Privacy",
                  color: "#00f1fe",
                  borderColor: "border-[#00f1fe]/20",
                  text: "As models become more invasive, ARGUS evolves. Our AI-vs-AI defense layer keeps you two steps ahead of extraction attacks.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-6">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full border ${item.borderColor} flex items-center justify-center`}
                    style={{ color: item.color }}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                      {item.title}
                    </h4>
                    <p className="text-[#adaaaa] leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-40 px-6 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#99f7ff]/5 blur-[150px] rounded-full pointer-events-none" />
          <div className="relative z-10 text-center max-w-4xl mx-auto">
            <h2
              className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-12 leading-none"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Control what{" "}
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(to right, #99f7ff, #ac89ff)" }}
              >
                AI can see.
              </span>
            </h2>
            <div className="inline-block p-[1px] rounded-full" style={{ backgroundImage: "linear-gradient(to right, #99f7ff50, #ac89ff50)" }}>
              <a
                href="#demo"
                onClick={scrollTo("demo")}
                className="bg-[#0e0e0e] px-12 py-6 rounded-full font-bold text-2xl hover:bg-transparent hover:text-[#005f64] transition-all duration-500 glow-primary inline-block"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Get Started Now
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-8 bg-[#0e0e0e] border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-4">
          <div className="text-lg font-bold text-white/50 tracking-widest uppercase" style={{ fontFamily: "Manrope, sans-serif" }}>
            ARGUS OBSIDIAN
          </div>
          <div className="flex gap-8">
            {["Privacy", "Terms", "Security"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-[10px] tracking-tighter uppercase text-white/40 hover:text-[#99f7ff] transition-colors"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                {link}
              </a>
            ))}
          </div>
          <div className="text-[10px] tracking-tighter uppercase text-white/40" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            © 2026 ARGUS OBSIDIAN. THE DIGITAL SENTINEL.
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroTitle() {
  const text = "ARGUS OBSIDIAN";
  const words = text.split(" ");

  return (
    <h1
      className="font-extrabold text-6xl md:text-8xl lg:text-9xl tracking-tighter mb-6 leading-none"
      style={{ fontFamily: "Manrope, sans-serif" }}
    >
      {words.map((word, wi) => (
        <span key={wi} className="hero-word">
          {word.split("").map((letter, li) => (
            <span
              key={li}
              className="hero-letter"
              style={{ animationDelay: `${wi * 0.1 + li * 0.03}s` }}
            >
              {letter}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
