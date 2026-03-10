import { useRef } from 'react';
import { ChatBubble } from './ChatBubble';
import type { FeedItem } from '../types';

export function ChatSection({
  feed,
  isConnected,
}: {
  feed: FeedItem[];
  isConnected: boolean;
}) {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="rounded-2xl border flex flex-col overflow-hidden flex-1 min-h-0"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Chat header */}
      <div
        className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="text-xs font-semibold text-white/40 uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>
          Live Chat
        </span>
        {feed.length > 0 && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-md font-mono tabular-nums flex-shrink-0"
            style={{ background: 'rgba(254,44,85,0.15)', color: '#FE2C55' }}
          >
            {feed.length}
          </span>
        )}
      </div>

      {/* Feed */}
      <div
        ref={chatContainerRef}
        className="overflow-hidden flex flex-col justify-end p-2 flex-1 min-h-0"
      >
        <div className="overflow-y-auto space-y-0.5 scrollbar-hide">
          {feed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
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
        </div>
      </div>
    </div>
  );
}
