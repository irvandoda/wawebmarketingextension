let isSending = false;
let currentStats = { total: 0, success: 0, failed: 0, failedNumbers: [] };

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Use a try-catch for robustness
  try {
    if (request.action === 'ping') {
      sendResponse({ status: 'pong' });
      return false;
    }
    
    if (request.action === 'startSending') {
      startBulkSending(request.contacts, request.message, request.delay, request.batchSize, request.attachments, request.advancedSettings);
      sendResponse({ status: 'started' });
    } else if (request.action === 'stopSending') {
      isSending = false;
      sendResponse({ status: 'stopped' });
    } else if (request.action === 'exportGroup') {
      exportGroupContacts();
      sendResponse({ status: 'exported' });
    } else if (request.action === 'exportLabel') {
      exportLabelContacts();
      sendResponse({ status: 'exported' });
    } else if (request.action === 'exportChatlist') {
      exportAllContacts();
      sendResponse({ status: 'exported' });
    } else if (request.action === 'SCRAPE_ACTIVE_LABEL') {
      scrapeActiveLabel().then(results => {
        sendResponse({ success: true, contacts: results });
      }).catch(err => {
        sendResponse({ success: false, error: err.message });
      });
      return true; // async
    }
  } catch (err) {
    console.error('Error in content script listener:', err);
    sendResponse({ success: false, error: err.message });
  }
  return false; 
});

async function startBulkSending(contacts, messageTemplate, delay, batchSize, attachments = [], advancedSettings = {}) {
  if (isSending) {
    alert('Pengiriman sedang berlangsung!');
    return;
  }
  isSending = true;
  currentStats = { total: contacts.length, success: 0, failed: 0, failedNumbers: [] };
  
  // Reconstruct File objects from base64 if needed
  const reconstructedAttachments = [];
  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      if (att.data) {
        reconstructedAttachments.push(await base64ToFile(att.data, att.name, att.type));
      } else {
        reconstructedAttachments.push(att);
      }
    }
  }

  showOverlay();

  for (let i = 0; i < contacts.length && isSending; i++) {
    const contact = contacts[i].trim();
    const message = personalizeMessage(messageTemplate, contact);
    
    updateOverlay(`📤 Mengirim ke ${contact}... (${i + 1}/${contacts.length})`);

    try {
      // Use the actual reconstructed attachments
      await sendMessageViaAPI(contact, message, reconstructedAttachments, advancedSettings);
      currentStats.success++;
      logActivity('✓ Berhasil', contact);
    } catch (error) {
      currentStats.failed++;
      currentStats.failedNumbers.push(contact);
      logActivity('✗ Gagal', `${contact}: ${error.message}`);
    }

    updateStats();

    // Delay between messages
    if (i < contacts.length - 1 && isSending) {
      const randomDelay = getRandomDelay(delay);
      const seconds = Math.round(randomDelay / 1000);
      
      for (let j = seconds; j > 0 && isSending; j--) {
        updateOverlay(`⏳ Tunggu ${j} detik... (${i + 1}/${contacts.length})`);
        await sleep(1000);
      }
      
      // Extra delay after batch
      if ((i + 1) % batchSize === 0 && isSending) {
        updateOverlay(`💤 Istirahat batch... (${i + 1}/${contacts.length})`);
        await sleep(randomDelay);
      }
    }
  }

  isSending = false;
  hideOverlay();
  
  const summary = `✅ Pengiriman Selesai!\n\n` +
    `✓ Berhasil: ${currentStats.success}\n` +
    `✗ Gagal: ${currentStats.failed}\n` +
    `📊 Total: ${currentStats.total}`;
  
  alert(summary);
}

