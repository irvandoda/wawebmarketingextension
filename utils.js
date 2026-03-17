// Utility functions untuk WA Marketing Web Extension

// Parse CSV content
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const phoneIndex = headers.findIndex(h => h.includes('phone') || h.includes('number'));
  const nameIndex = headers.findIndex(h => h.includes('name'));
  
  const contacts = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (phoneIndex >= 0 && values[phoneIndex]) {
      contacts.push({
        phone: values[phoneIndex].trim(),
        name: nameIndex >= 0 ? values[nameIndex].trim() : ''
      });
    }
  }
  return contacts;
}

// Validate phone number format
function validatePhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

// Format phone number (add country code if missing)
function formatPhone(phone, defaultCountryCode = '62') {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = defaultCountryCode + cleaned.substring(1);
  } else if (!cleaned.startsWith(defaultCountryCode)) {
    cleaned = defaultCountryCode + cleaned;
  }
  
  return cleaned;
}

// Generate random delay to appear more human-like
function getRandomDelay(baseDelay, variance = 0.3) {
  const min = baseDelay * (1 - variance);
  const max = baseDelay * (1 + variance);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Check if WhatsApp Web is ready
function isWhatsAppReady() {
  const mainElement = document.querySelector('[data-testid="conversation-panel-wrapper"]');
  return mainElement !== null;
}

// Extract contact name from WhatsApp
function extractContactName(phone) {
  const chatElements = document.querySelectorAll('[data-testid="cell-frame-container"]');
  for (const el of chatElements) {
    const titleElement = el.querySelector('[data-testid="cell-frame-title"]');
    if (titleElement && titleElement.textContent.includes(phone)) {
      return titleElement.textContent;
    }
  }
  return phone;
}

// Create notification
function showNotification(title, message, type = 'info') {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body: message,
      icon: chrome.runtime.getURL('icons/icon48.png')
    });
  }
}

// Export data to CSV
function exportToCSV(data, filename) {
  const csv = convertToCSV(data);
  downloadFile(csv, filename, 'text/csv');
}

// Convert array to CSV format
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || '';
      return `"${value.toString().replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// Download file
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Get timestamp
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

// Sanitize message text
function sanitizeMessage(message) {
  return message
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .trim();
}

// Check rate limit
function checkRateLimit(sentCount, timeWindow = 60000) {
  const maxPerMinute = 20;
  return sentCount < maxPerMinute;
}

// Calculate ETA
function calculateETA(remaining, avgDelay) {
  const totalSeconds = Math.ceil((remaining * avgDelay) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

// Storage helpers
const storage = {
  async get(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key]);
      });
    });
  },
  
  async set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  },
  
  async remove(key) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(key, resolve);
    });
  }
};

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseCSV,
    validatePhone,
    formatPhone,
    getRandomDelay,
    isWhatsAppReady,
    extractContactName,
    showNotification,
    exportToCSV,
    convertToCSV,
    downloadFile,
    getTimestamp,
    sanitizeMessage,
    checkRateLimit,
    calculateETA,
    storage
  };
}
