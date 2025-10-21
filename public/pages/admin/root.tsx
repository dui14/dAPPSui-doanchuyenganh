"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import Link from "next/link";

export default function AdminRoot() {
  const account = useCurrentAccount();

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-purple-900 flex items-center justify-center">
        <div className="bg-black/40 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-white text-xl font-semibold mb-4">Access Denied</h2>
          <Link href="/login" className="btn-primary">
            Connect Wallet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-purple-900 relative">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-2 h-2 bg-orange-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 left-20 w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></div>
        <div className="absolute bottom-10 right-10 w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
      </div>

      {/* Header */}
      <nav className="relative z-10 bg-black/20 backdrop-blur-xl border-b border-red-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                🏛️
              </div>
              <div>
                <span className="text-white font-bold text-xl">Ministry Control</span>
                <div className="text-red-400 text-xs font-mono">Root Authority • Level 4</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-xs text-red-400">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span>Admin Active</span>
              </div>
              <Link href="/login" className="btn-secondary bg-red-500/20 text-white border-red-400/30">
                ← Back
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-8 mb-8 text-white fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Ministry Dashboard 🏛️</h1>
              <p className="text-red-100 mb-4">Root authority for national education certificate system</p>
              <div className="bg-black/20 rounded-lg p-3 inline-block">
                <p className="text-sm font-mono">{account.address}</p>
              </div>
            </div>
            <div className="text-6xl opacity-20">⚙️</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 slide-up">
          <div className="bg-black/40 backdrop-blur-xl border border-red-500/20 rounded-xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Total Certificates</p>
                <p className="text-3xl font-bold text-white">1,250</p>
              </div>
              <div className="text-3xl">📃</div>
            </div>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-orange-500/20 rounded-xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-300 text-sm">Universities</p>
                <p className="text-3xl font-bold text-white">45</p>
              </div>
              <div className="text-3xl">🏢</div>
            </div>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-yellow-500/20 rounded-xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-300 text-sm">Pending Approval</p>
                <p className="text-3xl font-bold text-white">12</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-green-500/20 rounded-xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm">Today's Activity</p>
                <p className="text-3xl font-bold text-white">8</p>
              </div>
              <div className="text-3xl">🟢</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Authority Management */}
          <div className="bg-black/40 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 scale-in">
            <div className="flex items-center space-x-3 mb-6">
              <div className="text-2xl">🔑</div>
              <h2 className="text-xl font-bold text-white">Authority Management</h2>
            </div>
            <div className="space-y-3">
              <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105">
                🏢 Grant University Access
              </button>
              <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105">
                🏫 Grant Faculty Access
              </button>
              <button className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105">
                🏢 Manage Organizations
              </button>
              <button className="w-full bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105">
                🔍 Audit Blockchain
              </button>
            </div>
          </div>

          {/* Final Approval */}
          <div className="bg-black/40 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="text-2xl">✓</div>
              <h2 className="text-xl font-bold text-white">Final Approval Queue</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/30 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-orange-100">Master's Degree</h3>
                    <p className="text-orange-300/80 text-sm">🏢 Hanoi University of Technology</p>
                    <p className="text-orange-400/60 text-xs">Student: Nguyen Van B</p>
                  </div>
                  <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">Priority</span>
                </div>
                <div className="flex space-x-2">
                  <button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded-lg transition-colors">
                    ✓ Sign & Approve
                  </button>
                  <button className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded-lg transition-colors">
                    ✗ Reject
                  </button>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-blue-100">PhD Certificate</h3>
                    <p className="text-blue-300/80 text-sm">🏢 Vietnam National University</p>
                    <p className="text-blue-400/60 text-xs">Student: Tran Thi C</p>
                  </div>
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Review</span>
                </div>
                <div className="flex space-x-2">
                  <button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded-lg transition-colors">
                    ✓ Sign & Approve
                  </button>
                  <button className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded-lg transition-colors">
                    ✗ Reject
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* System Analytics */}
          <div className="bg-black/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="text-2xl">📈</div>
              <h2 className="text-xl font-bold text-white">System Analytics</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl p-4">
                <h3 className="text-purple-100 font-medium mb-3">Network Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-300/80 text-sm">Blockchain Health</span>
                    <span className="text-green-400 font-medium">99.9%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-300/80 text-sm">Active Nodes</span>
                    <span className="text-cyan-400 font-medium">156</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-300/80 text-sm">Gas Price</span>
                    <span className="text-yellow-400 font-medium">0.001 SUI</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl p-4">
                <h3 className="text-green-100 font-medium mb-3">Recent Activity</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-300/80">Certificate approved</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-blue-300/80">New university registered</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span className="text-orange-300/80">Authority granted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}