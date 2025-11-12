"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import Link from "next/link";
import Account from "../components/account";

export default function AdminOrgPage() {
  const router = useRouter();
  const { user, primaryWallet } = useDynamicContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [requests, setRequests] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [formData, setFormData] = useState({
    certificateType: '',
    description: '',
    studentEmail: '',
    files: []
  });

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

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/certificates/requests`);
      const data = await response.json();
      setRequests(data.filter(req => req.status === 'pending' || req.status === 'org_checked'));
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchCertificates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/certificates`);
      const data = await response.json();
      setCertificates(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    }
  };

  const handleCreateRequest = async () => {
    if (!formData.certificateType || !formData.description || !formData.studentEmail) {
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
          student_email: formData.studentEmail,
          org_id: 1,
          certificate_type: formData.certificateType,
          description: formData.description,
          ipfs_cid_list: []
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Tạo yêu cầu thành công! Mã: ${result.request_code}`);
        setFormData({ certificateType: '', description: '', studentEmail: '', files: [] });
        fetchRequests();
      } else {
        alert(`Lỗi: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Có lỗi xảy ra!');
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/certificates/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'org_checked',
          admin_org_email: user?.email
        })
      });

      if (response.ok) {
        alert('Phê duyệt thành công!');
        await fetchRequests();
        setActiveTab('send'); // Chuyển sang tab "Gửi lên trường"
      }
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleSendToUniversity = async (requestId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/certificates/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'org_approved',
          org_email: user?.email
        })
      });

      if (response.ok) {
        alert('Đã gửi lên trường để phê duyệt!');
        fetchRequests();
      }
    } catch (error) {
      console.error('Error sending to university:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'requests') {
      fetchRequests();
    }
    if (activeTab === 'certificates') {
      fetchCertificates();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-cyan-100">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                🏛️
              </div>
              <div>
                <span className="font-bold text-xl bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">Faculty Portal</span>
                <p className="text-xs text-gray-500">Quản lý khoa - Admin Org</p>
              </div>
            </div>
            <Account />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 mb-8 text-white fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Chào mừng Admin Khoa! 🏛️</h1>
              <p className="text-green-100 mb-4">Quản lý chứng chỉ và yêu cầu của khoa</p>
              <div className="bg-white/20 rounded-lg p-3 inline-block">
                {primaryWallet?.address && (<p className="text-sm font-mono">{primaryWallet.address}</p>)}
              </div>
            </div>
            <div className="text-6xl opacity-20">📚</div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 slide-up">
          <div className="bg-white rounded-xl p-6 shadow-lg card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Yêu cầu chờ duyệt</p>
                <p className="text-3xl font-bold text-orange-600">{requests.length}</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Đã phê duyệt</p>
                <p className="text-3xl font-bold text-green-600">45</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Chứng chỉ khoa</p>
                <p className="text-3xl font-bold text-blue-600">{certificates.length}</p>
              </div>
              <div className="text-3xl">📜</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Sinh viên</p>
                <p className="text-3xl font-bold text-purple-600">234</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 scale-in">
          <div className="flex border-b">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-medium ${activeTab === 'overview' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500'}`}
            >
              📊 Tổng quan
            </button>
            <button 
              onClick={() => setActiveTab('create')}
              className={`px-6 py-4 font-medium ${activeTab === 'create' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500'}`}
            >
              ➕ Tạo yêu cầu
            </button>
            <button 
              onClick={() => setActiveTab('send')}
              className={`px-6 py-4 font-medium ${activeTab === 'send' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500'}`}
            >
              📤 Gửi lên trường
            </button>
            <button 
              onClick={() => setActiveTab('certificates')}
              className={`px-6 py-4 font-medium ${activeTab === 'certificates' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500'}`}
            >
              📜 Danh sách chứng chỉ
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Yêu cầu cần xử lý</h2>
              <div className="space-y-4">
                {requests.slice(0, 3).map((request) => {
                  const requestData = request.note ? JSON.parse(request.note) : {};
                  const statusColor = request.status === 'pending' ? 'orange' : 'blue';
                  const statusText = request.status === 'pending' ? 'Chờ duyệt' : 'Đã duyệt khoa';
                  
                  return (
                    <div key={request.id} className={`border border-${statusColor}-200 rounded-xl p-4 bg-${statusColor}-50`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold">{requestData.certificate_type}</h3>
                        <span className={`bg-${statusColor}-500 text-white px-2 py-1 rounded text-sm`}>{statusText}</span>
                      </div>
                      <p className="text-sm text-gray-600">Sinh viên: {request.student_email}</p>
                      <p className="text-sm text-gray-600">Mã: {request.request_code}</p>
                      <div className="mt-2 flex space-x-2">
                        {request.status === 'pending' && (
                          <button 
                            onClick={() => handleApproveRequest(request.id)}
                            className="btn-primary text-sm py-1 px-3 bg-green-500"
                          >
                            Phê duyệt
                          </button>
                        )}
                        {request.status === 'org_checked' && (
                          <button 
                            onClick={() => handleSendToUniversity(request.id)}
                            className="btn-primary text-sm py-1 px-3 bg-blue-500"
                          >
                            Gửi lên trường
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Hoạt động gần đây</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="text-lg">✅</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Phê duyệt yêu cầu chứng chỉ</p>
                    <p className="text-xs text-gray-500">30 phút trước</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg">📝</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Tạo yêu cầu mới</p>
                    <p className="text-xs text-gray-500">1 giờ trước</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Request Tab */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Tạo yêu cầu chứng chỉ</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email sinh viên</label>
                  <input 
                    type="email"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="student@example.com"
                    value={formData.studentEmail}
                    onChange={(e) => setFormData(prev => ({...prev, studentEmail: e.target.value}))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loại chứng chỉ</label>
                  <select 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    rows="4"
                    placeholder="Mô tả chi tiết về chứng chỉ..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  />
                </div>

                <button 
                  onClick={handleCreateRequest}
                  className="w-full btn-primary py-3 bg-green-500 hover:bg-green-600"
                >
                  📤 Tạo yêu cầu
                </button>
              </div>

              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="font-bold text-green-800 mb-4">📋 Quy trình</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">1</div>
                    <span className="text-sm">Khoa tạo yêu cầu</span>
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

        {/* Send to University Tab */}
        {activeTab === 'send' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Gửi yêu cầu lên trường phê duyệt</h2>
            
            <div className="space-y-4">
              {requests.filter(req => req.status === 'org_checked').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📤</div>
                  <p>Không có yêu cầu nào sẵn sàng gửi lên trường</p>
                  <p className="text-sm mt-2">Các yêu cầu cần được khoa phê duyệt trước</p>
                </div>
              ) : (
                requests.filter(req => req.status === 'org_checked').map((request) => {
                  const requestData = request.note ? JSON.parse(request.note) : {};
                  return (
                    <div key={request.id} className="border border-blue-200 rounded-xl p-6 bg-blue-50">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{requestData.certificate_type}</h3>
                          <p className="text-gray-600">Mã yêu cầu: {request.request_code}</p>
                        </div>
                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                          Đã duyệt khoa
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <p><strong>Sinh viên:</strong> {request.student_email}</p>
                        <p><strong>Ngày tạo:</strong> {new Date(request.created_at).toLocaleDateString('vi-VN')}</p>
                        <p><strong>Phê duyệt bởi:</strong> {request.admin_org_email}</p>
                        <p><strong>Mô tả:</strong> {requestData.description}</p>
                      </div>
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => handleSendToUniversity(request.id)}
                          className="btn-primary bg-blue-500 hover:bg-blue-600"
                        >
                          📤 Gửi lên trường
                        </button>
                        <button className="btn-secondary">
                          👁️ Xem chi tiết
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Certificates List Tab */}
        {activeTab === 'certificates' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Danh sách chứng chỉ khoa</h2>
            
            <div className="space-y-4">
              {certificates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📜</div>
                  <p>Chưa có chứng chỉ nào</p>
                </div>
              ) : (
                certificates.map((cert, index) => (
                  <div key={index} className="border border-green-200 rounded-xl p-6 bg-green-50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{cert.cert_id}</h3>
                        <p className="text-gray-600">Sinh viên: {cert.student_email}</p>
                      </div>
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                        {cert.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <p><strong>Cấp bởi:</strong> {cert.issued_by}</p>
                      <p><strong>Ngày cấp:</strong> {new Date(cert.created_at).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 bg-white/50 rounded-2xl p-6 text-center">
          <p className="text-gray-600">© 2024 EduChain - Faculty Management Portal</p>
          <p className="text-sm text-gray-500 mt-2">Hệ thống quản lý khoa</p>
        </footer>
      </div>
    </div>
  );
}
