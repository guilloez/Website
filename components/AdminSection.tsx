import React, { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseEther, isAddress, parseUnits } from 'viem';
import { VAULT_CONTRACT_ADDRESS, VAULT_ABI, ERC20_ABI } from '../constants';
import { mainnet } from 'wagmi/chains';

const AdminSection: React.FC = () => {
  const { address, chain } = useAccount();
  
  // Read Owner
  const { data: ownerAddress, isLoading: isOwnerLoading, error: ownerError } = useReadContract({
    address: VAULT_CONTRACT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'owner',
    chainId: mainnet.id,
  });

  // Safely check ownership with type guards
  const isOwner = 
    address && 
    ownerAddress && 
    typeof ownerAddress === 'string' &&
    address.toLowerCase() === ownerAddress.toLowerCase();

  // State
  const [withdrawEthTo, setWithdrawEthTo] = useState('');
  const [withdrawEthAmount, setWithdrawEthAmount] = useState('');
  
  const [withdrawTokenAddr, setWithdrawTokenAddr] = useState('');
  const [withdrawTokenTo, setWithdrawTokenTo] = useState('');
  const [withdrawTokenAmount, setWithdrawTokenAmount] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState(18);

  const [newOwner, setNewOwner] = useState('');

  // Hooks
  const { writeContract: writeEth, isPending: isEthPending } = useWriteContract();
  const { writeContract: writeToken, isPending: isTokenPending } = useWriteContract();
  const { writeContract: writeOwnership, isPending: isOwnerPending } = useWriteContract();

  // Read Token Decimals helper
  const { data: decimalsData } = useReadContract({
    address: isAddress(withdrawTokenAddr) ? withdrawTokenAddr : undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    chainId: mainnet.id,
    query: {
        enabled: isAddress(withdrawTokenAddr),
    }
  });
  
  // Update decimals when loaded
  useEffect(() => {
    if (decimalsData !== undefined && decimalsData !== tokenDecimals) {
      setTokenDecimals(decimalsData as number);
    }
  }, [decimalsData, tokenDecimals]);

  // Handlers
  const handleWithdrawEth = () => {
    if (!withdrawEthTo || !withdrawEthAmount) return;
    // Fix: Explicitly pass account to satisfy TypeScript requirements
    writeEth({
      address: VAULT_CONTRACT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'withdrawEth',
      args: [withdrawEthTo as `0x${string}`, parseEther(withdrawEthAmount)],
      account: address,
      chain,
    });
  };

  const handleWithdrawToken = () => {
    if (!withdrawTokenAddr || !withdrawTokenTo || !withdrawTokenAmount) return;
    try {
      // Fix: Explicitly pass account to satisfy TypeScript requirements
      writeToken({
        address: VAULT_CONTRACT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'withdrawToken',
        args: [withdrawTokenAddr as `0x${string}`, withdrawTokenTo as `0x${string}`, parseUnits(withdrawTokenAmount, tokenDecimals)],
        account: address,
        chain,
      });
    } catch(e) {
      console.error(e);
    }
  };

  const handleTransferOwnership = () => {
    if (!newOwner || !isAddress(newOwner)) return;
    // Fix: Explicitly pass account to satisfy TypeScript requirements
    writeOwnership({
      address: VAULT_CONTRACT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'transferOwnership',
      args: [newOwner as `0x${string}`],
      account: address,
      chain,
    });
  };

  if (!isOwner) {
    return (
      <div className="tech-border bg-black/40 p-8 tech-glow text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-red-500/50 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Access Restricted</h3>
        </div>
        <p className="text-slate-400 text-sm italic leading-relaxed">Admin kernel restricted to authorized contract owner signature.</p>
        <div className="pt-4 border-t border-white/5 space-y-2">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Target Signature</p>
          <p className="text-xs font-mono text-slate-300 bg-white/5 p-2 rounded">
            {isOwnerLoading
              ? 'IDENTIFYING...'
              : ownerError
              ? 'IDENTIFICATION_FAILURE'
              : ownerAddress
              ? String(ownerAddress)
              : '---'}
          </p>
        </div>
        {ownerError && <p className="text-[10px] text-red-500/70 font-mono italic">! SYSTEM_EXCEPTION: {ownerError.message}</p>}
      </div>
    );
  }

  return (
    <div className="tech-border bg-black/40 p-8 tech-glow relative">
      <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
        <h2 className="text-xs font-black text-red-400 uppercase tracking-[0.3em]">Admin Kernel</h2>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Privileged Access</span>
        </div>
      </div>

      <div className="space-y-10">
        
        {/* Withdraw ETH */}
        <div className="space-y-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-3 bg-red-500/50" />
            ETH Egress Flow
          </p>
          <div className="bg-white/[0.02] border border-white/5 p-4 space-y-3">
            <input
              className="w-full bg-black border border-white/10 p-3 text-xs font-mono text-red-400 placeholder:text-slate-900 focus:outline-none focus:border-red-500/40 uppercase"
              placeholder="TARGET_RECIPIENT_ADDRESS"
              value={withdrawEthTo}
              onChange={(e) => setWithdrawEthTo(e.target.value)}
            />
            <input
              className="w-full bg-black border border-white/10 p-3 text-xs font-mono text-white placeholder:text-slate-900 focus:outline-none focus:border-red-500/40 uppercase"
              placeholder="AMOUNT_ETH"
              type="number"
              value={withdrawEthAmount}
              onChange={(e) => setWithdrawEthAmount(e.target.value)}
            />
            <button
              onClick={handleWithdrawEth}
              disabled={isEthPending}
              className="w-full bg-red-950/30 border border-red-500/20 hover:bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] py-3 transition-all"
            >
              {isEthPending ? 'EXECUTING...' : 'INITIATE_EGRESS'}
            </button>
          </div>
        </div>

        {/* Withdraw Token */}
        <div className="space-y-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-3 bg-red-500/50" />
            Asset Egress Flow
          </p>
          <div className="bg-white/[0.02] border border-white/5 p-4 space-y-3">
            <input
              className="w-full bg-black border border-white/10 p-3 text-xs font-mono text-blue-400 placeholder:text-slate-900 focus:outline-none focus:border-red-500/40 uppercase"
              placeholder="ASSET_CONTRACT_ADDRESS"
              value={withdrawTokenAddr}
              onChange={(e) => setWithdrawTokenAddr(e.target.value)}
            />
            <input
              className="w-full bg-black border border-white/10 p-3 text-xs font-mono text-red-400 placeholder:text-slate-900 focus:outline-none focus:border-red-500/40 uppercase"
              placeholder="TARGET_RECIPIENT_ADDRESS"
              value={withdrawTokenTo}
              onChange={(e) => setWithdrawTokenTo(e.target.value)}
            />
            <input
              className="w-full bg-black border border-white/10 p-3 text-xs font-mono text-white placeholder:text-slate-900 focus:outline-none focus:border-red-500/40 uppercase"
              placeholder="QUANTITY"
              type="number"
              value={withdrawTokenAmount}
              onChange={(e) => setWithdrawTokenAmount(e.target.value)}
            />
            <button
              onClick={handleWithdrawToken}
              disabled={isTokenPending}
              className="w-full bg-red-950/30 border border-red-500/20 hover:bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] py-3 transition-all"
            >
               {isTokenPending ? 'EXECUTING...' : 'INITIATE_EGRESS'}
            </button>
          </div>
        </div>

        {/* Transfer Ownership */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-3 bg-slate-700" />
            Signature Reassignment
          </p>
          <div className="bg-white/[0.02] border border-white/5 p-4 space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Current Signature</span>
              <span className="text-[10px] font-mono text-slate-400 break-all">{(ownerAddress as string)}</span>
            </div>
            <input
              className="w-full bg-black border border-white/10 p-3 text-xs font-mono text-[#00f2ff] placeholder:text-slate-900 focus:outline-none focus:border-[#00f2ff]/40 uppercase"
              placeholder="NEW_OWNER_ADDRESS"
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
            />
            <button
              onClick={handleTransferOwnership}
              disabled={isOwnerPending}
              className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] py-3 transition-all"
            >
              {isOwnerPending ? 'REASSIGNING...' : 'REASSIGN_SIGNATURE'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminSection;