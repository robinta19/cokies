// ==========================================================
// Cookie Manager Dev - Popup Script
// ==========================================================

document.addEventListener('DOMContentLoaded', async () => {
  // State
  let currentTab = null;
  let currentDomain = '';
  let allCookies = [];
  let whitelistedDomains = [];
  let isWhitelisted = false;
  let importParsedCookies = [];
  let savedSessions = [];
  let activeSessionId = null;

  // DOM Elements - Header & Domain
  const activeDomainText = document.getElementById('activeDomainText');
  const whitelistStatusBadge = document.getElementById('whitelistStatusBadge');
  const whitelistQuickAction = document.getElementById('whitelistQuickAction');
  const btnQuickWhitelist = document.getElementById('btnQuickWhitelist');
  const btnNoticeAddWhitelist = document.getElementById('btnNoticeAddWhitelist');
  const whitelistNotice = document.getElementById('whitelistNotice');
  const btnOpenSettings = document.getElementById('btnOpenSettings');

  // DOM Elements - Session Switcher
  const sessionSelect = document.getElementById('sessionSelect');
  const btnApplySession = document.getElementById('btnApplySession');
  const btnOpenSaveSessionModal = document.getElementById('btnOpenSaveSessionModal');
  const btnDeleteSession = document.getElementById('btnDeleteSession');
  const modalSaveSession = document.getElementById('modalSaveSession');
  const inputSessionName = document.getElementById('inputSessionName');
  const saveSessionDomainText = document.getElementById('saveSessionDomainText');
  const saveSessionCookieCount = document.getElementById('saveSessionCookieCount');
  const btnConfirmSaveSession = document.getElementById('btnConfirmSaveSession');

  // DOM Elements - Actions & Filter
  const btnExportModal = document.getElementById('btnExportModal');
  const btnImportModal = document.getElementById('btnImportModal');
  const btnRefreshCookies = document.getElementById('btnRefreshCookies');
  const cookieCountText = document.getElementById('cookieCountText');
  const cookieSearchInput = document.getElementById('cookieSearchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');
  const cookieFilterSelect = document.getElementById('cookieFilterSelect');
  const cookieList = document.getElementById('cookieList');
  const emptyState = document.getElementById('emptyState');
  const emptyStateMsg = document.getElementById('emptyStateMsg');

  // DOM Elements - Export Modal
  const modalExport = document.getElementById('modalExport');
  const exportMetaDomain = document.getElementById('exportMetaDomain');
  const exportMetaCount = document.getElementById('exportMetaCount');
  const exportMetaDate = document.getElementById('exportMetaDate');
  const exportJsonPreview = document.getElementById('exportJsonPreview');
  const btnCopyExportJson = document.getElementById('btnCopyExportJson');
  const btnDownloadExportJson = document.getElementById('btnDownloadExportJson');

  // DOM Elements - Import Modal
  const modalImport = document.getElementById('modalImport');
  const importTargetDomainText = document.getElementById('importTargetDomainText');
  const importStepInput = document.getElementById('importStepInput');
  const importJsonInput = document.getElementById('importJsonInput');
  const inputUploadCookieFile = document.getElementById('inputUploadCookieFile');
  const uploadFileInfo = document.getElementById('uploadFileInfo');
  const uploadFileNameText = document.getElementById('uploadFileNameText');
  const btnRemoveUploadedFile = document.getElementById('btnRemoveUploadedFile');
  const importParseError = document.getElementById('importParseError');
  const importStepPreview = document.getElementById('importStepPreview');
  const previewTotalCount = document.getElementById('previewTotalCount');
  const previewDomainBadge = document.getElementById('previewDomainBadge');
  const previewTableBody = document.getElementById('previewTableBody');
  const importStepResult = document.getElementById('importStepResult');
  const resultSuccessCount = document.getElementById('resultSuccessCount');
  const resultFailedCount = document.getElementById('resultFailedCount');
  const importResultLog = document.getElementById('importResultLog');

  const btnValidateImport = document.getElementById('btnValidateImport');
  const btnBackToInput = document.getElementById('btnBackToInput');
  const btnExecuteImport = document.getElementById('btnExecuteImport');
  const btnFinishImport = document.getElementById('btnFinishImport');

  // Toast Container
  const toastContainer = document.getElementById('toastContainer');

  // --------------------------------------------------------
  // Helper: Toast Notifications
  // --------------------------------------------------------
  function showToast(message, type = 'info', duration = 2500) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // --------------------------------------------------------
  // Modal Handlers
  // --------------------------------------------------------
  function openModal(modalEl) {
    modalEl.style.display = 'flex';
  }

  function closeModal(modalEl) {
    modalEl.style.display = 'none';
  }

  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      const targetModal = document.getElementById(modalId);
      if (targetModal) closeModal(targetModal);
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.style.display = 'none';
    }
  });

  // Settings Button
  btnOpenSettings.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('settings.html'));
    }
  });

  // --------------------------------------------------------
  // Domain & Whitelist Utilities
  // --------------------------------------------------------
  function isDomainWhitelisted(domain, whitelist) {
    if (!domain || !whitelist || !whitelist.length) return false;
    const cleanDomain = domain.toLowerCase().trim();

    return whitelist.some((rule) => {
      const cleanRule = rule.toLowerCase().trim();
      if (cleanRule === cleanDomain) return true;
      // Mendukung wildcard *.example.com atau suffix match
      if (cleanRule.startsWith('*.')) {
        const root = cleanRule.slice(2);
        return cleanDomain === root || cleanDomain.endsWith('.' + root);
      }
      return false;
    });
  }

  async function loadWhitelist() {
    const data = await chrome.storage.local.get(['whitelistedDomains']);
    whitelistedDomains = Array.isArray(data.whitelistedDomains)
      ? data.whitelistedDomains
      : ['localhost', '127.0.0.1'];
    updateWhitelistUI();
  }

  function updateWhitelistUI() {
    isWhitelisted = isDomainWhitelisted(currentDomain, whitelistedDomains);

    if (isWhitelisted) {
      whitelistStatusBadge.className = 'badge-status whitelisted';
      whitelistStatusBadge.textContent = 'Whitelisted';
      whitelistQuickAction.style.display = 'none';
      whitelistNotice.style.display = 'none';
      btnExportModal.disabled = false;
      btnImportModal.disabled = false;
    } else {
      whitelistStatusBadge.className = 'badge-status not-whitelisted';
      whitelistStatusBadge.textContent = 'Not Whitelisted';
      whitelistQuickAction.style.display = currentDomain ? 'block' : 'none';
      whitelistNotice.style.display = 'block';
    }
  }

  async function addCurrentDomainToWhitelist() {
    if (!currentDomain) return;
    if (!whitelistedDomains.includes(currentDomain)) {
      whitelistedDomains.push(currentDomain);
      await chrome.storage.local.set({ whitelistedDomains });
      showToast(`Domain "${currentDomain}" ditambahkan ke Whitelist!`, 'success');
      updateWhitelistUI();
    }
  }

  btnQuickWhitelist.addEventListener('click', addCurrentDomainToWhitelist);
  btnNoticeAddWhitelist.addEventListener('click', addCurrentDomainToWhitelist);

  // --------------------------------------------------------
  // Inisialisasi Tab Aktif & Load Cookies
  // --------------------------------------------------------
  async function initActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTab = tab;

      if (!tab || !tab.url) {
        activeDomainText.textContent = 'Tidak ada tab aktif';
        emptyStateMsg.textContent = 'Tidak dapat mendeteksi tab browser aktif.';
        emptyState.style.display = 'block';
        return;
      }

      // Validasi protokol URL
      if (
        tab.url.startsWith('chrome://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:') ||
        tab.url.startsWith('chrome-extension://')
      ) {
        activeDomainText.textContent = 'Halaman Internal Browser';
        whitelistStatusBadge.style.display = 'none';
        emptyStateMsg.textContent = 'Ekstensi tidak dapat mengelola cookie pada URL internal browser.';
        emptyState.style.display = 'block';
        btnExportModal.disabled = true;
        btnImportModal.disabled = true;
        return;
      }

      const urlObj = new URL(tab.url);
      currentDomain = urlObj.hostname;
      activeDomainText.textContent = currentDomain;
      activeDomainText.title = tab.url;
      importTargetDomainText.textContent = currentDomain;

      await loadWhitelist();
      await fetchCookies();
      await loadSessions();
    } catch (err) {
      console.error('Error saat inisialisasi tab:', err);
      showToast('Gagal memuat informasi tab aktif', 'error');
    }
  }

  async function fetchCookies() {
    if (!currentTab || !currentTab.url) return;

    try {
      // Ambil cookie spesifik untuk URL tab aktif
      const cookies = await chrome.cookies.getAll({ url: currentTab.url });
      allCookies = cookies || [];
      cookieCountText.textContent = `${allCookies.length} Cookie`;
      renderFilteredCookies();
    } catch (err) {
      console.error('Error saat mengambil cookie:', err);
      showToast('Gagal mengambil daftar cookie: ' + err.message, 'error');
    }
  }

  btnRefreshCookies.addEventListener('click', async () => {
    btnRefreshCookies.style.transform = 'rotate(180deg)';
    btnRefreshCookies.style.transition = 'transform 0.3s ease';
    await fetchCookies();
    setTimeout(() => {
      btnRefreshCookies.style.transform = 'none';
      btnRefreshCookies.style.transition = 'none';
    }, 300);
    showToast('Daftar cookie diperbarui', 'info');
  });

  // --------------------------------------------------------
  // Multi-Session / Account Switcher
  // --------------------------------------------------------
  function getSessionStorageKey(domain) {
    return `sessions_${domain.toLowerCase()}`;
  }

  async function loadSessions() {
    if (!currentDomain) return;
    try {
      const key = getSessionStorageKey(currentDomain);
      const data = await chrome.storage.local.get([key]);
      savedSessions = Array.isArray(data[key]) ? data[key] : [];
      renderSessionDropdown();
    } catch (err) {
      console.error('Gagal memuat sesi tersimpan:', err);
    }
  }

  function renderSessionDropdown() {
    sessionSelect.innerHTML = '<option value="">-- Pilih Akun / Sesi --</option>';
    savedSessions.forEach((sess) => {
      const opt = document.createElement('option');
      opt.value = sess.id;
      opt.textContent = `👤 ${sess.name} (${sess.cookies.length} cookie)`;
      if (sess.id === activeSessionId) {
        opt.selected = true;
      }
      sessionSelect.appendChild(opt);
    });
    updateSessionButtons();
  }

  function updateSessionButtons() {
    const selectedId = sessionSelect.value;
    btnApplySession.disabled = !selectedId;
    btnDeleteSession.style.display = selectedId ? 'inline-flex' : 'none';
  }

  sessionSelect.addEventListener('change', () => {
    updateSessionButtons();
  });

  btnOpenSaveSessionModal.addEventListener('click', () => {
    if (!isWhitelisted) {
      showToast('Domain ini belum di-whitelist.', 'warning');
      return;
    }
    if (allCookies.length === 0) {
      showToast('Tidak ada cookie aktif untuk disimpan sebagai sesi.', 'warning');
      return;
    }

    saveSessionDomainText.textContent = currentDomain;
    saveSessionCookieCount.textContent = `${allCookies.length} Cookie`;
    inputSessionName.value = '';
    openModal(modalSaveSession);
    setTimeout(() => inputSessionName.focus(), 100);
  });

  inputSessionName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      btnConfirmSaveSession.click();
    }
  });

  btnConfirmSaveSession.addEventListener('click', async () => {
    const name = inputSessionName.value.trim();
    if (!name) {
      showToast('Silakan masukkan nama akun / label sesi!', 'warning');
      inputSessionName.focus();
      return;
    }

    const key = getSessionStorageKey(currentDomain);
    const existingIndex = savedSessions.findIndex((s) => s.name.toLowerCase() === name.toLowerCase());

    const sessionObj = {
      id: existingIndex >= 0 ? savedSessions[existingIndex].id : `sess_${Date.now()}`,
      name: name,
      domain: currentDomain,
      savedAt: new Date().toISOString(),
      cookies: allCookies.map((c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        secure: c.secure,
        httpOnly: c.httpOnly,
        sameSite: c.sameSite,
        expirationDate: c.expirationDate,
        session: c.session,
        storeId: c.storeId
      }))
    };

    if (existingIndex >= 0) {
      savedSessions[existingIndex] = sessionObj;
    } else {
      savedSessions.push(sessionObj);
    }

    try {
      await chrome.storage.local.set({ [key]: savedSessions });
      activeSessionId = sessionObj.id;
      closeModal(modalSaveSession);
      renderSessionDropdown();
      showToast(`Sesi akun "${name}" (${allCookies.length} cookie) berhasil disimpan!`, 'success');
    } catch (err) {
      console.error('Gagal menyimpan sesi:', err);
      showToast('Gagal menyimpan sesi: ' + err.message, 'error');
    }
  });

  btnApplySession.addEventListener('click', async () => {
    const selectedId = sessionSelect.value;
    const session = savedSessions.find((s) => s.id === selectedId);
    if (!session) return;

    if (!isWhitelisted) {
      showToast('Domain belum diizinkan pada whitelist!', 'error');
      return;
    }

    btnApplySession.disabled = true;
    btnApplySession.textContent = 'Switching...';

    try {
      // 1. Hapus cookie aktif saat ini
      for (const cookie of allCookies) {
        const protocol = cookie.secure ? 'https://' : 'http://';
        const cleanDomain = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
        const url = `${protocol}${cleanDomain}${cookie.path}`;
        try {
          await chrome.cookies.remove({
            url: url,
            name: cookie.name,
            storeId: cookie.storeId
          });
        } catch (_) {}
      }

      // 2. Set cookie dari sesi yang dipilih
      let successCount = 0;
      for (const c of session.cookies) {
        let targetCookieDomain = c.domain;
        if (!targetCookieDomain || !currentDomain.endsWith(targetCookieDomain.replace(/^\./, ''))) {
          targetCookieDomain = currentDomain;
        }

        const isSecure = Boolean(c.secure);
        const protocol = isSecure ? 'https://' : 'http://';
        const cleanHost = targetCookieDomain.startsWith('.') ? targetCookieDomain.slice(1) : targetCookieDomain;
        const cookiePath = c.path || '/';
        const cookieUrl = `${protocol}${cleanHost}${cookiePath}`;

        const details = {
          url: cookieUrl,
          name: String(c.name),
          value: String(c.value),
          path: cookiePath,
          secure: isSecure,
          httpOnly: Boolean(c.httpOnly)
        };

        if (c.sameSite) {
          const s = String(c.sameSite).toLowerCase();
          if (['no_restriction', 'lax', 'strict', 'unspecified'].includes(s)) {
            details.sameSite = s;
          }
        }

        if (!c.session && c.expirationDate && typeof c.expirationDate === 'number') {
          details.expirationDate = Math.round(c.expirationDate);
        }

        const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(cleanHost);
        if (!isIp && targetCookieDomain) {
          details.domain = targetCookieDomain;
        }

        let res = await setChromeCookie(details);
        if (!res) {
          delete details.domain;
          res = await setChromeCookie(details);
        }
        if (res) successCount++;
      }

      activeSessionId = session.id;
      showToast(`Beralih ke akun "${session.name}"! Merefresh halaman...`, 'success');

      // 3. Reload tab & fetch cookies
      if (currentTab && currentTab.id) {
        chrome.tabs.reload(currentTab.id);
      }
      await fetchCookies();
    } catch (err) {
      console.error('Error saat switch sesi:', err);
      showToast('Gagal menerapkan sesi: ' + err.message, 'error');
    } finally {
      btnApplySession.disabled = false;
      btnApplySession.textContent = 'Switch';
      updateSessionButtons();
    }
  });

  btnDeleteSession.addEventListener('click', async () => {
    const selectedId = sessionSelect.value;
    const session = savedSessions.find((s) => s.id === selectedId);
    if (!session) return;

    if (confirm(`Hapus sesi akun "${session.name}"?`)) {
      savedSessions = savedSessions.filter((s) => s.id !== selectedId);
      const key = getSessionStorageKey(currentDomain);
      try {
        await chrome.storage.local.set({ [key]: savedSessions });
        if (activeSessionId === selectedId) activeSessionId = null;
        renderSessionDropdown();
        showToast(`Sesi "${session.name}" berhasil dihapus.`, 'info');
      } catch (err) {
        showToast('Gagal menghapus sesi: ' + err.message, 'error');
      }
    }
  });

  // --------------------------------------------------------
  // Render & Filter Cookies
  // --------------------------------------------------------
  function formatExpiration(exp, session) {
    if (session || !exp) {
      return 'Session (Saat browser ditutup)';
    }
    const date = new Date(exp * 1000);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function renderFilteredCookies() {
    const searchTerm = cookieSearchInput.value.trim().toLowerCase();
    const filterType = cookieFilterSelect.value;

    const filtered = allCookies.filter((cookie) => {
      // Filter tipe
      if (filterType === 'session' && !cookie.session) return false;
      if (filterType === 'persistent' && cookie.session) return false;
      if (filterType === 'secure' && !cookie.secure) return false;
      if (filterType === 'httponly' && !cookie.httpOnly) return false;

      // Filter search (Name / Value)
      if (searchTerm) {
        const nameMatch = cookie.name.toLowerCase().includes(searchTerm);
        const valMatch = cookie.value.toLowerCase().includes(searchTerm);
        return nameMatch || valMatch;
      }

      return true;
    });

    cookieCountText.textContent = `${filtered.length} dari ${allCookies.length} Cookie`;

    if (filtered.length === 0) {
      cookieList.innerHTML = '';
      emptyState.style.display = 'block';
      emptyStateMsg.textContent =
        allCookies.length === 0
          ? 'Tidak ada cookie pada domain ini.'
          : 'Tidak ada cookie yang cocok dengan filter.';
      return;
    }

    emptyState.style.display = 'none';
    cookieList.innerHTML = '';

    filtered.forEach((cookie, index) => {
      const card = createCookieCard(cookie, index);
      cookieList.appendChild(card);
    });
  }

  function createCookieCard(cookie, index) {
    const card = document.createElement('div');
    card.className = 'cookie-card';
    card.id = `cookie-card-${index}`;

    // Format SameSite badge
    let sameSiteLabel = 'None';
    if (cookie.sameSite === 'lax') sameSiteLabel = 'Lax';
    else if (cookie.sameSite === 'strict') sameSiteLabel = 'Strict';
    else if (cookie.sameSite === 'no_restriction') sameSiteLabel = 'None';

    const isSession = cookie.session || !cookie.expirationDate;

    card.innerHTML = `
      <div class="cookie-card-header">
        <div class="cookie-name-group" title="${escapeHtml(cookie.name)}">
          <span class="cookie-name">${escapeHtml(cookie.name)}</span>
        </div>
        <div class="cookie-actions">
          <button class="btn-card-action btn-copy-one" title="Salin format name=value" data-index="${index}">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="btn-card-action btn-del-one" title="Hapus cookie ini" data-index="${index}">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="cookie-value-box">
        <span class="cookie-value-text masked" id="cookieVal-${index}" data-val="${escapeHtml(cookie.value)}">••••••••••••</span>
        <button class="btn-card-action btn-toggle-val" data-index="${index}" title="Lihat / Sembunyikan Nilai">
          <svg class="icon-eye" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      </div>

      <div class="cookie-meta-grid">
        <div class="meta-item" title="Domain: ${escapeHtml(cookie.domain)}">
          <span class="meta-label">Domain:</span>
          <span class="meta-value">${escapeHtml(cookie.domain)}</span>
        </div>
        <div class="meta-item" title="Path: ${escapeHtml(cookie.path)}">
          <span class="meta-label">Path:</span>
          <span class="meta-value">${escapeHtml(cookie.path)}</span>
        </div>
        <div class="meta-item" style="grid-column: span 2;" title="Expired: ${formatExpiration(cookie.expirationDate, cookie.session)}">
          <span class="meta-label">Expired:</span>
          <span class="meta-value">${formatExpiration(cookie.expirationDate, cookie.session)}</span>
        </div>
      </div>

      <div class="cookie-badges">
        ${cookie.secure ? '<span class="badge badge-secure">Secure</span>' : ''}
        ${cookie.httpOnly ? '<span class="badge badge-httponly">HttpOnly</span>' : ''}
        <span class="badge badge-samesite">SameSite: ${sameSiteLabel}</span>
        ${isSession ? '<span class="badge badge-session">Session</span>' : ''}
      </div>
    `;

    // Event listener: Copy single cookie
    const btnCopy = card.querySelector('.btn-copy-one');
    btnCopy.addEventListener('click', () => {
      const pairText = `${cookie.name}=${cookie.value}`;
      navigator.clipboard.writeText(pairText).then(() => {
        showToast(`Cookie "${cookie.name}" disalin ke clipboard!`, 'success');
      });
    });

    // Event listener: Toggle view value
    const btnToggle = card.querySelector('.btn-toggle-val');
    const valTextEl = card.querySelector(`#cookieVal-${index}`);
    btnToggle.addEventListener('click', () => {
      if (valTextEl.classList.contains('masked')) {
        valTextEl.classList.remove('masked');
        valTextEl.textContent = cookie.value;
        btnToggle.title = 'Sembunyikan Nilai';
      } else {
        valTextEl.classList.add('masked');
        valTextEl.textContent = '••••••••••••';
        btnToggle.title = 'Lihat Nilai';
      }
    });

    // Event listener: Delete single cookie
    const btnDel = card.querySelector('.btn-del-one');
    btnDel.addEventListener('click', async () => {
      if (confirm(`Hapus cookie "${cookie.name}"?`)) {
        await deleteCookie(cookie);
      }
    });

    return card;
  }

  async function deleteCookie(cookie) {
    try {
      const protocol = cookie.secure ? 'https://' : 'http://';
      const cleanDomain = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
      const url = `${protocol}${cleanDomain}${cookie.path}`;

      await chrome.cookies.remove({
        url: url,
        name: cookie.name,
        storeId: cookie.storeId
      });

      showToast(`Cookie "${cookie.name}" berhasil dihapus.`, 'success');
      await fetchCookies();
    } catch (err) {
      console.error('Gagal menghapus cookie:', err);
      showToast('Gagal menghapus cookie: ' + err.message, 'error');
    }
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Filter & Search Events
  cookieSearchInput.addEventListener('input', () => {
    btnClearSearch.style.display = cookieSearchInput.value ? 'block' : 'none';
    renderFilteredCookies();
  });

  btnClearSearch.addEventListener('click', () => {
    cookieSearchInput.value = '';
    btnClearSearch.style.display = 'none';
    renderFilteredCookies();
  });

  cookieFilterSelect.addEventListener('change', renderFilteredCookies);

  // --------------------------------------------------------
  // EXPORT COOKIES
  // --------------------------------------------------------
  btnExportModal.addEventListener('click', () => {
    if (!isWhitelisted) {
      showToast('Domain ini belum di-whitelist. Silakan tambahkan ke whitelist terlebih dahulu.', 'warning');
      return;
    }

    if (allCookies.length === 0) {
      showToast('Tidak ada cookie untuk diexport.', 'warning');
      return;
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      domain: currentDomain,
      totalCookies: allCookies.length,
      cookies: allCookies.map((c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        secure: c.secure,
        httpOnly: c.httpOnly,
        sameSite: c.sameSite,
        expirationDate: c.expirationDate,
        session: c.session,
        storeId: c.storeId
      }))
    };

    exportMetaDomain.textContent = currentDomain;
    exportMetaCount.textContent = allCookies.length;
    exportMetaDate.textContent = new Date().toLocaleString('id-ID');

    exportJsonPreview.value = JSON.stringify(exportData, null, 2);
    openModal(modalExport);
  });

  btnCopyExportJson.addEventListener('click', () => {
    const jsonStr = exportJsonPreview.value;
    navigator.clipboard.writeText(jsonStr).then(() => {
      showToast('Seluruh data JSON cookie disalin ke clipboard!', 'success');
    });
  });

  btnDownloadExportJson.addEventListener('click', () => {
    const jsonStr = exportJsonPreview.value;
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeDomain = currentDomain.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `cookies_${safeDomain}_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('File JSON cookie berhasil diunduh.', 'success');
  });

  // --------------------------------------------------------
  // IMPORT COOKIES
  // --------------------------------------------------------
  btnImportModal.addEventListener('click', () => {
    if (!isWhitelisted) {
      showToast('Domain ini belum di-whitelist. Silakan tambahkan ke whitelist terlebih dahulu.', 'warning');
      return;
    }

    // Reset Import Modal State
    importStepInput.style.display = 'block';
    importStepPreview.style.display = 'none';
    importStepResult.style.display = 'none';

    btnValidateImport.style.display = 'inline-flex';
    btnBackToInput.style.display = 'none';
    btnExecuteImport.style.display = 'none';
    btnFinishImport.style.display = 'none';

    importJsonInput.value = '';
    if (inputUploadCookieFile) inputUploadCookieFile.value = '';
    if (uploadFileInfo) uploadFileInfo.style.display = 'none';
    importParseError.style.display = 'none';
    importParseError.textContent = '';
    importParsedCookies = [];

    openModal(modalImport);
  });

  // --------------------------------------------------------
  // File Upload & Drag-and-Drop Handler
  // --------------------------------------------------------
  if (inputUploadCookieFile) {
    inputUploadCookieFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleCookieFile(file);
    });
  }

  if (btnRemoveUploadedFile) {
    btnRemoveUploadedFile.addEventListener('click', () => {
      if (inputUploadCookieFile) inputUploadCookieFile.value = '';
      importJsonInput.value = '';
      if (uploadFileInfo) uploadFileInfo.style.display = 'none';
      importParseError.style.display = 'none';
      showToast('File dibatalkan', 'info');
    });
  }

  function handleCookieFile(file) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      showToast('Peringatan: Pastikan file berekstensi .json', 'warning');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      importJsonInput.value = event.target.result;
      if (uploadFileNameText) {
        uploadFileNameText.textContent = `${file.name} (${formatFileSize(file.size)})`;
      }
      if (uploadFileInfo) uploadFileInfo.style.display = 'flex';
      importParseError.style.display = 'none';
      showToast(`File "${file.name}" berhasil dimuat!`, 'success');
    };
    reader.onerror = () => {
      showToast('Gagal membaca file: ' + file.name, 'error');
    };
    reader.readAsText(file);
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  // Drag & drop ke textarea
  importJsonInput.addEventListener('dragover', (e) => {
    e.preventDefault();
    importJsonInput.classList.add('drag-over');
  });

  importJsonInput.addEventListener('dragleave', () => {
    importJsonInput.classList.remove('drag-over');
  });

  importJsonInput.addEventListener('drop', (e) => {
    e.preventDefault();
    importJsonInput.classList.remove('drag-over');
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleCookieFile(e.dataTransfer.files[0]);
    }
  });

  // Step 1: Validate & Preview
  btnValidateImport.addEventListener('click', () => {
    const raw = importJsonInput.value.trim();
    if (!raw) {
      importParseError.textContent = 'Silakan masukkan atau tempelkan teks JSON.';
      importParseError.style.display = 'block';
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      importParseError.textContent = 'Format JSON tidak valid: ' + err.message;
      importParseError.style.display = 'block';
      return;
    }

    let cookieArray = [];
    let originDomain = '';

    if (Array.isArray(parsed)) {
      cookieArray = parsed;
    } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.cookies)) {
      cookieArray = parsed.cookies;
      originDomain = parsed.domain || '';
    } else {
      importParseError.textContent = 'Struktur data tidak valid. JSON harus berupa array cookie atau object dengan property "cookies".';
      importParseError.style.display = 'block';
      return;
    }

    if (cookieArray.length === 0) {
      importParseError.textContent = 'Daftar cookie kosong.';
      importParseError.style.display = 'block';
      return;
    }

    // Validasi item cookie
    const validCookies = [];
    for (let i = 0; i < cookieArray.length; i++) {
      const c = cookieArray[i];
      if (c && typeof c === 'object' && typeof c.name === 'string' && c.value !== undefined) {
        validCookies.push(c);
      }
    }

    if (validCookies.length === 0) {
      importParseError.textContent = 'Tidak ada cookie dengan format nama dan nilai yang valid.';
      importParseError.style.display = 'block';
      return;
    }

    importParsedCookies = validCookies;
    importParseError.style.display = 'none';

    // Update Preview UI
    previewTotalCount.textContent = validCookies.length;
    if (originDomain && originDomain !== currentDomain) {
      previewDomainBadge.textContent = `Asal: ${originDomain} ➔ Target: ${currentDomain}`;
      previewDomainBadge.className = 'badge badge-warning';
    } else {
      previewDomainBadge.textContent = `Target Domain: ${currentDomain}`;
      previewDomainBadge.className = 'badge badge-info';
    }

    previewTableBody.innerHTML = '';
    validCookies.forEach((c) => {
      const tr = document.createElement('tr');
      const flags = [
        c.secure ? 'Secure' : null,
        c.httpOnly ? 'HttpOnly' : null,
        c.sameSite ? `SameSite:${c.sameSite}` : null
      ].filter(Boolean).join(', ') || '-';

      const shortVal = String(c.value).length > 25 ? String(c.value).slice(0, 25) + '...' : String(c.value);

      tr.innerHTML = `
        <td><strong>${escapeHtml(c.name)}</strong></td>
        <td>${escapeHtml(c.domain || currentDomain)}</td>
        <td>${escapeHtml(c.path || '/')}</td>
        <td><small>${escapeHtml(flags)}</small></td>
        <td title="${escapeHtml(String(c.value))}">${escapeHtml(shortVal)}</td>
      `;
      previewTableBody.appendChild(tr);
    });

    importStepInput.style.display = 'none';
    importStepPreview.style.display = 'block';
    btnValidateImport.style.display = 'none';
    btnBackToInput.style.display = 'inline-flex';
    btnExecuteImport.style.display = 'inline-flex';
  });

  // Back to input
  btnBackToInput.addEventListener('click', () => {
    importStepInput.style.display = 'block';
    importStepPreview.style.display = 'none';
    btnValidateImport.style.display = 'inline-flex';
    btnBackToInput.style.display = 'none';
    btnExecuteImport.style.display = 'none';
  });

  // Step 2: Execute Import
  btnExecuteImport.addEventListener('click', async () => {
    if (!isWhitelisted) {
      showToast('Domain target belum diizinkan pada whitelist!', 'error');
      return;
    }

    btnExecuteImport.disabled = true;
    btnExecuteImport.textContent = 'Memproses...';

    let successCount = 0;
    let failedCount = 0;
    const logItems = [];

    for (const c of importParsedCookies) {
      try {
        // Tentukan domain target yang sesuai
        let targetCookieDomain = c.domain;
        
        // Jika domain cookie bawaan tidak kompatibel dengan hostname tab aktif, gunakan currentDomain
        if (!targetCookieDomain || !currentDomain.endsWith(targetCookieDomain.replace(/^\./, ''))) {
          targetCookieDomain = currentDomain;
        }

        const isSecure = Boolean(c.secure);
        const protocol = isSecure ? 'https://' : 'http://';
        const cleanHost = targetCookieDomain.startsWith('.')
          ? targetCookieDomain.slice(1)
          : targetCookieDomain;
        const cookiePath = c.path || '/';
        const cookieUrl = `${protocol}${cleanHost}${cookiePath}`;

        const details = {
          url: cookieUrl,
          name: String(c.name),
          value: String(c.value),
          path: cookiePath,
          secure: isSecure,
          httpOnly: Boolean(c.httpOnly)
        };

        // Normalisasi SameSite
        if (c.sameSite) {
          const s = String(c.sameSite).toLowerCase();
          if (['no_restriction', 'lax', 'strict', 'unspecified'].includes(s)) {
            details.sameSite = s;
          }
        }

        // Tangani Expiration Date
        if (!c.session && c.expirationDate && typeof c.expirationDate === 'number') {
          details.expirationDate = Math.round(c.expirationDate);
        }

        // Domain attribute jika bukan IP address (Chrome melarang explicit domain di IP seperti 127.0.0.1)
        const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(cleanHost);
        if (!isIp && targetCookieDomain) {
          details.domain = targetCookieDomain;
        }

        // Set Cookie via Chrome API
        const setResult = await setChromeCookie(details);

        if (setResult) {
          successCount++;
          logItems.push({
            name: c.name,
            status: 'success',
            msg: 'Berhasil diset'
          });
        } else {
          // Fallback tanpa atribut domain spesifik
          delete details.domain;
          const retryResult = await setChromeCookie(details);
          if (retryResult) {
            successCount++;
            logItems.push({
              name: c.name,
              status: 'success',
              msg: 'Berhasil (Host-only fallback)'
            });
          } else {
            failedCount++;
            logItems.push({
              name: c.name,
              status: 'failed',
              msg: chrome.runtime.lastError?.message || 'Ditolak oleh Chrome API'
            });
          }
        }
      } catch (err) {
        failedCount++;
        logItems.push({
          name: c.name,
          status: 'failed',
          msg: err.message
        });
      }
    }

    // Step 3: Show Result
    importStepPreview.style.display = 'none';
    importStepResult.style.display = 'block';
    resultSuccessCount.textContent = successCount;
    resultFailedCount.textContent = failedCount;

    importResultLog.innerHTML = '';
    logItems.forEach((item) => {
      const row = document.createElement('div');
      row.className = `log-item ${item.status}`;
      row.innerHTML = `<span>${escapeHtml(item.name)}</span><span>${escapeHtml(item.msg)}</span>`;
      importResultLog.appendChild(row);
    });

    btnBackToInput.style.display = 'none';
    btnExecuteImport.style.display = 'none';
    btnExecuteImport.disabled = false;
    btnExecuteImport.textContent = 'Terapkan Cookie Sekarang';
    btnFinishImport.style.display = 'inline-flex';

    showToast(`Proses selesai: ${successCount} berhasil, ${failedCount} gagal.`, successCount > 0 ? 'success' : 'error');
  });

  function setChromeCookie(details) {
    return new Promise((resolve) => {
      chrome.cookies.set(details, (cookie) => {
        if (chrome.runtime.lastError || !cookie) {
          resolve(null);
        } else {
          resolve(cookie);
        }
      });
    });
  }

  // Finish Import
  btnFinishImport.addEventListener('click', async () => {
    closeModal(modalImport);
    await fetchCookies();
    // Berikan opsi reload halaman tab
    if (confirm('Cookie telah diimpor. Apakah Anda ingin merefresh halaman website sekarang agar sesi aktif?')) {
      chrome.tabs.reload(currentTab.id);
    }
  });

  // Mulai inisialisasi ekstensi
  await initActiveTab();
});
