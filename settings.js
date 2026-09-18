// Settings Page Script

const defaultSettings = {
  sensitivity: 3,
  checkCompanyImpersonation: true,
  checkSubdomains: true,
  checkShorteners: true,
  checkHomographs: true,
  checkUrgentLanguage: true,
  checkForms: true,
  enableLogging: true
};

// Load settings on page load
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadStats();
  setupEventListeners();
  updateSensitivityLabel();
});

function loadSettings() {
  chrome.storage.sync.get(defaultSettings, (items) => {
    document.getElementById('sensitivity').value = items.sensitivity;
    document.getElementById('checkCompanyImpersonation').checked = items.checkCompanyImpersonation;
    document.getElementById('checkSubdomains').checked = items.checkSubdomains;
    document.getElementById('checkShorteners').checked = items.checkShorteners;
    document.getElementById('checkHomographs').checked = items.checkHomographs;
    document.getElementById('checkUrgentLanguage').checked = items.checkUrgentLanguage;
    document.getElementById('checkForms').checked = items.checkForms;
    document.getElementById('enableLogging').checked = items.enableLogging;
  });
}

function loadStats() {
  chrome.storage.local.get(['emailsScanned', 'threatsDetected', 'lastScan'], (items) => {
    document.getElementById('emailsScanned').textContent = items.emailsScanned || 0;
    document.getElementById('threatsDetected').textContent = items.threatsDetected || 0;
    
    if (items.lastScan) {
      const lastScanDate = new Date(items.lastScan);
      document.getElementById('lastScan').textContent = lastScanDate.toLocaleString();
    }
  });
}

function setupEventListeners() {
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  document.getElementById('resetBtn').addEventListener('click', resetSettings);
  document.getElementById('sensitivity').addEventListener('change', updateSensitivityLabel);
}

function updateSensitivityLabel() {
  const value = document.getElementById('sensitivity').value;
  const labels = {
    '1': 'Very Low',
    '2': 'Low',
    '3': 'Medium',
    '4': 'High',
    '5': 'Very High'
  };
  document.getElementById('sensitivityValue').textContent = labels[value];
}

function saveSettings() {
  const settings = {
    sensitivity: parseInt(document.getElementById('sensitivity').value),
    checkCompanyImpersonation: document.getElementById('checkCompanyImpersonation').checked,
    checkSubdomains: document.getElementById('checkSubdomains').checked,
    checkShorteners: document.getElementById('checkShorteners').checked,
    checkHomographs: document.getElementById('checkHomographs').checked,
    checkUrgentLanguage: document.getElementById('checkUrgentLanguage').checked,
    checkForms: document.getElementById('checkForms').checked,
    enableLogging: document.getElementById('enableLogging').checked
  };

  chrome.storage.sync.set(settings, () => {
    showStatus('Settings saved successfully!', 'success');
    setTimeout(() => {
      hideStatus();
    }, 3000);
  });
}

function resetSettings() {
  if (confirm('Reset all settings to defaults?')) {
    chrome.storage.sync.set(defaultSettings, () => {
      loadSettings();
      showStatus('Settings reset to defaults!', 'success');
      setTimeout(() => {
        hideStatus();
      }, 3000);
    });
  }
}

function showStatus(message, type) {
  const statusEl = document.getElementById('statusMessage');
  statusEl.textContent = message;
  statusEl.className = `status-message status-${type}`;
}

function hideStatus() {
  document.getElementById('statusMessage').className = 'status-message';
}
