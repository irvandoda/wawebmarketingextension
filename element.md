# WhatsApp Web Elements Summary

Dokumen ini merangkum selector dan struktur elemen penting di WhatsApp Web yang digunakan untuk kegiatan automation dan WhatsApp Marketing.

## 🏗️ Struktur Dasar (Root)
| Element | Selector / ID | Deskripsi |
|---------|---------------|-----------|
| **HTML Root** | `html#whatsapp-web` | Elemen root aplikasi. |
| **App Mount** | `#mount_0_0_SP` | Titik utama aplikasi WhatsApp Web dirender. |
| **Startup Screen** | `#wa_web_initial_startup` | Layar loading/splash saat pertama dibuka. |

## 💬 Chat & Messaging
| Fitur | Selector Utama | Alternative/Fallback |
|-------|----------------|----------------------|
| **Input Box** | `[data-testid="conversation-compose-box-input"]` | `[data-tab="10"]`, `div[contenteditable="true"][role="textbox"]` |
| **Send Button** | `[data-testid="send"]` | `button[data-tab="11"]`, `button[aria-label="Send"]` |
| **Message List** | `[data-testid="conversation-panel-messages"]` | Elemen penampung semua bubble chat. |
| **Chat Bubble** | `[data-testid="msg-container"]` | Kontainer untuk satu pesan. |

## 📎 Attachments (Media)
| Fitur | Selector Utama | Alternative/Fallback |
|-------|----------------|----------------------|
| **Attach Menu** | `[data-testid="clip"]` | `[data-icon="clip"]`, `[data-icon="attach-menu-plus"]` |
| **File Input** | `input[type="file"]` | `input[accept*="image"]` |
| **Preview Send** | `[aria-label="Send"][role="button"]` | `[data-testid="send"]`, `[data-icon="wds-ic-send-filled"]` |

## 👥 Contact & Group Extraction
| Fitur | Selector Utama | Deskripsi |
|-------|----------------|-----------|
| **Chat List Item** | `[data-testid="cell-frame-container"]` | Satu baris chat di daftar chat sebelah kiri. |
| **Contact Title** | `[data-testid="cell-frame-title"]` | Nama kontak atau nomor di daftar chat. |
| **Last Message** | `[data-testid="last-msg-status"]` | Status pesan terakhir (centang/jam). |
| **Profile Pic** | `[data-testid="avatar"]` | Container foto profil. |

## 🔍 Navigation & Search
| Fitur | Selector | Deskripsi |
|-------|----------|-----------|
| **Search Box** | `[data-testid="chat-list-search"]` | Kotak pencarian kontak/chat. |
| **New Chat** | `[data-testid="menu-bar-chat"]` | Tombol untuk memulai chat baru. |
| **Menu Toggle** | `[data-testid="menu-bar-menu"]` | Tombol titik tiga (Setelan, Profil, dll). |

---

> [!TIP]
> **Pro Tip for Marketing**: WhatsApp Web sering melakukan update pada class name-nya melalui proses obfuscation. Selalu gunakan `[data-testid]` atau atribut ARIA jika tersedia, karena atribut ini jauh lebih stabil dibandingkan class CSS biasa.

> [!IMPORTANT]
> Untuk mengirim pesan ke nomor baru tanpa menyimpannya, gunakan URL scheme: `https://web.whatsapp.com/send?phone=62812xxxxxx`.
