import React, { useEffect } from 'react';
import { useDynamicContext, DynamicWidget } from '@dynamic-labs/sdk-react-core';

const WalletConnect: React.FC = () => {
  const { user, primaryWallet, setShowAuthFlow } = useDynamicContext();

  const isAuthenticated = !!user;

  const handleConnect = () => {
    if (!isAuthenticated) {
      setShowAuthFlow(true); // Mở modal chọn ví Sui
    }
  };
  useEffect(() => {
    const updateWalletInDB = async () => {
      if (!user?.email) return;

      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        await fetch(`${API_URL}/api/users/wallet`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            wallet_address: primaryWallet?.address || null
          })
        });

        console.log('Wallet updated in DB:', primaryWallet?.address || 'NULL');
      } catch (error) {
        console.error('Error updating wallet:', error);
      }
    };

    updateWalletInDB();
  }, [primaryWallet, user?.email]); // Chạy khi primaryWallet hoặc user email thay đổi

  return (
    <div className="flex flex-col items-center">
      <DynamicWidget />
      
      {/* Hiển thị trạng thái ví */}
      {primaryWallet && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-300">
            Connected Wallet: {primaryWallet.address.slice(0, 6)}...{primaryWallet.address.slice(-4)}
          </p>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;