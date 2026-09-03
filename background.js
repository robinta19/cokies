// Background Service Worker - Cookie Manager Dev (Manifest V3)

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Cookie Manager Dev] Installed or Updated:', details.reason);

  try {
    // Inisialisasi default whitelist jika belum ada
    const data = await chrome.storage.local.get(['whitelistedDomains']);
    if (!data.whitelistedDomains || !Array.isArray(data.whitelistedDomains)) {
      const defaultWhitelist = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0'
      ];
      await chrome.storage.local.set({ whitelistedDomains: defaultWhitelist });
      console.log('[Cookie Manager Dev] Default whitelist diinisialisasi:', defaultWhitelist);
    }
  } catch (err) {
    console.error('[Cookie Manager Dev] Inisialisasi storage gagal:', err);
  }
});
