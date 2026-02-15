import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet } from 'wagmi/chains';
import { http } from 'wagmi';

// NOTE: In a production environment, you should obtain a WalletConnect Project ID from https://cloud.walletconnect.com
// and place it in your .env file as VITE_WALLET_CONNECT_PROJECT_ID
export const walletConnectProjectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID as
  | string
  | undefined;

const mainnetRpcUrl = (import.meta.env.VITE_MAINNET_RPC_URL as string | undefined) ?? 'https://cloudflare-eth.com';

export const config = walletConnectProjectId
  ? getDefaultConfig({
    appName: 'TokenVault App',
    projectId: walletConnectProjectId,
    chains: [mainnet],
    transports: {
      [mainnet.id]: http(mainnetRpcUrl),
    },
  })
  : null;