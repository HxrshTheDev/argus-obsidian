// ARGUS OBSIDIAN - Main JavaScript

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
   * Analyze input and generate protected output
   */
  function analyzeAndSecure() {
    const text = inputBuffer.value;
    
    if (!text.trim()) {
      alert('Please enter some text to secure');
      return;
    }

    // Disable button during processing
    secureBtn.disabled = true;
    secureBtn.textContent = 'Processing...';

    // Simulate processing delay
    setTimeout(() => {
      const findings = detectSensitiveData(text);
      let maskedText = text;

      // Replace sensitive data with placeholders
      findings.forEach(finding => {
        maskedText = maskedText.replace(
          new RegExp(escapeRegex(finding.value), 'g'),
          `[${finding.type.toUpperCase()}]`
        );
      });

      // Update protected output
      protectedOutput.innerHTML = `
        <p class="font-body text-sm text-white/80">
          <strong>Masked Output:</strong><br/>
          <code class="text-white/60 break-words">${maskedText}</code>
        </p>
      `;

      // Re-enable button
      secureBtn.disabled = false;
      secureBtn.textContent = 'Secure & Improve';
    }, 800);
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
