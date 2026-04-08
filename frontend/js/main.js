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

    let lastOutput = "";

    // 3. API URL Definition
    const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:8000"
        : "https://your-backend.onrender.com";

    // 4. Real-Time Detection
    if (input && detectionPanel) {
        input.addEventListener("input", () => {
            const text = input.value;
            const emailMatches = text.match(/[\w.-]+@[\w.-]+/g) || [];
            const phoneMatches = text.match(/\d{10}/g) || [];
            const count = emailMatches.length + phoneMatches.length;
            
            detectionPanel.innerText = `${count} sensitive items detected`;
            
            // Optional: Preserve risk bar visuals if elements exist
            const riskBar = document.getElementById("riskBar");
            const riskLabel = document.getElementById("riskLabel");
            if (riskBar && riskLabel) {
                if (count === 0) {
                    riskBar.style.width = "15%";
                    riskBar.style.background = "#22c55e";
                    riskLabel.innerText = "IDLE";
                } else if (count === 1) {
                    riskBar.style.width = "45%";
                    riskBar.style.background = "#facc15";
                    riskLabel.innerText = "ELEVATED_RISK";
                } else {
                    riskBar.style.width = "85%";
                    riskBar.style.background = "#ef4444";
                    riskLabel.innerText = "CRITICAL_RISK";
                }
            }
        });
    }

    // 5. Button Click Logic
    if (btn && input && finalOutput && maskedOutput) {
        btn.onclick = async () => {
            const text = input.value;

            if (!text.trim()) {
                finalOutput.innerText = "⚠️ Please enter some data.";
                return;
            }

            btn.disabled = true;
            try {
                // Fake AI States (Text only, preserving UI lock)
                finalOutput.innerText = "Analyzing...";
                await delay(400);

                finalOutput.innerText = "Masking sensitive data...";
                await delay(400);

                finalOutput.innerText = "Generating secure output...";
                await delay(400);

                // API Call
                const res = await fetch(`${API_URL}/process`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text })
                });

                if (!res.ok) throw new Error("API Failure");

                const data = await res.json();

                // Update UI (existing elements only)
                maskedOutput.innerText = data.masked;

                const improvedText = `Your data has been secured and optimized:\n\n• ${data.count} sensitive items masked\n• Structure improved for clarity\n• Safe for external sharing\n\n${data.masked}`;

                finalOutput.innerText = improvedText;
                detectionPanel.innerText = `${data.count} sensitive items detected`;
                lastOutput = improvedText;

            } catch (err) {
                console.error(err);
                finalOutput.innerText = "⚠️ Something went wrong. Try again.";
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
            finalOutput.innerText = "✅ Copied to clipboard";

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
