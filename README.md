# 🍪 Cookie Manager Dev

<p align="center">
  <img src="icons/icon128.png" alt="Cookie Manager Dev Logo" width="100" />
</p>

<p align="center">
  <strong>Ekstensi Browser Chrome (Manifest V3) buat Developer yang suka ngotak-ngatik Cookie tanpa ribet buka DevTools.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Manifest-V3-success?style=flat-square" alt="Manifest V3">
  <img src="https://img.shields.io/badge/Platform-Chromium%20%7C%20Brave%20%7C%20Edge-orange?style=flat-square" alt="Chromium">
  <img src="https://img.shields.io/badge/Made%20With-Kopi%20Hitam%20%26%20Doa-darkviolet?style=flat-square" alt="Made With Love">
</p>

---

## ⚡ Fitur Utama

- 🔍 **Live Cookie Viewer**: Lihat seluruh cookie domain aktif secara instan, lengkap dengan atribut `HttpOnly`, `Secure`, `SameSite`, dan `Expires`.
- ➕ **Add & Edit Cookie On-The-Fly**: Bikin cookie baru atau modifikasi value cookie lama tanpa reload bolak-balik.
- 🗑️ **Single / Batch Delete**: Hapus cookie yang bikin pusing satu per satu atau sapu bersih sekaligus.
- 📦 **Export & Import JSON**: Backup state cookie ke format JSON dan inject kembali dalam 1 klik.
- 🛡️ **Domain Whitelist & Safety Guard**: Proteksi bawaan biar kamu nggak sengaja hapus/timpa cookie di web yang nggak semestinya.
- 🌙 **Sleek Dark Mode**: Desain UI modern, ramah mata programmer yang coding jam 2 pagi.

---

## 🚀 Cara Pasang (Installation)

Karena ekstensi ini belum (atau memang sengaja tidak) nongkrong di Chrome Web Store:

1. **Clone atau Download** repositori ini ke komputer kamu:
   ```bash
   git clone https://github.com/robinta19/cokies.git
   ```
2. Buka browser Chromium favorit kamu (Chrome, Edge, Brave, dll).
3. Masuk ke halaman extensions:
   - Chrome: `chrome://extensions`
   - Brave: `brave://extensions`
   - Edge: `edge://extensions`
4. Aktifkan **Developer mode** (toggle di pojok kanan atas).
5. Klik tombol **Load unpacked** (Muat yang belum dibongkar).
6. Pilih folder repositori ini (`cokies`).
7. Selesai! Pin icon Cookie Manager di toolbar browser kamu. 🎉

---

## 💀 DISCLAIMER: Dosa Ditanggung Sendiri Bre!

> ### ⚠️ PERINGATAN KERAS DARI PENCIPTA:
> 
> 1. **Dosa Ditanggung Sendiri**: Tool ini dibuat murni untuk keperluan **Development, Debugging, Testing, dan DevOps**. Kalau kamu pakai buat bajak sesi orang, nge-bypass login ilegal, atau aksi jahiliyah lainnya... **tanggung sendiri dosanya di dunia dan akhirat, jangan bawa-bawa developer!** 🗿
> 2. **Session Hangus Bukan Urusan Kami**: Kalau kamu iseng klik *Clear All Cookies* di akun penting pas lagi transaksi atau upload dokumen skripsi, jangan panik, itu namanya pembelajaran hidup.
> 3. **Keep Your JSON Safe**: Export cookie itu isinya data sensitif (termasuk session token kamu). Jangan asal paste JSON cookie kamu di grup WhatsApp keluarga apalagi status Threads.
> 4. **No Warranty**: Tool ini disediakan *as-is*. Tidak ada jaminan server kantor kamu nggak meledak kalau kamu salah inject cookie `isAdmin=true`.

---

## 🛠️ Tech Stack

- **HTML5 & Vanilla CSS**: UI modern, responsive, no bloated frameworks.
- **Vanilla JavaScript (ES6+)**: Ringan, cepat, langsung nyambung ke Chrome Extension API (`chrome.cookies`, `chrome.storage`, `chrome.tabs`).
- **Manifest V3**: Standar ekstensi Chrome generasi terbaru.

---

## 🤝 Kontribusi

Punya ide fitur gokil atau nemu bug aneh?
1. Fork repo ini
2. Bikin branch baru (`git checkout -b feature/fitur-keren`)
3. Commit perubahanmu (`git commit -m 'feat: nambahin fitur anti apes'`)
4. Push ke branch (`git push origin feature/fitur-keren`)
5. Bikin **Pull Request**

---

## 📜 Lisensi

Project ini dilisensikan di bawah [MIT License](LICENSE).  
Bebas dipakai, dimodifikasi, dan disebarluaskan — asal tetap ingat: *Dosa ditanggung masing-masing!* ✌️

## Development & Collaboration
This project follows standard open source contribution workflows with automated testing and pair-programming reviews.

### Code Style & Architecture
- Follow standard JavaScript ESLint configurations.
- Use async/await for Chrome extension runtime and storage APIs.
