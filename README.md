# WA Marketing Web - WhatsApp Bulk Message Sender

Extension browser untuk mengirim pesan WhatsApp secara massal melalui WhatsApp Web.

## ✨ Fitur Utama

### 1. Bulk Message Sender
- ✅ Kirim pesan ke banyak kontak sekaligus
- ✅ Tidak buka tab baru (bekerja di tab yang sama)
- ✅ Auto-pilot seperti iMacros
- ✅ Import kontak dari CSV/Excel
- ✅ Paste langsung nomor telepon
- ✅ Personalisasi pesan dengan field dinamis
- ✅ Kontrol kecepatan dengan delay dan batch size
- ✅ Progress tracking real-time

### 2. Download Template
- 📥 Download template CSV dengan format yang benar
- 📝 Contoh data untuk panduan
- 🎯 Format: phone, name, first_name

### 3. Export Contacts
- 📤 Export kontak dari grup WhatsApp
- 📤 Export kontak dari label
- 📤 Export semua kontak dari chat list
- 💾 Format export: CSV

### 4. Transparent Sending Process
- 📊 Progress bar real-time di overlay
- ✓ Statistik: berhasil, gagal, total
- 💾 Export hasil pengiriman
- 🔄 Retry untuk pesan yang gagal
- ⏹ Stop kapan saja

### 5. Message Personalization
- `{{First-Name}}` - Nama depan kontak
- `{{Name}}` - Nama lengkap kontak
- `{{Phone}}` - Nomor telepon kontak

### 7. Attachment Support (New!)
- 📎 **Auto-Upload Media**: Mendukung pengiriman gambar secara massal.
- 🚀 **Two-Step Sending**: Mengirim gambar terlebih dahulu, baru kemudian pesan teks untuk memastikan delivery yang sempurna.
- 🛠 **Super Robust Detection**: Menggunakan algoritma cerdas untuk mendeteksi tombol Send di preview media, termasuk deteksi via SVG path koordinat.

### 8. Technical Documentation
- 📂 **Selector Reference**: Lihat [element.md](element.md) untuk daftar lengkap selector WhatsApp Web yang digunakan.
- ⚙️ **Connection Management**: Dilengkapi dengan sistem Ping/Pong untuk memastikan komunikasi antar komponen extension tetap stabil.

## Cara Install

### Chrome/Edge
1. Download atau clone repository ini
2. Buka `chrome://extensions/`
3. Aktifkan "Developer mode"
4. Klik "Load unpacked"
5. Pilih folder extension ini

### Firefox
1. Download atau clone repository ini
2. Buka `about:debugging#/runtime/this-firefox`
3. Klik "Load Temporary Add-on"
4. Pilih file `manifest.json`

## 🚀 Quick Start

Lihat [QUICK-START.md](QUICK-START.md) untuk panduan 5 menit setup dan kirim pesan pertama!

Atau ikuti langkah berikut:

