'use client';

import { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  webhookUrl: string;
  onSave: (url: string) => void;
}

export function SettingsModal({ isOpen, onClose, webhookUrl, onSave }: SettingsModalProps) {
  const [url, setUrl] = useState(webhookUrl);

  useEffect(() => {
    setUrl(webhookUrl);
  }, [webhookUrl]);

  const handleSave = () => {
    onSave(url.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md mx-4 rounded-2xl p-6 border"
        style={{ 
          background: 'var(--surface)',
          borderColor: 'var(--border)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 
            className="text-lg font-bold text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Webhook Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              className="w-full px-3 py-2.5 rounded-lg text-sm border bg-transparent text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>

          <div 
            className="p-3 rounded-lg text-xs"
            style={{ background: 'var(--surface-2)' }}
          >
            <p className="text-white/40 mb-2">Webhook akan menerima event:</p>
            <ul className="space-y-1 text-white/60">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Chat messages
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Gift events
              </li>
            </ul>
          </div>

          <div 
            className="p-3 rounded-lg text-xs border"
            style={{ 
              background: 'rgba(37,244,238,0.05)',
              borderColor: 'rgba(37,244,238,0.15)'
            }}
          >
            <p className="text-cyan-400/80 font-mono">POST /webhook</p>
            <p className="text-white/40 mt-1">Content-Type: application/json</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors"
            style={{ 
              background: 'transparent',
              borderColor: 'var(--border)',
              color: 'white/60'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ 
              background: 'var(--red)',
              color: 'white'
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
