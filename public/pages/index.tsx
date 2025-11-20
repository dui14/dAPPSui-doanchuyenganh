"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                🎓
              </div>
              <span className="text-white font-bold text-xl">EduChain</span>
            </div>
            <Link href="/login" className="btn-secondary bg-white/20 text-white border-white/30 hover:bg-white/30">
              Đăng nhập
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <div className="fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Hệ thống Chứng chỉ
            <br />
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Blockchain
            </span>
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            Quản lý và xác thực chứng chỉ học tập phi tập trung trên Sui Network. 
            Minh bạch, bảo mật và không thể giả mạo.
          </p>
        </div>
        
        <div className="slide-up flex flex-col sm:flex-row gap-4 mb-12">
          <Link href="/login" className="btn-primary text-lg px-8 py-4">
            🚀 Bắt đầu ngay
          </Link>
          <Link href="/verify" className="btn-secondary bg-white/20 text-white border-white/30 hover:bg-white/30 text-lg px-8 py-4">
            🔍 Xác thực chứng chỉ
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto scale-in">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 card-hover">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-white font-semibold text-lg mb-2">Bảo mật tuyệt đối</h3>
            <p className="text-white/70 text-sm">Sử dụng công nghệ blockchain Sui để đảm bảo tính bất biến</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 card-hover">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-white font-semibold text-lg mb-2">Xử lý nhanh chóng</h3>
            <p className="text-white/70 text-sm">Phê duyệt và cấp chứng chỉ trong thời gian thực</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 card-hover">
            <div className="text-3xl mb-3">🌐</div>
            <h3 className="text-white font-semibold text-lg mb-2">Xác thực toàn cầu</h3>
            <p className="text-white/70 text-sm">Có thể xác minh từ bất kỳ đâu trên thế giới</p>
          </div>
        </div>
      </div>
    </div>
  );
}