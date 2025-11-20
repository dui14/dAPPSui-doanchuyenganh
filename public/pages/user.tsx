"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import WalletConnect from '../components/walletconnect';
import Link from "next/link";
import Account from '../components/account';

export default function StudentPage() {
    const { user, primaryWallet } = useDynamicContext();

  if (!user) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-white text-xl font-semibold mb-4">Yêu cầu đăng nhập</h2>
          <Link href="/login" className="btn-primary">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                🎓
              </div>
              <div>
                <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Student Portal</span>
                <p className="text-xs text-gray-500">Quản lý chứng chỉ cá nhân</p>
              </div>
            </div>
            <Account />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 mb-8 text-white fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Xin chào, Nguyễn Văn A! 👋</h1>
              <p className="text-purple-100 mb-4">Chào mừng bạn đến với hệ thống quản lý chứng chỉ</p>
              <div className="bg-white/20 rounded-lg p-3 inline-block">
                {primaryWallet?.address && (<p className="text-sm font-mono">{primaryWallet.address}</p>)}
              </div>
            </div>
            <div className="text-6xl opacity-20">🏆</div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 slide-up">
          <div className="bg-white rounded-xl p-6 shadow-lg card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Tổng chứng chỉ</p>
                <p className="text-3xl font-bold text-blue-600">2</p>
              </div>
              <div className="text-3xl">📜</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Đã hoàn thành</p>
                <p className="text-3xl font-bold text-green-600">1</p>
              </div>
              <div className="text-3xl">✓</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Đang chờ</p>
                <p className="text-3xl font-bold text-orange-600">1</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Xếp hạng</p>
                <p className="text-3xl font-bold text-purple-600">A+</p>
              </div>
              <div className="text-3xl">🌟</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Certificates */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 scale-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Chợng chỉ của tôi</h2>
                <button className="btn-primary text-sm py-2 px-4">
                  + Yêu cầu mới
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="border-2 border-green-200 rounded-xl p-6 bg-gradient-to-r from-green-50 to-emerald-50 card-hover">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="text-2xl">🏅</div>
                        <h3 className="font-bold text-green-800 text-lg">Bằng Cử nhân CNTT</h3>
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">✓ Hoàn thành</span>
                      </div>
                      <p className="text-gray-600 mb-1">🏢 Trường Đại học Bách Khoa Hà Nội</p>
                      <p className="text-gray-500 text-sm">📅 Cấp ngày: 15/06/2024</p>
                      <p className="text-gray-500 text-sm">🔗 NFT ID: #CER001234</p>
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-4">
                    <button className="btn-primary text-sm py-2 px-4">
                      🔍 Xem chi tiết
                    </button>
                    <button className="btn-secondary text-sm py-2 px-4">
                      📤 Chia sẻ
                    </button>
                    <button className="btn-secondary text-sm py-2 px-4">
                      💾 Tải xuống
                    </button>
                  </div>
                </div>
                
                <div className="border-2 border-orange-200 rounded-xl p-6 bg-gradient-to-r from-orange-50 to-yellow-50 card-hover">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="text-2xl">📃</div>
                        <h3 className="font-bold text-orange-800 text-lg">Chứng chỉ Tốt nghiệp</h3>
                        <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">⏳ Chờ duyệt</span>
                      </div>
                      <p className="text-gray-600 mb-1">🏢 Trường Đại học Bách Khoa Hà Nội</p>
                      <p className="text-gray-500 text-sm">📅 Gửi yêu cầu: 20/10/2024</p>
                      <p className="text-gray-500 text-sm">🔄 Trạng thái: Chờ University phê duyệt</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="bg-orange-100 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Tiến trình:</span>
                        <span className="font-medium">2/3 bước</span>
                      </div>
                      <div className="w-full bg-orange-200 rounded-full h-2 mt-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{width: '66%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile & Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 scale-in">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Thông tin cá nhân</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="text-xl">👤</div>
                  <div>
                    <p className="font-medium">Nguyễn Văn A</p>
                    <p className="text-sm text-gray-500">Họ và tên</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-xl">🎫</div>
                  <div>
                    <p className="font-medium">20210001</p>
                    <p className="text-sm text-gray-500">Mã số sinh viên</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-xl">🏢</div>
                  <div>
                    <p className="font-medium">Công nghệ thông tin</p>
                    <p className="text-sm text-gray-500">Khoa</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-xl">🎓</div>
                  <div>
                    <p className="font-medium">ĐH Bách Khoa Hà Nội</p>
                    <p className="text-sm text-gray-500">Trường</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Hoạt động gần đây</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg">📨</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Yêu cầu chứng chỉ mới</p>
                    <p className="text-xs text-gray-500">2 giờ trước</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="text-lg">✓</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Chứng chỉ được phê duyệt</p>
                    <p className="text-xs text-gray-500">1 ngày trước</p>
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