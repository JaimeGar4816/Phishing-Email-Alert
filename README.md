# Phishing Email Alert - Chrome Extension

A Chrome extension that detects and alerts users when emails contain suspicious phishing attempts. Uses multi-pattern detection to catch common phishing techniques.

## Features

### URL-Based Detection
- **Company Impersonation**: Detects when links claim to be from PayPal, Amazon, Google, etc. but go to different domains
- **Homograph Attacks**: Catches similar-looking domains (goog1e.com vs google.com, using 0/O and 1/l confusion)
- **IP Address Detection**: Flags links using IP addresses instead of domain names
- **URL Shorteners**: Alerts on bit.ly, tinyurl, goo.gl and other shorteners (commonly used to hide malicious URLs)
- **Suspicious Subdomains**: Catches admin, verify, confirm, login, secure subdomains on unknown domains
- **International Domains (IDN)**: Detects internationalized domain names that attackers use to create fake lookalikes

### Content Detection
- **Clickable Blocks**: Scans not just links, but buttons, divs, and spans with click handlers
- **Password Stealing Forms**: Detects forms requesting passwords without proper form actions
- **Urgent Language**: Flags emails with multiple phishing trigger phrases:
  - "verify your account", "confirm your identity", "update payment"
  - "unusual activity", "account suspended", "locked account"
  - "your password has expired", "immediate action required"

### Visual Indicators
- Suspicious links highlighted with red border and warning background
- Extension popup shows number of threats detected
- Console logging for debugging (F12 > Console)

## Installation

### Step 1: Save the Files

Create a folder called `phishing-alert` on your computer (Desktop or Documents):
- `manifest.json`
- `content.js`
- `popup.html`
- `popup.js`

### Step 2: Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select your `phishing-alert` folder
5. Extension is now active!

## Usage

1. Open Gmail, Outlook.com, or Yahoo Mail
2. Open any email
3. Click the extension icon in your toolbar
4. The popup shows:
   - Green checkmark if no threats detected
   - Red warning with threat details if suspicious content found
   - List of flagged links with what made them suspicious

## Testing

Send yourself test emails to verify:

**Test 1: Company Impersonation**
```
Verify your PayPal account: http://paypa1-secure.com
```

**Test 2: Urgent Language + Suspicious Link**
```
Your account has suspicious activity!
Click here to verify your identity: http://verify-account-now.com
```

**Test 3: Form Stealing**
```html
<form>
  <input type="password" placeholder="Enter your password">
  <button>Confirm</button>
</form>
```

**Test 4: Normal Link (should NOT flag)**
```
Visit Google: https://google.com
```

## Architecture

```
phishing-alert/
├── manifest.json      (Extension config, permissions)
├── content.js         (Main detection logic, runs on email pages)
├── popup.html         (UI shown when clicking extension)
├── popup.js           (Popup functionality)
└── README.md          (This file)
```

### How It Works

1. **content.js** runs when you open an email
2. Scans all links, buttons, and clickable elements
3. Checks against multiple detection patterns
4. Highlights suspicious items with red border
5. Stores results in Chrome storage
6. **popup.js** retrieves and displays results when you click the extension icon

## Console Debugging

Open Developer Tools (F12 > Console) to see:
- `Phishing Email Alert: Scanning active` - Extension is running
- `Checking link - Display: "..." | URL: domain.com` - Link being analyzed
- `FLAGGED: [reason]` - Why a link was flagged
- `OK: Link looks legitimate` - Link passed checks

## Current Limitations

- Only works on Gmail, Outlook.com, and Yahoo Mail
- Doesn't check attachment safety
- No integration with phishing database (yet)
- Can't validate DKIM/SPF headers (Gmail doesn't expose them)

## Future Phases

**Phase 2:**
- Settings page for detection sensitivity
- Whitelist/blacklist management
- Email sender verification
- Statistics dashboard

**Phase 3:**
- Integration with VirusTotal or similar APIs
- Machine learning classification
- Export suspicious emails
- Share findings with team

## Security & Privacy

- All detection happens locally in your browser
- No data is sent to external servers
- Extension only has access to email pages you view
- Chrome storage is encrypted

## Common False Positives

The extension may flag legitimate emails if:
- They use URL shorteners (some companies do)
- They mention urgent action (transactional emails)
- They have admin subdomains (if from the actual company)

These can be reduced with a whitelist feature (Phase 2).

## For Your Cybersecurity Portfolio

This project demonstrates:
- JavaScript and Chrome extension development
- Understanding of common phishing techniques
- Pattern recognition and detection logic
- User experience design (UI/UX)
- Security best practices (no external data transmission)

## Support

Issues or questions?
1. Check console (F12) for error messages
2. Verify manifest.json is correct
3. Make sure all files are in the same folder
4. Try reloading the extension (refresh icon on chrome://extensions/)

---

Built by Jaime for cybersecurity education. Perfect for portfolio and internship applications!
