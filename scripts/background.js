// WPC Toolkit — background.js (Service Worker)
// Handles ShopApp SPA navigation events to auto-inject/deactivate scripts.

chrome.webNavigation.onCommitted.addListener(function(details) {
  if (details.frameId === 0 && details.url.startsWith('https://opstools-p1')) {
    handleUrlChange(details.url, details.tabId);
  }
});

chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
  if (details.frameId === 0 && details.url.startsWith('https://opstools-p1')) {
    handleUrlChange(details.url, details.tabId);
  }
});

function handleUrlChange(currentUrl, tabId) {
  if (currentUrl.includes('Offerv2')) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['scripts/shopapp-content.js'],
    }).catch(err => console.warn('WPC: inject error', err.message));
  } else {
    chrome.tabs.sendMessage(tabId, { action: 'deactivateExtension' })
      .catch(() => {}); // tab might not have the content script
  }
}
