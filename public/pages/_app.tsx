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
          onLogout: async (arg) => {
            console.log('onLogout was called', arg);
            localStorage.removeItem('auth_token');
            // Cập nhật wallet_address thành NULL trong database
            try {
              const token = localStorage.getItem('auth_token');
              const API_URL = process.env.NEXT_PUBLIC_API_URL;
              await fetch(`${API_URL}/api/users/wallet`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  wallet_address: null
                })
              });
              console.log('Wallet address cleared in DB');
            } catch (error) {
              console.error('Error removing wallet:', error);
            }
          },
          // Khi connect ví thành công
          onAuthSuccess: async (args: any) => {
            console.log('user:', args.user);
            console.log('Connected Sui Wallet:', args.primaryWallet?.address);
            if (args.authToken) {
              localStorage.setItem('auth_token', args.authToken);
              console.log('JWT token saved:', args.authToken);
                            // Cập nhật wallet address vào DB
              try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL;
                await fetch(`${API_URL}/api/users/wallet`, {
                  method: 'PUT',
                  headers: {
                    'Authorization': `Bearer ${args.authToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    wallet_address: args.primaryWallet?.address || null
                  })
                });
                console.log('Wallet address updated in DB');
              } catch (error) {
                console.error('Error updating wallet:', error);
              }
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
