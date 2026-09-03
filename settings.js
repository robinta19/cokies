// ==========================================================
// Cookie Manager Dev - Settings Script
// ==========================================================

document.addEventListener('DOMContentLoaded', async () => {
  const DEFAULT_WHITELIST = ['localhost', '127.0.0.1', '0.0.0.0'];

  // DOM Elements
  const formAddDomain = document.getElementById('formAddDomain');
  const inputNewDomain = document.getElementById('inputNewDomain');
  const whitelistUl = document.getElementById('whitelistUl');
  const whitelistCount = document.getElementById('whitelistCount');
  const btnResetDefault = document.getElementById('btnResetDefault');
  const btnExportBackup = document.getElementById('btnExportBackup');
  const inputRestoreFile = document.getElementById('inputRestoreFile');
  const toastContainer = document.getElementById('toastContainer');

  let currentWhitelist = [];

  // Toast notification
  function showToast(message, type = 'info', duration = 3000) {
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

  // Load Whitelist from storage
  async function loadWhitelist() {
    try {
      const data = await chrome.storage.local.get(['whitelistedDomains']);
      if (Array.isArray(data.whitelistedDomains)) {
        currentWhitelist = data.whitelistedDomains;
      } else {
        currentWhitelist = [...DEFAULT_WHITELIST];
        await chrome.storage.local.set({ whitelistedDomains: currentWhitelist });
      }
      renderWhitelist();
    } catch (err) {
      console.error('Gagal memuat whitelist:', err);
      showToast('Gagal memuat whitelist dari storage', 'error');
    }
  }

  // Save Whitelist to storage
  async function saveWhitelist() {
    try {
      await chrome.storage.local.set({ whitelistedDomains: currentWhitelist });
      renderWhitelist();
    } catch (err) {
      console.error('Gagal menyimpan whitelist:', err);
      showToast('Gagal menyimpan perubahan: ' + err.message, 'error');
    }
  }

  // Clean domain input
  function cleanDomainInput(raw) {
    let d = raw.trim().toLowerCase();
    // Hapus protocol jika user menempelkan URL
    d = d.replace(/^https?:\/\//i, '');
    // Hapus path
    const slashIdx = d.indexOf('/');
    if (slashIdx !== -1) d = d.substring(0, slashIdx);
    // Hapus port jika ada kecuali IP/localhost
    if (!d.startsWith('localhost:')) {
      const colonIdx = d.indexOf(':');
      if (colonIdx !== -1) d = d.substring(0, colonIdx);
    }
    return d;
  }

  // Render list
  function renderWhitelist() {
    whitelistCount.textContent = currentWhitelist.length;
    whitelistUl.innerHTML = '';

    if (currentWhitelist.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'domain-item';
      emptyLi.innerHTML = '<span style="color: var(--text-muted); font-style: italic;">Belum ada domain diizinkan. Silakan tambahkan domain di atas.</span>';
      whitelistUl.appendChild(emptyLi);
      return;
    }

    currentWhitelist.forEach((domain, idx) => {
      const li = document.createElement('li');
      li.className = 'domain-item';
      li.innerHTML = `
        <span class="domain-name">${escapeHtml(domain)}</span>
        <div class="domain-actions">
          <button class="btn-del" data-index="${idx}" title="Hapus domain ini">Hapus</button>
        </div>
      `;

      li.querySelector('.btn-del').addEventListener('click', () => {
        removeDomain(idx);
      });

      whitelistUl.appendChild(li);
    });
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

  // Add domain
  formAddDomain.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawValue = inputNewDomain.value;
    const cleaned = cleanDomainInput(rawValue);

    if (!cleaned) {
      showToast('Nama domain tidak valid.', 'error');
      return;
    }

    if (currentWhitelist.includes(cleaned)) {
      showToast(`Domain "${cleaned}" sudah ada di dalam whitelist.`, 'warning');
      return;
    }

    currentWhitelist.push(cleaned);
    await saveWhitelist();
    inputNewDomain.value = '';
    showToast(`Domain "${cleaned}" berhasil ditambahkan.`, 'success');
  });

  // Remove domain
  async function removeDomain(index) {
    const domain = currentWhitelist[index];
    if (confirm(`Apakah Anda yakin ingin menghapus "${domain}" dari whitelist?`)) {
      currentWhitelist.splice(index, 1);
      await saveWhitelist();
      showToast(`Domain "${domain}" telah dihapus.`, 'info');
    }
  }

  // Reset to default
  btnResetDefault.addEventListener('click', async () => {
    if (confirm('Kembalikan whitelist ke pengaturan default (localhost, 127.0.0.1, 0.0.0.0)?')) {
      currentWhitelist = [...DEFAULT_WHITELIST];
      await saveWhitelist();
      showToast('Whitelist dikembalikan ke setelan default.', 'success');
    }
  });

  // Export Backup
  btnExportBackup.addEventListener('click', () => {
    const backupObj = {
      appName: 'Cookie Manager Dev',
      version: '1.0.0',
      backupDate: new Date().toISOString(),
      whitelistedDomains: currentWhitelist
    };

    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `cookie_manager_whitelist_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('File backup whitelist berhasil diunduh.', 'success');
  });

  // Restore Backup
  inputRestoreFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        let domainsToRestore = [];

        if (Array.isArray(parsed)) {
          domainsToRestore = parsed;
        } else if (parsed && Array.isArray(parsed.whitelistedDomains)) {
          domainsToRestore = parsed.whitelistedDomains;
        } else {
          showToast('File backup tidak valid: Format data tidak dikenali.', 'error');
          return;
        }

        // Sanitasi dan hilangkan duplikat
        const sanitized = Array.from(
          new Set(
            domainsToRestore
              .filter((d) => typeof d === 'string' && d.trim().length > 0)
              .map((d) => cleanDomainInput(d))
          )
        );

        if (sanitized.length === 0) {
          showToast('Tidak ada domain valid ditemukan dalam file backup.', 'warning');
          return;
        }

        if (confirm(`Ditemukan ${sanitized.length} domain dalam file backup. Pulihkan dan perbarui whitelist sekarang?`)) {
          currentWhitelist = sanitized;
          await saveWhitelist();
          showToast(`Berhasil memulihkan ${sanitized.length} domain ke whitelist!`, 'success');
        }
      } catch (err) {
        console.error('Error saat membaca file backup:', err);
        showToast('Gagal memproses file JSON backup: ' + err.message, 'error');
      } finally {
        inputRestoreFile.value = '';
      }
    };
    reader.readAsText(file);
  });

  // Inisialisasi awal
  await loadWhitelist();
});
