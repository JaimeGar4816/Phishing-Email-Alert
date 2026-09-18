// Phishing Email Alert - Popup Script

document.addEventListener('DOMContentLoaded', () => {
  const statusDiv = document.getElementById('status');
  const linksContainer = document.getElementById('links-container');

  // Settings link
  document.getElementById('settingsLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  // Retrieve threat data from storage
  chrome.storage.local.get(['flaggedLinks', 'urgentLanguageFound', 'suspiciousFormsFound'], (result) => {
    console.log('Popup retrieving storage:', result);
    const flaggedLinks = result.flaggedLinks || [];
    const urgentLanguageFound = result.urgentLanguageFound || false;
    const suspiciousFormsFound = result.suspiciousFormsFound || false;
    console.log(`Popup data: links=${flaggedLinks.length}, urgent=${urgentLanguageFound}, forms=${suspiciousFormsFound}`);

    if (flaggedLinks.length === 0 && !urgentLanguageFound && !suspiciousFormsFound) {
      // No suspicious content found
      statusDiv.className = 'status safe';
      statusDiv.innerHTML = '✓ No phishing indicators detected';

      linksContainer.innerHTML = `
        <div class="empty-state">
          
          <p>This email looks clean!</p>
          <p style="font-size: 12px; color: #999;">Scans for suspicious links, urgent language, and credential-stealing forms.</p>
        </div>
      `;
    } else {
      // Suspicious content found
      statusDiv.className = 'status danger';
      let threatCount = flaggedLinks.length;
      if (urgentLanguageFound) threatCount++;
      if (suspiciousFormsFound) threatCount++;
      
      statusDiv.innerHTML = `Found ${threatCount} phishing indicator${threatCount > 1 ? 's' : ''}`;

      let contentHTML = '';

      // Show flagged links
      if (flaggedLinks.length > 0) {
        contentHTML += flaggedLinks.map((link, index) => {
          let reason = "Suspicious URL pattern detected";
          
          if (link.displayText.toLowerCase().includes('paypal') && !link.actualURL.includes('paypal.com')) {
            reason = "Claims to be PayPal but domain is different";
          } else if (link.displayText.toLowerCase().includes('amazon') && !link.actualURL.includes('amazon.com')) {
            reason = "Claims to be Amazon but domain is different";
          } else if (link.displayText.toLowerCase().includes('google') && !link.actualURL.includes('google.com')) {
            reason = "Claims to be Google but domain is different";
          } else if (/^\d+\.\d+\.\d+\.\d+/.test(new URL(link.actualURL).hostname)) {
            reason = "Using IP address instead of domain";
          } else if (['bit.ly', 'tinyurl.com', 'goo.gl'].some(s => link.actualURL.includes(s))) {
            reason = "Uses URL shortener (hides destination)";
          }

          return `
            <div class="flagged-link">
              <div class="link-display">Link #${index + 1}: "${link.displayText}"</div>
              <div class="link-actual">Actually goes to: ${link.actualURL}</div>
              <div class="detection-reason">Why flagged: ${reason}</div>
              <div class="link-time">Detected: ${link.timestamp}</div>
            </div>
          `;
        }).join('');
      }

      // Show urgent language warning
      if (urgentLanguageFound) {
        contentHTML += `
          <div class="flagged-link" style="border-left-color: #ff9800; background: #fff3e0;">
            <div class="link-display" style="color: #e65100;">Urgent/Threatening Language</div>
            <div style="font-size: 12px; color: #e65100; margin-top: 6px;">
              This email uses phrases designed to create panic like "update payment", "data will be deleted", "final reminder", or "account suspended".
            </div>
            <div class="detection-reason" style="border-left-color: #ff9800; color: #e65100;">Tactic: False urgency to trick you into action</div>
          </div>
        `;
      }

      // Show suspicious form warning
      if (suspiciousFormsFound) {
        contentHTML += `
          <div class="flagged-link" style="border-left-color: #d32f2f;">
            <div class="link-display">Password Form Detected</div>
            <div style="font-size: 12px; color: #d32f2f; margin-top: 6px;">
              This email contains a form requesting password or sensitive information.
            </div>
            <div class="detection-reason">Never enter passwords or personal data in email forms</div>
          </div>
        `;
      }

      linksContainer.innerHTML = contentHTML;

      // Add warning message
      const warning = document.createElement('div');
      warning.style.cssText = 'background: #fff3e0; padding: 10px; border-radius: 4px; margin-top: 15px; font-size: 12px; color: #e65100; border: 1px solid #ffe0b2;';
      warning.innerHTML = '<strong>Warning:</strong> This email shows phishing signs. Do NOT click links or enter personal information.';
      linksContainer.appendChild(warning);
    }
  });
});
