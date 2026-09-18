// Phishing Email Alert - Content Script
// This runs on Gmail, Outlook, Yahoo Mail, etc.

const flaggedLinks = [];

// List of commonly impersonated brands - still checked, but not required
const impersonatedBrands = {
  'paypal': ['paypal.com'],
  'amazon': ['amazon.com'],
  'apple': ['apple.com'],
  'microsoft': ['microsoft.com'],
  'google': ['google.com'],
  'facebook': ['facebook.com'],
  'netflix': ['netflix.com'],
  'linkedin': ['linkedin.com'],
  'instagram': ['instagram.com'],
  'twitter': ['twitter.com'],
  'uber': ['uber.com'],
  'airbnb': ['airbnb.com'],
  'dropbox': ['dropbox.com']
};

// Common free email providers (shouldn't be used for business/official emails)
const freeEmailProviders = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
  'mail.com', 'protonmail.com', 'tempmail.com', 'guerrillamail.com'
];

// Function to check if a domain looks legitimately structured
function isLegitimatelyStructuredDomain(domain) {
  if (!domain) return false;
  
  // Remove www and protocol
  const cleanDomain = domain.replace(/^www\./, '').replace(/^https?:\/\//, '');
  
  // Check if it's obviously fake
  // Too many dashes, underscores, or numbers mixed with incomplete words
  const dashCount = (cleanDomain.match(/-/g) || []).length;
  const underscoreCount = (cleanDomain.match(/_/g) || []).length;
  
  // More than 2 dashes or underscores is suspicious
  if (dashCount > 2 || underscoreCount > 2) {
    return false;
  }
  
  // Check if domain parts have actual words (not just random chars)
  const parts = cleanDomain.split('.');
  for (let part of parts) {
    // Each part should be at least 2 chars and mostly letters
    if (part.length < 2) return false;
    const letterRatio = (part.match(/[a-z]/gi) || []).length / part.length;
    if (letterRatio < 0.6) return false; // Less than 60% letters = suspicious
  }
  
  return true;
}

// Function to detect typosquatting attempts
function detectTyposquatting(displayDomain, actualDomain) {
  if (!displayDomain || !actualDomain) return false;
  
  const display = displayDomain.toLowerCase().replace(/^www\./, '');
  const actual = actualDomain.toLowerCase().replace(/^www\./, '');
  
  // If they're the same, not typosquatting
  if (display === actual) return false;
  
  // Extract the main domain parts
  const displayParts = display.split('.').slice(0, -1).join(''); // Remove TLD
  const actualParts = actual.split('.').slice(0, -1).join('');
  
  // Check edit distance (simple: count character differences)
  let differences = 0;
  const maxLen = Math.max(displayParts.length, actualParts.length);
  
  for (let i = 0; i < maxLen; i++) {
    if ((displayParts[i] || '') !== (actualParts[i] || '')) {
      differences++;
    }
  }
  
  // If only 1-2 character differences in a domain name, it's likely typosquatting
  // e.g., paypa1 vs paypal, amaz0n vs amazon
  if (differences <= 2 && maxLen > 4) {
    return true;
  }
  
  return false;
}

// Function to check if a domain looks like it's impersonating a known brand
function detectBrandImpersonation(domain) {
  if (!domain) return null;
  
  const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
  
  // Check against known brand patterns
  for (let [brand, officialDomains] of Object.entries(impersonatedBrands)) {
    // Exact match check
    if (cleanDomain.includes(brand)) {
      // But doesn't match an official domain
      if (!officialDomains.some(official => cleanDomain.includes(official))) {
        console.log(`FLAGGED: Brand impersonation - domain contains brand name "${brand}"`);
        return brand;
      }
    }
    
    // Typosquatted brand check - check for common character swaps
    // Amazon -> Amaz0n, AmazOn, etc.
    const typosquatVariants = [
      brand.replace(/a/g, '0'),  // amazon -> 0m0z0n
      brand.replace(/o/g, '0'),  // amazon -> amaz0n
      brand.replace(/i/g, '1'),  // linkedin -> l1nkedin
      brand.replace(/e/g, '3'),  // netflix -> n3tflix
      brand.replace(/s/g, '5'),  // paypass -> paypa55
      brand.replace(/l/g, '1'),  // paypal -> paypa1
      brand.replace(/o/g, '0').replace(/a/g, '0'),  // amazon -> 0m0z0n
    ];
    
    for (let variant of typosquatVariants) {
      if (cleanDomain.includes(variant) && !officialDomains.some(official => cleanDomain.includes(official))) {
        console.log(`FLAGGED: Typosquatting detected - "${variant}" in domain "${cleanDomain}" (brand: ${brand})`);
        return brand;
      }
    }
  }
  
  return null;
}

// Function to check if sender is using a free email provider for business
function isSuspiciousSenderDomain(senderEmail) {
  if (!senderEmail) return false;
  
  const domain = senderEmail.split('@')[1]?.toLowerCase();
  
  // If using free email provider, it's more suspicious
  if (freeEmailProviders.includes(domain)) {
    return true;
  }
  
  return false;
}

function isFromLegitimateCompany(senderEmail) {
  if (!senderEmail) {
    console.log('No sender email to check');
    return false;
  }
  
  const senderDomain = senderEmail.split('@')[1]?.toLowerCase();
  console.log(`Checking sender domain: ${senderDomain}`);
  
  // Red flag: Using free email provider for what looks like a business email
  if (isSuspiciousSenderDomain(senderEmail)) {
    console.log(`Warning: Using free email provider "${senderDomain}" - may be spoofed`);
    return false;
  }
  
  // Check if domain is legitimately structured
  if (!isLegitimatelyStructuredDomain(senderDomain)) {
    console.log(`Domain "${senderDomain}" has suspicious structure`);
    return false;
  }
  
  // Check for brand impersonation
  const impersonatedBrand = detectBrandImpersonation(senderDomain);
  if (impersonatedBrand) {
    console.log(`Domain "${senderDomain}" appears to impersonate "${impersonatedBrand}"`);
    return false;
  }
  
  console.log(`Domain "${senderDomain}" appears legitimate based on structure and patterns`);
  return true;
}

// Function to get sender email from Gmail - looks for the From header specifically
function getSenderEmail() {
  try {
    // Method 1: Look in the email header container - Gmail puts sender info in specific places
    // Look for spans that contain sender info (usually near "From:" text)
    const headerInfo = document.querySelector('.gH');
    if (headerInfo) {
      const emails = headerInfo.innerText.match(/[\w\.-]+@[\w\.-]+\.\w+/g);
      if (emails && emails.length > 0) {
        // Return the first email found (should be the sender, not recipient)
        const senderEmail = emails[0];
        console.log(`Found sender email from header: ${senderEmail}`);
        return senderEmail;
      }
    }
    
    // Method 2: Look for aria-label with "from" which Gmail uses
    const fromElement = document.querySelector('[aria-label*="from"]');
    if (fromElement) {
      const email = fromElement.getAttribute('aria-label');
      const emailMatch = email.match(/[\w\.-]+@[\w\.-]+\.\w+/);
      if (emailMatch) {
        console.log(`Found sender email from aria-label: ${emailMatch[0]}`);
        return emailMatch[0];
      }
    }
    
    console.log('No sender email found in header');
    return null;
  } catch (e) {
    console.log('Error getting sender email:', e.message);
    return null;
  }
}

// Extract the main domain from a URL or domain string
function extractMainDomain(urlOrDomain) {
  try {
    // Don't treat pure numbers as domains (e.g., "$0.39" should not be a domain)
    if (/^\d+(\.\d+)*$/.test(urlOrDomain)) {
      return '';
    }
    
    // If it's just a domain name without protocol, add https
    let urlString = urlOrDomain.includes('://') ? urlOrDomain : 'https://' + urlOrDomain;
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    
    // Remove www. if present
    const withoutWww = hostname.replace(/^www\./, '');
    
    // Split by dots and get the last 2 parts (domain.tld)
    const parts = withoutWww.split('.');
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    return withoutWww;
  } catch (e) {
    return '';
  }
}

// Function to check if a URL looks suspicious
function isSuspiciousURL(actualURL, displayText) {
  try {
    const urlObj = new URL(actualURL);
    const actualDomain = urlObj.hostname.toLowerCase();
    const displayLower = displayText.toLowerCase().trim();

    console.log(`Checking link - Display: "${displayText}" | URL: ${actualDomain}`);

    // Early check: Brand impersonation detection
    const impersonatedBrand = detectBrandImpersonation(actualDomain);
    if (impersonatedBrand) {
      console.log(`FLAGGED: Domain appears to impersonate "${impersonatedBrand}" brand`);
      return true;
    }

    // Early check: Typosquatting detection
    // If display text looks like a domain, check for typosquatting
    const displayDomainMatch = displayText.match(/([a-z0-9-]+\.[a-z0-9-.]+)/i);
    if (displayDomainMatch) {
      const displayDomain = displayDomainMatch[1].toLowerCase();
      if (/[a-z]/i.test(displayDomain)) { // Must contain letters, not just numbers
        if (detectTyposquatting(displayDomain, actualDomain)) {
          console.log(`FLAGGED: Typosquatting detected - "${displayDomain}" vs "${actualDomain}"`);
          return true;
        }
      }
    }

    // Rule 1: If display text contains a company name, check if actual domain is EXACTLY that company
    // Look for known company names and their official domains
    const knownCompanies = {
      'paypal': ['paypal.com'],
      'amazon': ['amazon.com'],
      'google': ['google.com'],
      'microsoft': ['microsoft.com'],
      'apple': ['apple.com'],
      'facebook': ['facebook.com'],
      'twitter': ['twitter.com'],
      'linkedin': ['linkedin.com'],
      'netflix': ['netflix.com']
    };
    
    for (let [company, officialDomains] of Object.entries(knownCompanies)) {
      if (displayLower.includes(company)) {
        // Check if actual domain is one of the official domains
        let isOfficial = false;
        for (let official of officialDomains) {
          if (actualDomain === official || actualDomain.endsWith('.' + official)) {
            isOfficial = true;
            break;
          }
        }
        if (!isOfficial) {
          console.log(`FLAGGED: Display mentions "${company}" but domain is ${actualDomain} (not official)`);
          return true;
        }
      }
    }

    // Rule 2: Check for IP addresses instead of normal domains
    if (/^\d+\.\d+\.\d+\.\d+/.test(actualDomain)) {
      console.log(`FLAGGED: Using IP address instead of domain`);
      return true;
    }

    // Rule 3: Check if display text looks like a domain but doesn't match
    const domainMatchInRule3 = displayText.match(/([a-z0-9-]+\.[a-z0-9-.]+)/i);
    if (domainMatchInRule3) {
      const displayDomain = domainMatchInRule3[1].toLowerCase();
      
      // Only treat it as a domain if it contains at least one letter (not just numbers like prices)
      if (!/[a-z]/i.test(displayDomain)) {
        console.log(`Skipping pure-number match: "${displayDomain}"`);
      } else {
        // Extract main domains for proper comparison
        // This prevents www.thisisfakegoogle.com from being treated as google.com
        const displayMainDomain = extractMainDomain(displayDomain);
        const actualMainDomain = extractMainDomain(actualDomain);
        
        console.log(`Comparing domains - Display main: "${displayMainDomain}" vs Actual main: "${actualMainDomain}"`);
        
        // If display domain and actual domain don't match exactly, flag it
        if (displayMainDomain !== actualMainDomain && displayMainDomain && actualMainDomain) {
          console.log(`FLAGGED: Display domain "${displayDomain}" doesn't match actual domain "${actualDomain}"`);
          return true;
        }
        
        // Check for homograph attacks (0 vs O, 1 vs l, etc)
        const normalized = displayMainDomain.replace(/[0o]/g, '0').replace(/[1l]/g, '1');
        const actualNormalized = actualMainDomain.replace(/[0o]/g, '0').replace(/[1l]/g, '1');
        if (normalized !== actualNormalized && displayMainDomain.length > 3) {
          console.log(`FLAGGED: Possible homograph attack - "${displayDomain}" vs "${actualDomain}"`);
          return true;
        }
      }
    }

    // Rule 4: Check for URL shorteners (common in phishing)
    const shortenerDomains = ['bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 'short.url', 'is.gd', 'buff.ly', 'adf.ly', 't.co'];
    if (shortenerDomains.some(shortener => actualDomain.includes(shortener))) {
      console.log(`FLAGGED: Using URL shortener - ${actualDomain}`);
      return true;
    }

    // Rule 5: Check for suspicious subdomains (admin, verify, confirm, login, etc)
    const suspiciousSubdomains = ['admin', 'verify', 'confirm', 'update', 'login', 'signin', 'secure', 'account', 'validate', 'compliance', 'urgent', 'action-required'];
    const parts = actualDomain.split('.');
    if (parts.length > 2) {
      const subdomain = parts[0].toLowerCase();
      if (suspiciousSubdomains.some(sus => subdomain.includes(sus))) {
        console.log(`FLAGGED: Suspicious subdomain - ${subdomain} in ${actualDomain}`);
        return true;
      }
    }

    // Rule 6: Check for international domain names (IDN) that look like real companies
    if (actualDomain.includes('xn--')) {
      console.log(`FLAGGED: International domain name (IDN) detected - possible homograph attack`);
      return true;
    }

    console.log(`OK: Link looks legitimate`);
    return false;
  } catch (e) {
    console.log(`ERROR checking URL: ${e.message}`);
    return true;
  }
}

// Function to find and flag suspicious links
function scanEmailForPhishing() {
  flaggedLinks.length = 0; // Clear previous findings - prevents duplicates from multiple scans

  // Check if this email is from a legitimate company
  const senderEmail = getSenderEmail();
  const isLegit = isFromLegitimateCompany(senderEmail);
  
  console.log(`Sender: ${senderEmail}, Is legitimate company: ${isLegit}`);
  
  // If from legitimate company, don't flag URL patterns (they often have tracking URLs)
  if (isLegit) {
    console.log(`Email from legitimate company (${senderEmail}) - skipping URL pattern checks`);
    return;
  }

  // Get all traditional links from main page
  let allLinks = Array.from(document.querySelectorAll('a'));
  
  // Also scan inside Gmail's .a3s email body container
  const emailBodyContainer = document.querySelector('.a3s');
  if (emailBodyContainer) {
    console.log('Found Gmail email body container (.a3s)');
    const emailBodyLinks = Array.from(emailBodyContainer.querySelectorAll('a'));
    console.log(`Found ${emailBodyLinks.length} links inside email body`);
    allLinks = allLinks.concat(emailBodyLinks);
  }

  allLinks.forEach((link) => {
    const href = link.getAttribute('href');
    const displayText = link.textContent.trim();

    // Skip empty links or certain types
    if (!href || !displayText || href.startsWith('#') || href.startsWith('javascript:')) {
      return;
    }

    // Skip mailto and tel links
    if (href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    if (isSuspiciousURL(href, displayText)) {
      flaggedLinks.push({
        displayText: displayText,
        actualURL: href,
        timestamp: new Date().toLocaleTimeString()
      });

      // Highlight the suspicious link
      link.style.border = '2px solid #d32f2f';
      link.style.backgroundColor = '#ffebee';
      link.title = `Warning: Link text says "${displayText}" but goes to ${new URL(href).hostname}`;
    }
  });

  // Also check clickable blocks (divs, spans, buttons that might act as links)
  const clickableElements = document.querySelectorAll('[onclick], [data-url], button[data-href]');
  
  clickableElements.forEach((element) => {
    let url = element.getAttribute('data-url') || element.getAttribute('data-href');
    
    // Try to extract URL from onclick attribute
    if (!url && element.getAttribute('onclick')) {
      const onclickMatch = element.getAttribute('onclick').match(/(?:window\.location|location\.href)\s*=\s*['"](.*?)['"]/);
      if (onclickMatch) {
        url = onclickMatch[1];
      }
    }

    if (!url) return;

    const displayText = element.textContent.trim();
    if (!displayText) return;

    try {
      // Make URL absolute if it's relative
      const absoluteURL = new URL(url, window.location.href).href;
      
      if (isSuspiciousURL(absoluteURL, displayText)) {
        flaggedLinks.push({
          displayText: displayText,
          actualURL: absoluteURL,
          timestamp: new Date().toLocaleTimeString()
        });

        // Highlight the suspicious link/button with prominent red warning styling
        element.style.border = '3px solid #d32f2f';
        element.style.outline = '2px solid #c62828';
        element.style.backgroundColor = '#ffcdd2';
        element.style.boxShadow = '0 0 10px rgba(211, 47, 47, 0.5), inset 0 0 5px rgba(211, 47, 47, 0.3)';
        element.style.cursor = 'not-allowed';
        element.style.pointerEvents = 'none';
        element.style.opacity = '0.8';
        element.title = `PHISHING WARNING: Link text says "${displayText}" but actually goes to ${new URL(absoluteURL).hostname}`;
        
        // Add visual warning indicator
        if (element.tagName === 'A') {
          element.textContent = '[FLAGGED] ' + displayText + ' (PHISHING)';
          element.style.fontWeight = 'bold';
          element.style.color = '#c62828';
        }
      }
    } catch (e) {
      // Invalid URL, skip
    }
  });

  // Store flagged links for popup to access
  chrome.storage.local.set({ flaggedLinks: flaggedLinks });
}

// Function to detect credential-stealing forms in emails
function checkForSuspiciousForms() {
  const forms = document.querySelectorAll('form');
  let suspiciousFormCount = 0;

  forms.forEach((form) => {
    const inputs = form.querySelectorAll('input[type="password"], input[name*="password"], input[name*="pwd"]');
    if (inputs.length > 0) {
      // Check if this looks like a legitimate password form or a phishing form
      const formAction = form.getAttribute('action') || '';
      const formMethod = form.getAttribute('method') || '';
      
      // If form doesn't have action or has suspicious action, flag it
      if (!formAction || formAction.startsWith('#') || formAction.startsWith('javascript:')) {
        console.log(`FLAGGED: Suspicious form requesting password input`);
        suspiciousFormCount++;
        
        // Highlight suspicious form with prominent red warning styling
        form.style.border = '4px solid #d32f2f';
        form.style.outline = '2px solid #c62828';
        form.style.backgroundColor = '#ffcdd2';
        form.style.boxShadow = '0 0 15px rgba(211, 47, 47, 0.6), inset 0 0 8px rgba(211, 47, 47, 0.3)';
        form.style.padding = '15px';
        form.title = 'PHISHING WARNING: This form is requesting a password but has no legitimate destination!';
        
        // Highlight password inputs inside the form
        const passwordInputs = form.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
          input.style.border = '2px solid #c62828';
          input.style.backgroundColor = '#ffe6e6';
          input.style.color = '#b71c1c';
          input.disabled = true;
        });
      }
    }
  });

  return suspiciousFormCount;
}

// Function to detect urgent/threatening language patterns
function checkForUrgentLanguage() {
  // Try to get email body from Gmail containers
  let emailBody = '';
  
  // Method 1: Look for Gmail's email body container (a3s class)
  const gmailBody = document.querySelector('.a3s');
  if (gmailBody) {
    emailBody = gmailBody.innerText;
  }
  
  // Method 2: Look for any large text container if Gmail method didn't work
  if (!emailBody || emailBody.length < 100) {
    const textContainers = document.querySelectorAll('[role="article"], .message-body, .email-content, [data-message-id]');
    for (let container of textContainers) {
      const text = container.innerText;
      if (text && text.length > emailBody.length) {
        emailBody = text;
      }
    }
  }
  
  // Method 3: Fallback to body if still not found
  if (!emailBody || emailBody.length < 50) {
    emailBody = document.body.innerText;
  }
  
  const emailBodyLower = emailBody.toLowerCase();
  console.log(`Checking for urgent language in email body length: ${emailBody.length}`);
  
  const urgentPhrases = [
    'verify your account',
    'confirm your identity',
    'update payment',
    'unusual activity',
    'urgent action required',
    'immediate action',
    'account suspended',
    'locked account',
    'click here immediately',
    'password has expired',
    're-activate',
    'click below to confirm',
    'validate your information',
    'payment method has expired',
    'data will be deleted',
    'final reminder',
    'at risk',
    'action required',
    'update your',
    'confirm your',
    'verify your',
    'secure my data',
    'secure your account',
    'prevent data loss',
    'account has been compromised',
    'compromised',
    'immediately before'
  ];

  let foundPhrases = [];
  urgentPhrases.forEach(phrase => {
    if (emailBodyLower.includes(phrase)) {
      foundPhrases.push(phrase);
      console.log(`FOUND: "${phrase}"`);
    }
  });

  console.log(`Total phrases found: ${foundPhrases.length}`);
  console.log(`Phrases: ${foundPhrases.join(', ')}`);

  // Flag if found 2 or more urgent phrases OR if found specific high-risk phrases
  const highRiskPhrases = ['data will be deleted', 'account suspended', 'locked account', 'payment method has expired', 'compromised', 'account has been compromised'];
  const hasHighRisk = highRiskPhrases.some(phrase => emailBodyLower.includes(phrase));

  console.log(`Has high risk phrases: ${hasHighRisk}`);

  if (foundPhrases.length > 1 || hasHighRisk) {
    console.log(`WARNING: Email contains phishing language: ${foundPhrases.join(', ')}`);
    return true;
  }
  
  console.log(`No urgent language detected`);
  return false;
}

// Scan on page load with delay to let Gmail render
setTimeout(() => {
  console.log('Starting phishing scan after Gmail render...');
  scanEmailForPhishing();
  const formCount = checkForSuspiciousForms();
  const hasUrgentLanguage = checkForUrgentLanguage();

  console.log(`Scan complete - Links: ${flaggedLinks.length}, Forms: ${formCount}, Urgent: ${hasUrgentLanguage}`);

  // Deduplicate flaggedLinks by actualURL to prevent showing the same phishing link twice
  const uniqueLinks = [];
  const seenURLs = new Set();
  for (const link of flaggedLinks) {
    if (!seenURLs.has(link.actualURL)) {
      seenURLs.add(link.actualURL);
      uniqueLinks.push(link);
    }
  }

  // Single storage update with all data
  console.log(`STORING: flaggedLinks=${uniqueLinks.length} (deduplicated from ${flaggedLinks.length}), urgent=${hasUrgentLanguage}, forms=${formCount > 0}`);
  chrome.storage.local.set({
    flaggedLinks: uniqueLinks,
    urgentLanguageFound: hasUrgentLanguage,
    suspiciousFormsFound: formCount > 0,
    emailsScanned: 1,
    lastScan: new Date().toISOString()
  }, () => {
    console.log('Storage set complete, callback fired');
  });

  if (formCount > 0 || hasUrgentLanguage) {
    console.log(`ALERT: Email contains phishing indicators - forms: ${formCount}, urgent language: ${hasUrgentLanguage}`);
  }
}, 2000); // Wait 2 seconds for Gmail to fully render sender info

// Re-scan when new emails are loaded (Gmail/Outlook dynamic loading)
const observer = new MutationObserver(() => {
  scanEmailForPhishing();
  const newFormCount = checkForSuspiciousForms();
  const newHasUrgent = checkForUrgentLanguage();
  
  // Store updated results (with deduplication as backup)
  const uniqueObserverLinks = [];
  const seenObserverURLs = new Set();
  for (const link of flaggedLinks) {
    if (!seenObserverURLs.has(link.actualURL)) {
      seenObserverURLs.add(link.actualURL);
      uniqueObserverLinks.push(link);
    }
  }
  
  console.log(`OBSERVER STORING: flaggedLinks=${uniqueObserverLinks.length} (deduplicated from ${flaggedLinks.length}), urgent=${newHasUrgent}, forms=${newFormCount > 0}`);
  chrome.storage.local.set({
    flaggedLinks: uniqueObserverLinks,
    urgentLanguageFound: newHasUrgent,
    suspiciousFormsFound: newFormCount > 0
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('Phishing Email Alert: Scanning active');
