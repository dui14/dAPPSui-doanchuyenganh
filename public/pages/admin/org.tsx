"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import Link from "next/link";

export default function UniversityAdmin() {
  const account = useCurrentAccount();

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-black/40 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-white text-xl font-semibold mb-4">Access Required</h2>
          <Link href="/login" className="btn-primary">
            Connect Wallet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 relative">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-2 h-2 bg-indigo-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 left-20 w-4 h-4 bg-cyan-400 rounded-full animate-bounce"></div>
      </div>

      {/* Header */}
      <nav className="relative z-10 bg-black/20 backdrop-blur-xl border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                🏢
              </div>
              <div>
                <span className="text-white font-bold text-xl">University Node</span>
                <div className="text-blue-400 text-xs font-mono">Institution Authority • Level 3</div>
              </div>
            </div>
            <Link href="/login" className="btn-secondary bg-blue-500/20 text-white border-blue-400/30">
              ← Back
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">University Dashboard 🏢</h1>
              <p className="text-blue-100 mb-4">Manage and approve institutional certificates</p>
              <div className="bg-black/20 rounded-lg p-3 inline-block">
                <p className="text-sm font-mono">{account.address}</p>
              </div>
            </div>
            <div className="text-6xl opacity-20">🏆</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 slide-up">
          <div className="bg-black/40 backdrop-blur-xl border border-orange-500/20 rounded-xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-300 text-sm">Pending Approval</p>
                <p className="text-3xl font-bold text-white">5</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-green-500/20 rounded-xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm">Approved</p>
                <p className="text-3xl font-bold text-white">120</p>
              </div>
              <div className="text-3xl">✓</div>
            </div>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-red-500/20 rounded-xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Rejected</p>
                <p className="text-3xl font-bold text-white">3</p>
              </div>
              <div className="text-3xl">✗</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Approval Queue */}
          <div className="bg-black/40 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 scale-in">
            <div className="flex items-center space-x-3 mb-6">
              <div className="text-2xl">📋</div>
              <h2 className="text-xl font-bold text-white">Approval Queue</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-blue-100">Bachelor's Degree - IT</h3>
                    <p className="text-blue-300/80 text-sm">👨🎓 Nguyen Van A</p>
                    <p className="text-blue-400/60 text-xs">Faculty: Computer Science</p>
                    <p className="text-blue-400/60 text-xs">GPA: 3.8/4.0</p>
                  </div>
                  <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">Pending</span>
                </div>
                <div className="flex space-x-2">
                  <button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded-lg transition-colors">
                    ✓ Approve
                  </button>
                  <button className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded-lg transition-colors">
                    ✗ Reject
                  </button>
                  <button className="bg-gray-600 hover:bg-gray-700 text-white text-sm py-2 px-3 rounded-lg transition-colors">
                    🔍 Review
                  </button>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-purple-100">Master's Degree - Engineering</h3>
                    <p className="text-purple-300/80 text-sm">👩🎓 Tran Thi B</p>
                    <p className="text-purple-400/60 text-xs">Faculty: Mechanical Engineering</p>
                    <p className="text-purple-400/60 text-xs">Thesis: AI in Manufacturing</p>
                  </div>
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Review</span>
                </div>
                <div className="flex space-x-2">
                  <button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded-lg transition-colors">
                    ✓ Approve
                  </button>
                  <button className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded-lg transition-colors">
                    ✗ Reject
                  </button>
                  <button className="bg-gray-600 hover:bg-gray-700 text-white text-sm py-2 px-3 rounded-lg transition-colors">
                    🔍 Review
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Management Tools */}
          <div className="space-y-6">
            <div className="bg-black/40 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="text-2xl">⚙️</div>
                <h2 className="text-xl font-bold text-white">Management Tools</h2>
              </div>
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105">
                  📈 View Analytics
                </button>
                <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105">
                  🏫 Manage Faculties
                </button>
                <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105">
                  📃 Certificate Templates
                </button>
                <button className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105">
                  🔍 Audit Trail
                </button>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-2xl">📈</div>
                <h2 className="text-lg font-bold text-white">Recent Activity</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-3 p-3 bg-green-500/20 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-green-100">Certificate approved</p>
                    <p className="text-green-300/60 text-xs">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-500/20 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-blue-100">New faculty registered</p>
                    <p className="text-blue-300/60 text-xs">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-orange-500/20 rounded-lg">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-orange-100">System maintenance</p>
                    <p className="text-orange-300/60 text-xs">1 day ago</p>
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