import React from 'react';
import { useDynamicContext, DynamicWidget } from '@dynamic-labs/sdk-react-core';

const WalletConnect: React.FC = () => {
  const { user, primaryWallet, setShowAuthFlow } = useDynamicContext();

  const isAuthenticated = !!user; 

  const handleConnect = () => {
    if (!isAuthenticated) {
      setShowAuthFlow(true); // Mở modal chọn ví Sui
    }
  };

  // const handleDisconnect = async () => {
  //   if (primaryWallet) {
  //     try {
  //       if ((primaryWallet as any).disconnect) {
  //         await (primaryWallet as any).disconnect();
  //         console.log('Wallet disconnected (via disconnect)');
  //       }
  //       else if ((primaryWallet as any).connector?.disconnect) {
  //         await (primaryWallet as any).connector.disconnect();
  //         console.log('Wallet disconnected (via connector.disconnect)');
  //       }
  //       else {
  //         setShowAuthFlow(false);
  //         console.log('Fallback: closed auth flow (no explicit disconnect available)');
  //       }
  //     } catch (err) {
  //       console.error('Error disconnecting wallet:', err);
  //     }
  //   }
  // };

  // if (isAuthenticated && primaryWallet) {
  //   return (
  //     <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
  //       <span className="text-sm font-medium text-gray-700">
  //         Connected: {primaryWallet.address.slice(0, 6)}...{primaryWallet.address.slice(-4)}
  //       </span>
  //       <button
  //         onClick={handleDisconnect}
  //         className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
  //       >
  //         Disconnect
  //       </button>
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-col items-center">
      <DynamicWidget /> {/* Nút connect mặc định của Dynamic */}
      {/* <button
        onClick={handleConnect}
        className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Login
      </button> */}
    </div>
  );
};

export default WalletConnect;