async function sendMessageViaAPI(phone, message, attachments = [], advancedSettings = {}) {
  // Default settings
  const settings = {
    chatLoadDelay: advancedSettings.chatLoadDelay || 5000,
    focusDelay: advancedSettings.focusDelay || 500,
    typingDelay: advancedSettings.typingDelay || 800,
    sendDelay: advancedSettings.sendDelay || 2500,
    attachPreviewDelay: advancedSettings.attachPreviewDelay || 2000,
    attachSendDelay: advancedSettings.attachSendDelay || 3000,
    elementTimeout: advancedSettings.elementTimeout || 8000
  };

  // Format phone number
  const phoneNumber = phone.replace(/\D/g, '');
  const chatId = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@c.us`;
  
  // Open chat by navigating to the URL directly
  const chatUrl = `https://web.whatsapp.com/send?phone=${phoneNumber}`;
  
  // Create and click a temporary link to trigger navigation
  const link = document.createElement('a');
  link.href = chatUrl;
  link.target = '_self';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Wait for chat to load
  await sleep(settings.chatLoadDelay);
  
  // Handle attachments if provided
  if (attachments && attachments.length > 0) {
    await sendAttachments(attachments, null, settings); // Send image first without caption
    console.log('✅ Image sent, waiting to send the message next...');
    await sleep(2000); // Wait for chat UI to stabilize
  }
  
  // Find message input box with multiple selectors
  const selectors = [
    '[contenteditable="true"][data-tab="10"]',
    '[contenteditable="true"][data-testid="conversation-compose-box-input"]',
    'div[contenteditable="true"][role="textbox"]',
    '[contenteditable="true"].selectable-text'
  ];
  
  let inputBox = null;
  for (const selector of selectors) {
    inputBox = await waitForElement(selector, settings.elementTimeout);
    if (inputBox) {
      console.log('✅ Input box found:', selector);
      break;
    }
  }
  
  if (!inputBox) {
    // Try one more time with a very generic selector
    inputBox = document.querySelector('div[contenteditable="true"]');
    if (!inputBox) throw new Error('Input box tidak ditemukan');
  }
  
  // Focus and clear input
  inputBox.focus();
  await sleep(settings.focusDelay);
  
  // Type message - simulate real typing
  inputBox.textContent = '';
  
  // Split message by lines and insert
  const lines = message.split('\n');
  for (let i = 0; i < lines.length; i++) {
    // Insert text segment
    if (lines[i].length > 0) {
      document.execCommand('insertText', false, lines[i]);
    }
    
    // Add line break if not last line
    if (i < lines.length - 1) {
      // Using insertHTML with <br> is often more reliable for multiline in WA Web
      document.execCommand('insertHTML', false, '<br>');
    }
  }
  
  // Trigger input events
  inputBox.dispatchEvent(new Event('input', { bubbles: true }));
  inputBox.dispatchEvent(new Event('change', { bubbles: true }));
  
  await sleep(settings.typingDelay);
  
  // Find send button with multiple selectors
  const sendSelectors = [
    'button[data-tab="11"]',
    '[data-testid="send"]',
    'button[aria-label="Send"]',
    'span[data-icon="send"]'
  ];
  
  let sendButton = null;
  for (const selector of sendSelectors) {
    sendButton = document.querySelector(selector);
    if (sendButton) {
      // If it's a span, get parent button
      if (sendButton.tagName === 'SPAN') {
        sendButton = sendButton.closest('button');
      }
      break;
    }
  }
  
  if (!sendButton) {
    throw new Error('Tombol kirim tidak ditemukan');
  }
  
  // Click send button
  sendButton.click();
  
  // Wait for message to be sent
  await sleep(settings.sendDelay);
}

