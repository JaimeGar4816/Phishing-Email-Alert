# Quick Start Guide - Phishing Email Alert

## What You're Getting

A full-featured Chrome extension that:
- Detects 10+ types of phishing attacks
- Shows detailed threat analysis
- Lets you customize detection sensitivity
- Tracks statistics (emails scanned, threats found)
- Works on Gmail, Outlook, and Yahoo Mail

## Files You Need

1. `manifest.json` - Extension configuration
2. `content.js` - Detection logic (runs on emails)
3. `popup.html` - User interface popup
4. `popup.js` - Popup functionality
5. `settings.html` - Settings page
6. `settings.js` - Settings functionality

## Installation (5 minutes)

### Step 1: Create Folder
Create a folder on your computer called `phishing-alert`

### Step 2: Copy Files
Put all 6 files into that folder

## First Test

### Send Test Email
1. Open Gmail
2. Click Compose
3. Send to yourself:
```
Subject: Test
Body: Click here to verify your PayPal account: 
http://paypa1-secure-verify.com
```

### Check Results
1. Open the email
2. Click the extension icon in toolbar
3. You should see a warning about the link

## How It Works

**When you open an email:**
- content.js automatically scans all links
- Checks against multiple threat patterns
- Highlights suspicious links in red
- Stores results in browser storage

**When you click the extension icon:**
- popup.js retrieves findings
- Shows what was detected and why
- Displays a threat level

**Settings:**
- Click "Settings" link in popup
- Adjust detection sensitivity
- Enable/disable specific checks
- View statistics

## What It Detects

**Link Problems:**
- Company impersonation (fake PayPal, etc.)
- Homograph attacks (similar-looking domains)
- IP addresses instead of domains
- URL shorteners (hides real destination)
- Suspicious subdomains (admin, verify, confirm)

**Email Content:**
- Password-stealing forms
- Urgent language ("verify account", "unusual activity")
- Multiple warning signs combined

## Common Test Cases

**Should Flag:**
```
"Verify your Amazon account"
goes to: http://amaz0n-verify.com
```

**Should Flag:**
```
"Confirm PayPal identity"
goes to: bit.ly/phishing
```

**Should Flag:**
```
"Your account has unusual activity"
"Click below to verify"
"Update your password"
(Multiple urgent phrases)
```

**Should NOT Flag:**
```
"Visit Google"
goes to: https://google.com
```

## Questions?

Check the full README.md for detailed documentation on how it works and all available features.
