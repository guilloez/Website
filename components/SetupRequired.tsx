import React from 'react';

const SetupRequired: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-slate-100 font-mono relative overflow-hidden flex items-center justify-center px-4">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(0,242,255,0.1),transparent_70%)]" />
      
      <div className="w-full max-w-2xl relative z-10">
        <div className="tech-border bg-black/80 p-8 sm:p-12 tech-glow">
          <div className="flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
            <div className="w-14 h-14 tech-border flex items-center justify-center font-bold text-3xl text-[#00f2ff] bg-black">
              TV
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-[0.2em] text-white uppercase italic">TokenVault</h1>
              <p className="text-[10px] text-[#00f2ff] font-bold uppercase tracking-[0.3em] opacity-80 mt-1">System Initialization Required</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white/[0.02] border border-white/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-pulse" />
                <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Missing Configuration</h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Terminal requires a WalletConnect Project ID to establish external uplink.
              </p>
              
              <div className="space-y-3">
                <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Target Environment Variable</div>
                <div className="bg-black border border-white/10 p-4 font-mono text-xs text-[#00f2ff]">
                  VITE_WALLET_CONNECT_PROJECT_ID=...
                </div>
                <p className="text-[10px] text-slate-500 italic mt-2">
                  Reference: cloud.walletconnect.com
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Network', val: 'Mainnet' },
                { label: 'Layer', val: 'L1_Base' },
                { label: 'Security', val: 'Encrypted' }
              ].map((stat, i) => (
                <div key={i} className="border border-white/5 bg-white/[0.01] p-4 text-center">
                  <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mb-1">{stat.label}</div>
                  <div className="text-xs font-black text-white uppercase">{stat.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupRequired;
