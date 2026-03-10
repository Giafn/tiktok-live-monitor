'use client';

import { useState } from 'react';
import { Header, StatsBar, ConnectionForm, ChatSection, VideoPlayer } from './components';
import { useTikTokSocket } from './hooks';
import type { StatusEvent, ChatMessage, GiftEvent, LikeEvent, FeedItem } from './types';

// ─── Constants ─────────────────────────────────────────────────────────────────
const MAX_FEED = 200;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [status, setStatus] = useState<StatusEvent | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  const { socket, joinRoom, leaveRoom } = useTikTokSocket({
    onStatus: (data: StatusEvent) => {
      console.log('[Page] Status event:', data);
      setStatus(data);
      if (data.type === 'connected') {
        setIsConnected(true);
        if (data.roomId) setRoomId(data.roomId);
        if (data.streamUrl) {
          console.log('[Page] Setting stream URL:', data.streamUrl);
          setStreamUrl(data.streamUrl);
        }
      }
      if (data.type === 'disconnected' || data.type === 'error') {
        setIsConnected(false);
        setRoomId(null);
        setStreamUrl(null);
      }
    },
    onNewChat: (data: ChatMessage) => {
      setFeed((prev) => [...prev.slice(-MAX_FEED + 1), { kind: 'chat', ...data }]);
    },
    onNewGift: (data: GiftEvent) => {
      setFeed((prev) => [...prev.slice(-MAX_FEED + 1), { kind: 'gift', ...data }]);
    },
    onNewLike: (data: LikeEvent) => {
      setTotalLikes((prev) => Math.max(prev, data.totalLikeCount));
    },
    onViewerCount: (count: number) => {
      setViewerCount(count);
    },
  });

  const handleConnect = () => {
    if (!username.trim()) return;
    setFeed([]);
    setViewerCount(0);
    setTotalLikes(0);
    setRoomId(null);
    setStreamUrl(null);
    setStatus({ type: 'connecting', message: `Menghubungkan ke @${username.replace('@', '')}...` });
    joinRoom(username.replace('@', '').trim());
  };

  const handleDisconnect = () => {
    leaveRoom();
    setIsConnected(false);
    setRoomId(null);
    setStreamUrl(null);
  };

  const chatCount = feed.filter((f) => f.kind === 'chat').length;

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-body)' }}>
      {/* ── Navbar ── */}
      <Header>
        {isConnected && (
          <StatsBar viewerCount={viewerCount} totalLikes={totalLikes} messageCount={chatCount} />
        )}
      </Header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
        {/* ── Content: Video + Chat (Responsive Grid) ── */}
        {isConnected && (
          <div className="flex-1 flex flex-col lg:flex-row gap-4">
            {/* Video Player Section - Full height */}
            <div className="rounded-2xl border p-4 flex-1 flex flex-col lg:h-screen" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <span className="text-xs font-semibold text-white/40 uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>
                  Live Stream
                </span>
                <div className="flex-1" />
                <div className="flex items-center gap-2 px-2 py-1 rounded-md text-[10px] font-mono" style={{ background: 'rgba(37,244,238,0.1)', border: '1px solid rgba(37,244,238,0.2)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-cyan-400/70">LIVE</span>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <VideoPlayer streamUrl={streamUrl} username={username} />
              </div>
            </div>

            {/* Chat Section - With Connection Form on top */}
            <div className="flex flex-col gap-4">
              <ConnectionForm
                username={username}
                onUsernameChange={setUsername}
                isConnected={isConnected}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                status={status}
              />
              <ChatSection
                feed={feed}
                isConnected={isConnected}
              />
            </div>
          </div>
        )}

        {/* Connection Form when not connected */}
        {!isConnected && (
          <div className="flex justify-center">
            <ConnectionForm
              username={username}
              onUsernameChange={setUsername}
              isConnected={isConnected}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              status={status}
            />
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-[11px] text-white/15">
          Data live dari TikTok WebCast API • Max {MAX_FEED} pesan tersimpan
        </p>
      </main>
    </div>
  );
}
