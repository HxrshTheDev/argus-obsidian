const express = require("express");
const cors = require("cors");
const https = require("https");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------- PII Detection Rules ---------------
const RULES = [
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

// --------------- HTTPS Request Helper ---------------
function makeRequest(url, headers, bodyData) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "POST",
      headers: headers,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          text: () => Promise.resolve(data),
          json: () => {
            try {
              return Promise.resolve(JSON.parse(data));
            } catch (e) {
              return Promise.reject(new Error("Invalid JSON returned: " + data));
            }
          }
        });
      });
    });

    req.on("error", (e) => {
      reject(e);
    });

    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}

// --------------- Health ---------------
app.get("/api/healthz", (req, res) => {
  res.json({ status: "ok" });
});

// --------------- Process GET ---------------
app.get("/api/process", (req, res) => {
  res.json({
    status: "ok",
    message: "Argus Obsidian /api/process endpoint is live. Send a POST request with { \"text\": \"...\" } to use it.",
  });
});

// --------------- Process POST ---------------
app.post("/api/process", async (req, res) => {
  try {
    const text = (req.body?.text ?? "").trim();
    if (!text) {
      res.json({ masked: "", count: 0, improved: "No input provided" });
      return;
    }

    // --- PII masking ---
    const matches = [];
    const ranges = [];

    for (const rule of RULES) {
      rule.pattern.lastIndex = 0;
      let match;
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
    const typeCounters = {};
    for (const m of matches) {
      typeCounters[m.category] = (typeCounters[m.category] || 0) + 1;
      m.index = typeCounters[m.category];
    }

    let currentText = text;
    for (const m of [...matches].reverse()) {
      const placeholder = `[${m.category}_${m.index}]`;
      currentText = currentText.slice(0, m.start) + placeholder + currentText.slice(m.end);
    }

    // --- Nvidia API Key ---
    const nvidiaApiKey = req.headers["x-nvidia-api-key"] || req.body.apiKey || process.env.NVIDIA_API_KEY;

    if (!nvidiaApiKey) {
      res.json({
        masked: currentText,
        count: matches.length,
        improved: "⚠️ Nvidia Nemotron API key not configured. Please enter your API key in Settings or set the NVIDIA_API_KEY environment variable on Vercel to receive the AI response.",
      });
      return;
    }

    // --- Call Nvidia NIM ---
    const prompt = `Task: Provide a helpful, intelligent response to the following prompt.\nConstraint 1: You MUST PRESERVE all placeholders like [EMAIL_1], [PHONE_1], [API_KEY_1], etc. exactly format-wise.\nConstraint 2: Do NOT provide conversational preamble. Output a direct, seamless reply.\n\nPrompt:\n${currentText}`;

    const modelName = process.env.NVIDIA_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";

    const requestBody = JSON.stringify({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      top_p: 0.95,
      max_tokens: 4096,
      extra_body: {
        chat_template_kwargs: { enable_thinking: true },
        reasoning_budget: 1024
      }
    });

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${nvidiaApiKey}`,
      "Content-Length": Buffer.byteLength(requestBody)
    };

    const apiResponse = await makeRequest("https://integrate.api.nvidia.com/v1/chat/completions", headers, requestBody);

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

    const resData = await apiResponse.json();
    const aiText = resData.choices?.[0]?.message?.content || "";

    // --- Reverse Remapping ---
    let restoredText = aiText;
    const placeholderMap = {};
    for (const m of matches) {
      placeholderMap[`[${m.category}_${m.index}]`] = m.value;
    }
    for (const [placeholder, originalValue] of Object.entries(placeholderMap)) {
      restoredText = restoredText.replaceAll(placeholder, originalValue);
    }

    res.json({
      masked: currentText,
      count: matches.length,
      improved: restoredText,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || "An unexpected error occurred during AI processing.",
    });
  }
});

module.exports = app;
