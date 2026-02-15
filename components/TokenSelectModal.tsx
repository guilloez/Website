import React, { useMemo, useState } from 'react';
import { useAccount, useBalance, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { mainnet } from 'wagmi/chains';
import { ASSET_OPTIONS, ERC20_ABI } from '../constants';

type AssetId = (typeof ASSET_OPTIONS)[number]['id'];

export type TokenSelectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSelect: (assetId: AssetId) => void;
  selectedId?: AssetId;
};

// Unique colors & emoji for each token
const TOKEN_THEME: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  eth: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', icon: 'Ξ' },
  usdt: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', icon: '₮' },
  usdc: { bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/30', icon: '$' },
  pyusd: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30', icon: 'P' },
  usdp: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: 'Ᵽ' },
  dai: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', icon: '◈' },
};

const getTheme = (id: string) => TOKEN_THEME[id] || { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30', icon: '?' };

const COMING_SOON_CHAINS = [
  { id: 'solana', name: 'Solana', icon: '◎' },
  { id: 'bsc', name: 'BNB Chain', icon: '⬡' },
  { id: 'tron', name: 'Tron', icon: '◆' },
  { id: 'ton', name: 'TON', icon: '◇' },
];

export const TokenSelectModal: React.FC<TokenSelectModalProps> = ({ isOpen, onClose, title, onSelect, selectedId }) => {
  const { address } = useAccount();
  const [search, setSearch] = useState('');

  const { data: ethBalance } = useBalance({
    address,
    chainId: mainnet.id,
  });

  const tokenOptions = useMemo(() => ASSET_OPTIONS.filter((a) => a.address), []);
  const { data: tokenBalancesResult } = useReadContracts({
    contracts: tokenOptions.map((asset) => ({
      address: asset.address!,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: address ? [address] : undefined,
    })),
    query: {
      enabled: isOpen && !!address,
    },
  });

  const balanceByAssetId: Record<string, string> = useMemo(() => {
    const out: Record<string, string> = {};
    if (ethBalance?.value !== undefined) {
      out.eth = formatUnits(ethBalance.value, 18);
    }
    tokenOptions.forEach((asset, i) => {
      const res = tokenBalancesResult?.[i];
      if (res?.status === 'success' && res.result !== undefined) {
        out[asset.id] = formatUnits(res.result as bigint, asset.decimals);
      }
    });
    return out;
  }, [ethBalance?.value, tokenBalancesResult, tokenOptions]);

  const formatBalance = (raw: string) => {
    const n = parseFloat(raw);
    if (n >= 1e6) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (n >= 1) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    if (n > 0) return n.toFixed(6);
    return '0.00';
  };

  const filteredAssets = useMemo(() => {
    if (!search.trim()) return [...ASSET_OPTIONS];
    const q = search.toLowerCase();
    return ASSET_OPTIONS.filter(
      a => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
    );
  }, [search]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-[420px] max-h-[85vh] flex flex-col bg-[#0a0a0a] border border-white/10 shadow-[0_0_60px_rgba(0,242,255,0.08)] rounded-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-gradient-to-r from-[#00f2ff]/5 to-transparent">
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all text-sm"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-white/5">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm">⌕</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or symbol..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-sm pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00f2ff]/30 transition-all"
            />
          </div>
        </div>

        {/* Popular tokens quick-select */}
        <div className="px-4 py-3 flex gap-2 flex-wrap border-b border-white/5">
          {ASSET_OPTIONS.slice(0, 4).map(asset => {
            const theme = getTheme(asset.id);
            const isSelected = selectedId === asset.id;
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => { onSelect(asset.id); onClose(); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-[11px] font-bold ${isSelected
                    ? `${theme.bg} ${theme.text} ${theme.border}`
                    : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06] hover:border-white/20'
                  }`}
              >
                <span className={`w-4 h-4 rounded-full ${theme.bg} ${theme.text} flex items-center justify-center text-[9px] font-black`}>
                  {theme.icon}
                </span>
                {asset.symbol}
              </button>
            );
          })}
        </div>

        {/* Token list */}
        <div className="overflow-y-auto flex-1 py-2">
          {/* Ethereum section */}
          <div className="px-4 py-2 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#00f2ff]/15 flex items-center justify-center text-[10px] text-[#00f2ff]">⟠</span>
            <span className="text-[10px] font-black text-[#00f2ff] uppercase tracking-[0.2em]">Ethereum Network</span>
            <div className="flex-1 border-t border-white/5 ml-2" />
          </div>

          <div className="px-2 space-y-0.5">
            {filteredAssets.map((asset) => {
              const theme = getTheme(asset.id);
              const isSelected = selectedId === asset.id;
              const bal = balanceByAssetId[asset.id];
              const hasBal = bal !== undefined && parseFloat(bal) > 0;

              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => { onSelect(asset.id); onClose(); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all text-left group ${isSelected
                      ? 'bg-[#00f2ff]/5 border border-[#00f2ff]/20'
                      : 'border border-transparent hover:bg-white/[0.03] hover:border-white/5'
                    }`}
                >
                  {/* Token icon */}
                  <div className={`w-10 h-10 rounded-full ${theme.bg} border ${theme.border} flex items-center justify-center text-base font-black ${theme.text} shrink-0 transition-all group-hover:scale-110`}>
                    {theme.icon}
                  </div>

                  {/* Name + symbol */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{asset.symbol}</span>
                      {isSelected && (
                        <span className="text-[8px] font-bold text-[#00f2ff] bg-[#00f2ff]/10 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Selected</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 block truncate">{asset.name}</span>
                  </div>

                  {/* Balance */}
                  <div className="text-right shrink-0">
                    {address && bal !== undefined ? (
                      <>
                        <span className={`text-xs font-bold tabular-nums block ${hasBal ? 'text-white' : 'text-slate-600'}`}>
                          {formatBalance(bal)}
                        </span>
                        <span className="text-[9px] text-slate-600 font-bold uppercase">Balance</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-700">—</span>
                    )}
                  </div>
                </button>
              );
            })}

            {filteredAssets.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-600 italic">No matching tokens</div>
            )}
          </div>

          {/* Coming soon chains */}
          <div className="px-4 py-3 mt-3 border-t border-white/5">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">More Networks</span>
          </div>
          <div className="px-2 space-y-0.5">
            {COMING_SOON_CHAINS.map((chain) => (
              <div key={chain.id} className="flex items-center justify-between py-2.5 px-4 rounded-sm opacity-40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-base text-slate-500">
                    {chain.icon}
                  </div>
                  <span className="text-sm font-bold text-slate-500">{chain.name}</span>
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-600 px-2.5 py-1 border border-slate-800 rounded-full bg-slate-900/50">
                  Soon
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
