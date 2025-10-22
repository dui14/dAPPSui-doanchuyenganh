import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  SuiClientProvider,
  WalletProvider,
  createNetworkConfig,
} from "@mysten/dapp-kit";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { SuiWalletConnectors } from "@dynamic-labs/sui";
import "../styles/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID,
        walletConnectors: [SuiWalletConnectors], 
        events: {
          onLogout: (arg) => {
            console.log('onLogout was called', arg);
          },
          onAuthSuccess: ({ primaryWallet }) => {
            console.log('Connected Sui Wallet:', primaryWallet?.address);
          },
          onAuthFailure: () => {
            console.error('Sui Wallet Connect Failed');
          },
        },
      }}
    >
      <Component {...pageProps} />
    </DynamicContextProvider>
  );
}
