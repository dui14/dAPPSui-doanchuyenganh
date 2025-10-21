"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import Link from "next/link";

export default function FacultyAdmin() {
  const account = useCurrentAccount();

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 flex items-center justify-center">
        <div className="bg-black/40 backdrop-blur-xl border border-green-500/20 rounded-2xl p-8 text-center">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 relative">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 left-20 w-4 h-4 bg-lime-400 rounded-full animate-bounce"></div>
      </div>

      {/* Header */}
      <nav className="relative z-10 bg-black/20 backdrop-blur-xl border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                🏫
              </div>
              <div>
                <span className="text-white font-bold text-xl">Faculty Node</span>
                <div className="text-green-400 text-xs font-mono">Department Authority • Level 2</div>
              </div>
            </div>
            <Link href="/login" className="btn-secondary bg-green-500/20 text-white border-green-400/30">
              ← Back
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 mb-8 text-white fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Faculty Dashboard 🏫</h1>
              <p className="text-green-100 mb-4">Create and manage certificate requests for students</p>
              <div className="bg-black/20 rounded-lg p-3 inline-block">
                <p className="text-sm font-mono">{account.address}</p>
              </div>
            </div>
            <div className="text-6xl opacity-20">📝</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Certificate Request Form */}
          <div className="bg-black/40 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6 scale-in">
            <div className="flex items-center space-x-3 mb-6">
              <div className="text-2xl">📝</div>
              <h2 className="text-xl font-bold text-white">Create Certificate Request</h2>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-green-300 text-sm font-medium mb-2">
                  Student Wallet Address
                </label>
                <input 
                  type="text" 
                  className="w-full bg-black/30 border border-green-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0x..."
                />
              </div>
              
              <div>
                <label className="block text-green-300 text-sm font-medium mb-2">
                  Certificate Type
                </label>
                <select className="w-full bg-black/30 border border-green-500/30 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  <option value="">Select certificate type</option>
                  <option value="graduation">Graduation Certificate</option>
                  <option value="bachelor">Bachelor's Degree</option>
                  <option value="master">Master's Degree</option>
                  <option value="phd">PhD Degree</option>
                </select>
              </div>
              
              <div>
                <label className="block text-green-300 text-sm font-medium mb-2">
                  Student Information
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="text" 
                    className="bg-black/30 border border-green-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500"
                    placeholder="Full Name"
                  />
                  <input 
                    type="text" 
                    className="bg-black/30 border border-green-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500"
                    placeholder="Student ID"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-green-300 text-sm font-medium mb-2">
                  Upload Documents
                </label>
                <div className="border-2 border-dashed border-green-500/30 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-gray-400 mb-2">Drag & drop files or click to browse</p>
                  <input 
                    type="file" 
                    className="hidden"
                    multiple
                    id="file-upload"
                  />
                  <label 
                    htmlFor="file-upload"
                    className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Choose Files
                  </label>
                </div>
              </div>
              
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                🚀 Submit Request to Blockchain
              </button>
            </form>
          </div>

          {/* Request History */}
          <div className="space-y-6">
            <div className="bg-black/40 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="text-2xl">📋</div>
                <h2 className="text-xl font-bold text-white">Request History</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/30 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-emerald-100">Bachelor's IT Degree</h3>
                      <p className="text-emerald-300/80 text-sm">👨🎓 Tran Thi B</p>
                      <p className="text-emerald-400/60 text-xs">ID: 20210002</p>
                    </div>
                    <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">Pending University</span>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2 mb-2">
                    <div className="text-xs text-emerald-300">Progress: 1/3 steps</div>
                    <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                      <div className="bg-emerald-500 h-1 rounded-full" style={{width: '33%'}}></div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-500/20 to-lime-500/20 border border-green-400/30 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-green-100">Graduation Certificate</h3>
                      <p className="text-green-300/80 text-sm">👨🎓 Le Van C</p>
                      <p className="text-green-400/60 text-xs">ID: 20210003</p>
                    </div>
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Completed</span>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2">
                    <div className="text-xs text-green-300">NFT Minted: #CER001235</div>
                    <div className="text-xs text-green-400/60">Completed: 2 days ago</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-xl border border-lime-500/20 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-2xl">📈</div>
                <h2 className="text-lg font-bold text-white">Faculty Stats</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">15</div>
                  <div className="text-xs text-blue-300">Total Requests</div>
                </div>
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">12</div>
                  <div className="text-xs text-green-300">Approved</div>
                </div>
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">2</div>
                  <div className="text-xs text-orange-300">Pending</div>
                </div>
                <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">1</div>
                  <div className="text-xs text-red-300">Rejected</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}