import type { StatusEvent } from '../types';

export function StatusBadge({ status }: { status: StatusEvent | null }) {
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
