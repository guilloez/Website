import React, { useMemo } from 'react';
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
};

const COMING_SOON_CHAINS = [
  { id: 'solana', name: 'Solana', logo: 'SOL' },
  { id: 'bsc', name: 'BSC', logo: 'BSC' },
  { id: 'tron', name: 'Tron', logo: 'TRX' },
  { id: 'ton', name: 'TON', logo: 'TON' },
];

export const TokenSelectModal: React.FC<TokenSelectModalProps> = ({ isOpen, onClose, title, onSelect }) => {
  const { address } = useAccount();

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

  const formatBalance = (raw: string, decimals: number) => {
    const n = parseFloat(raw);
    if (n >= 1e6) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (n >= 1) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    if (n > 0) return n.toFixed(6);
    return '0';
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-40" onClick={onClose} aria-hidden="true" />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md max-h-[80vh] flex flex-col bg-[#0d0d0d] border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-sm font-black text-[#00f2ff] uppercase tracking-widest">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {/* Ethereum - expanded */}
          <div className="mb-2">
            <div className="flex items-center gap-2 py-2 text-[#00f2ff] font-bold text-xs uppercase tracking-wider">
              <span className="w-6 h-6 rounded-full bg-[#00f2ff]/20 flex items-center justify-center text-[10px]">⟠</span>
              Ethereum
              <span className="text-slate-500 ml-1">▴</span>
            </div>
            <div className="space-y-0.5 pl-1">
              {ASSET_OPTIONS.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    onSelect(asset.id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                      asset.id === 'eth' ? 'bg-[#00f2ff]/30 text-[#00f2ff]' : 'bg-purple-500/30 text-purple-300'
                    }`}
                  >
                    {asset.symbol.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-black text-white block">{asset.symbol}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{asset.name}</span>
                  </div>
                  {address && balanceByAssetId[asset.id] !== undefined && (
                    <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                      {formatBalance(balanceByAssetId[asset.id], asset.decimals)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Coming soon */}
          {COMING_SOON_CHAINS.map((chain) => (
            <div key={chain.id} className="flex items-center justify-between py-2.5 px-3 rounded border border-white/5 opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-[10px] font-black text-slate-500">
                  {chain.logo.slice(0, 2)}
                </div>
                <span className="text-xs font-bold text-slate-400">{chain.name}</span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 px-2 py-1 border border-slate-700 rounded">
                Coming soon
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
