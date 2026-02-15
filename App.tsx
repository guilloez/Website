import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';
import DepositSection from './components/DepositSection';
import AdminSection from './components/AdminSection';
import VaultInfo from './components/VaultInfo';
import { CustomConnectButton } from './components/CustomConnectButton';
import SwapPage from './pages/SwapPage';

const VaultDashboard: React.FC = () => {
  const { isConnected } = useAccount();
  return (
    <main className="w-full max-w-6xl">
      {!isConnected ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[60vh]">
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 border border-[#00f2ff]/20 bg-[#00f2ff]/5 text-[#00f2ff] text-[10px] font-bold uppercase tracking-[0.3em]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f2ff] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f2ff]"></span>
              </span>
              Secure Asset Storage
            </div>
            <h2 className="text-5xl sm:text-7xl font-black tracking-tight text-white leading-[0.9]">
              STABLE <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#00f2ff] to-[#008cff]">INFRASTRUCTURE</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-xl font-medium border-l-2 border-[#00f2ff]/30 pl-6 italic">
              A military-grade vault for decentralized asset management. Deposit, withdraw, and manage ETH and ERC20 tokens with cryptographic certainty.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
              <CustomConnectButton />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Deployment</span>
                <span className="text-xs font-mono text-slate-300">0x59BB…A67d</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 grid gap-4 relative">
            <div className="absolute -inset-10 bg-[#00f2ff]/5 blur-3xl rounded-full" />
            <div className="tech-border bg-black/80 p-8 space-y-6 relative tech-glow">
              <h3 className="text-xs font-black text-[#00f2ff] uppercase tracking-[0.2em] border-b border-white/10 pb-4">Operational Modules</h3>
              <div className="space-y-4">
                {[
                  { label: 'Asset Custody', desc: 'Secure ETH + ERC20 cold-style storage' },
                  { label: 'Direct Access', desc: 'Zero-intermediary withdrawal protocol' },
                  { label: 'Admin Kernel', desc: 'Permissioned governance for contract owners' }
                ].map((item, idx) => (
                  <div key={idx} className="group cursor-default border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-[#00f2ff]/5 hover:border-[#00f2ff]/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white uppercase tracking-tight">{item.label}</span>
                      <span className="text-[10px] text-[#00f2ff]">0{idx+1}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-12">
          <VaultInfo />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <DepositSection />
            <AdminSection />
          </div>
        </div>
      )}
    </main>
  );
};

const App: React.FC = () => {
  const location = useLocation();
  const isSwap = location.pathname === '/swap';

  return (
    <div className="min-h-screen bg-black text-slate-100 font-mono relative overflow-hidden">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-20%,rgba(0,242,255,0.15),transparent_70%)]" />
      <div className="flex flex-col items-center py-10 px-4 relative z-10">
      {/* Navbar / Header */}
        <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-16 gap-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 tech-border tech-glow flex items-center justify-center font-bold text-2xl text-[#00f2ff] bg-black/50 tracking-tighter transition-all group-hover:border-[#00f2ff]/50">
                TV
              </div>
              <div className="leading-tight">
                <h1 className="text-2xl font-black tracking-[0.2em] text-white uppercase italic">TokenVault</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-pulse" />
                  <p className="text-[10px] text-[#00f2ff] font-bold uppercase tracking-widest opacity-80">Protocol v1.0.4</p>
                </div>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6 border-l border-white/10 pl-8">
              <Link 
                to="/" 
                className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all ${!isSwap ? 'text-[#00f2ff] border-b border-[#00f2ff] pb-1' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Vault
              </Link>
              <Link 
                to="/swap" 
                className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all ${isSwap ? 'text-[#00f2ff] border-b border-[#00f2ff] pb-1' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Swap
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">Network Status</span>
              <span className="text-[11px] text-[#00f2ff] font-bold">Ethereum Mainnet // Live</span>
            </div>
            <CustomConnectButton />
          </div>
        </header>

      {/* Main Content */}
      <Routes>
        <Route path="/" element={<VaultDashboard />} />
        <Route path="/swap" element={<SwapPage />} />
      </Routes>

        <footer className="mt-16 text-slate-500 text-sm w-full max-w-6xl border-t border-slate-800 pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Interact with contract <span className="font-mono text-slate-300">0x59BB...A67d</span>
            </p>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Built with Wagmi + RainbowKit</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;