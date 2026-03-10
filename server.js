const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const { v4: uuidv4 } = require('uuid');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

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
          activeConnections.get(socket.id).disconnect();
        } catch (e) {}
        activeConnections.delete(socket.id);
      }

      socket.emit('status', { type: 'connecting', message: `Menghubungkan ke @${cleanUsername}...` });

      // Create connection dengan opsi yang benar untuk menghindari error websocket
      const tiktokConnection = new WebcastPushConnection(cleanUsername, {
        processInitialData: false,
        enableExtendedGiftInfo: true,
        requestPollingIntervalMs: 2000,
        // Gunakan fetchRoomInfoOnConnect untuk mencegah koneksi ke room offline
        fetchRoomInfoOnConnect: true,
        // WebcastPushConnection akan otomatis fallback ke polling jika websocket gagal
        webClientParams: {
          app_language: 'id-ID',
          device_platform: 'web',
        },
        webClientHeaders: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      activeConnections.set(socket.id, tiktokConnection);

      // Setup event listeners BEFORE connect
      tiktokConnection.on('connecting', () => {
        console.log('[TikTok] connecting event triggered');
      });

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
        try { tiktokConnection.disconnect(); } catch (e) {}
      }, 15000);

      try {
        console.log(`[TikTok] Calling connect() for @${cleanUsername}...`);
        const state = await tiktokConnection.connect();
        clearTimeout(connectTimeout);
        console.log(`[TikTok] ✓ Connected to room: ${state.roomId} for user: ${cleanUsername}`);

        // Extract stream URL dari roomInfo
        let streamUrl = null;
        console.log('[TikTok] roomInfo keys:', state.roomInfo ? Object.keys(state.roomInfo) : 'null');

        if (state.roomInfo) {
          if (state.roomInfo.stream_url) {
            console.log('[TikTok] stream_url keys:', Object.keys(state.roomInfo.stream_url));
            console.log('[TikTok] stream_url:', JSON.stringify(state.roomInfo.stream_url, null, 2));
            streamUrl = state.roomInfo.stream_url.rtmp_pull_url ||
                        state.roomInfo.stream_url.hls_pull_url ||
                        state.roomInfo.stream_url.live_core_sdk_data?.pull_data?.stream_data || null;
          } else {
            console.log('[TikTok] No stream_url in roomInfo');
          }
        }

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

      // Forward chat messages - struktur data sesuai dengan WebcastPushConnection
      tiktokConnection.on('chat', (data) => {
        console.log('[TikTok] chat event received:', data);
        socket.emit('new-chat', {
          id: uuidv4(),
          uniqueId: data.uniqueId || 'unknown',
          nickname: data.nickname || data.uniqueId || 'Unknown',
          comment: data.comment || '',
          profilePictureUrl: data.profilePictureUrl || '',
          timestamp: Date.now(),
        });
      });

      // Forward gifts
      tiktokConnection.on('gift', (data) => {
        console.log('[TikTok] gift event received:', data);
        // Skip streak in progress
        if (data.giftType === 1 && !data.repeatEnd) {
          return;
        }
        socket.emit('new-gift', {
          id: uuidv4(),
          uniqueId: data.uniqueId || 'unknown',
          nickname: data.nickname || data.uniqueId || 'Unknown',
          giftName: data.giftName || 'Gift',
          repeatCount: data.repeatCount || 1,
          profilePictureUrl: data.profilePictureUrl || '',
          timestamp: Date.now(),
        });
      });

      // Forward likes
      tiktokConnection.on('like', (data) => {
        console.log('[TikTok] like event received:', data);
        socket.emit('new-like', {
          uniqueId: data.uniqueId || 'unknown',
          nickname: data.nickname || 'Unknown',
          likeCount: data.likeCount || 1,
          totalLikeCount: data.totalLikeCount || 0,
        });
      });

      // Forward viewer count
      tiktokConnection.on('roomUser', (data) => {
        console.log('[TikTok] roomUser event received, viewerCount:', data.viewerCount);
        socket.emit('viewer-count', { viewerCount: data.viewerCount || 0 });
      });

      // Handle member join
      tiktokConnection.on('member', (data) => {
        console.log('[TikTok] member event:', data.user?.uniqueId || 'user joined');
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
          activeConnections.get(socket.id).disconnect();
        } catch (e) {}
        activeConnections.delete(socket.id);
        socket.emit('status', { type: 'disconnected', message: 'Berhasil keluar dari room.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      if (activeConnections.has(socket.id)) {
        try {
          activeConnections.get(socket.id).disconnect();
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
