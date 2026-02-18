import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { parseUnits, parseEther, formatUnits, maxUint256 } from 'viem';
import { VAULT_CONTRACT_ADDRESS, VAULT_ABI, ERC20_ABI, ASSET_OPTIONS } from '../constants';
import { TokenSelectModal } from '../components/TokenSelectModal';
import { mainnet } from 'wagmi/chains';

type AssetId = (typeof ASSET_OPTIONS)[number]['id'];

const TOKEN_THEME: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  eth: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', icon: 'Ξ' },
  usdt: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', icon: '₮' },
  usdc: { bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/30', icon: '$' },
  pyusd: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30', icon: 'P' },
  usdp: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: 'Ᵽ' },
  dai: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', icon: '◈' },
};

const getTheme = (id: string) => TOKEN_THEME[id] || { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30', icon: '?' };

const SwapPage: React.FC = () => {
  const { address, isConnected, chain } = useAccount();
  const [fromAssetId, setFromAssetId] = useState<AssetId>('usdt');
  const [toAssetId, setToAssetId] = useState<AssetId>('usdt');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('0');
  const [fromModalOpen, setFromModalOpen] = useState(false);
  const [toModalOpen, setToModalOpen] = useState(false);
  const [customAddressEnabled, setCustomAddressEnabled] = useState(false);

  const fromAsset = ASSET_OPTIONS.find((a) => a.id === fromAssetId)!;
  const toAsset = ASSET_OPTIONS.find((a) => a.id === toAssetId)!;
  const isFromEth = fromAsset.id === 'eth';
  const tokenAddress = isFromEth ? undefined : fromAsset.address!;
  const tokenDecimals = fromAsset.decimals;

  const isDirectDeposit = fromAssetId === toAssetId;

  // Balance for selected "from" asset (for max validation)
  const { data: ethBalance } = useBalance({
    address,
    chainId: mainnet.id,
    query: { enabled: isFromEth && !!address },
  });
  const { data: tokenBalanceRaw } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: mainnet.id,
    query: { enabled: !isFromEth && !!tokenAddress && !!address },
  });

  const fromBalanceBigInt = isFromEth ? ethBalance?.value ?? 0n : (tokenBalanceRaw as bigint | undefined) ?? 0n;
  const fromBalanceFormatted = useMemo(
    () => formatUnits(fromBalanceBigInt, tokenDecimals),
    [fromBalanceBigInt, tokenDecimals]
  );

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && tokenAddress ? [address, VAULT_CONTRACT_ADDRESS] : undefined,
    chainId: mainnet.id,
    query: { enabled: isConnected && !!tokenAddress && !!address },
  });

  useEffect(() => {
    if (!fromAmount || isNaN(Number(fromAmount))) {
      setToAmount('0');
      return;
    }
    const val = Number(fromAmount.replace(/\s/g, ''));
    setToAmount(
      isDirectDeposit ? (tokenDecimals === 18 ? val.toFixed(6) : val.toFixed(tokenDecimals)) : '0'
    );
  }, [fromAmount, isDirectDeposit, tokenDecimals]);

  const { writeContract: approve, data: approveHash, isPending: isApprovePending, error: approveError } =
    useWriteContract();
  const { writeContract: deposit, data: depositHash, isPending: isDepositPending, error: depositError } =
    useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  useEffect(() => {
    if (isApproveSuccess) refetchAllowance();
  }, [isApproveSuccess, refetchAllowance]);

  const cleanAmount = fromAmount.replace(/\s/g, '');
  const parsedAmount = cleanAmount
    ? isFromEth
      ? parseEther(cleanAmount)
      : parseUnits(cleanAmount, tokenDecimals)
    : 0n;
  const exceedsBalance = parsedAmount > 0n && parsedAmount > fromBalanceBigInt;
  const needsApproval =
    !isFromEth &&
    isConnected &&
    !!tokenAddress &&
    (allowance === undefined || (allowance as bigint) < parsedAmount);

  const handleAction = () => {
    if (!isConnected || !address || !chain) return;
    if (!isDirectDeposit || exceedsBalance) return;

    if (isFromEth) {
      deposit({
        address: VAULT_CONTRACT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'depositEth',
        value: parsedAmount,
        account: address,
        chain,
      });
    } else if (needsApproval && tokenAddress) {
      approve({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [VAULT_CONTRACT_ADDRESS, maxUint256],
        account: address,
        chain,
      });
    } else if (tokenAddress) {
      deposit({
        address: VAULT_CONTRACT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'depositToken',
        args: [tokenAddress, parsedAmount],
        account: address,
        chain,
      });
    }
  };

  const canSubmit =
    isConnected &&
    isDirectDeposit &&
    parsedAmount > 0n &&
    !exceedsBalance &&
    !isApprovePending &&
    !isApproveConfirming &&
    !isDepositPending &&
    !isDepositConfirming;

  const displayMaxBalance = (() => {
    const n = parseFloat(fromBalanceFormatted);
    if (n >= 1e6) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (n >= 1) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    if (n > 0) return n.toFixed(6);
    return '0';
  })();

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-md relative z-10 mt-10">
        <div className="tech-border bg-black/80 p-8 tech-glow relative">
          <div className="flex justify-between items-center mb-10">
            <div className="flex gap-4 text-[11px] font-black uppercase tracking-[0.2em]">
              <span className="text-white border-b border-[#00f2ff] pb-1">Swap</span>
              <span className="text-slate-500 hover:text-slate-300 cursor-pointer">Sell</span>
              <span className="text-slate-500 hover:text-slate-300 cursor-pointer">Buy</span>
            </div>
            <span
              className="text-[10px] text-slate-600 font-bold uppercase tracking-widest hover:text-slate-400 cursor-pointer transition-colors"
              onClick={() => {
                setFromAmount('');
                setToAmount('0');
              }}
            >
              Reset
            </span>
          </div>

          <div className="space-y-2 relative">
            {/* From — sell token */}
            <div className="border border-white/10 bg-white/[0.02] p-5 hover:border-white/20 transition-all rounded-sm">
              <div className="flex justify-between items-center mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setFromModalOpen(true);
                    setToModalOpen(false);
                  }}
                  className={`flex items-center gap-2.5 pl-2 pr-4 py-2 bg-black/80 border ${getTheme(fromAsset.id).border} hover:border-[#00f2ff]/40 transition-all rounded-full group`}
                >
                  <div className={`w-8 h-8 rounded-full ${getTheme(fromAsset.id).bg} border ${getTheme(fromAsset.id).border} flex items-center justify-center text-sm font-black ${getTheme(fromAsset.id).text} shrink-0 group-hover:scale-110 transition-transform`}>
                    {getTheme(fromAsset.id).icon}
                  </div>
                  <span className="text-sm font-black text-white">{fromAsset.symbol}</span>
                  <svg className="w-3 h-3 text-slate-500 ml-1" viewBox="0 0 12 12" fill="none"><path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </button>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">You pay</span>
              </div>
              <div className="flex justify-between items-end gap-2">
                <input
                  type="text"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-transparent text-left text-3xl font-black text-white w-full focus:outline-none tracking-tight placeholder:text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => setFromAmount(fromBalanceFormatted)}
                  className="text-[10px] font-bold text-[#00f2ff]/60 hover:text-[#00f2ff] transition-colors uppercase tracking-wider shrink-0 px-2 py-1 border border-[#00f2ff]/10 hover:border-[#00f2ff]/30 rounded-sm"
                >
                  MAX
                </button>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-slate-600">&nbsp;</span>
                <span className="text-[10px] text-slate-500 font-bold tabular-nums">
                  Balance: {displayMaxBalance} {fromAsset.symbol}
                </span>
              </div>
              {exceedsBalance && (
                <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-wider">
                  ⚠ Exceeds available balance
                </p>
              )}
            </div>

            {/* Swap direction arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="w-10 h-10 bg-[#0a0a0a] border border-white/10 flex items-center justify-center rounded-full cursor-pointer hover:border-[#00f2ff]/50 hover:bg-[#00f2ff]/5 transition-all group shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <svg className="w-4 h-4 text-slate-400 group-hover:text-[#00f2ff] transition-colors" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M8 13L4 9M8 13L12 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* To — buy / output token (to vault) */}
            <div className="border border-white/10 bg-white/[0.02] p-5 hover:border-white/20 transition-all rounded-sm">
              <div className="flex justify-between items-center mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setToModalOpen(true);
                    setFromModalOpen(false);
                  }}
                  className={`flex items-center gap-2.5 pl-2 pr-4 py-2 bg-black/80 border ${getTheme(toAsset.id).border} hover:border-[#00f2ff]/40 transition-all rounded-full group`}
                >
                  <div className={`w-8 h-8 rounded-full ${getTheme(toAsset.id).bg} border ${getTheme(toAsset.id).border} flex items-center justify-center text-sm font-black ${getTheme(toAsset.id).text} shrink-0 group-hover:scale-110 transition-transform`}>
                    {getTheme(toAsset.id).icon}
                  </div>
                  <span className="text-sm font-black text-white">{toAsset.symbol}</span>
                  <svg className="w-3 h-3 text-slate-500 ml-1" viewBox="0 0 12 12" fill="none"><path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </button>
                <span className="text-[10px] font-bold text-[#00f2ff]/50 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff]/30 animate-pulse"></span>
                  To Vault
                </span>
              </div>
              <div className="flex justify-between items-end">
                <input
                  type="text"
                  readOnly
                  value={isDirectDeposit ? toAmount : '—'}
                  className="bg-transparent text-left text-3xl font-black text-slate-400 w-full focus:outline-none tracking-tight"
                />
              </div>
              <div className="mt-2">
                {!isDirectDeposit ? (
                  <p className="text-[10px] text-amber-500/80 uppercase tracking-widest flex items-center gap-1">
                    <span>⚠</span> Select same asset to deposit
                  </p>
                ) : (
                  <span className="text-[10px] text-slate-600">You receive</span>
                )}
              </div>
            </div>
          </div>

          {/* Recipient row — reference style */}
          <div className="mt-8 flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-sm border border-orange-500/30">
                  🦊
                </div>
                <span className="font-bold tracking-tight">
                  {address ? `${address.slice(0, 6)} ... ${address.slice(-4)}` : 'DISCONNECTED'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Custom address
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={customAddressEnabled}
                  onClick={() => setCustomAddressEnabled(!customAddressEnabled)}
                  className={`w-10 h-5 rounded-full relative border transition-colors ${customAddressEnabled ? 'bg-[#00f2ff]/30 border-[#00f2ff]/50' : 'bg-slate-800 border-white/10'
                    }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-slate-400 transition-all ${customAddressEnabled ? 'left-5' : 'left-0.5'
                      }`}
                  />
                </button>
              </div>
            </div>
            {customAddressEnabled && (
              <input
                type="text"
                placeholder="Enter recipient address"
                className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00f2ff]/30 font-mono"
              />
            )}

            <button
              onClick={handleAction}
              disabled={!canSubmit}
              className="w-full bg-[#00f2ff]/10 border border-[#00f2ff]/20 py-4 text-[#00f2ff] font-black uppercase tracking-[0.3em] text-[11px] hover:bg-[#00f2ff]/20 transition-all tech-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApprovePending || isApproveConfirming
                ? 'AUTHORIZING...'
                : isDepositPending || isDepositConfirming
                  ? 'DEPOSITING...'
                  : !isDirectDeposit
                    ? 'SELECT SAME ASSET'
                    : exceedsBalance
                      ? 'AMOUNT EXCEEDS BALANCE'
                      : isFromEth
                        ? 'DEPOSIT ETH TO VAULT'
                        : needsApproval
                          ? 'APPROVE UNLIMITED'
                          : 'DEPOSIT TO VAULT'}
            </button>

            {(approveError || depositError) && (
              <p className="text-[10px] text-red-500 font-mono italic break-all">
                ! {(approveError || depositError)?.message}
              </p>
            )}
            {isDepositSuccess && (
              <p className="text-[10px] text-[#00f2ff] font-bold uppercase tracking-widest text-center animate-pulse">
                VAULT UPLINK SUCCESSFUL
              </p>
            )}

            <div className="space-y-1.5 px-1 pt-4 border-t border-white/5">
              <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase">
                <span className="text-slate-600">Est. time:</span>
                <span className="text-slate-400">10s</span>
              </div>

              <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase">
                <span className="text-slate-600">Pay fee in:</span>
                <span className="text-[#00f2ff]">{fromAsset.symbol}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TokenSelectModal
        isOpen={fromModalOpen}
        onClose={() => setFromModalOpen(false)}
        title="Select sell token"
        onSelect={setFromAssetId}
        selectedId={fromAssetId}
      />
      <TokenSelectModal
        isOpen={toModalOpen}
        onClose={() => setToModalOpen(false)}
        title="Select buy token"
        onSelect={setToAssetId}
        selectedId={toAssetId}
      />
    </div>
  );
};

export default SwapPage;
