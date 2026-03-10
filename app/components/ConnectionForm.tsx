import { StatusBadge } from './StatusBadge';
import type { StatusEvent } from '../types';

export function ConnectionForm({
  username,
  onUsernameChange,
  isConnected,
  onConnect,
  onDisconnect,
  status,
}: {
  username: string;
  onUsernameChange: (value: string) => void;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  status: StatusEvent | null;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onConnect();
  };

  return (
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
            onChange={(e) => onUsernameChange(e.target.value)}
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
            onClick={onConnect}
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
            onClick={onDisconnect}
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

      {status && <StatusBadge status={status} />}
    </div>
  );
}
