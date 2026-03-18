// background.js (Service Worker for MV3)
// All event listeners MUST be registered at the top level, synchronously.

chrome.runtime.onInstalled.addListener(() => {
  console.log('WA Marketing Web Extension installed');
});

// Avoid using async/await directly on the top-level listener callback if it causes issues,
// but for simple messages it's usually fine. Ensure it returns true if using sendResponse asynchronously (if needed later).
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStats') {
    chrome.storage.local.set({ sendingStats: request.stats })
      .then(() => {
        // Optional: you can send a response back if needed
        if (typeof sendResponse === 'function') sendResponse({ success: true });
      })
      .catch(err => console.error("Storage error:", err));
    return true; // Keep message channel open for async response
  }
  
  // Return false if we handle the message synchronously or don't handle it at all
  return false;
});
