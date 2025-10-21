"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import WalletConnect from "../components/walletconnect";
import Link from "next/link";

export default function Login() {
  const account = useCurrentAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Blockchain Tech Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-cyan-900/30"></div>
        
        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-15">
          <div className="grid grid-cols-20 grid-rows-20 h-full w-full">
            {Array.from({length: 400}).map((_, i) => (
              <div 
                key={i} 
                className="border-blue-400/10 border-r border-b animate-pulse" 
                style={{animationDelay: `${(i % 20) * 0.1}s`}}
              ></div>
            ))}
          </div>
        </div>
        
        {/* Floating Particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-purple-400/60 rounded-full animate-bounce"></div>
        <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-indigo-400 rounded-full animate-ping"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top Panel - Branding */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="text-center max-w-4xl">
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/25">
                <span className="text-2xl">⛓️</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">EduChain</h1>
                <p className="text-blue-400 font-mono text-sm">Blockchain Education Platform</p>
              </div>
            </div>
            
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Decentralized
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Certificate </span>
              Management
            </h2>
            
            <p className="text-gray-300 text-xl mb-8 leading-relaxed max-w-2xl mx-auto">
              Secure, transparent, and immutable certificate verification powered by Sui blockchain technology.
            </p>
            
            <div className="flex items-center justify-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-emerald-400">🔒</span>
                </div>
                <span className="text-gray-300">Cryptographically Secured</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-cyan-400">⚡</span>
                </div>
                <span className="text-gray-300">Instant Verification</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-blue-400">🌐</span>
                </div>
                <span className="text-gray-300">Global Accessibility</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Panel - Login */}
        <div className="flex justify-center px-8 pb-12">
          <div className="w-full max-w-4xl">
            {/* Login Card */}
            <div className="bg-gray-900/50 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Connect Wallet</h2>
                <p className="text-gray-400">Access the blockchain education network</p>
              </div>

              <div className="flex justify-center mb-6">
                <WalletConnect />
              </div>

              {account ? (
                <div className="space-y-6">
                  {/* Connection Status */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 max-w-md mx-auto">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-blue-400 font-medium">Connected</span>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 font-mono text-xs text-gray-300 break-all">
                      {account.address}
                    </div>
                  </div>

                  {/* Role Grid */}
                  <div className="space-y-4">
                    <h3 className="text-white font-medium text-center">Select Access Level</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
                      <Link href="/admin/root" className="group bg-gradient-to-br from-red-500/10 to-orange-500/10 hover:from-red-500/20 hover:to-orange-500/20 border border-red-500/20 hover:border-red-400/40 rounded-xl p-6 text-center transition-all duration-300">
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🏛️</div>
                        <div className="text-white font-medium">Ministry</div>
                        <div className="text-red-400/80 text-xs">Level 4</div>
                      </Link>
                      
                      <Link href="/admin/org" className="group bg-gradient-to-br from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 border border-blue-500/20 hover:border-blue-400/40 rounded-xl p-6 text-center transition-all duration-300">
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🏢</div>
                        <div className="text-white font-medium">University</div>
                        <div className="text-blue-400/80 text-xs">Level 3</div>
                      </Link>
                      
                      <Link href="/admin/admin_org" className="group bg-gradient-to-br from-emerald-500/10 to-green-500/10 hover:from-emerald-500/20 hover:to-green-500/20 border border-emerald-500/20 hover:border-emerald-400/40 rounded-xl p-6 text-center transition-all duration-300">
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🏫</div>
                        <div className="text-white font-medium">Faculty</div>
                        <div className="text-emerald-400/80 text-xs">Level 2</div>
                      </Link>
                      
                      <Link href="/user" className="group bg-gradient-to-br from-purple-500/10 to-violet-500/10 hover:from-purple-500/20 hover:to-violet-500/20 border border-purple-500/20 hover:border-purple-400/40 rounded-xl p-6 text-center transition-all duration-300">
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">👨🎓</div>
                        <div className="text-white font-medium">Student</div>
                        <div className="text-purple-400/80 text-xs">Level 1</div>
                      </Link>
                      
                      <Link href="/verify" className="group bg-gradient-to-br from-gray-600/10 to-slate-600/10 hover:from-gray-600/20 hover:to-slate-600/20 border border-gray-500/20 hover:border-gray-400/40 rounded-xl p-6 text-center transition-all duration-300">
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🔍</div>
                        <div className="text-white font-medium">Verify</div>
                        <div className="text-gray-400/80 text-xs">Public</div>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4 max-w-md mx-auto">
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                    <div className="text-yellow-400 text-sm">⚠️ Wallet connection required</div>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• Supported: Sui Wallet, Ethos Wallet</p>
                    <p>• Network: Sui Testnet</p>
                    <p>• Protocol: Move Smart Contracts</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span>Decentralized</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
                  <span>Immutable</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>Transparent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}