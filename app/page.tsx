'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { FeedItem, StatusEvent, LikeEvent } from './types';
import { ChatMessage } from './types';
import { GiftEvent } from './types';

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ url, name }: { url: string; name: string }) {
  const initials = name ? name.slice(0, 2).toUpperCase() : '??';
  const hue = name
    ? name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
    : 0;

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-white/10"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white/90 ring-1 ring-white/10"
      style={{ background: `hsl(${hue}, 60%, 35%)` }}
    >
      {initials}
    </div>
  );
}

// ─── Chat Bubble ─────────────────────────────────────────────────────────────
function ChatBubble({ item }: { item: FeedItem }) {
  if (item.kind === 'gift') {
    return (
      <div className="chat-message-enter flex items-center gap-2.5 py-2 px-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
        <Avatar url={item.profilePictureUrl} name={item.nickname} />
        <div className="flex-1 min-w-0">
          <span className="text-yellow-400/90 font-medium text-sm">{item.nickname}</span>
          <span className="text-white/50 text-sm"> mengirim </span>
          <span className="text-yellow-300 font-semibold text-sm">🎁 {item.giftName}</span>
          {item.repeatCount > 1 && (
            <span className="text-yellow-400/70 text-xs ml-1">×{item.repeatCount}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-message-enter flex items-start gap-2.5 py-2 px-3 rounded-xl hover:bg-white/[0.02] transition-colors group">
      <Avatar url={item.profilePictureUrl} name={item.nickname} />
      <div className="flex-1 min-w-0">
        <span
          className="font-semibold text-sm mr-2"
          style={{ color: `hsl(${item.uniqueId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360}, 70%, 72%)` }}
        >
          {item.nickname}
        </span>
        <span className="text-white/80 text-sm leading-relaxed break-words">{item.comment}</span>
      </div>
    </div>
  );
}

// ─── Stats Bar ───────────────────────────────────────────────────────────────
function StatsBar({
  viewerCount,
  totalLikes,
  messageCount,
}: {
  viewerCount: number;
  totalLikes: number;
  messageCount: number;
}) {
  return (
    <div className="flex items-center gap-4 text-xs">
      <div className="flex items-center gap-1.5 text-white/50">
        <svg className="w-3.5 h-3.5 text-cyan-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="tabular-nums">{viewerCount.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-1.5 text-white/50">
        <svg className="w-3.5 h-3.5 text-red-400/80" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <span className="tabular-nums">{totalLikes.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-1.5 text-white/50">
        <svg className="w-3.5 h-3.5 text-blue-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="tabular-nums">{messageCount}</span>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: StatusEvent | null }) {
  if (!status) return null;

  const configs = {
    connecting: { dot: 'bg-yellow-400 pulse-dot', text: 'text-yellow-400/80', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    connected: { dot: 'bg-green-400 pulse-dot', text: 'text-green-400/80', bg: 'bg-green-500/10 border-green-500/20' },
    disconnected: { dot: 'bg-gray-500', text: 'text-gray-400/80', bg: 'bg-gray-500/10 border-gray-500/20' },
    error: { dot: 'bg-red-400', text: 'text-red-400/80', bg: 'bg-red-500/10 border-red-500/20' },
  };

  const cfg = configs[status.type];

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      <span className={cfg.text}>{status.message}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [status, setStatus] = useState<StatusEvent | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const feedEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const MAX_FEED = 200;

  // Auto-scroll
  useEffect(() => {
    if (isAutoScroll && feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [feed, isAutoScroll]);

  // Handle scroll to pause/resume auto-scroll
  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
    setIsAutoScroll(isNearBottom);
  }, []);

  // Init socket once
  useEffect(() => {
    const socket = io({
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      upgrade: true,
    });

    socketRef.current = socket;

    socket.on('status', (data: StatusEvent) => {
      setStatus(data);
      if (data.type === 'connected') setIsConnected(true);
      if (data.type === 'disconnected' || data.type === 'error') setIsConnected(false);
    });

    socket.on('new-chat', (data: ChatMessage) => {
      setFeed((prev) => [...prev.slice(-MAX_FEED + 1), { kind: 'chat', ...data }]);
    });

    socket.on('new-gift', (data: GiftEvent) => {
      setFeed((prev) => [...prev.slice(-MAX_FEED + 1), { kind: 'gift', ...data }]);
    });

    socket.on('new-like', (data: LikeEvent) => {
      setTotalLikes((prev) => Math.max(prev, data.totalLikeCount));
    });

    socket.on('viewer-count', ({ viewerCount }: { viewerCount: number }) => {
      setViewerCount(viewerCount);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleConnect = () => {
    if (!username.trim() || !socketRef.current) return;
    setFeed([]);
    setViewerCount(0);
    setTotalLikes(0);
    setStatus({ type: 'connecting', message: `Menghubungkan ke @${username.replace('@', '')}...` });
    socketRef.current.emit('join-room', username.replace('@', '').trim());
  };

  const handleDisconnect = () => {
    socketRef.current?.emit('leave-room');
    setIsConnected(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConnect();
  };

  const chatCount = feed.filter((f) => f.kind === 'chat').length;

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-body)' }}>
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#08090a]/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* TikTok-esque logo mark */}
            <div className="relative w-7 h-7">
              <div className="absolute inset-0 rounded-md bg-gradient-to-br from-[#FE2C55] to-[#ff7043]" />
              <div className="absolute inset-0 rounded-md bg-gradient-to-br from-[#25F4EE] to-transparent opacity-60 mix-blend-screen" style={{ transform: 'translate(-1.5px, 1.5px)' }} />
              <svg className="absolute inset-0 w-full h-full p-1.5" viewBox="0 0 24 24" fill="white">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.55a8.27 8.27 0 004.83 1.55V7.67a4.85 4.85 0 01-1.06-.98z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
                TikTok Live Monitor
              </h1>
              <p className="text-[10px] text-white/30 leading-none mt-0.5">Real-time chat tracker</p>
            </div>
          </div>

          {/* Right side stats */}
          {isConnected && (
            <StatsBar viewerCount={viewerCount} totalLikes={totalLikes} messageCount={chatCount} />
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-4">

        {/* ── Input Section ── */}
        <div
          className="rounded-2xl border p-4 space-y-3"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold text-white/40 uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>
              Connect to Live
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm font-medium select-none">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="username"
                disabled={isConnected}
                className="w-full pl-7 pr-3 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  fontFamily: 'var(--font-mono)',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(254,44,85,0.4)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
              />
            </div>

            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={!username.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #FE2C55, #ff5e78)',
                  fontFamily: 'var(--font-display)',
                  boxShadow: username.trim() ? '0 0 20px rgba(254,44,85,0.3)' : 'none',
                }}
              >
                Connect
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white/70 transition-all active:scale-95 hover:bg-white/10"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Disconnect
              </button>
            )}
          </div>

          {/* Status */}
          {status && <StatusBadge status={status} />}
        </div>

        {/* ── Chat Section ── */}
        <div
          className="flex-1 rounded-2xl border flex flex-col overflow-hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', minHeight: '480px' }}
        >
          {/* Chat header */}
          <div
            className="px-4 py-3 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>
                Live Chat
              </span>
              {feed.length > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-md font-mono tabular-nums"
                  style={{ background: 'rgba(254,44,85,0.15)', color: '#FE2C55' }}
                >
                  {feed.length}
                </span>
              )}
            </div>

            {!isAutoScroll && feed.length > 0 && (
              <button
                onClick={() => {
                  setIsAutoScroll(true);
                  feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg transition-all"
                style={{ background: 'rgba(254,44,85,0.15)', color: '#FE2C55' }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                Ke Bawah
              </button>
            )}
          </div>

          {/* Feed */}
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto chat-scroll p-2 space-y-0.5"
          >
            {feed.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-white/25 text-sm">
                  {isConnected ? 'Menunggu pesan...' : 'Connect ke TikTok Live untuk mulai'}
                </p>
                {!isConnected && (
                  <p className="text-white/15 text-xs mt-1">Masukkan username streamer di atas</p>
                )}
              </div>
            ) : (
              feed.map((item) => <ChatBubble key={item.id} item={item} />)
            )}
            <div ref={feedEndRef} />
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-white/15">
          Data live dari TikTok WebCast API • Max {MAX_FEED} pesan tersimpan
        </p>
      </main>
    </div>
  );
}
