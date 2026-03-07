export interface ChatMessage {
  id: string;
  uniqueId: string;
  nickname: string;
  comment: string;
  profilePictureUrl: string;
  timestamp: number;
}

export interface GiftEvent {
  id: string;
  uniqueId: string;
  nickname: string;
  giftName: string;
  repeatCount: number;
  profilePictureUrl: string;
  timestamp: number;
}

export interface LikeEvent {
  uniqueId: string;
  nickname: string;
  likeCount: number;
  totalLikeCount: number;
}

export interface StatusEvent {
  type: 'connecting' | 'connected' | 'disconnected' | 'error';
  message: string;
  roomId?: string;
}

export type FeedItem =
  | ({ kind: 'chat' } & ChatMessage)
  | ({ kind: 'gift' } & GiftEvent);