### Persiapan
1. Buka WhatsApp Web (https://web.whatsapp.com)
2. Login dengan scan QR code
3. Pastikan WhatsApp Web sudah terbuka dan siap

### Mengirim Bulk Message

1. **Klik icon extension** di toolbar browser (pastikan sudah di-pin)

2. **Download Template CSV** (opsional)
   - Klik tombol "📥 Download Template"
   - Buka file `contacts-template.csv`
   - Isi dengan data kontak Anda:
     - `phone`: Nomor dengan kode negara (contoh: 628123456789)
     - `name`: Nama lengkap (opsional)
     - `first_name`: Nama depan (opsional)

3. **Import Kontak**
   - Klik "📂 Import dari File" dan pilih CSV Anda
   - Atau paste langsung nomor telepon (satu nomor per baris)

4. **Tulis Pesan**
   - Ketik pesan di textarea
   - Gunakan personalisasi:
     - `{{First-Name}}` - Nama depan
     - `{{Name}}` - Nama lengkap
     - `{{Phone}}` - Nomor telepon

5. **Atur Pengiriman**
   - Delay: 5-20 detik (rekomendasi: 8-10 detik)
   - Batch size: 10-30 pesan (rekomendasi: 20)

6. **Mulai Kirim**
   - Klik "Start Sending"
   - Extension akan otomatis:
     - Buka chat contact
     - Ketik pesan
     - Kirim pesan
     - Tunggu delay
     - Lanjut ke contact berikutnya
   - Semua dilakukan di tab yang sama, tanpa buka tab baru!

7. **Monitor Progress**
   - Overlay muncul di pojok kanan atas WhatsApp Web
   - Menampilkan status real-time
   - Bisa stop kapan saja dengan klik tombol "Stop"

### Format Nomor Telepon
```
628123456789
628987654321
6281234567890
```

### Import dari CSV
Gunakan tombol "📥 Download Template" untuk mendapatkan format yang benar:
```csv
phone,name,first_name
628123456789,John Doe,John
628987654321,Jane Smith,Jane
6281234567890,Bob Johnson,Bob
```

Kolom yang tersedia:
- `phone` (wajib): Nomor dengan kode negara
- `name` (opsional): Nama lengkap untuk {{Name}}
- `first_name` (opsional): Nama depan untuk {{First-Name}}

## Pengaturan Pengiriman

- **Delay**: Jeda waktu antar pesan (3-60 detik)
- **Batch Size**: Jumlah pesan per batch (1-50)
- Disarankan: delay 5-10 detik, batch size 10-20

## Keamanan & Privasi

- Extension ini hanya bekerja di WhatsApp Web
- Tidak menyimpan data kontak atau pesan
- Tidak mengirim data ke server eksternal
- Semua proses dilakukan di browser Anda

## Batasan

- Ikuti kebijakan WhatsApp untuk menghindari banned
- Jangan kirim spam atau pesan tidak diinginkan
- Gunakan delay yang wajar antar pesan
- Mulai dengan batch kecil untuk testing

## Troubleshooting

### Pesan tidak terkirim
- Pastikan WhatsApp Web sudah login
- Cek format nomor telepon (harus dengan kode negara)
- Tingkatkan delay antar pesan

### Extension tidak muncul
- Refresh halaman WhatsApp Web
- Restart browser
- Reinstall extension

## Disclaimer

Extension ini dibuat untuk tujuan marketing yang sah. Pengguna bertanggung jawab penuh atas penggunaan extension ini. Pastikan Anda mematuhi Terms of Service WhatsApp dan tidak mengirim spam.

## Lisensi

MIT License


## 📚 Dokumentasi Lengkap

### 📖 Panduan Pengguna
- [QUICK-START.md](QUICK-START.md) - Panduan 5 menit untuk pemula
- [USAGE-GUIDE.md](USAGE-GUIDE.md) - Panduan penggunaan lengkap
- [INSTALL.md](INSTALL.md) - Panduan instalasi detail

### 🔧 Dokumentasi Teknis
- [FAQ.md](docs/FAQ.md) - Frequently Asked Questions
- [BEST-PRACTICES.md](docs/BEST-PRACTICES.md) - Best practices marketing
- [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Solusi masalah
- [HOW-IT-WORKS.md](docs/HOW-IT-WORKS.md) - Cara kerja extension
- [API.md](docs/API.md) - API documentation

### 📝 Lainnya
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [CONTRIBUTING.md](CONTRIBUTING.md) - Panduan kontributor
- [PROJECT-SUMMARY.md](PROJECT-SUMMARY.md) - Project summary

## ⚠️ Disclaimer

Extension ini dibuat untuk tujuan marketing yang sah. Pengguna bertanggung jawab penuh atas:
- Kepatuhan terhadap WhatsApp Terms of Service
- Hukum dan regulasi lokal
- Anti-spam laws (CAN-SPAM, GDPR, dll)
- Mendapatkan consent dari penerima

**Gunakan dengan bijak dan bertanggung jawab!**

## 🤝 Contributing

Kontribusi sangat diterima! Lihat [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan.

## 📄 License

MIT License - Bebas digunakan, dimodifikasi, dan didistribusikan.

Lihat [LICENSE](LICENSE) untuk detail lengkap.

## 🆘 Support

Butuh bantuan?
- 📖 Baca dokumentasi di folder `docs/`
- ❓ Cek [FAQ.md](docs/FAQ.md)
- 🐛 Laporkan bug di GitHub Issues
- 💡 Request fitur di GitHub Issues

## 🌟 Star This Project

Jika project ini bermanfaat, berikan star! ⭐

---

**Built with ❤️ for WhatsApp Marketing Community**

**Remember: Use responsibly and ethically!** 🙏
