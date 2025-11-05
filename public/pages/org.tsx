import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useDynamicContext, getAuthToken } from '@dynamic-labs/sdk-react-core';
import Link from "next/link";
import Account from "../components/account";

export default function RootPage() {
  const router = useRouter();
  const { user, primaryWallet } = useDynamicContext();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // Lấy token từ Dynamic
        const token = await getAuthToken();
        
        // Gọi API để verify role
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        
        // Check role from database
        if (data.role !== 'org') {
          router.push('/login');
          return;
        }

        setUserData(data);
        setLoading(false);

      } catch (error) {
        console.error('Auth error:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [user, router]);

  if (loading || !userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
      <header className="w-full p-4 bg-gray-900 text-white text-center text-2xl font-semibold shadow">
        🌐 ORG Dashboard
      </header>

      <main className="mt-10 flex flex-col items-center gap-4">
        <h2 className="text-xl font-bold">Welcome, {userData.display_name || userData.email}</h2>
        <div className="p-4 rounded-xl bg-white shadow-md border w-[320px] text-center">
          <p><strong>Role:</strong> {userData.role}</p>
          <p><strong>Email:</strong> {userData.email}</p>
          <p><strong>Wallet:</strong> {primaryWallet?.address || 'No wallet connected'}</p>
        </div>
         <Account />
      </main>
    </div>
  );
}