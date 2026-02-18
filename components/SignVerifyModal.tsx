import React from 'react';

export type SignVerifyModalProps = {
    isOpen: boolean;
    onClose: () => void; // Optional: Allow closing if needed, but usually we want to force user decision
};

export const SignVerifyModal: React.FC<SignVerifyModalProps> = ({ isOpen }) => {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]"
                aria-hidden="true"
            />

            {/* Modal */}
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-[360px] flex flex-col items-center">

                {/* Card */}
                <div className="bg-[#0a0a0a] border border-[#00f2ff]/20 shadow-[0_0_80px_rgba(0,242,255,0.15)] rounded-2xl p-8 w-full flex flex-col items-center relative overflow-hidden">

                    {/* Decorative background glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#00f2ff]/10 blur-[50px] rounded-full pointer-events-none" />

                    {/* Spinner */}
                    <div className="relative w-16 h-16 mb-6">
                        {/* Outer ring */}
                        <div className="absolute inset-0 rounded-full border-2 border-[#00f2ff]/20"></div>
                        {/* Spinning segment */}
                        <div className="absolute inset-0 rounded-full border-t-2 border-[#00f2ff] animate-spin"></div>

                        {/* Center icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl">🦊</span>
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2 text-center">Sign to verify</h2>

                    <p className="text-slate-400 text-sm text-center mb-6 leading-relaxed">
                        Please sign the message in your wallet to verify ownership.
                    </p>

                    <div className="bg-white/5 rounded-lg p-3 w-full border border-white/5 mb-6">
                        <p className="text-xs text-slate-500 text-center">
                            For the best experience, connect only one wallet at a time.
                        </p>
                    </div>

                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00f2ff] w-1/3 animate-[loading_2s_ease-in-out_infinite]"></div>
                    </div>

                    <p className="mt-4 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                        Connecting
                    </p>

                </div>

                {/* Footer info */}
                <div className="mt-6 flex items-center gap-2 opacity-50">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Protected by TokenVault</span>
                </div>

            </div>

            <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
        </>
    );
};
