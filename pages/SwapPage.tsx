import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, isAddress } from 'viem';
import { VAULT_CONTRACT_ADDRESS, VAULT_ABI, ERC20_ABI } from '../constants';
import { CustomConnectButton } from '../components/CustomConnectButton';
import { mainnet } from 'wagmi/chains';

const SwapPage: React.FC = () => {
  const { address, isConnected, chain } = useAccount();
  const [fromAmount, setFromAmount] = useState('0.1');
  const [tokenAddress, setTokenAddress] = useState('0xdAC17F958D2ee523a2206206994597C13D831ec7'); // Default USDT
  const [tokenDecimals, setTokenDecimals] = useState(6); // USDT is 6 decimals
  const [toAmount, setToAmount] = useState('0');

  // 1. Check Allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: isAddress(tokenAddress) ? (tokenAddress as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && isAddress(tokenAddress) ? [address, VAULT_CONTRACT_ADDRESS] : undefined,
    chainId: mainnet.id,
    query: {
      enabled: isConnected && isAddress(tokenAddress) && !!address,
    },
  });

  // 2. Read Token Decimals
  const { data: decimalsData } = useReadContract({
    address: isAddress(tokenAddress) ? (tokenAddress as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    chainId: mainnet.id,
    query: {
      enabled: isAddress(tokenAddress),
    }
  });

  useEffect(() => {
    if (decimalsData !== undefined) {
      setTokenDecimals(decimalsData as number);
    }
  }, [decimalsData]);

  // 3. Update toAmount (simulated swap output)
  useEffect(() => {
    if (!fromAmount || isNaN(Number(fromAmount))) {
      setToAmount('0');
      return;
    }
    const val = Number(fromAmount.replace(/\s/g, ''));
    setToAmount((val * 0.999).toFixed(6));
  }, [fromAmount]);

  // Hooks for Write
  const { writeContract: approve, data: approveHash, isPending: isApprovePending, error: approveError } = useWriteContract();
  const { writeContract: deposit, data: depositHash, isPending: isDepositPending, error: depositError } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({ hash: depositHash });

  useEffect(() => {
    if (isApproveSuccess) refetchAllowance();
  }, [isApproveSuccess, refetchAllowance]);

  // Determine if we need to approve first
  const cleanAmount = fromAmount.replace(/\s/g, '');
  const parsedAmount = cleanAmount ? parseUnits(cleanAmount, tokenDecimals) : 0n;
  const needsApproval = isConnected && isAddress(tokenAddress) && (allowance === undefined || (allowance as bigint) < parsedAmount);

  const handleAction = () => {
    if (!isConnected || !address || !chain) return;
    if (needsApproval) {
      approve({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [VAULT_CONTRACT_ADDRESS, parsedAmount],
        account: address,
        chain,
      });
    } else {
      deposit({
        address: VAULT_CONTRACT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'depositToken',
        args: [tokenAddress as `0x${string}`, parsedAmount],
        account: address,
        chain,
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 font-mono relative overflow-hidden flex flex-col items-center py-10 px-4">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(0,242,255,0.05),transparent_70%)]" />
      
      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-16 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 tech-border tech-glow flex items-center justify-center font-bold text-2xl text-[#00f2ff] bg-black/50">
            TV
          </div>
          <h1 className="text-2xl font-black tracking-[0.2em] text-white uppercase italic">TokenVault</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <span className="hover:text-white cursor-pointer flex items-center gap-1">
              <span className="text-[#00f2ff]">ⓘ</span> About
            </span>
            <span className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 cursor-pointer">
              ☼
            </span>
          </div>
          <CustomConnectButton />
        </div>
      </header>

      {/* Swap Interface */}
      <main className="w-full max-w-md relative z-10 mt-10">
        <div className="tech-border bg-black/80 p-8 tech-glow relative">
          <div className="flex justify-between items-center mb-10">
            <div className="flex gap-4 text-[11px] font-black uppercase tracking-[0.2em]">
              <span className="text-white border-b border-[#00f2ff] pb-1">Swap</span>
              <span className="text-slate-500 hover:text-slate-300 cursor-pointer">Sell</span>
              <span className="text-slate-500 hover:text-slate-300 cursor-pointer">Buy</span>
            </div>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest hover:text-slate-400 cursor-pointer transition-colors">Reset</span>
          </div>

          <div className="space-y-2 relative">
            {/* From Input */}
            <div className="border border-white/10 bg-white/[0.02] p-5 hover:border-white/20 transition-all">
              <div className="flex justify-between items-center mb-3">
                <input
                  type="text"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  placeholder="Token Address (0x...)"
                  className="bg-black border border-white/10 px-2 py-1 text-[10px] font-black text-white w-2/3 focus:outline-none focus:border-[#00f2ff]/30"
                />
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-[#00f2ff] tracking-widest">IN</span>
                <input 
                  type="text" 
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="bg-transparent text-right text-3xl font-black text-white w-full focus:outline-none tracking-tighter"
                />
              </div>
            </div>

            {/* Swap Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black border border-white/10 flex items-center justify-center rounded-full tech-glow cursor-pointer hover:border-[#00f2ff]/50 transition-all group">
              <span className="text-xs group-hover:text-[#00f2ff] transition-colors">↓</span>
            </div>

            {/* To Input */}
            <div className="border border-white/10 bg-white/[0.02] p-5 hover:border-white/20 transition-all">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2 px-2 py-1 bg-black border border-white/10 opacity-50">
                  <div className="w-4 h-4 rounded-full bg-purple-500" />
                  <span className="text-[10px] font-black text-white">VAULT_STORAGE</span>
                </div>
                <span className="text-[9px] font-bold text-[#00f2ff]/70 uppercase tracking-widest">Destination Secured</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-slate-500 tracking-widest">OUT</span>
                <input 
                  type="text" 
                  readOnly
                  value={toAmount}
                  className="bg-transparent text-right text-3xl font-black text-slate-400 w-full focus:outline-none tracking-tighter"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <div className="w-4 h-4 rounded-full bg-orange-500/20 flex items-center justify-center text-[8px] text-orange-500 border border-orange-500/30">🦊</div>
                <span className="font-bold tracking-tight">{address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'DISCONNECTED'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Custom address</span>
                <div className="w-8 h-4 bg-slate-800 rounded-full relative cursor-pointer border border-white/10 group">
                  <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-slate-500 rounded-full group-hover:bg-slate-400" />
                </div>
              </div>
            </div>

            <button 
              onClick={handleAction}
              disabled={!isConnected || isApprovePending || isApproveConfirming || isDepositPending || isDepositConfirming}
              className="w-full bg-[#00f2ff]/10 border border-[#00f2ff]/20 py-4 text-[#00f2ff] font-black uppercase tracking-[0.3em] text-[11px] hover:bg-[#00f2ff]/20 transition-all tech-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApprovePending || isApproveConfirming ? 'AUTHORIZING...' : 
               isDepositPending || isDepositConfirming ? 'DEPOSITING...' :
               needsApproval ? 'APPROVE TOKEN' : 'SWAP TO VAULT'}
            </button>

            {(approveError || depositError) && (
              <p className="text-[10px] text-red-500 font-mono italic break-all">! {(approveError || depositError)?.message}</p>
            )}
            {isDepositSuccess && (
              <p className="text-[10px] text-[#00f2ff] font-bold uppercase tracking-widest text-center animate-pulse">VAULT UPLINK SUCCESSFUL</p>
            )}

            <div className="space-y-1.5 px-1 pt-4 border-t border-white/5">
              <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase">
                <span className="text-slate-600">Est.time:</span>
                <span className="text-slate-400">2 min</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase">
                <span className="text-slate-600">Total fee:</span>
                <span className="text-slate-400">≈ $0.23</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase">
                <span className="text-slate-600">Pay fee in:</span>
                <span className="text-[#00f2ff]">USDT</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto py-10 text-[10px] font-bold text-slate-600 uppercase tracking-widest relative z-10 w-full max-w-6xl flex justify-between border-t border-white/5">
        <p>Interact with contract 0x59BB...A67d</p>
        <p>Built with Wagmi + RainbowKit</p>
      </footer>
    </div>
  );
};

export default SwapPage;
