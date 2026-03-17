let isSending = false;
let sendingStats = { total: 0, success: 0, failed: 0, failedNumbers: [] };

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
  });
});

// Insert personalization fields
document.querySelectorAll('.insert-field').forEach(btn => {
  btn.addEventListener('click', () => {
    const field = btn.dataset.field;
    const messageBox = document.getElementById('message');
    const cursorPos = messageBox.selectionStart;
    const textBefore = messageBox.value.substring(0, cursorPos);
    const textAfter = messageBox.value.substring(cursorPos);
    messageBox.value = textBefore + field + textAfter;
    messageBox.focus();
  });
});

// Download Template
document.getElementById('downloadTemplate').addEventListener('click', () => {
  const template = `phone,name,first_name
628123456789,John Doe,John
628987654321,Jane Smith,Jane
6281234567890,Bob Johnson,Bob
628555666777,Alice Williams,Alice
628999888777,Charlie Brown,Charlie`;
  
  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'contacts-template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  // Show notification
  alert('✅ Template berhasil didownload!\n\nSilakan isi file CSV dengan data kontak Anda:\n- phone: Nomor dengan kode negara (contoh: 628123456789)\n- name: Nama lengkap\n- first_name: Nama depan (opsional)');
});

// Import CSV
document.getElementById('importCsv').addEventListener('click', () => {
  document.getElementById('csvFile').click();
});

document.getElementById('csvFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const lines = content.split('\n').filter(line => line.trim());
      
      // Skip header if exists
      const hasHeader = lines[0].toLowerCase().includes('phone') || lines[0].toLowerCase().includes('name');
      const dataLines = hasHeader ? lines.slice(1) : lines;
      
      // Extract phone numbers from CSV
      const phones = dataLines.map(line => {
        const parts = line.split(',');
        return parts[0].trim().replace(/[^0-9]/g, ''); // Get first column (phone)
      }).filter(phone => phone.length >= 10);
      
      document.getElementById('contacts').value = phones.join('\n');
      alert(`✅ Berhasil import ${phones.length} kontak dari file!`);
    };
    reader.readAsText(file);
  }
});

// Attachment handling
document.getElementById('attachments').addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  const list = document.getElementById('attachmentList');
  list.innerHTML = files.map(f => `<div>📎 ${f.name}</div>`).join('');
});

// Start sending
document.getElementById('startSending').addEventListener('click', async () => {
  try {
    const contacts = document.getElementById('contacts').value.split('\n').filter(c => c.trim());
    const message = document.getElementById('message').value;
    const delay = (parseInt(document.getElementById('delay').value) || 5) * 1000;
    const batchSize = parseInt(document.getElementById('batchSize').value) || 10;
    const attachmentFiles = document.getElementById('attachments').files;

    // Advanced settings
    const advancedSettings = {
      chatLoadDelay: (parseFloat(document.getElementById('chatLoadDelay').value) || 5) * 1000,
      focusDelay: (parseFloat(document.getElementById('focusDelay').value) || 0.5) * 1000,
      typingDelay: (parseFloat(document.getElementById('typingDelay').value) || 0.8) * 1000,
      sendDelay: (parseFloat(document.getElementById('sendDelay').value) || 2.5) * 1000,
      attachPreviewDelay: (parseFloat(document.getElementById('attachPreviewDelay').value) || 2) * 1000,
      attachSendDelay: (parseFloat(document.getElementById('attachSendDelay').value) || 3) * 1000,
      elementTimeout: (parseFloat(document.getElementById('elementTimeout').value) || 8) * 1000
    };

    if (!contacts.length || !message) {
      alert('Harap isi kontak dan pesan!');
      return;
    }

    isSending = true;
    document.getElementById('startSending').style.display = 'none';
    document.getElementById('stopSending').style.display = 'block';

    sendingStats = { total: contacts.length, success: 0, failed: 0, failedNumbers: [] };

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs[0]) {
        alert('Gagal menemukan tab aktif.');
        stopSendingUI();
        return;
      }

      // Check if content script is loaded
      const isLoaded = await pingContentScript(tabs[0].id);
      if (!isLoaded) {
        alert('⚠️ WhatsApp Web belum siap!\n\nMohon REFRESH halaman WhatsApp Web Anda agar extension dapat terhubung kembali setelah pembaruan.');
        stopSendingUI();
        return;
      }

      // Convert files to base64
      const attachments = [];
      if (attachmentFiles && attachmentFiles.length > 0) {
        for (const file of Array.from(attachmentFiles)) {
          try {
            const base64 = await fileToBase64(file);
            attachments.push({
              name: file.name,
              type: file.type,
              data: base64
            });
          } catch (err) {
            console.error('Gagal membaca file:', file.name, err);
          }
        }
      }

      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'startSending',
        contacts,
        message,
        delay,
        batchSize,
        attachments,
        advancedSettings
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Runtime error:', chrome.runtime.lastError.message);
          alert('Error: Gagal terhubung ke WhatsApp Web. Pastikan halaman WhatsApp Web aktif dan sudah dimuat ulang.');
          stopSendingUI();
        }
      });
    });
  } catch (error) {
    console.error('General error in startSending:', error);
    alert('Terjadi kesalahan: ' + error.message);
    stopSendingUI();
  }
});

function stopSendingUI() {
  isSending = false;
  document.getElementById('startSending').style.display = 'block';
  document.getElementById('stopSending').style.display = 'none';
}

async function pingContentScript(tabId) {
  return new Promise((resolve) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve('timeout');
      }
    }, 1500);

    try {
      chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);

        if (chrome.runtime.lastError) {
          resolve(chrome.runtime.lastError.message);
        } else if (response && response.status === 'pong') {
          resolve('ok');
        } else {
          resolve('Respon tidak valid');
        }
      });
    } catch (e) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve(e.message);
      }
    }
  });
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

// Stop sending
document.getElementById('stopSending').addEventListener('click', () => {
  isSending = false;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'stopSending' });
  });
  document.getElementById('startSending').style.display = 'block';
  document.getElementById('stopSending').style.display = 'none';
});

// Export functions
document.getElementById('exportGroup').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'exportGroup' });
  });
});

document.getElementById('exportLabel').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'exportLabel' });
  });
});

document.getElementById('exportChatlist').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'exportChatlist' });
  });
});

// Export results
document.getElementById('exportResults').addEventListener('click', () => {
  const csv = `Status,Number\n${sendingStats.failedNumbers.map(n => `Failed,${n}`).join('\n')}`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sending-results.csv';
  a.click();
});

// Retry failed
document.getElementById('retryFailed').addEventListener('click', () => {
  if (sendingStats.failedNumbers.length > 0) {
    document.getElementById('contacts').value = sendingStats.failedNumbers.join('\n');
    document.querySelector('[data-tab="simple"]').click();
  }
});

// Listen for updates from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStats') {
    sendingStats = request.stats;
    updateStatsDisplay();
  }
});

// Contact Scraper
document.getElementById('btn-scrape-label').addEventListener('click', () => {
  const statusBox = document.getElementById('scrape-status');
  statusBox.textContent = '⏳ Scraping in progress... Please wait.';
  statusBox.style.color = '#007bff';

  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (!tabs[0]) return;

    // Check if content script is loaded
    const pingStatus = await pingContentScript(tabs[0].id);
    if (pingStatus !== 'ok') {
      const errorDetail = pingStatus === 'timeout' ? 'Koneksi timeout' : (pingStatus || 'Script tidak terdeteksi');
      alert(`⚠️ WhatsApp Web belum siap!\n\nDetail: ${errorDetail}\n\nSolusi:\n1. RELOAD halaman WhatsApp Web.\n2. Buka chrome://extensions dan klik icon "Reload" pada extension ini.`);
      statusBox.textContent = 'Gagal menghubungkan ke WhatsApp Web.';
      statusBox.style.color = '#dc3545';
      return;
    }

    chrome.tabs.sendMessage(tabs[0].id, { action: 'SCRAPE_ACTIVE_LABEL' }, (response) => {
      if (chrome.runtime.lastError) {
        statusBox.innerHTML = `<span style="color: #dc3545;">❌ Error: ${chrome.runtime.lastError.message}</span>`;
        return;
      }

      if (response && response.success) {
        const numbers = response.contacts;
        if (numbers && numbers.length > 0) {
          const content = numbers.join('\n');
          const blob = new Blob([content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'contact.txt';
          a.click();
          URL.revokeObjectURL(url);

          statusBox.innerHTML = `<span style="color: #28a745; font-weight: bold;">✅ Berhasil! ${numbers.length} kontak ditemukan.</span><br><small>File contact.txt otomatis diunduh.</small>`;
        } else {
          statusBox.innerHTML = `<span style="color: #ffc107;">⚠️ Tidak ada kontak ditemukan.</span><br><small>Buka console (F12) untuk melihat detail proses.</small>`;
        }
      } else {
        const errorMsg = response ? response.error : 'Unknown error';
        statusBox.innerHTML = `<span style="color: #dc3545;">❌ Scraping gagal: ${errorMsg}</span>`;
      }
    });
  });
});

// Update stats display
function updateStatsDisplay() {
  document.getElementById('totalSent').textContent = sendingStats.total;
  document.getElementById('successSent').textContent = sendingStats.success;
  document.getElementById('failedSent').textContent = sendingStats.failed;
  const progress = (sendingStats.success + sendingStats.failed) / sendingStats.total * 100;
  document.getElementById('progressFill').style.width = progress + '%';
}
