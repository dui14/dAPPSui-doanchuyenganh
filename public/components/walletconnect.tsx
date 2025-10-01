"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

export default function WalletConnect() {
  const account = useCurrentAccount();

  return (
    <div className="p-4">
      <ConnectButton />
      {account && (
        <div className="mt-2 text-sm text-white bg-gray-800 px-3 py-2 rounded-lg shadow-lg">
          Connected to: <b>{account.address}</b>
        </div>
      )}
    </div>
  );
}