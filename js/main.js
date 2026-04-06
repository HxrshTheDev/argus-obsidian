// ARGUS OBSIDIAN - Main JavaScript

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

        // Randomized duration matching framer-motion: 20 + Math.random() * 10
        const duration = 20 + Math.random() * 10;
        // Negative delay so paths start at different phases
        const delay = Math.random() * -30;
        path.style.animation = `floatingPath ${duration}s linear ${delay}s infinite`;

        svg.appendChild(path);
    }

    container.appendChild(svg);
    
    // Add Intersection Observer to pause/play animations when in view
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
            // Staggered delay matching framer-motion: wordIndex * 0.1 + letterIndex * 0.03
            letterSpan.style.animationDelay = `${wordIndex * 0.1 + letterIndex * 0.03}s`;
            letterSpan.textContent = letter;
            wordSpan.appendChild(letterSpan);
        });

        titleEl.appendChild(wordSpan);
    });
}
// Initialize DOM elements
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Background Paths animation
  generateFloatingPaths('paths-pos1', 1);
  generateFloatingPaths('paths-neg1', -1);
  animateHeroTitle();

  const input = document.getElementById("userInput");
  const btn = document.getElementById("processBtn");
  const statusBadge = document.getElementById("statusBadge");

  if (btn && input) {
    btn.onclick = async () => {
      const text = input.value;
      if (!text.trim()) return;

      btn.disabled = true;
      btn.innerHTML = '<span class="animate-spin mr-2">⏳</span> SECURING...';

      let emailCount = 0;
      let phoneCount = 0;

      const masked = text
        .replace(/[\w.-]+@[\w.-]+/g, () => {
          emailCount++;
          return `[EMAIL_${emailCount}]`;
        })
        .replace(/\d{10}/g, () => {
          phoneCount++;
          return `[PHONE_${phoneCount}]`;
        });

      const total = emailCount + phoneCount;

      // Update UI panels with professional states
      const updateUI = (state) => {
          if (state === 'analyzing') {
              statusBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-yellow-400 animate-pulse mr-2"></span>ANALYZING';
              statusBadge.className = "flex items-center px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-400 text-[10px] font-bold tracking-widest";
          } else if (state === 'complete') {
              statusBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-cyan-400 mr-2"></span>SECURE';
              statusBadge.className = "flex items-center px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-400 text-[10px] font-bold tracking-widest";
          }
      };

      document.getElementById("detectionPanel").innerText =
        `${total} sensitive items detected`;

      // Risk bar logic
      const riskBar = document.getElementById("riskBar");
      const riskLabel = document.getElementById("riskLabel");
      
      if (total === 0) {
        riskBar.style.width = "15%";
        riskBar.style.background = "#22c55e";
        if (riskLabel) riskLabel.innerText = "LOW RISK";
      } else if (total === 1) {
        riskBar.style.width = "45%";
        riskBar.style.background = "#facc15";
        if (riskLabel) riskLabel.innerText = "MEDIUM RISK";
      } else {
        riskBar.style.width = "85%";
        riskBar.style.background = "#ef4444";
        if (riskLabel) riskLabel.innerText = "HIGH RISK";
      }

      const output = document.getElementById("finalOutput");
      const maskedOutput = document.getElementById("maskedOutput");

      // Professional Simulation Sequence
      updateUI('analyzing');
      maskedOutput.innerHTML = '<span class="animate-pulse">Intercepting data stream...</span>';
      await new Promise(r => setTimeout(r, 600));

      maskedOutput.innerText = masked;
      output.innerHTML = '<span class="animate-pulse">Generating improved version...</span>';
      await new Promise(r => setTimeout(r, 800));

      updateUI('complete');
      output.innerText =
        "Please provide a concise, structured response while preserving privacy constraints: " + masked;
      
      btn.disabled = false;
      btn.innerText = 'SECURE & IMPROVE';
    };
  }

  // Smooth scroll for navigation links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && document.querySelector(href)) {
        e.preventDefault();
        document.querySelector(href).scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // Get Started buttons event handler
  document.querySelectorAll('button').forEach(btn => {
    if (btn.textContent.includes('Get Started') || btn.textContent.includes('Start Securing') || btn.textContent.includes('See How It Works')) {
      btn.addEventListener('click', () => {
        const demoSection = document.getElementById('demo');
        if (demoSection) {
          demoSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  });
});
