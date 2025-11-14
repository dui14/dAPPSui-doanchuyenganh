"use client";


import { useState } from 'react';
import React, { useEffect } from 'react';

import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import WalletConnect from '../components/walletconnect';
import Link from "next/link";
import Account from '../components/account';

export default function StudentPage() {
    const { user, primaryWallet } = useDynamicContext();
    const [activeTab, setActiveTab] = useState('overview');
    const [requests, setRequests] = useState([]);
    const [formData, setFormData] = useState({
      certificateType: '',
      description: '',
      files: []
    });

    useEffect(() => {
      if (user && activeTab === 'requests') {
        fetchUserRequests();
      }
    }, [user, activeTab]);

    const fetchUserRequests = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/certificates/requests`);
        const data = await response.json();
        const userRequests = data.filter(req => req.student_email === user?.email);
        setRequests(userRequests);
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };

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

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, files }));
  };

  // Trong handleSubmitRequest
  const handleSubmitRequest = async () => {
    if (!formData.certificateType || !formData.description) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/certificates/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_email: user?.email,
          org_id: 1, // ← Gửi org_id
          certificate_type: formData.certificateType,
          description: formData.description,
          ipfs_cid_list: [] // ← Gửi mảng rỗng
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Gửi yêu cầu thành công! Mã yêu cầu: ${result.request_code}`);
        setFormData({ certificateType: '', description: '', files: [] });
        setActiveTab('requests');
        fetchUserRequests(); // Refresh danh sách
      } else {
        alert(`Lỗi: ${result.error || 'Có lỗi xảy ra!'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi kết nối server!');
    }
  };

  const handleClaimCertificate = (certId) => {
    // TODO: Implement NFT claim to wallet
    alert(`Nhận chứng chỉ ${certId} về ví thành công!`);
  };

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
              <h1 className="text-3xl font-bold mb-2">
                  Xin chào, {user?.name || user?.email?.split('@')[0] || 'Bạn'}!
              </h1>
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

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 scale-in">
          <div className="flex border-b">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-medium ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              📊 Tổng quan
            </button>
            <button 
              onClick={() => setActiveTab('create')}
              className={`px-6 py-4 font-medium ${activeTab === 'create' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              ➕ Tạo yêu cầu
            </button>
            <button 
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-4 font-medium ${activeTab === 'requests' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              📋 Danh sách đã yêu cầu
            </button>
            <button 
              onClick={() => setActiveTab('claim')}
              className={`px-6 py-4 font-medium ${activeTab === 'claim' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              🎯 Nhận chứng chỉ về ví
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Certificates */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 scale-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Chứng chỉ của tôi</h2>
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
        )}

        {/* Create Request Tab */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Tạo yêu cầu chứng chỉ mới</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loại chứng chỉ</label>
                  <select 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.certificateType}
                    onChange={(e) => setFormData(prev => ({...prev, certificateType: e.target.value}))}
                  >
                    <option value="">Chọn loại chứng chỉ</option>
                    <option value="bachelor">Bằng Cử nhân</option>
                    <option value="master">Bằng Thạc sĩ</option>
                    <option value="certificate">Chứng chỉ hoàn thành</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                  <textarea 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    placeholder="Nhập mô tả chi tiết về chứng chỉ..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tài liệu đính kèm</label>
                  <input 
                    type="file" 
                    multiple
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    onChange={handleFileUpload}
                  />
                  <p className="text-sm text-gray-500 mt-1">Hỗ trợ: PDF, JPG, PNG (tối đa 10MB)</p>
                </div>

                <button 
                  onClick={handleSubmitRequest}
                  className="w-full btn-primary py-3"
                >
                  📤 Gửi yêu cầu
                </button>
              </div>

              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="font-bold text-blue-800 mb-4">📋 Quy trình phê duyệt</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">1</div>
                    <span className="text-sm">Khoa xem xét và phê duyệt</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm">2</div>
                    <span className="text-sm">Trường xác nhận</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm">3</div>
                    <span className="text-sm">Bộ ký và cấp chứng chỉ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Requests List Tab */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Danh sách đã yêu cầu</h2>
            
            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📋</div>
                  <p>Chưa có yêu cầu nào</p>
                </div>
              ) : (
                requests.map((request) => {
                  const requestData = request.note ? JSON.parse(request.note) : {};
                  const statusColor = {
                    'pending': 'orange',
                    'org_checked': 'blue', 
                    'org_approved': 'purple',
                    'root_signed': 'green',
                    'minted': 'green',
                    'rejected': 'red'
                  }[request.status] || 'gray';

                  return (
                    <div key={request.id} className={`border border-${statusColor}-200 rounded-xl p-6 bg-${statusColor}-50`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{requestData.certificate_type || 'Chứng chỉ'}</h3>
                          <p className="text-gray-600">Mã yêu cầu: {request.request_code}</p>
                        </div>
                        <span className={`bg-${statusColor}-500 text-white px-3 py-1 rounded-full text-sm`}>
                          {request.status === 'pending' ? 'Chờ duyệt' : 
                           request.status === 'org_checked' ? 'Khoa đã duyệt' :
                           request.status === 'org_approved' ? 'Trường đã duyệt' :
                           request.status === 'root_signed' ? 'Bộ đã ký' :
                           request.status === 'minted' ? 'Hoàn thành' : 'Từ chối'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <p><strong>Ngày gửi:</strong> {new Date(request.created_at).toLocaleDateString('vi-VN')}</p>
                        <p><strong>Trạng thái:</strong> {request.status}</p>
                        <p><strong>Mô tả:</strong> {requestData.description || 'Không có'}</p>
                        <p><strong>Cập nhật:</strong> {new Date(request.updated_at).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Claim Certificate Tab */}
        {activeTab === 'claim' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Nhận chứng chỉ về ví cá nhân</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold mb-4">Chứng chỉ sẵn sàng nhận</h3>
                <div className="space-y-4">
                  <div className="border-2 border-green-200 rounded-xl p-6 bg-green-50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-green-800">Bằng Cử nhân CNTT</h4>
                        <p className="text-sm text-gray-600">Đã được phê duyệt và ký</p>
                      </div>
                      <div className="text-2xl">🏅</div>
                    </div>
                    <button 
                      onClick={() => handleClaimCertificate('CER001234')}
                      className="w-full btn-primary"
                    >
                      🎯 Nhận về ví
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-xl p-6">
                <h3 className="font-bold text-purple-800 mb-4">💡 Hướng dẫn</h3>
                <div className="space-y-3 text-sm">
                  <p>• Chứng chỉ sẽ được mint thành NFT SoulBound Token</p>
                  <p>• NFT sẽ được gửi trực tiếp vào ví Sui của bạn</p>
                  <p>• Chứng chỉ NFT không thể chuyển nhượng</p>
                  <p>• Bạn có thể xem và chia sẻ chứng chỉ bất cứ lúc nào</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 bg-white/50 rounded-2xl p-6 text-center">
          <p className="text-gray-600">© 2024 EduChain - Hệ thống chứng chỉ Blockchain</p>
          <p className="text-sm text-gray-500 mt-2">Được xây dựng trên Sui Network</p>
        </footer>
      </div>
    </div>
  );
}
