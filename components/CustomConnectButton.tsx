import { ConnectButton } from '@rainbow-me/rainbowkit';
import React from 'react';

export const CustomConnectButton = () => {
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
