import { Router } from "express";
import { z } from "zod";

const router = Router();

const InputSchema = z.object({ text: z.string() });

const RULES: { category: string; pattern: RegExp }[] = [
  { category: "API_KEY", pattern: /\b[A-Za-z0-9_-]{20,}\b|\bsk-[A-Za-z0-9]{20,}\b|\bpk_[A-Za-z0-9]{20,}\b|\b(?:api[-]?key|token|secret)\s*[:=]\s*[A-Za-z0-9-]{10,}\b/gi },
  { category: "TOKEN", pattern: /\bBearer\s+[A-Za-z0-9-._~+/]+=*\b/gi },
  { category: "PASSWORD", pattern: /\b(?:password|pwd|pass)\s*[:=]\s*\S+\b/gi },
  { category: "CARD", pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g },
  { category: "URL_CRED", pattern: /https?:\/\/[^\s:@]+:[^\s:@]+@[^\s/:]+(?::\d+)?(?:\/[^\s]*)?/gi },
  { category: "EMAIL", pattern: /[\w.-]+@[\w.-]+/g },
  { category: "PHONE", pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|\b\d{10}\b/g },
  { category: "ADDRESS", pattern: /\b\d{1,5}\s\w+\s(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Blvd)\b/gi },
  { category: "ID", pattern: /\b\d{6,}\b/g },
  { category: "NAME", pattern: /\b[A-Z][a-z]+\s[A-Z][a-z]+\b/g },
];

interface MatchEntry {
  category: string;
  value: string;
  start: number;
  end: number;
  index: number;
}

router.post("/process", (req: any, res: any) => {
  const parsed = InputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const text = parsed.data.text.trim();
  if (!text) {
    res.json({ masked: "", count: 0, improved: "No input provided" });
    return;
  }

  const matches: MatchEntry[] = [];
  const ranges: { start: number; end: number }[] = [];

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = rule.pattern.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      const overlaps = ranges.some(
        (r) => (start >= r.start && start < r.end) || (end > r.start && end <= r.end)
      );
      if (overlaps) continue;

      if (rule.category === "NAME") {
        const commonCities = ["New", "San", "Los", "Santa"];
        if (commonCities.includes(match[0].split(" ")[0])) continue;
      }

      ranges.push({ start, end });
      matches.push({ category: rule.category, value: match[0], start, end, index: 0 });
    }
  }

  matches.sort((a, b) => a.start - b.start);

  const typeCounters: Record<string, number> = {};
  for (const m of matches) {
    typeCounters[m.category] = (typeCounters[m.category] || 0) + 1;
    m.index = typeCounters[m.category];
  }

  let currentText = text;
  for (const m of [...matches].reverse()) {
    const placeholder = `[${m.category}_${m.index}]`;
    currentText = currentText.slice(0, m.start) + placeholder + currentText.slice(m.end);
  }

  res.json({
    masked: currentText,
    count: matches.length,
    improved: currentText,
  });
});

export default router;