async function sendAttachments(attachments, message, settings) {
  // Find attachment button
  const attachSelectors = [
    '[data-testid="clip"]',
    '[data-icon="clip"]',
    'span[data-icon="attach-menu-plus"]',
    'button[aria-label*="Attach"]'
  ];
  
  let attachButton = null;
  for (const selector of attachSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      attachButton = element.tagName === 'BUTTON' ? element : element.closest('button');
      if (attachButton) {
        console.log('✅ Attachment button found:', selector);
        break;
      }
    }
  }
  
  if (!attachButton) {
    throw new Error('Tombol attachment tidak ditemukan');
  }
  
  // Click attachment button
  attachButton.click();
  await sleep(1000);
  
  // Find file input for images/documents
  const fileInputSelectors = [
    'input[type="file"][accept*="image"]',
    'input[type="file"]'
  ];
  
  let fileInput = null;
  for (const selector of fileInputSelectors) {
    fileInput = document.querySelector(selector);
    if (fileInput) break;
  }
  
  if (!fileInput) {
    // Try to find any file input if the above fails
    fileInput = document.querySelector('input[type="file"]');
    if (!fileInput) throw new Error('Input file tidak ditemukan');
  }

  console.log('📤 Preparing to upload', attachments.length, 'files');
  
  // Create DataTransfer to simulate file selection
  const dataTransfer = new DataTransfer();
  for (let i = 0; i < attachments.length; i++) {
    const attachment = attachments[i];
    console.log(`📎 Adding file ${i}:`, attachment.name, attachment instanceof File);
    if (attachment instanceof File) {
      dataTransfer.items.add(attachment);
    } else {
      console.warn('⚠️ Attachment is not a File object, trying to force wrap it');
      // If it's a blob-like object but not passing instanceof, wrap it
      try {
        const forcedFile = new File([attachment], attachment.name || `file-${i}`, { type: attachment.type });
        dataTransfer.items.add(forcedFile);
      } catch (e) {
        throw new Error(`Gagal memproses lampiran ${i}: ${e.message}`);
      }
    }
  }
  fileInput.files = dataTransfer.files;
  
  // Trigger change event
  fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Wait for preview to load
  await sleep(settings.attachPreviewDelay);

  // Try to type message into caption field if provided
  if (message) {
    const captionSelectors = [
      '[data-testid="media-caption-input"]',
      'div[contenteditable="true"][data-tab="10"]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"].selectable-text'
    ];
    
    let captionBox = null;
    for (const selector of captionSelectors) {
      captionBox = document.querySelector(selector);
      if (captionBox) {
        console.log('✅ Caption box found:', selector);
        break;
      }
    }

    if (captionBox) {
      captionBox.focus();
      await sleep(500);
      captionBox.textContent = '';
      
      // Use formatted insertion for newlines in caption
      const segments = message.split('\n');
      for (let i = 0; i < segments.length; i++) {
        if (segments[i].length > 0) {
          document.execCommand('insertText', false, segments[i]);
        }
        if (i < segments.length - 1) {
          document.execCommand('insertHTML', false, '<br>');
        }
      }
      captionBox.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(settings.typingDelay);
    }
  }
  
  // Find and click send button in attachment preview
  const attachSendSelectors = [
    '[data-icon="wds-ic-send-filled"]',
    '[data-testid="send"]',
    '[aria-label="Send"][role="button"]',
    '[data-icon="send"]',
    'span[data-icon="send"]',
    '[role="button"]' // Last resort: check all buttons
  ];
  
  let attachSendButton = null;
  console.log('🔍 Searching for attachment send button (Robust Mode)...');
  
  // Outer loop for retries if the preview takes longer to load
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const selector of attachSendSelectors) {
      // Find all elements matching this selector
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        let target = el;
        
        // If it's an icon inside a button, get the button
        if (!['BUTTON', 'DIV'].includes(target.tagName) || (target.tagName === 'DIV' && target.getAttribute('role') !== 'button')) {
          const clickable = target.closest('button, [role="button"]');
          if (clickable) target = clickable;
        }
        
        // Check if visible and has proper send button characteristics
        const rect = target.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && window.getComputedStyle(target).display !== 'none';
        
        // Ensure it's not the main chat send button (which is usually nearby but might be hidden or in a different container)
        // Usually preview send button is inside a modal or a specific container
        const isInPreview = target.closest('[data-testid="media-editor-preview"]') || target.closest('.x1247r65');
        
        if (isVisible && (isInPreview || selector !== '[role="button"]')) {
          // Double check: does it have a send icon or label?
          const hasSendText = target.getAttribute('aria-label')?.toLowerCase().includes('send') || 
                              target.innerHTML.toLowerCase().includes('send') ||
                              target.querySelector('[data-icon*="send"]');
          
          if (hasSendText || selector === '[data-icon="wds-ic-send-filled"]') {
            attachSendButton = target;
            console.log('🎯 Found visible send button:', selector, target);
            break;
          }
        }
      }
      if (attachSendButton) break;
    }
    
    if (attachSendButton) break;
    console.log(`⏳ Attempt ${attempt + 1} failed, waiting...`);
    await sleep(1000);
  }
  
  // Last resort fallback: find by specific SVG path data
  if (!attachSendButton) {
    console.log('🕵️ Searching by SVG path data...');
    const allPaths = document.querySelectorAll('path');
    for (const p of allPaths) {
      if (p.getAttribute('d')?.startsWith('M5.4 19.425')) {
        const btn = p.closest('[role="button"], button');
        if (btn && btn.getBoundingClientRect().width > 0) {
          attachSendButton = btn;
          console.log('🎯 Found button by SVG path!');
          break;
        }
      }
    }
  }
  
  if (attachSendButton) {
    console.log('✅ Clicking attachment send button');
    attachSendButton.focus();
    await sleep(300);
    
    // Simulate real interaction
    const clickEvents = ['mousedown', 'mouseup', 'click'];
    clickEvents.forEach(type => {
      attachSendButton.dispatchEvent(new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window,
        buttons: 1
      }));
    });
    
    await sleep(settings.attachSendDelay);
  } else {
    console.error('❌ FATAL: Could not find attachment send button after all attempts');
    // Final desperate click on anything that looks like a send button in the middle-right area
    const possibleButtons = Array.from(document.querySelectorAll('[role="button"]'));
    const desperateMatch = possibleButtons.find(b => {
      const r = b.getBoundingClientRect();
      return r.left > window.innerWidth * 0.7 && r.top > window.innerHeight * 0.7 && r.width > 0;
    });
    
    if (desperateMatch) {
      console.log('🚀 Desperate attempt: clicking button in bottom-right area');
      desperateMatch.click();
    }
  }
}

