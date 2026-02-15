import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, isAddress, parseUnits } from 'viem';
import { VAULT_CONTRACT_ADDRESS, VAULT_ABI, ERC20_ABI } from '../constants';

const DepositSection: React.FC = () => {
  const { address, chain } = useAccount();
  
  // --- ETH DEPOSIT STATE ---
  const [ethAmount, setEthAmount] = useState('');
  
  // --- TOKEN DEPOSIT STATE ---
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState<number>(18);

  // --- WAGMI HOOKS FOR TRANSACTIONS ---
  const { 
    data: depositEthHash, 
    writeContract: depositEth, 
    isPending: isEthPending, 
    error: ethError 
  } = useWriteContract();

  const { 
    data: approveHash, 
    writeContract: approveToken, 
    isPending: isApprovePending,
    error: approveError 
  } = useWriteContract();

  const { 
    data: depositTokenHash, 
    writeContract: depositToken, 
    isPending: isTokenDepositPending,
    error: tokenError 
  } = useWriteContract();

  // --- READS ---
  // Read Token Decimals
  const { data: decimalsData } = useReadContract({
    address: isAddress(tokenAddress) ? tokenAddress : undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
        enabled: isAddress(tokenAddress),
    }
  });

  // Read Token Allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: isAddress(tokenAddress) ? tokenAddress : undefined,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && isAddress(tokenAddress) ? [address, VAULT_CONTRACT_ADDRESS] : undefined,
    query: {
        enabled: !!address && isAddress(tokenAddress),
    }
  });

  useEffect(() => {
    if (decimalsData) setTokenDecimals(decimalsData as number);
  }, [decimalsData]);

  // --- RECEIPT WAITERS ---
  const { isLoading: isEthConfirming, isSuccess: isEthSuccess } = useWaitForTransactionReceipt({
    hash: depositEthHash,
  });

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isTokenDepositConfirming, isSuccess: isTokenDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositTokenHash,
  });

  // Refetch allowance after approval
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

  // --- HANDLERS ---

  const handleDepositEth = () => {
    if (!ethAmount) return;
    // Fix: Explicitly pass account to satisfy TypeScript requirements
    depositEth({
      address: VAULT_CONTRACT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'depositEth',
      value: parseEther(ethAmount),
      account: address,
      chain,
    });
  };

  const handleApproveToken = () => {
    if (!tokenAddress || !tokenAmount) return;
    try {
      const amountParsed = parseUnits(tokenAmount, tokenDecimals);
      // Fix: Explicitly pass account to satisfy TypeScript requirements
      approveToken({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [VAULT_CONTRACT_ADDRESS, amountParsed],
        account: address,
        chain,
      });
    } catch (e) {
      console.error("Invalid amount or decimals");
    }
  };

  const handleDepositToken = () => {
    if (!tokenAddress || !tokenAmount) return;
    try {
      const amountParsed = parseUnits(tokenAmount, tokenDecimals);
      // Fix: Explicitly pass account to satisfy TypeScript requirements
      depositToken({
        address: VAULT_CONTRACT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'depositToken',
        args: [tokenAddress as `0x${string}`, amountParsed],
        account: address,
        chain,
      });
    } catch (e) {
      console.error("Invalid amount or decimals");
    }
  };

  // Determine if we need to approve first
  const parsedTokenAmount = tokenAmount ? tryParseUnits(tokenAmount, tokenDecimals) : BigInt(0);
  const currentAllowance = (allowance as bigint) || BigInt(0);
  const needsApproval = parsedTokenAmount > currentAllowance;

  function tryParseUnits(val: string, dec: number) {
    try { return parseUnits(val, dec); } catch { return BigInt(0); }
  }

  return (
    <div className="space-y-8">
      {/* Deposit ETH Card */}
      <div className="tech-border bg-black/40 p-8 tech-glow">
        <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00f2ff]" />
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Module: ETH Ingress</h3>
        </div>
        
        <div className="space-y-6">
          <div className="group">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 group-focus-within:text-[#00f2ff] transition-colors">Amount // ETH</label>
            <div className="relative">
              <input
                type="number"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-black border border-white/10 p-4 text-xl font-black text-white placeholder:text-slate-900 focus:outline-none focus:border-[#00f2ff]/40 transition-all tracking-tight"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-700 uppercase">Input_Val</div>
            </div>
          </div>

          <button
            onClick={handleDepositEth}
            disabled={!ethAmount || isEthPending || isEthConfirming}
            className="w-full relative group overflow-hidden bg-[#00f2ff] disabled:bg-slate-900 py-4 transition-all"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
            <span className="relative text-black font-black uppercase tracking-[0.2em] text-xs">
              {isEthPending || isEthConfirming ? 'Transmitting...' : 'Execute Deposit'}
            </span>
          </button>
          
          {ethError && <p className="text-[10px] text-red-500/70 font-mono italic p-2 border border-red-500/20 bg-red-500/5">! ERROR: {ethError.message}</p>}
          {isEthSuccess && <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest text-center">Protocol Success: Asset Secured</p>}
        </div>
      </div>

      {/* Deposit ERC20 Card */}
      <div className="tech-border bg-black/40 p-8 tech-glow">
        <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Module: ERC20 Bridge</h3>
        </div>

        <div className="space-y-6">
          <div className="group">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 group-focus-within:text-blue-400 transition-colors">Asset Address</label>
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="0x..."
              className="w-full bg-black border border-white/10 p-3 text-xs font-mono text-blue-400 placeholder:text-slate-900 focus:outline-none focus:border-blue-500/40 transition-all uppercase"
            />
          </div>

          <div className="group">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 group-focus-within:text-blue-400 transition-colors">Quantity</label>
            <div className="relative">
              <input
                type="number"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-black border border-white/10 p-4 text-xl font-black text-white placeholder:text-slate-900 focus:outline-none focus:border-blue-500/40 transition-all tracking-tight"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-700 uppercase tracking-widest">Units</div>
            </div>
          </div>
          
          {needsApproval ? (
            <button
              onClick={handleApproveToken}
              disabled={!tokenAddress || !tokenAmount || isApprovePending || isApproveConfirming}
              className="w-full relative group overflow-hidden bg-blue-600 disabled:bg-slate-900 py-4 transition-all"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
              <span className="relative text-white font-black uppercase tracking-[0.2em] text-xs">
                {isApprovePending || isApproveConfirming ? 'Authorizing...' : 'Authorize Protocol'}
              </span>
            </button>
          ) : (
             <button
              onClick={handleDepositToken}
              disabled={!tokenAddress || !tokenAmount || isTokenDepositPending || isTokenDepositConfirming}
              className="w-full relative group overflow-hidden bg-[#00f2ff] disabled:bg-slate-900 py-4 transition-all"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
              <span className="relative text-black font-black uppercase tracking-[0.2em] text-xs">
                {isTokenDepositPending || isTokenDepositConfirming ? 'Transmitting...' : 'Execute Deposit'}
              </span>
            </button>
          )}

          {(approveError || tokenError) && (
             <p className="text-[10px] text-red-500/70 font-mono italic p-2 border border-red-500/20 bg-red-500/5">! ERROR: {(approveError || tokenError)?.message}</p>
          )}
          {isApproveSuccess && !isTokenDepositSuccess && <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest text-center animate-pulse">Authorization Granted: Ready for Transfer</p>}
          {isTokenDepositSuccess && <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest text-center">Protocol Success: Assets Secured</p>}
        </div>
      </div>
    </div>
  );
};

export default DepositSection;