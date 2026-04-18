// ARGUS OBSIDIAN - Main JavaScript (Integrated Version)

// ============================================
// Background Paths - Floating SVG Animation
// ============================================

function generateFloatingPaths(containerId, position) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'w-full h-full');
    svg.setAttribute('viewBox', '0 0 696 316');
    svg.setAttribute('fill', 'none');
    svg.style.color = 'white';

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = 'Background Paths';
    svg.appendChild(title);

    for (let i = 0; i < 8; i++) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M-${380 - i * 5 * position} -${189 + i * 6}C-${
            380 - i * 5 * position
        } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
            152 - i * 5 * position
        } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
            684 - i * 5 * position
        } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`;

        path.setAttribute('d', d);
        path.setAttribute('stroke', 'currentColor');
        path.setAttribute('stroke-width', String(0.5 + i * 0.03));
        path.setAttribute('stroke-opacity', String(0.1 + i * 0.03));
        path.setAttribute('fill', 'none');
        path.setAttribute('class', 'floating-path');

        const duration = 20 + Math.random() * 10;
        const delayVal = Math.random() * -30;
        path.style.animation = `floatingPath ${duration}s linear ${delayVal}s infinite`;

        svg.appendChild(path);
    }

    container.appendChild(svg);
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                svg.style.display = 'block';
            } else {
                svg.style.display = 'none';
            }
        });
    }, { threshold: 0.1 });
    
    observer.observe(container);
}

// ============================================
// Hero Title - Letter-by-Letter Reveal
// ============================================

function animateHeroTitle() {
    const titleEl = document.getElementById('hero-title');
    if (!titleEl) return;

    const text = titleEl.textContent.trim();
    titleEl.innerHTML = '';

    const words = text.split(/\s+/);
    words.forEach((word, wordIndex) => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'hero-word';

        word.split('').forEach((letter, letterIndex) => {
            const letterSpan = document.createElement('span');
            letterSpan.className = 'hero-letter';
            letterSpan.style.animationDelay = `${wordIndex * 0.1 + letterIndex * 0.03}s`;
            letterSpan.textContent = letter;
            wordSpan.appendChild(letterSpan);
        });

        titleEl.appendChild(wordSpan);
    });
}

// ============================================
// DELAY FUNCTION
// ============================================
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// INITIALIZATION & LOGIC
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize UI Animations
    generateFloatingPaths('paths-pos1', 1);
    generateFloatingPaths('paths-neg1', -1);
    animateHeroTitle();

    // 2. Element Definitions
    const input = document.getElementById("userInput");
    const btn = document.getElementById("processBtn");
    const detectionPanel = document.getElementById("detectionPanel");
    const maskedOutput = document.getElementById("maskedOutput");
    const finalOutput = document.getElementById("finalOutput");

    // Initialize System States
    if (detectionPanel) detectionPanel.innerText = "SCANNER_ACTIVE_STANDBY";
    if (maskedOutput) maskedOutput.innerText = "STREAM_NOT_ESTABLISHED";
    if (finalOutput) finalOutput.innerText = "READY_FOR_AI_VERIFICATION";

    let lastOutput = "";

    
    // PII VAULT & SESSION STATE
    const piiVault = {
        mappings: {}, // Token -> OriginalValue
        counts: { email: 0, phone: 0 }
    };

    const sessionState = {
        isSafeModeActive: false,
        debounceTimer: null
    };

    // 3. API URL Definition
    const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:8000"
        : "/api"; // Routing via vercel.json rewrites


    // PII CATEGORIES & REGEX (Tiers 1-8)
    const PII_RULES = [
        { type: 'API_KEY',  regex: /\b(?:sk|pk)-[A-Za-z0-9]{20,}\b|\bpk_[A-Za-z0-9]{20,}\b/g },
        { type: 'SECRET',   regex: /\b(?:api[-]?key|token|secret)\s*[:=]\s*[A-Za-z0-9-]{10,}\b/gi },
        { type: 'TOKEN',    regex: /\b[A-Za-z0-9_-]{20,}\b/g }, // High entropy generic
        { type: 'TOKEN',    regex: /\bBearer\s+[A-Za-z0-9-._~+/]+=*\b/gi }, // Auth Header
        { type: 'PASSWORD', regex: /\b(?:password|pwd|pass)\s*[:=]\s*\S+\b/gi },
        { type: 'EMAIL',    regex: /[a-zA-Z0-9._%+-]+@[\w.-]+\.[a-zA-Z]{2,}(?!\w)/g },
        { type: 'PHONE',    regex: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|\b\d{10}\b/g },
        { type: 'ADDRESS',  regex: /\b\d{1,5}\s\w+\s(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Blvd)\b/gi },
        { type: 'ID',       regex: /\b\d{6,}\b/g },
        { type: 'NAME',     regex: /\b[A-Z][a-z]+\s[A-Z][a-z]+\b/g }
    ];

    /**
     * CORE COMPREHENSIVE MASKING ENGINE (V3)
     */
    function applyZeroClickMasking(textarea) {
        const text = textarea.value;
        const cursorStart = textarea.selectionStart;
        
        let newText = text;
        const currentMappings = {};
        const matches = [];
        const counters = {};

        // 1. Identify matches in tiered order to prevent conflicts
        // Higher priority categories match first and occupy the range
        const ranges = []; // [{start, end}]

        PII_RULES.forEach((rule) => {
            let match;
            rule.regex.lastIndex = 0; // Reset regex
            while ((match = rule.regex.exec(text)) !== null) {
                const start = match.index;
                const end = start + match[0].length;
                
                // Overlap check
                const isOverlapping = ranges.some(r => (start >= r.start && start < r.end) || (end > r.start && end <= r.end));
                
                // Name check: Heuristic to avoid common false positives like "Main Street"
                let isFalsePositive = false;
                if (rule.type === 'NAME') {
                    // Check if it overlaps with an already found Address
                    if (isOverlapping) isFalsePositive = true;
                    // Check context (e.g., lowercase preceding word suggests start-of-sentence city/etc)
                    const preceding = text.slice(0, start).trim().split(/\s+/).pop();
                    const commonCities = ["New", "San", "Los", "Santa"];
                    if (commonCities.includes(match[0].split(' ')[0])) isFalsePositive = true;
                }

                if (!isOverlapping && !isFalsePositive) {
                    ranges.push({ start, end });
                    matches.push({
                        type: rule.type,
                        value: match[0],
                        index: start
                    });
                }
            }
        });

        // 2. Sort matches by position for replacement
        matches.sort((a, b) => a.index - b.index);

        let finalCursorStart = cursorStart;
        let textShift = 0;

        matches.forEach((m) => {
            // Respect boundary/typing rules
            const isAtEnd = (m.index + m.value.length === text.length);
            const isActive = isAtEnd && (cursorStart === text.length);
            if (isActive) return;

            // Increment separate counters per type
            counters[m.type] = (counters[m.type] || 0) + 1;
            const token = `[${m.type}_${counters[m.type]}]`;
            const originalValue = m.value;
            const matchIndex = m.index + textShift;
            
            currentMappings[token] = originalValue;

            const left = newText.slice(0, matchIndex);
            const right = newText.slice(matchIndex + originalValue.length);
            
            newText = left + token + right;
            const diff = token.length - originalValue.length;
            
            if (cursorStart > m.index) finalCursorStart += diff;
            textShift += diff;
        });

        // 3. Sync if changes occurred
        if (newText !== text) {
            textarea.value = newText;
            textarea.setSelectionRange(finalCursorStart, finalCursorStart);
        }

        // 4. Update Vault
        const tokenRegex = /\[(API_KEY|TOKEN|SECRET|PASSWORD|EMAIL|PHONE|ADDRESS|ID|NAME)_\d+\]/g;
        const totalMatches = (newText.match(tokenRegex) || []).length;

        piiVault.mappings = currentMappings;
        piiVault.counts = { total: totalMatches, categories: counters };

        return { total: totalMatches, text: newText };
    }


    function updateSafeModeUI() {
        const statusBadge = document.getElementById("statusBadge");
        if (sessionState.isSafeModeActive && statusBadge) {
            statusBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse shadow-[0_0_8px_#34d399]"></span>AI_SAFE_MODE_ENABLED';
            statusBadge.className = statusBadge.className
                .replace(/bg-cyan-400\/\d+/, "bg-emerald-400/10")
                .replace(/text-cyan-400/, "text-emerald-400")
                .replace(/border-cyan-400\/\d+/, "border-emerald-400/20");
        }
    }

    // 4. Real-Time Detection Listener with Debounce
    if (input && detectionPanel) {
        input.addEventListener("input", () => {
            if (sessionState.debounceTimer) clearTimeout(sessionState.debounceTimer);
            
            sessionState.debounceTimer = setTimeout(() => {
                const result = applyZeroClickMasking(input);
                const count = result.total;
                
                detectionPanel.innerText = `${count} SENSITIVE_UNITS_SECURED`;
                
                if (maskedOutput) {
                    maskedOutput.innerText = result.text;
                    maskedOutput.className = "text-cyan-400/70 transition-all duration-300";
                }
                
                // Pulse UI if Safe Mode is active to show "Default Layer" behavior
                if (sessionState.isSafeModeActive && finalOutput) {
                    finalOutput.style.opacity = "0.7";
                    setTimeout(() => finalOutput.style.opacity = "1", 100);
                }

                // Sync risk bar visuals
                const riskBar = document.getElementById("riskBar");
                const riskLabel = document.getElementById("riskLabel");
                if (riskBar && riskLabel) {
                    if (count === 0) {
                        riskBar.style.width = "15%";
                        riskBar.style.background = "#22c55e";
                        riskLabel.innerText = "IDLE";
                    } else if (count <= 3) {
                        riskBar.style.width = "45%";
                        riskBar.style.background = "#facc15";
                        riskLabel.innerText = "ELEVATED_RISK";
                    } else {
                        riskBar.style.width = "85%";
                        riskBar.style.background = "#ef4444";
                        riskLabel.innerText = "CRITICAL_RISK";
                    }
                }
            }, 250); // 250ms Debounce
        });
    }


    // 5. Button Click Logic (Refined for Zero-Click & Safe Mode Activation)
    if (btn && input && finalOutput && maskedOutput) {
        btn.onclick = async () => {
            const text = input.value;

            if (!text.trim()) {
                finalOutput.innerText = "⚠️ Please enter some data.";
                return;
            }

            // ACTIVATE SAFE MODE ON FIRST USE
            if (!sessionState.isSafeModeActive) {
                sessionState.isSafeModeActive = true;
                updateSafeModeUI();
            }

            btn.disabled = true;
            try {
                finalOutput.innerText = "ESTABLISHING_TLS_OBSIDIAN_HANDSHAKE...";
                await delay(400);

                finalOutput.innerText = "PROTOCOL_ACTIVE_STREAM_NEUTRALIZED...";
                await delay(400);

                finalOutput.innerText = "FINALIZING_SECURE_OUTPUT...";
                
                const response = await fetch(`${API_URL}/process`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: text })
                });

                if (!response.ok) {
                    throw new Error(`API_RESPONSE_FAIL: ${response.status}`);
                }

                const data = await response.json();
                
                // Ensure we handle the response correctly
                const resultText = data.improved || data.masked || text;
                
                finalOutput.innerText = resultText;
                lastOutput = resultText;

            } catch (err) {
                console.error(err);
                finalOutput.innerText = `⚠️ SECURITY_HANDSHAKE_FAILED: ${err.message}`;
            } finally {
                btn.disabled = false;
            }
        };
    }



    // 6. Click to Copy (No button needed)
    if (finalOutput) {
        finalOutput.style.cursor = "pointer";
        finalOutput.addEventListener("click", () => {
            if (!lastOutput) return;

            navigator.clipboard.writeText(lastOutput);
            finalOutput.innerText = "STREAM_COPIED_TO_BUFFER";

            setTimeout(() => {
                finalOutput.innerText = lastOutput;
            }, 1500);

        });
    }

    // 7. Smooth Scroll Support
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                document.querySelector(href).scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});
