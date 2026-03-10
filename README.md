# TikTok Live Monitor 🎯

Monitor TikTok Live chat, gift, dan viewer count secara real-time dengan video stream langsung.

![Stack](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
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
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Server** | Express + Socket.io |
| **Styling** | Tailwind CSS |
| **Video Player** | flv.js |
| **TikTok Connector** | tiktok-live-connector |

### Dependencies

```json
{
  "next": "14.2.0",
  "react": "^18",
  "react-dom": "^18",
  "express": "^4.18.3",
  "socket.io": "^4.7.4",
  "socket.io-client": "^4.7.4",
  "tiktok-live-connector": "^1.1.15",
  "flv.js": "^1.6.2",
  "uuid": "^9.0.1"
}
```

### Dev Dependencies

```json
{
  "typescript": "^5",
  "@types/node": "^20",
  "@types/react": "^18",
  "@types/react-dom": "^18",
  "@types/uuid": "^9",
  "tailwindcss": "^3.4.1",
  "postcss": "^8",
  "autoprefixer": "^10"
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
│              server.js (Express + Socket.io)         │
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
├── server.js                  # Custom Express + Socket.io server
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
- Koneksi otomatis terputus jika live berakhir
- Maksimum **200 pesan** disimpan di frontend (FIFO)
- Beberapa streamer mungkin membatasi akses via API TikTok

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
