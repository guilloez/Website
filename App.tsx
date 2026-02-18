import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';
import DepositSection from './components/DepositSection';
import AdminSection from './components/AdminSection';
import VaultInfo from './components/VaultInfo';
import { CustomConnectButton } from './components/CustomConnectButton';
import SwapPage from './pages/SwapPage';

import { useReadContract } from 'wagmi';
import { VAULT_CONTRACT_ADDRESS, VAULT_ABI } from './constants';

const ProtectedVaultRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address, isConnected } = useAccount();
  const { data: owner } = useReadContract({
    address: VAULT_CONTRACT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'owner',
  });

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest">Access Restricted</h2>
        <p className="text-slate-400 max-w-md">Please connect your wallet to access the Vault Dashboard.</p>
        <CustomConnectButton />
      </div>
    );
  }

  if (owner && address && owner.toLowerCase() !== address.toLowerCase()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
          <span className="text-2xl">🔒</span>
        </div>
        <div>
          <h2 className="text-xl font-black text-red-500 uppercase tracking-widest mb-2">Unauthorized Access</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            The Vault Dashboard is restricted to the contract owner.<br />
            Current wallet: <span className="text-slate-300 font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
          </p>
        </div>
        <Link to="/" className="text-[#00f2ff] hover:text-white font-bold uppercase tracking-widest text-xs border-b border-[#00f2ff]/30 pb-1 transaction-all">
          Return to Swap
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};

const VaultDashboard: React.FC = () => {
  return (
    <div className="w-full space-y-12">
      <VaultInfo />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <DepositSection />
        <AdminSection />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const location = useLocation();
  const isVault = location.pathname === '/vault';

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
                className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all ${!isVault ? 'text-[#00f2ff] border-b border-[#00f2ff] pb-1' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Swap
              </Link>
              <Link
                to="/vault"
                className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all ${isVault ? 'text-[#00f2ff] border-b border-[#00f2ff] pb-1' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Vault
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
        <main className="w-full max-w-6xl">
          <Routes>
            <Route path="/" element={<SwapPage />} />
            <Route
              path="/vault"
              element={
                <ProtectedVaultRoute>
                  <VaultDashboard />
                </ProtectedVaultRoute>
              }
            />
          </Routes>
        </main>

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