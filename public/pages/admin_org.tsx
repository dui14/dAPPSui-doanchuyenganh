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

  const fetchRequests = async () => {
    if (!user) return;
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/certificates/requests`, {
        headers: {
          'Authorization': `Bearer ${token}` // Thêm nếu backend yêu cầu auth cho GET
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fetch requests failed: ${errorText}`);
      }
      const data = await response.json();
      setRequests(data.filter(req => req.status === 'pending' || req.status === 'org_checked'));
    } catch (error) {
      console.error('Error fetching requests:', error);
      alert('Lỗi khi tải yêu cầu: ' + error.message);
    }
  };

  const fetchCertificates = async () => {
    if (!user) return;
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/certificates`, {
        headers: {
          'Authorization': `Bearer ${token}` // Thêm nếu cần
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fetch certificates failed: ${errorText}`);
      }
      const data = await response.json();
      setCertificates(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      alert('Lỗi khi tải chứng chỉ: ' + error.message);
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
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Create request failed: ${errorText}`);
      }
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
      alert('Có lỗi xảy ra: ' + error.message);
    }
  };

  const handleApproveRequest = async (requestId) => {
    if (!confirm("Phê duyệt yêu cầu này và gửi lên Trường Đại học để xem xét?")) return;

    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/certificates/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'org_checked',           // Khoa duyệt xong → gửi lên Trường
          admin_org_email: user?.email
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Lỗi phê duyệt');
      }

      alert('Đã phê duyệt và gửi lên Trường thành công!');
      await fetchRequests();
    } catch (error) {
      console.error('Lỗi phê duyệt:', error);
      alert('Lỗi: ' + error.message);
    }
  };

  const handleSendToUniversity = async (requestId) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('Token không tồn tại. Vui lòng đăng nhập lại!');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/certificates/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'org_approved',
          org_email: user?.email
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Send failed: ${errorText}`);
      }
      // Không cần json() nếu không trả data
      alert('Đã gửi lên trường để phê duyệt!');
      fetchRequests();
    } catch (error) {
      console.error('Error sending to university:', error);
      alert('Có lỗi xảy ra khi gửi: ' + error.message);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, files }));
  };

  useEffect(() => {
    if (!user) return;

    if (activeTab === 'overview' || activeTab === 'requests' || activeTab === 'send') {
      fetchRequests();
    }
    if (activeTab === 'certificates') {
      fetchCertificates();
    }
  }, [activeTab, user]);

  return (
    !user ? (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-white text-xl font-semibold mb-4">Yêu cầu đăng nhập</h2>
          <Link href="/login" className="btn-primary">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    ) : (
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
                  <p className="text-xs text-gray-500">Quản lý chứng chỉ khoa</p>
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
                <h1 className="text-3xl font-bold mb-2">
                  Xin chào, {user?.name || user?.email?.split('@')[0] || 'Admin'}!
                </h1>
                <p className="text-green-100 mb-4">Chào mừng đến với cổng quản lý khoa</p>
                <div className="bg-white/20 rounded-lg p-3 inline-block">
                  {primaryWallet?.address && (<p className="text-sm font-mono">{primaryWallet.address}</p>)}
                </div>
              </div>
              <div className="text-6xl opacity-20">🏆</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-lg mb-8">
            <div className="flex border-b">
              <button onClick={() => setActiveTab('overview')} className={`flex-1 py-4 font-medium ${activeTab === 'overview' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-500'}`}>
                Tổng quan
              </button>
              <button onClick={() => setActiveTab('requests')} className={`flex-1 py-4 font-medium ${activeTab === 'requests' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-500'}`}>
                Yêu cầu chờ duyệt
              </button>
              <button onClick={() => setActiveTab('send')} className={`flex-1 py-4 font-medium ${activeTab === 'send' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-500'}`}>
                Gửi lên trường
              </button>
              <button onClick={() => setActiveTab('create')} className={`flex-1 py-4 font-medium ${activeTab === 'create' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-500'}`}>
                Tạo yêu cầu mới
              </button>
              <button onClick={() => setActiveTab('certificates')} className={`flex-1 py-4 font-medium ${activeTab === 'certificates' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-500'}`}>
                Chứng chỉ
              </button>
            </div>
          </div>

          {/* Overview Tab - Thêm phần yêu cầu chờ duyệt với nút phê duyệt */}
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Stats Cards */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-800">Yêu cầu mới</h3>
                    <div className="text-3xl">📥</div>
                  </div>
                  <p className="text-4xl font-bold text-teal-600 mb-2">{requests.filter(req => req.status === 'pending').length}</p>
                  <p className="text-sm text-gray-500">Chờ phê duyệt</p>
                </div>
                
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-800">Đang xử lý</h3>
                    <div className="text-3xl">⚙️</div>
                  </div>
                  <p className="text-4xl font-bold text-teal-600 mb-2">{requests.filter(req => ['org_checked', 'org_approved'].includes(req.status)).length}</p>
                  <p className="text-sm text-gray-500">Chờ trường/bộ</p>
                </div>
                
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-800">Hoàn thành</h3>
                    <div className="text-3xl">✅</div>
                  </div>
                  <p className="text-4xl font-bold text-teal-600 mb-2">{certificates.length}</p>
                  <p className="text-sm text-gray-500">Chứng chỉ đã cấp</p>
                </div>
              </div>

              {/* Phần yêu cầu chờ duyệt trong overview */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Yêu cầu chờ duyệt (Khoa)</h2>
                
                <div className="space-y-4">
                  {requests.filter(req => req.status === 'pending').length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-4">📥</div>
                      <p>Không có yêu cầu mới</p>
                    </div>
                  ) : (
                    requests.filter(req => req.status === 'pending').map((request) => {
                      const requestData = request.note ? JSON.parse(request.note) : {};
                      return (
                        <div key={request.id} className="border border-orange-200 rounded-xl p-6 bg-orange-50">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-bold text-lg">{requestData.certificate_type}</h3>
                              <p className="text-gray-600">Mã yêu cầu: {request.request_code}</p>
                            </div>
                            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                              Chờ duyệt
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <p><strong>Sinh viên:</strong> {request.student_email}</p>
                            <p><strong>Ngày tạo:</strong> {new Date(request.created_at).toLocaleDateString('vi-VN')}</p>
                            <p><strong>Mô tả:</strong> {requestData.description}</p>
                          </div>
                          <div className="flex space-x-3">
                            <button 
                              onClick={() => handleApproveRequest(request.id)}
                              className="btn-primary"
                            >
                              ✅ Phê duyệt
                            </button>
                            <button 
                              onClick={() => {/* TODO: Implement reject */}}
                              className="btn-secondary bg-red-500 hover:bg-red-600 text-white"
                            >
                              ❌ Từ chối
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
            </div>
          )}

          {/* Requests Tab - Giữ nguyên, hiển thị pending */}
          {activeTab === 'requests' && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Yêu cầu chờ duyệt (Khoa)</h2>
              
              <div className="space-y-4">
                {requests.filter(req => req.status === 'pending').length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">📥</div>
                    <p>Không có yêu cầu mới</p>
                  </div>
                ) : (
                  requests.filter(req => req.status === 'pending').map((request) => {
                    const requestData = request.note ? JSON.parse(request.note) : {};
                    return (
                      <div key={request.id} className="border border-orange-200 rounded-xl p-6 bg-orange-50">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-lg">{requestData.certificate_type}</h3>
                            <p className="text-gray-600">Mã yêu cầu: {request.request_code}</p>
                          </div>
                          <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                            Chờ duyệt
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <p><strong>Sinh viên:</strong> {request.student_email}</p>
                          <p><strong>Ngày tạo:</strong> {new Date(request.created_at).toLocaleDateString('vi-VN')}</p>
                          <p><strong>Mô tả:</strong> {requestData.description}</p>
                        </div>
                        <div className="flex space-x-3">
                          <button 
                            onClick={() => handleApproveRequest(request.id)}
                            className="btn-primary"
                          >
                            ✅ Phê duyệt
                          </button>
                          <button 
                            onClick={() => {/* TODO: Implement reject */}}
                            className="btn-secondary bg-red-500 hover:bg-red-600 text-white"
                          >
                            ❌ Từ chối
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

          {/* Send to University Tab - Giữ nguyên, hiển thị org_checked */}
          {activeTab === 'send' && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Yêu cầu đã gửi lên Trường (chờ phê duyệt)
              </h2>
              
              <div className="space-y-4">
                {requests.filter(req => req.status === 'org_checked').length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">Đã gửi</div>
                    <p className="text-xl">Chưa có yêu cầu nào được gửi lên Trường</p>
                  </div>
                ) : (
                  requests.filter(req => req.status === 'org_checked').map((request) => {
                    const requestData = request.note ? JSON.parse(request.note) : {};
                    return (
                      <div key={request.id} className="border-2 border-blue-300 rounded-xl p-6 bg-blue-50">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-xl text-blue-900">{requestData.certificate_type}</h3>
                            <p className="text-gray-600">Mã: <strong>{request.request_code}</strong></p>
                          </div>
                          <span className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold">
                            Đã gửi lên Trường
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 space-y-1">
                          <p><strong>Sinh viên:</strong> {request.student_email}</p>
                          <p><strong>Đã duyệt bởi:</strong> {request.admin_org_email}</p>
                          <p><strong>Mô tả:</strong> {requestData.description}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Create Request Tab */}
          {activeTab === 'create' && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Tạo yêu cầu chứng chỉ mới</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email sinh viên</label>
                      <input 
                        type="email"
                        value={formData.studentEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, studentEmail: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-teal-500 focus:ring-teal-500"
                        placeholder="student@email.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Loại chứng chỉ</label>
                      <input 
                        type="text"
                        value={formData.certificateType}
                        onChange={(e) => setFormData(prev => ({ ...prev, certificateType: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-teal-500 focus:ring-teal-500"
                        placeholder="Ví dụ: Bằng cử nhân CNTT"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                      <textarea 
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-teal-500 focus:ring-teal-500 h-32"
                        placeholder="Mô tả lý do cấp chứng chỉ..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tài liệu đính kèm</label>
                      <input 
                        type="file" 
                        multiple 
                        onChange={handleFileUpload}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      />
                      {formData.files.length > 0 && (
                        <p className="text-sm text-gray-500 mt-2">{formData.files.length} file được chọn</p>
                      )}
                    </div>
                    
                    <button 
                      onClick={handleCreateRequest}
                      className="btn-primary w-full"
                    >
                      📝 Tạo yêu cầu
                    </button>
                  </div>
                </div>

                <div className="bg-teal-50 rounded-xl p-6">
                  <h3 className="font-bold text-teal-800 mb-4">💡 Quy trình cấp chứng chỉ</h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center text-sm">1</div>
                      <span>Khoa tạo và phê duyệt yêu cầu</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm">2</div>
                      <span>Trường xác nhận</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm">3</div>
                      <span>Bộ ký và cấp chứng chỉ</span>
                    </div>
                  </div>
                </div>
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
    )
  );
}