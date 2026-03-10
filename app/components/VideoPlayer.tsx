'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface VideoPlayerProps {
  streamUrl: string | null;
  username: string;
}

export function VideoPlayer({ streamUrl, username }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const flvPlayerRef = useRef<any>(null);
  const lastDataTimeRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [urlKey, setUrlKey] = useState(0);
  const [flvLoaded, setFlvLoaded] = useState(false);

  const initPlayer = useCallback(() => {
    if (!videoRef.current || !streamUrl || !flvLoaded) {
      return;
    }

    // Get flvjs from dynamic import
    import('flv.js').then((module) => {
      const flv = module.default || module;

      if (!flv.isSupported()) {
        console.log('[VideoPlayer] FLV not supported');
        return;
      }

      const videoElement = videoRef.current!;

      // Destroy existing player
      if (flvPlayerRef.current) {
        flvPlayerRef.current.destroy();
        flvPlayerRef.current = null;
      }

      // Create new player
      const flvPlayer = flv.createPlayer({
        type: 'flv',
        url: streamUrl,
        isLive: true,
        hasAudio: true,
        hasVideo: true,
        cors: true,
      });

      flvPlayer.attachMediaElement(videoElement);
      flvPlayer.load();
      flvPlayer.play().catch((err: any) => {
        console.error('[VideoPlayer] Play error:', err);
      });

      // Setup statistics info update for data detection
      flvPlayer.on(flv.Events.STATISTICS_INFO, () => {
        lastDataTimeRef.current = Date.now();
      });

      flvPlayer.on(flv.Events.ERROR, (errorType: any, errorDetail: any, errorInfo: any) => {
        console.error('[VideoPlayer] Error:', errorType, errorDetail, errorInfo);
        // Auto-retry on error
        setTimeout(() => {
          setUrlKey((prev) => prev + 1);
        }, 2000);
      });

      flvPlayerRef.current = flvPlayer;
    });
  }, [streamUrl, flvLoaded]);

  useEffect(() => {
    // Load flv.js on mount
    import('flv.js').then(() => setFlvLoaded(true));
  }, []);

  useEffect(() => {
    if (!streamUrl || !flvLoaded) return;

    initPlayer();

    // Check for stuck stream every 3 seconds
    checkIntervalRef.current = setInterval(() => {
      const timeSinceLastData = Date.now() - lastDataTimeRef.current;

      // If no data for 10 seconds, refresh player
      if (timeSinceLastData > 10000) {
        console.log('[VideoPlayer] Stream stuck, refreshing...');
        setUrlKey((prev) => prev + 1);
      }
    }, 3000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      if (flvPlayerRef.current) {
        flvPlayerRef.current.destroy();
        flvPlayerRef.current = null;
      }
    };
  }, [streamUrl, urlKey, flvLoaded, initPlayer]);

  if (!streamUrl) {
    return (
      <div className="w-full h-full rounded-2xl flex flex-col items-center justify-center" style={{ background: 'var(--surface-2)' }}>
        <svg className="w-16 h-16 text-white/10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p className="text-white/20 text-sm">Stream not available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden" style={{ background: 'black' }}>
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        autoPlay
        playsInline
        muted
        controls
      />
    </div>
  );
}
