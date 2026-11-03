const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { TikTokLiveConnection } = require('tiktok-live-connector');
const { v4: uuidv4 } = require('uuid');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store webhook URL per socket
const webhookUrls = new Map();

// HTTP POST helper for webhook
async function sendWebhook(url, payload) {
  if (!url) {
    console.log('[Webhook] No URL configured, skipping');
    return;
  }

  console.log(`[Webhook] Sending ${payload.type} to ${url}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000), // 5s timeout
    });
    console.log(`[Webhook] Sent to ${url}: ${payload.type}, status: ${response.status}`);
  } catch (err) {
    console.error(`[Webhook] Failed to send to ${url}:`, err.message);
  }
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    allowEIO3: true,
  });

  // Track active TikTok connections per socket
  const activeConnections = new Map();

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Handle webhook URL setup
    socket.on('set-webhook', (url) => {
      if (url) {
        webhookUrls.set(socket.id, url);
        console.log(`[Webhook] URL set for socket ${socket.id}: ${url}`);
      } else {
        webhookUrls.delete(socket.id);
        console.log(`[Webhook] URL removed for socket ${socket.id}`);
      }
    });

    socket.on('join-room', async (tiktokUsername) => {
      // Clean username
      const cleanUsername = tiktokUsername.replace('@', '').trim();

      if (!cleanUsername) {
        socket.emit('error', 'Username tidak boleh kosong.');
        return;
      }

      console.log(`[Socket] join-room request for: @${cleanUsername}`);

      // Disconnect existing connection if any
      if (activeConnections.has(socket.id)) {
        try {
          await activeConnections.get(socket.id).disconnect();
        } catch (e) {}
        activeConnections.delete(socket.id);
      }

      socket.emit('status', { type: 'connecting', message: `Menghubungkan ke @${cleanUsername}...` });

      // enableExtendedGiftInfo dimatikan: endpoint gift gallery butuh API key berbayar (Euler Stream Business).
      // Nama gift tetap tersedia lewat data.gift.name dari proto.
      const tiktokConnection = new TikTokLiveConnection(cleanUsername, {
        processInitialData: false,
        enableExtendedGiftInfo: false,
        // fetchRoomInfoOnConnect mencegah koneksi ke room offline
        fetchRoomInfoOnConnect: true,
      });

      activeConnections.set(socket.id, tiktokConnection);

      // Store roomId for webhook
      let roomId = null;

      tiktokConnection.on('error', (err) => {
        console.error('[TikTok] error event:', err);
      });

      // Add timeout untuk connect attempt
      const connectTimeout = setTimeout(() => {
        console.error('[TikTok] Connection timeout after 15s');
        socket.emit('status', {
          type: 'error',
          message: 'Timeout: Gagal terhubung dalam 15 detik. User mungkin tidak sedang live.',
        });
        activeConnections.delete(socket.id);
        try { tiktokConnection.disconnect().catch(() => {}); } catch (e) {}
      }, 15000);

      try {
        console.log(`[TikTok] Calling connect() for @${cleanUsername}...`);
        const state = await tiktokConnection.connect();
        clearTimeout(connectTimeout);
        roomId = state.roomId; // Store roomId for later use
        console.log(`[TikTok] ✓ Connected to room: ${state.roomId} for user: ${cleanUsername}`);

        // Extract stream URL dari roomInfo (di v2 berada di roomInfo.data.stream_url)
        const streamData = state.roomInfo?.data?.stream_url;
        const streamUrl = streamData?.rtmp_pull_url ||
                          streamData?.hls_pull_url ||
                          streamData?.live_core_sdk_data?.pull_data?.stream_data || null;
        console.log('[TikTok] Stream URL:', streamUrl ? 'found' : 'not found');

        console.log('[TikTok] Final Stream URL:', streamUrl);

        socket.emit('status', {
          type: 'connected',
          message: `Terhubung ke live @${cleanUsername}`,
          roomId: state.roomId,
          streamUrl: streamUrl,
        });
      } catch (err) {
        clearTimeout(connectTimeout);
        console.error('[TikTok] ✗ Connection failed:', err.message);
        console.error('[TikTok] Full error:', err);

        // Handle error spesifik untuk websocket upgrade
        let errorMessage = err.message || 'User mungkin tidak sedang live.';
        if (err.message && err.message.includes('websocket upgrade')) {
          errorMessage = 'TikTok membatasi koneksi tanpa login. Coba gunakan username lain atau tunggu streamer lain yang lebih populer.';
        } else if (err.message && err.message.includes('Cannot read room')) {
          errorMessage = 'Username tidak ditemukan atau user tidak sedang live.';
        } else if (err.message && err.message.includes('captcha')) {
          errorMessage = 'TikTok mendeteksi aktivitas mencurigakan. Coba lagi dalam beberapa menit.';
        }

        socket.emit('status', {
          type: 'error',
          message: `Gagal terhubung: ${errorMessage}`,
        });
        activeConnections.delete(socket.id);
        return;
      }

      // Forward chat messages (v2: data nested di data.user, teks chat di data.content)
      tiktokConnection.on('chat', (data) => {
        console.log('[TikTok] chat event received:', data.user?.displayId, ':', data.content);

        const chatPayload = {
          type: 'chat',
          roomId: roomId,
          data: {
            id: uuidv4(),
            uniqueId: data.user?.displayId || data.user?.uniqueId || 'unknown',
            nickname: data.user?.nickname || data.user?.displayId || 'Unknown',
            comment: data.content || '',
            profilePictureUrl: data.user?.avatarThumb?.urlList?.[0] || '',
            timestamp: Date.now(),
          },
        };

        // Send to socket client
        socket.emit('new-chat', chatPayload.data);

        // Send to webhook
        const webhookUrl = webhookUrls.get(socket.id);
        console.log('[Webhook] Getting URL for socket', socket.id, ':', webhookUrl);
        sendWebhook(webhookUrl, chatPayload);
      });

      // Forward gifts (v2: nama gift dari data.gift.name, streak ditandai data.gift.combo)
      tiktokConnection.on('gift', (data) => {
        console.log('[TikTok] gift event received:', data.user?.displayId, data.gift?.name, data.repeatCount);
        // Skip streak (combo) yang masih berjalan, kirim saat selesai
        if (data.gift?.combo && !data.repeatEnd) {
          return;
        }

        const giftPayload = {
          type: 'gift',
          roomId: roomId,
          data: {
            id: uuidv4(),
            uniqueId: data.user?.displayId || data.user?.uniqueId || 'unknown',
            nickname: data.user?.nickname || data.user?.displayId || 'Unknown',
            giftName: data.gift?.name || 'Gift',
            repeatCount: data.repeatCount || data.groupCount || 1,
            profilePictureUrl: data.user?.avatarThumb?.urlList?.[0] || '',
            timestamp: Date.now(),
          },
        };

        // Send to socket client
        socket.emit('new-gift', giftPayload.data);

        // Send to webhook
        const webhookUrl = webhookUrls.get(socket.id);
        sendWebhook(webhookUrl, giftPayload);
      });

      // Forward likes (v2: jumlah like di data.count, total di data.total)
      tiktokConnection.on('like', (data) => {
        console.log('[TikTok] like event received:', data.user?.displayId, data.count);
        socket.emit('new-like', {
          uniqueId: data.user?.displayId || data.user?.uniqueId || 'unknown',
          nickname: data.user?.nickname || 'Unknown',
          likeCount: data.count || 1,
          totalLikeCount: Number(data.total) || 0,
        });
      });

      // Forward viewer count (v2: jumlah penonton di data.total)
      tiktokConnection.on('roomUser', (data) => {
        console.log('[TikTok] roomUser event received, viewerCount:', data.total);
        socket.emit('viewer-count', { viewerCount: Number(data.total) || 0 });
      });

      // Handle member join
      tiktokConnection.on('member', (data) => {
        console.log('[TikTok] member event:', data.user?.displayId || data.user?.nickname || 'user joined');
      });

      // Handle disconnect
      tiktokConnection.on('disconnected', () => {
        console.log('[TikTok] disconnected event');
        socket.emit('status', { type: 'disconnected', message: 'Koneksi terputus dari TikTok.' });
        activeConnections.delete(socket.id);
      });
    });

    socket.on('leave-room', () => {
      if (activeConnections.has(socket.id)) {
        try {
          activeConnections.get(socket.id).disconnect().catch(() => {});
        } catch (e) {}
        activeConnections.delete(socket.id);
        socket.emit('status', { type: 'disconnected', message: 'Berhasil keluar dari room.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      if (activeConnections.has(socket.id)) {
        try {
          activeConnections.get(socket.id).disconnect().catch(() => {});
        } catch (e) {}
        activeConnections.delete(socket.id);
      }
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
