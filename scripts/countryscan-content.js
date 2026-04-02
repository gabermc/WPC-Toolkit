// WPC Toolkit — countryscan-content.js
// Injected on all pages. Listens for messages from popup to scan page language.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scanPage') {
    sendResponse(scanPageLanguage());
  }
  return true;
});

function scanPageLanguage() {
  return {
    htmlLang:        document.documentElement.lang || null,
    metaLang:        document.querySelector('meta[http-equiv="content-language"]')?.content || null,
    ogLocale:        document.querySelector('meta[property="og:locale"]')?.content || null,
    pageTitle:       document.title,
    pageUrl:         window.location.href,
    metaDescription: document.querySelector('meta[name="description"]')?.content
                     || document.querySelector('meta[property="og:description"]')?.content || null,
    canonical:       document.querySelector('link[rel="canonical"]')?.href || null,
  };
}
