// ARGUS OBSIDIAN - Main JavaScript

// Same origin when UI is served by FastAPI; override for split deploy: <script>window.__ARGUS_API_BASE__ = 'https://api.example.com'</script>
const API_BASE = typeof window !== 'undefined' && window.__ARGUS_API_BASE__ != null
  ? String(window.__ARGUS_API_BASE__).replace(/\/$/, '')
  : '';

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

// Mock sensitive data patterns
const SENSITIVE_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+1|\b1)?[-.]?(\d{3})[-.]?(\d{3})[-.]?(\d{4})\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  apiKey: /[a-zA-Z0-9]{32,}/g
};

// Initialize DOM elements
document.addEventListener('DOMContentLoaded', () => {
  const inputBuffer = document.getElementById('inputBuffer');
  const secureBtn = document.getElementById('secureBtn');
  const detectionCount = document.getElementById('detectionCount');
  const detectionStatus = document.getElementById('detectionStatus');
  const privacyRisk = document.getElementById('privacyRisk');
  const privacyBar = document.getElementById('privacyBar');
  const protectedOutput = document.getElementById('protectedOutput');

  // Handle secure & improve button click
  secureBtn.addEventListener('click', () => {
    analyzeAndSecure();
  });

  // Real-time analysis as user types
  inputBuffer.addEventListener('input', () => {
    performRealTimeAnalysis();
  });

  /**
   * Perform real-time analysis of input
   */
  function performRealTimeAnalysis() {
    const text = inputBuffer.value;
    
    if (!text.trim()) {
      resetAnalysis();
      return;
    }

    const findings = detectSensitiveData(text);
    updateDetectionPanel(findings);
  }

  /**
   * Client-only mask (fallback when API unreachable)
   */
  function maskClientSide(text) {
    const findings = detectSensitiveData(text);
    let maskedText = text;
    findings.forEach(finding => {
      maskedText = maskedText.replace(
        new RegExp(escapeRegex(finding.value), 'g'),
        `[${finding.type.toUpperCase()}]`
      );
    });
    return maskedText;
  }

  function renderProtectedOutput(maskedText, restoredText, noteHtml) {
    const safeMasked = escapeHtml(maskedText);
    let body = `<p class="font-body text-sm text-white/80"><strong>Masked output:</strong><br/><code class="text-white/60 break-words">${safeMasked}</code></p>`;
    if (restoredText) {
      body += `<p class="font-body text-sm text-white/80 mt-3"><strong>Restored (after AI):</strong><br/><code class="text-primary/90 break-words">${escapeHtml(restoredText)}</code></p>`;
    }
    if (noteHtml) {
      body += noteHtml;
    }
    protectedOutput.innerHTML = body;
  }

  /**
   * Analyze input and generate protected output (Python API when available)
   */
  async function analyzeAndSecure() {
    const text = inputBuffer.value;

    if (!text.trim()) {
      alert('Please enter some text to secure');
      return;
    }

    secureBtn.disabled = true;
    secureBtn.textContent = 'Processing...';

    try {
      const res = await fetch(`${API_BASE}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      let note = '';
      if (data.llm_error) {
        note = `<p class="font-body text-xs text-yellow-400/90 mt-3">${escapeHtml(data.llm_error)}</p>`;
      }
      renderProtectedOutput(data.masked_text, data.restored_text, note);
    } catch (err) {
      console.warn('ARGUS API unavailable, using client-side mask only', err);
      const maskedText = maskClientSide(text);
      const hint = `<p class="font-body text-xs text-white/40 mt-3">Run the Python server from <code class="text-white/50">server/</code> and open the app via <code class="text-white/50">http://127.0.0.1:8000</code> for full pipeline.</p>`;
      renderProtectedOutput(maskedText, null, hint);
    }

    secureBtn.disabled = false;
    secureBtn.textContent = 'Secure & Improve';
  }

  /**
   * Detect sensitive data in text
   */
  function detectSensitiveData(text) {
    const findings = [];

    Object.entries(SENSITIVE_PATTERNS).forEach(([type, pattern]) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        findings.push({
          type: type,
          value: match[0],
          index: match.index
        });
      }
    });

    return findings;
  }

  /**
   * Update detection panel with findings
   */
  function updateDetectionPanel(findings) {
    const riskLevel = calculateRiskLevel(findings.length);

    // Update detection count
    detectionCount.textContent = `${findings.length} FOUND`;
    detectionCount.className = findings.length > 0 
      ? 'font-label text-xs text-error font-medium' 
      : 'font-label text-xs text-primary font-medium';

    // Update detection status
    if (findings.length > 0) {
      const findingsList = findings
        .map(f => `<span class="text-error">${f.type}</span>`)
        .join(', ');

      detectionStatus.innerHTML = `
        <span class="material-symbols-outlined mb-2 text-error">warning</span>
        <p class="font-body text-xs">${findings.length} sensitive items detected</p>
        <p class="font-label text-[9px] text-white/40 mt-1">${findingsList}</p>
      `;
      detectionStatus.classList.remove('opacity-40');
    } else {
      detectionStatus.innerHTML = `
        <span class="material-symbols-outlined mb-2">check_circle</span>
        <p class="font-body text-xs">No sensitive data detected</p>
      `;
      detectionStatus.classList.add('opacity-40');
    }

    // Update privacy risk indicator
    privacyRisk.textContent = riskLevel.label;
    privacyRisk.className = `font-label text-xs font-medium ${riskLevel.color}`;

    // Update privacy bar
    privacyBar.style.width = `${riskLevel.percentage}%`;
    privacyBar.className = `h-full ${riskLevel.barColor}`;
  }

  /**
   * Calculate risk level based on findings
   */
  function calculateRiskLevel(findingCount) {
    if (findingCount === 0) {
      return {
        label: 'LOW',
        color: 'text-primary',
        barColor: 'bg-primary',
        percentage: 15
      };
    } else if (findingCount <= 2) {
      return {
        label: 'MEDIUM',
        color: 'text-yellow-400',
        barColor: 'bg-yellow-400',
        percentage: 50
      };
    } else {
      return {
        label: 'HIGH',
        color: 'text-error',
        barColor: 'bg-error',
        percentage: 85
      };
    }
  }

  /**
   * Reset analysis panel
   */
  function resetAnalysis() {
    detectionCount.textContent = '0 FOUND';
    detectionCount.className = 'font-label text-xs text-error font-medium';
    
    detectionStatus.innerHTML = `
      <span class="material-symbols-outlined mb-2">check_circle</span>
      <p class="font-body text-xs">No sensitive data detected</p>
    `;
    detectionStatus.classList.add('opacity-40');

    privacyRisk.textContent = 'LOW';
    privacyRisk.className = 'font-label text-xs text-primary';

    privacyBar.style.width = '15%';
    privacyBar.className = 'h-full bg-primary';

    protectedOutput.innerHTML = '<p class="font-body text-sm text-white/40 italic">Waiting for processing...</p>';
  }

  /**
   * Escape special regex characters
   */
  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    if (btn.textContent.includes('Get Started') || btn.textContent.includes('Start Securing')) {
      btn.addEventListener('click', () => {
        console.log('Get Started clicked');
        // Add your CTA logic here
      });
    }
  });
});
