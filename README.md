# TikTok Live Monitor 🎯

Monitor TikTok Live chat secara real-time menggunakan Next.js 14, Socket.io, dan `tiktok-live-connector`.

## Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Server**: Custom Express + Socket.io
- **Styling**: Tailwind CSS
- **Library**: `tiktok-live-connector`

## Cara Install & Jalankan

### 1. Install dependencies

```bash
npm install
```

### 2. Jalankan development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### 3. Build untuk production

```bash
npm run build
npm start
```

## Cara Pakai

1. Masukkan username TikTok streamer (tanpa `@`, contoh: `cristiano`)
2. Klik **Connect**
3. Chat, gift, dan viewer count akan muncul secara real-time
4. Klik **Disconnect** untuk keluar dari room

## Arsitektur

```
┌─────────────────────────────────────────────┐
│                 Browser                      │
│  Next.js Frontend  ←──Socket.io──→  server.js│
└─────────────────────────────────────────────┘
                                      │
                              tiktok-live-connector
                                      │
                              TikTok WebCast API
```

`server.js` adalah custom Express server yang:
1. Menjalankan Next.js app
2. Membuat Socket.io server
3. Saat `join-room` event → membuka koneksi ke TikTok live
4. Forward event `chat`, `gift`, `like`, `roomUser` ke frontend

## Catatan

- User TikTok **harus sedang live** agar bisa connect
- Koneksi akan otomatis terputus jika live berakhir
- Maksimum 200 pesan disimpan di frontend (FIFO)
