/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_WALLET_CONNECT_PROJECT_ID?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
