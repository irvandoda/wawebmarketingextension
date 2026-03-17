chrome.runtime.onInstalled.addListener(() => {
  console.log('WA Marketing Web Extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStats') {
    chrome.storage.local.set({ sendingStats: request.stats });
  }
});
