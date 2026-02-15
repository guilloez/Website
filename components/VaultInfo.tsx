import React, { useState } from 'react';
import { useReadContract } from 'wagmi';
import { formatEther, isAddress } from 'viem';
import { VAULT_CONTRACT_ADDRESS, VAULT_ABI } from '../constants';
import { mainnet } from 'wagmi/chains';

const VaultInfo: React.FC = () => {
  const [tokenAddress, setTokenAddress] = useState<string>('');

  // 1. Get ETH Balance of Vault
  const { data: ethBalance, isLoading: isEthLoading, error: ethError } = useReadContract({
    address: VAULT_CONTRACT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'getVaultEthBalance',
    args: [],
    chainId: mainnet.id,
    query: {
        refetchOnWindowFocus: true,
    }
  });

  // 2. Get specific Token Balance if address provided
  const { data: tokenBalance, isLoading: isTokenLoading, error: tokenError } = useReadContract({
    address: VAULT_CONTRACT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'getVaultTokenBalance',
    args: tokenAddress && isAddress(tokenAddress) ? [tokenAddress] : undefined,
    chainId: mainnet.id,
    query: {
        enabled: !!tokenAddress && isAddress(tokenAddress),
    }
  });

  return (
    <div className="tech-border bg-black/40 p-8 tech-glow relative">
      <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
        <h2 className="text-xs font-black text-[#00f2ff] uppercase tracking-[0.3em]">Vault Intelligence</h2>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Real-time Feed</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-[#00f2ff]" />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Reserve Balance</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-6 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#00f2ff]/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
            <p className="text-4xl font-black text-white tracking-tighter">
              {isEthLoading
                ? <span className="text-slate-700 animate-pulse">0.0000</span>
                : ethError
                ? <span className="text-red-500/50">ERROR</span>
                : ethBalance !== undefined
                ? parseFloat(formatEther(ethBalance)).toFixed(4)
                : '0.0000'}
              <span className="text-xs text-slate-500 ml-2 font-bold uppercase tracking-widest">ETH</span>
            </p>
          </div>
          {ethError && <p className="text-[10px] text-red-500/70 font-mono italic">! {ethError.message}</p>}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-slate-700" />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Token Inspector</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-6 relative">
            <input
              type="text"
              placeholder="ENTER CONTRACT ADDRESS..."
              className="w-full bg-black border border-white/10 px-4 py-3 text-xs text-[#00f2ff] placeholder:text-slate-800 focus:outline-none focus:border-[#00f2ff]/40 font-mono uppercase transition-all mb-4"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
            />
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Query Result</span>
                <p className="text-xl font-black text-white tracking-tight leading-none mt-1">
                  {tokenAddress && isAddress(tokenAddress)
                    ? isTokenLoading
                      ? <span className="text-slate-700 animate-pulse italic text-sm">FETCHING...</span>
                      : tokenError
                      ? <span className="text-red-500/50 text-sm">FAILED</span>
                      : tokenBalance !== undefined
                      ? tokenBalance.toString()
                      : '0'
                    : '---'}
                </p>
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Units</span>
            </div>
          </div>
          {tokenError && <p className="text-[10px] text-red-500/70 font-mono italic">! {tokenError.message}</p>}
        </div>
      </div>
    </div>
  );
};

export default VaultInfo;