"use client";

import { useState } from "react";
import Link from "next/link";

export default function VerifyPage() {
  const [certificateId, setCertificateId] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (!certificateId.trim()) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setVerificationResult({
        valid: true,
        studentName: "Nguyễn Văn A",
        certificateType: "Bằng Cử nhân CNTT",
        university: "ĐH Bách Khoa Hà Nội",
        issueDate: "15/06/2024",
        nftId: "#CER001234"
      });
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                🔍
              </div>
              <div>
                <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Certificate Verify</span>
                <p className="text-xs text-gray-500">Xác thực chứng chỉ công khai</p>
              </div>
            </Link>
            <Link href="/login" className="btn-secondary">
              Đăng nhập
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 fade-in">
          <div className="text-6xl mb-6">🛡️</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Xác thực Chứng chỉ
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Nhập ID chứng chỉ hoặc địa chỉ NFT để xác minh tính xác thực và thông tin chi tiết
          </p>
        </div>

        {/* Verify Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 slide-up">
          <div className="max-w-md mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID Chứng chỉ hoặc NFT Address
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                placeholder="Nhập #CER001234 hoặc 0x..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleVerify}
                disabled={isLoading || !certificateId.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "🔄" : "🔍"} Xác thực
              </button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-8 scale-in">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Đang xác thực trên blockchain...</p>
          </div>
        )}

        {/* Verification Result */}
        {verificationResult && !isLoading && (
          <div className="bg-white rounded-2xl shadow-xl p-8 scale-in">
            {verificationResult.valid ? (
              <div>
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="text-3xl">✅</div>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-green-800 text-center mb-6">
                  Chứng chỉ hợp lệ!
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">👤</div>
                      <div>
                        <p className="font-medium">{verificationResult.studentName}</p>
                        <p className="text-sm text-gray-500">Tên sinh viên</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">🏆</div>
                      <div>
                        <p className="font-medium">{verificationResult.certificateType}</p>
                        <p className="text-sm text-gray-500">Loại chứng chỉ</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">🏢</div>
                      <div>
                        <p className="font-medium">{verificationResult.university}</p>
                        <p className="text-sm text-gray-500">Trường cấp</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">📅</div>
                      <div>
                        <p className="font-medium">{verificationResult.issueDate}</p>
                        <p className="text-sm text-gray-500">Ngày cấp</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">🔗</div>
                      <div>
                        <p className="font-medium font-mono">{verificationResult.nftId}</p>
                        <p className="text-sm text-gray-500">NFT ID</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">⛓️</div>
                      <div>
                        <p className="font-medium">Sui Testnet</p>
                        <p className="text-sm text-gray-500">Blockchain</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 p-4 bg-green-50 rounded-lg">
                  <p className="text-green-800 text-sm text-center">
                    ✅ Chứng chỉ này đã được xác thực và có hiệu lực trên blockchain Sui
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="text-3xl">❌</div>
                </div>
                <h2 className="text-2xl font-bold text-red-800 mb-4">
                  Chứng chỉ không hợp lệ
                </h2>
                <p className="text-gray-600">
                  Không tìm thấy chứng chỉ với ID này trên blockchain
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 text-center card-hover">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-semibold text-lg mb-2">Bảo mật tuyệt đối</h3>
            <p className="text-gray-600 text-sm">Dữ liệu được mã hóa và lưu trữ trên blockchain</p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 text-center card-hover">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold text-lg mb-2">Xác thực nhanh</h3>
            <p className="text-gray-600 text-sm">Kết quả xác thực trong vài giây</p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 text-center card-hover">
            <div className="text-3xl mb-3">🌍</div>
            <h3 className="font-semibold text-lg mb-2">Toàn cầu</h3>
            <p className="text-gray-600 text-sm">Có thể xác minh từ bất kỳ đâu trên thế giới</p>
          </div>
        </div>
      </div>
    </div>
  );
}