function personalizeMessage(template, contact) {
  // Extract name from contact if format is "name,phone" or just use phone
  let name = 'User';
  let phone = contact;
  
  if (contact.includes(',')) {
    const parts = contact.split(',');
    phone = parts[0].trim();
    name = parts[1] ? parts[1].trim() : 'User';
  }
  
  const firstName = name.split(' ')[0];
  
  return template
    .replace(/\{\{Phone\}\}/g, phone)
    .replace(/\{\{First-Name\}\}/g, firstName)
    .replace(/\{\{Name\}\}/g, name);
}

function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function base64ToFile(base64Data, filename, contentType) {
  try {
    const parts = base64Data.split(';base64,');
    const mime = contentType || (parts[0].match(/:(.*?);/) ? parts[0].match(/:(.*?);/)[1] : 'image/png');
    const base64 = parts.length > 1 ? parts[1] : parts[0];
    
    const binaryStr = atob(base64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    
    const file = new File([bytes], filename, { type: mime });
    console.log('✅ Reconstructed file:', filename, '| type:', mime, '| size:', file.size, '| isFile:', file instanceof File);
    return file;
  } catch (err) {
    console.error('❌ base64ToFile error:', err);
    throw new Error('Gagal merubah data gambar: ' + err.message);
  }
}

function updateStats() {
  chrome.runtime.sendMessage({
    action: 'updateStats',
    stats: currentStats
  }).catch(() => {
    // Ignore errors if popup is closed
  });
}

// Export functions
function exportGroupContacts() {
  const contacts = extractContacts();
  downloadCSV(contacts, 'group-contacts.csv');
  alert(`✅ Berhasil export ${contacts.length} kontak!`);
}

function exportLabelContacts() {
  const contacts = extractContacts();
  downloadCSV(contacts, 'label-contacts.csv');
  alert(`✅ Berhasil export ${contacts.length} kontak!`);
}

function exportAllContacts() {
  const contacts = extractContacts();
  downloadCSV(contacts, 'all-contacts.csv');
  alert(`✅ Berhasil export ${contacts.length} kontak!`);
}

function extractContacts() {
  const contacts = [];
  const chatElements = document.querySelectorAll('[data-testid="cell-frame-container"]');
  
  chatElements.forEach(el => {
    const titleElement = el.querySelector('[data-testid="cell-frame-title"]');
    if (titleElement) {
      contacts.push(titleElement.textContent.trim());
    }
  });
  
  return contacts;
}

function downloadCSV(data, filename) {
  const csv = 'name\n' + data.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Overlay UI functions
function showOverlay() {
  hideOverlay();
  
  const overlay = document.createElement('div');
  overlay.id = 'wa-bulk-sender-overlay';
  overlay.className = 'wa-bulk-sender-overlay';
  overlay.innerHTML = `
    <h4>🚀 WA Bulk Sender</h4>
    <div class="status" id="overlay-status">Memulai pengiriman...</div>
    <div class="stats">
      <span class="stat-success">✓ <span id="success-count">0</span></span>
      <span class="stat-failed">✗ <span id="failed-count">0</span></span>
      <span class="stat-total">📊 <span id="total-count">0</span></span>
    </div>
    <div class="progress">
      <div class="progress-bar" id="overlay-progress"></div>
    </div>
    <button id="overlay-stop">⏹ Stop Sending</button>
  `;
  document.body.appendChild(overlay);
  
  document.getElementById('overlay-stop').addEventListener('click', () => {
    if (confirm('Yakin ingin menghentikan pengiriman?')) {
      isSending = false;
      updateOverlay('⏸ Menghentikan...');
    }
  });
  
  // Update total count
  document.getElementById('total-count').textContent = currentStats.total;
}

function updateOverlay(status) {
  const statusEl = document.getElementById('overlay-status');
  const progressEl = document.getElementById('overlay-progress');
  const successEl = document.getElementById('success-count');
  const failedEl = document.getElementById('failed-count');
  
  if (statusEl) statusEl.textContent = status;
  if (successEl) successEl.textContent = currentStats.success;
  if (failedEl) failedEl.textContent = currentStats.failed;
  
  if (progressEl && currentStats.total > 0) {
    const progress = ((currentStats.success + currentStats.failed) / currentStats.total) * 100;
    progressEl.style.width = progress + '%';
  }
}

function hideOverlay() {
  const overlay = document.getElementById('wa-bulk-sender-overlay');
  if (overlay) overlay.remove();
}

// Utility functions
function getRandomDelay(baseDelay) {
  const variance = 0.3;
  const min = baseDelay * (1 - variance);
  const max = baseDelay * (1 + variance);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function logActivity(action, details) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${action}: ${details}`);
}

// Initialize
console.log('✅ WA Marketing Web - Content script loaded!');
console.log('📱 Ready to send bulk messages on WhatsApp Web');

/**
 * Scrapes phone numbers from the active label filter.
 */
async function scrapeActiveLabel() {
  logActivity('Scraper', 'Starting Contact Scraping...');
  
  // 1. Detect if we are in a filtered/labeled view
  // First, try to find the active label button in the tab bar
  const labelButton = document.querySelector('#labels-filter[aria-pressed="true"]');
  
  // Also check for the "filter pill" in the chat list header (e.g. "New customer x")
  const filterPill = document.querySelector('div[role="button"] span[dir="auto"]'); // Generic search for pills
  
  if (!labelButton) {
    console.warn('⚠️ Active label button not found. Will attempt to scrape current visible list as fallback.');
  }

  const chatListSide = document.querySelector('#pane-side');
  if (!chatListSide) {
    throw new Error('Gagal menemukan daftar chat (#pane-side). Pastikan WhatsApp Web sudah terbuka sempurna.');
  }

  const contactsSet = new Set();
  let scrollAttempts = 0;
  const maxAttempts = 50;

  while (scrollAttempts < maxAttempts) {
    // Look for items with role="listitem" OR role="row" OR testing IDs
    const chatItems = chatListSide.querySelectorAll('[role="listitem"], [role="row"], [data-testid="cell-frame-container"]');
    
    if (chatItems.length === 0) {
      console.warn('⚠️ No chat items found in current view. Checking container structure...');
    }

    // Log how many items we found to check selector accuracy
    logActivity('Scraper', `Found ${chatItems.length} rows in the chat list container.`);

    chatItems.forEach(item => {
      // Find ALL numeric-like patterns in text and all attributes
      const allText = item.innerText + ' ' + Array.from(item.attributes).map(a => a.value).join(' ');
      
      // Look for any string of 9 to 18 digits (optionally with separators)
      const patterns = allText.match(/\+?[0-9][0-9\s\-\.\(\)\/]{8,25}[0-9]/g);
      
      if (patterns) {
        patterns.forEach(match => {
          const clean = match.replace(/[^0-9]/g, '');
          // Standard WA numbers are 10-15 digits. Let's be slightly loose (9-16).
          if (clean.length >= 9 && clean.length <= 16) {
            contactsSet.add(clean);
          }
        });
      }

      // Deep search for title/aria-label in child elements
      const children = item.querySelectorAll('*');
      children.forEach(child => {
        ['title', 'aria-label', 'data-testid'].forEach(attr => {
          const val = child.getAttribute(attr);
          if (val) {
            const matches = val.match(/\+?[0-9][0-9\s\-\.\(\)\/]{8,25}[0-9]/g);
            if (matches) {
              matches.forEach(m => {
                const c = m.replace(/[^0-9]/g, '');
                if (c.length >= 9 && c.length <= 16) contactsSet.add(c);
              });
            }
          }
        });
      });
    });

    logActivity('Scraper', `Status: ${contactsSet.size} unique contacts found so far.`);

    const currentPos = chatListSide.scrollTop;
    chatListSide.scrollTop += 650; 
    await new Promise(r => setTimeout(r, 1000)); // Wait 1s for virtual rendering
    
    if (chatListSide.scrollTop === currentPos) {
      scrollAttempts++;
      if (scrollAttempts > 5) {
        logActivity('Scraper', `Scraping finished. Total: ${contactsSet.size}`);
        break; 
      }
    } else {
      scrollAttempts = 0;
    }
  }

  chatListSide.scrollTop = 0;
  return Array.from(contactsSet);
}
