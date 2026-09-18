# Phishing Email Alert

A Chrome extension that detects and alerts users when emails contain suspicious phishing attempts. Uses multi-pattern detection to catch common phishing techniques without requiring API keys or external services.

## Features

### URL-Based Detection
- **Company Impersonation**: Detects when links claim to be from PayPal, Amazon, Google, etc. but go to different domains
- **Typosquatting**: Catches homograph attacks like "amaz0n.com" (zero instead of O) and "paypa1.com" (one instead of L)
- **IP Address Detection**: Flags links using IP addresses instead of domain names
- **URL Shorteners**: Alerts on bit.ly, tinyurl, goo.gl and other shorteners commonly used to hide malicious URLs
- **Suspicious Subdomains**: Catches admin, verify, confirm, login, secure subdomains on unknown domains
- **International Domains (IDN)**: Detects internationalized domain names used for fake lookalikes

### Content Detection
- **Password Stealing Forms**: Detects forms requesting passwords without proper form actions
- **Urgent Language**: Flags emails with multiple phishing trigger phrases like "verify your account", "action required", "account suspended"

### Visual Indicators
- Suspicious links highlighted with red border and warning background
- Extension popup shows number of threats detected
- Clear warnings for dangerous emails

## Installation

1. Download this repository or clone it: `git clone https://github.com/yourusername/phishing-email-alert.git`
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" and select the `phishing-email-alert` folder
5. The extension is now active on Gmail, Outlook, and Yahoo Mail

## Supported Email Providers
- Gmail (mail.google.com)
- Outlook (outlook.com, outlook.live.com)
- Yahoo Mail (mail.yahoo.com)

## How It Works
The extension scans every email you open and checks for phishing indicators. When suspicious content is detected, it:
1. Highlights dangerous links with red borders
2. Shows a warning in the popup indicating the number of threats found
3. Displays why each link was flagged (e.g., "Using IP address instead of domain")

## Privacy
This extension does not collect, store, or transmit any user data. All analysis happens locally in your browser. Detection results are stored only in your browser's local storage and never sent to external servers.

## Technologies Used
- JavaScript (Content Script)
- Chrome Storage API
- Chrome Extension Manifest V3

## License
MIT License

## Author
Jaime Garcia
