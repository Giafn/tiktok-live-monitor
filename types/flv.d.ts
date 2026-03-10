declare module 'flv.js' {
  interface Player {
    attachMediaElement(mediaElement: HTMLVideoElement): void;
    load(): void;
    play(): Promise<void>;
    pause(): void;
    destroy(): void;
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback?: (...args: any[]) => void): void;
  }

  interface PlayerConfig {
    type: string;
    url: string;
    isLive?: boolean;
    hasAudio?: boolean;
    hasVideo?: boolean;
    cors?: boolean;
  }

  namespace flvjs {
    function isSupported(): boolean;
    function createPlayer(config: PlayerConfig): Player;
    const Events: {
      STATISTICS_INFO: string;
      ERROR: string;
    };
  }

  const flvjs: typeof flvjs;
  export default flvjs;
}
