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

// GET handler — helpful message for browser visitors
router.get("/process", (_req: any, res: any) => {
  res.json({
    status: "ok",
    message: "Argus Obsidian /api/process endpoint is live. Send a POST request with { \"text\": \"...\" } to use it.",
  });
});

router.post("/process", async (req: any, res: any) => {
  try {
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

    // Extract Nvidia API Key from Header, Body, or Environment
    const nvidiaApiKey = req.headers["x-nvidia-api-key"] || req.body.apiKey || process.env.NVIDIA_API_KEY;

    if (!nvidiaApiKey) {
      res.json({
        masked: currentText,
        count: matches.length,
        improved: "⚠️ Nvidia Nemotron API key not configured. Please enter your API key in Settings or set the NVIDIA_API_KEY environment variable on Vercel to receive the AI response.",
      });
      return;
    }

    // Call the Nvidia hosted NIM Chat Completions endpoint
    const prompt = `Task: Provide a helpful, intelligent response to the following prompt.
Constraint 1: You MUST PRESERVE all placeholders like [EMAIL_1], [PHONE_1], [API_KEY_1], etc. exactly format-wise.
Constraint 2: Do NOT provide conversational preamble. Output a direct, seamless reply.

Prompt:
${currentText}`;

    const modelName = process.env.NVIDIA_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";
    
    const apiResponse: any = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${nvidiaApiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        top_p: 0.95,
        max_tokens: 4096,
        extra_body: {
          chat_template_kwargs: { enable_thinking: true },
          reasoning_budget: 1024
        }
      }),
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      let errorMsg = `NVIDIA API Error: ${apiResponse.status} ${apiResponse.statusText}`;
      if (apiResponse.status === 401) {
        errorMsg = "⚠️ NVIDIA API Error: Unauthorized (401). Please check if your NVIDIA API key is valid.";
      } else if (apiResponse.status === 404) {
        errorMsg = `⚠️ NVIDIA API Error: Model not found (404). Failed to access model "${modelName}".`;
      } else if (errText) {
        errorMsg += ` - ${errText.substring(0, 150)}`;
      }
      throw new Error(errorMsg);
    }

    const resData: any = await apiResponse.json();
    const aiText = resData.choices?.[0]?.message?.content || "";

    // Reverse Remapping (De-masking)
    let restoredText = aiText;
    const placeholderMap: Record<string, string> = {};
    for (const m of matches) {
      const placeholder = `[${m.category}_${m.index}]`;
      placeholderMap[placeholder] = m.value;
    }

    for (const [placeholder, originalValue] of Object.entries(placeholderMap)) {
      restoredText = restoredText.replaceAll(placeholder, originalValue);
    }

    res.json({
      masked: currentText,
      count: matches.length,
      improved: restoredText,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || "An unexpected error occurred during AI processing.",
    });
  }
});

export default router;
