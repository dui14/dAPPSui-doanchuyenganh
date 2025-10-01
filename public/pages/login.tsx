"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import WalletConnect from "../components/walletconnect";

export default function Login() {
  const account = useCurrentAccount();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Đăng nhập dApp</h1>

      <WalletConnect />

      {account ? (
        <div className="mt-4 text-green-700 font-semibold">
          Ví đã kết nối: {account.address}
        </div>
      ) : (
        <p className="mt-4 text-gray-600">Vui lòng kết nối ví</p>
      )}
    </div>
  );
}
