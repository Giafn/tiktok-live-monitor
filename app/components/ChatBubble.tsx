import type { FeedItem } from '../types';
import { Avatar } from './Avatar';

export function ChatBubble({ item }: { item: FeedItem }) {
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
