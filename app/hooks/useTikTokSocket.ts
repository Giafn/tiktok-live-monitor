import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { FeedItem, StatusEvent, ChatMessage, GiftEvent, LikeEvent } from '../types';

interface UseTikTokSocketOptions {
  onStatus?: (status: StatusEvent) => void;
  onNewChat?: (data: ChatMessage) => void;
  onNewGift?: (data: GiftEvent) => void;
  onNewLike?: (data: LikeEvent) => void;
  onViewerCount?: (count: number) => void;
}

const MAX_FEED = 200;

export function useTikTokSocket({
  onStatus,
  onNewChat,
  onNewGift,
  onNewLike,
  onViewerCount,
}: UseTikTokSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const callbacksRef = useRef({ onStatus, onNewChat, onNewGift, onNewLike, onViewerCount });

  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = { onStatus, onNewChat, onNewGift, onNewLike, onViewerCount };
  });

  useEffect(() => {
    const socket = io({
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      upgrade: true,
    });

    socketRef.current = socket;

    socket.on('status', (data: StatusEvent) => {
      callbacksRef.current.onStatus?.(data);
    });

    socket.on('new-chat', (data: ChatMessage) => {
      callbacksRef.current.onNewChat?.(data);
    });

    socket.on('new-gift', (data: GiftEvent) => {
      callbacksRef.current.onNewGift?.(data);
    });

    socket.on('new-like', (data: LikeEvent) => {
      callbacksRef.current.onNewLike?.(data);
    });

    socket.on('viewer-count', ({ viewerCount }: { viewerCount: number }) => {
      callbacksRef.current.onViewerCount?.(viewerCount);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinRoom = (username: string) => {
    socketRef.current?.emit('join-room', username);
  };

  const leaveRoom = () => {
    socketRef.current?.emit('leave-room');
  };

  const setWebhook = (url: string) => {
    socketRef.current?.emit('set-webhook', url);
  };

  return { socket: socketRef, joinRoom, leaveRoom, setWebhook, MAX_FEED };
}
