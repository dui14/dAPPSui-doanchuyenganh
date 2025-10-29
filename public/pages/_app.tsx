import type { AppProps } from "next/app";
import { useEffect } from 'react';
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
            localStorage.removeItem('auth_token');
          },
          onAuthSuccess: (args: any) => {
            console.log('user:', args.user);
            console.log('Connected Sui Wallet:', args.primaryWallet?.address);
            if (args.authToken) {
              localStorage.setItem('auth_token', args.authToken);
              console.log('JWT token saved:', args.authToken);
            }
          },
          onAuthFailure: () => {
            console.error('Sui Wallet Connect Failed');
            localStorage.removeItem('auth_token');
          },
        },
      }}
    >
      <Component {...pageProps} />
    </DynamicContextProvider>
  );
}
