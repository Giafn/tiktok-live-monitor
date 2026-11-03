# TikTok Live Monitor 🎯

Monitor TikTok Live chat, gift, dan viewer count secara real-time dengan video stream langsung.

![Stack](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Socket.io](https://img.shields.io/badge/Socket.io-4-red?logo=socket.io)

## ✨ Fitur

- 📺 **Live Video Stream** - Nonton live stream TikTok langsung di aplikasi
- 💬 **Real-time Chat** - Lihat chat dari viewers live
- 🎁 **Gift Tracking** - Track gift yang dikirim viewers
- ❤️ **Like Counter** - Hitung total like yang diterima
- 👥 **Viewer Count** - Lihat jumlah viewers secara real-time
- 🎨 **Modern UI** - Interface bersih dengan Tailwind CSS
- 📡 **Webhook Support** - Integrasikan event ke aplikasi eksternal

## 🛠️ Tech Stack

| Kategori | Package |
|----------|---------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript |
| **Server** | Node.js HTTP + Socket.io |
| **Styling** | Tailwind CSS 4 |
| **Video Player** | flv.js |
| **TikTok Connector** | tiktok-live-connector 2 |

### Dependencies

```json
{
  "next": "^16.4.4",
  "react": "^19.3.1",
  "react-dom": "^19.3.1",
  "express": "^5.3.0",
  "socket.io": "^4.8.4",
  "socket.io-client": "^4.8.4",
  "tiktok-live-connector": "^2.5.0",
  "flv.js": "^1.6.2",
  "uuid": "^14.0.3"
}
```

### Dev Dependencies

```json
{
  "typescript": "^5",
  "@types/node": "^26",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "tailwindcss": "^4",
  "@tailwindcss/postcss": "^4",
  "postcss": "^8"
}
```

## 🚀 Cara Install & Jalankan

### 1. Install Dependencies

```bash
npm install
```

### 2. Jalankan Development Server

```bash
npm run dev
```

Server akan berjalan di: **http://localhost:3000**

### 3. Build untuk Production

```bash
npm run build
npm start
```

## 📖 Cara Pakai

1. Buka aplikasi di browser
2. Masukkan **username TikTok** streamer (tanpa `@`, contoh: `cristiano`)
3. Klik tombol **Connect**
4. Tunggu hingga terhubung - video stream, chat, gift, dan viewer count akan muncul real-time
5. Klik **Disconnect** untuk keluar dari room

## 🔌 Webhook Integration

Untuk mengintegrasikan event ke aplikasi eksternal (Discord, database, dll):

1. Klik icon **⚙️ Settings** di header
2. Masukkan URL webhook Anda (contoh: `https://your-api.com/webhook`)
3. Klik **Save**
4. Connect ke live TikTok
5. Event `chat` dan `gift` akan dikirim ke webhook Anda

📄 **Dokumentasi lengkap:** [WEBHOOK_DOCS.md](WEBHOOK_DOCS.md)

## 🏗️ Arsitektur

```
┌─────────────────────────────────────────────────────┐
│                  Browser (Client)                    │
│  ┌──────────────┐    ┌──────────────────────────┐   │
│  │  Next.js UI  │ ←→ │   Socket.io Client       │   │
│  │  - Video     │    │   - join-room            │   │
│  │  - Chat      │    │   - new-chat             │   │
│  │  - Stats     │    │   - new-gift             │   │
│  └──────────────┘    │   - new-like             │   │
│                      │   - viewer-count         │   │
│                      └──────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                         ↕ WebSocket
┌─────────────────────────────────────────────────────┐
│              server.js (Node.js + Socket.io)         │
│  ┌──────────────────┐    ┌──────────────────────┐   │
│  │  Socket.io Server│ ←→ │ TikTokLiveConnector  │   │
│  │  - Broadcast     │    │ - Connect to TikTok  │   │
│  │  - Room Mgmt     │    │ - Parse Events       │   │
│  └──────────────────┘    └──────────────────────┘   │
└─────────────────────────────────────────────────────┘
                         ↕ HTTP
              TikTok WebCast API
```

## 📁 Struktur Folder

```
tiktok-live-monitor/
├── app/
│   ├── components/
│   │   ├── VideoPlayer.tsx    # FLV video player component
│   │   ├── ChatSection.tsx    # Chat feed display
│   │   ├── ConnectionForm.tsx # Username input & connect button
│   │   ├── StatsBar.tsx       # Viewer/like/message counter
│   │   ├── Header.tsx         # Navbar dengan settings button
│   │   ├── SettingsModal.tsx  # Modal webhook settings
│   │   └── ...
│   ├── hooks/
│   │   └── useTikTokSocket.ts # Socket.io client hook
│   ├── globals.css            # Global styles & Tailwind
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main page
├── types/
│   └── flv.d.ts               # FLV.js type definitions
├── server.js                  # Custom Node.js + Socket.io server
├── package.json
├── README.md
└── WEBHOOK_DOCS.md            # Dokumentasi webhook integration
```

## 🔌 Socket Events

### Client → Server

| Event | Payload | Deskripsi |
|-------|---------|-----------|
| `join-room` | `string` (username) | Connect ke TikTok live |
| `leave-room` | - | Disconnect dari room |

### Server → Client

| Event | Payload | Deskripsi |
|-------|---------|-----------|
| `status` | `{ type, message, roomId?, streamUrl? }` | Status koneksi |
| `new-chat` | `{ id, uniqueId, nickname, comment, ... }` | Chat baru |
| `new-gift` | `{ id, uniqueId, nickname, giftName, repeatCount, ... }` | Gift diterima |
| `new-like` | `{ uniqueId, nickname, likeCount, totalLikeCount }` | Like event |
| `viewer-count` | `{ viewerCount }` | Update jumlah viewers |

## ⚠️ Catatan Penting

- **User harus sedang live** untuk bisa connect
- **Pastikan username benar** — username salah akan ditolak API TikTok (`user_not_found`)
- Koneksi otomatis terputus jika live berakhir
- Maksimum **200 pesan** disimpan di frontend (FIFO)
- Koneksi memakai jalur gratis Euler Stream (plan Community); fitur premium seperti katalog gift lengkap membutuhkan API key — set env `SIGN_API_KEY` jika tersedia

## 🎨 Customization

### Mengubah Port

Edit di `server.js`:

```javascript
const port = process.env.PORT || 3000; // Ganti 3000 ke port lain
```

### Mengubah Max Feed

Edit di `app/page.tsx`:

```typescript
const MAX_FEED = 200; // Ganti angka sesuai kebutuhan
```

## 📄 License

MIT
