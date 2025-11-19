"use client";
import { useRouter } from 'next/router';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Account from "../components/account";
import { FiFileText, FiCheckCircle, FiClock, FiAlertCircle, FiDownload, FiUser, FiCalendar } from 'react-icons/fi';

interface CertificateRequest {
  id: number;
  request_code: string;
  student_email: string;
  admin_org_email: string;
  org_id: number;
  ipfs_cid_list: string;
  status: string;
  note: string;
  created_at: string;
  updated_at: string;
}

interface MintedCertificate {
  id: number;
  cert_id: string;
  student_email: string;
  issued_by: string;
  org_id: number;
  ipfs_cid: string;
  status: string;
  tx_hash: string;
  created_at: string;
}

export default function StudentPage() {
  const router = useRouter();
  const { user, primaryWallet } = useDynamicContext();
  
  const [activeTab, setActiveTab] = useState('create');
  const [loading, setLoading] = useState(false);
  const [availableAdminOrgs, setAvailableAdminOrgs] = useState<any[]>([]);
  // States cho form tạo yêu cầu
  const [formData, setFormData] = useState({
    student_name: '',
    student_email: '',
    student_id: '',
    certificate_type: '',
    grade: '',
    completion_date: '',
    admin_org_email: ''
    
  });

  // States cho danh sách yêu cầu và chứng chỉ
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [mintedCertificates, setMintedCertificates] = useState<MintedCertificate[]>([]);
  
  const [token, setToken] = useState<string | null>(null);
  const [API_URL, setAPIUrl] = useState<string>("");

  // ✅ Khởi tạo token
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem("auth_token"));
      setAPIUrl(process.env.NEXT_PUBLIC_API_URL || "");
    }
  }, []);

  // Tự động điền email từ user
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({
        ...prev,
        student_email: user.email
      }));
    }
  }, [user]);

  // Fetch data theo tab
  useEffect(() => {
    if (!token || !API_URL || !user) return;

    if (activeTab === 'create') {
      fetchAvailableAdminOrgs();
    } else if (activeTab === 'requests') {
      fetchMyRequests();
    } else if (activeTab === 'claim') {
      fetchMintedCertificates();
    }
  }, [activeTab, token, API_URL, user]);

  const fetchAvailableAdminOrgs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/certificates/available-admin-orgs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Không thể tải danh sách khoa');
      
      const data = await res.json();
      setAvailableAdminOrgs(data);
    } catch (error: any) {
      console.error('Error fetching admin orgs:', error);
    }
  };

  //  API FUNCTIONS 

  // Fetch danh sách yêu cầu của sinh viên
  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/certificates/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Không thể tải danh sách yêu cầu');
      
      const data = await res.json();
      
      // Lọc chỉ lấy request của user hiện tại
      const myRequests = data.filter((req: CertificateRequest) => 
        req.student_email === user?.email
      );
      
      setRequests(myRequests);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      alert(`Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch chứng chỉ đã được mint (status = minted)
  const fetchMintedCertificates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/certificates/certificates/mine`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Không thể tải chứng chỉ');
      
      const data = await res.json();
      setMintedCertificates(data);
    } catch (error: any) {
      console.error('Error fetching certificates:', error);
      alert(`Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // THÊM: Gửi yêu cầu chứng chỉ mới
    const handleSubmitRequest = async () => {
    if (!formData.student_name || !formData.student_id || 
        !formData.certificate_type || !formData.grade || 
        !formData.completion_date || !formData.admin_org_email) {
      alert('❌ Vui lòng điền đầy đủ thông tin và chọn Khoa!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/certificates/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          student_email: user?.email,
          admin_org_email: formData.admin_org_email, 
          certificate_type: formData.certificate_type,
          description: JSON.stringify({
            student_name: formData.student_name,
            student_id: formData.student_id,
            grade: formData.grade,
            completion_date: formData.completion_date
          }),
          ipfs_cid_list: []
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Không thể gửi yêu cầu');
      }

      const result = await res.json();
      const selectedAdmin = availableAdminOrgs.find(admin => admin.email === formData.admin_org_email
      );
      const displayName = selectedAdmin ? `${selectedAdmin.display_name} (${selectedAdmin.org_name})` : formData.admin_org_email;
      alert(`✅ Gửi yêu cầu thành công!\n\n` + `📋 Mã yêu cầu: ${result.request_code}\n` +`📨 Đã gửi đến: ${displayName}`);

      setFormData({
        student_name: '',
        admin_org_email: '',
        student_email: user?.email || '',
        student_id: '',
        certificate_type: '',
        grade: '',
        completion_date: ''
      });
      
      setActiveTab('requests');
    } catch (error: any) {
      console.error('Error submitting request:', error);
      alert(`❌ Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // THÊM: Claim chứng chỉ về ví (giả lập - cần tích hợp Sui SDK)
  const handleClaimCertificate = async (certId: string, txHash: string) => {
    if (!primaryWallet) {
      alert('❌ Vui lòng kết nối ví Sui trước!');
      return;
    }

    if (!confirm(`Xác nhận nhận chứng chỉ ${certId} về ví?`)) return;

    try {
      // TODO: Tích hợp với Sui SDK để claim NFT
      alert(`🎯 Đang chuyển NFT về ví...\n\nTransaction Hash: ${txHash}\n\nĐịa chỉ ví: ${primaryWallet.address}`);
      
      // Giả lập thành công
      alert('✅ Đã nhận chứng chỉ NFT về ví thành công!');
    } catch (error: any) {
      alert(`❌ Lỗi: ${error.message}`);
    }
  };

  // === HELPER FUNCTIONS ===

  const getStatusBadge = (status: string) => {
    const config: Record<string, { text: string; color: string; icon: any }> = {
      'pending': { text: 'Chờ Khoa duyệt', color: 'bg-yellow-100 text-yellow-800', icon: <FiClock /> },
      'org_checked': { text: 'Khoa đã duyệt', color: 'bg-blue-100 text-blue-800', icon: <FiCheckCircle /> },
      'org_approved': { text: 'Trường đã duyệt', color: 'bg-purple-100 text-purple-800', icon: <FiCheckCircle /> },
      'root_signed': { text: 'Bộ đã ký', color: 'bg-green-100 text-green-800', icon: <FiCheckCircle /> },
      'minted': { text: 'Đã cấp chứng chỉ', color: 'bg-green-100 text-green-800', icon: <FiCheckCircle /> },
      'rejected': { text: 'Đã từ chối', color: 'bg-red-100 text-red-800', icon: <FiAlertCircle /> }
    };

    const { text, color, icon } = config[status] || { text: status, color: 'bg-gray-100 text-gray-800', icon: null };

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${color}`}>
        {icon}
        <span>{text}</span>
      </span>
    );
  };

  // ✅ Kiểm tra đăng nhập
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Yêu cầu đăng nhập</h2>
          <p className="text-gray-600 mb-6">Vui lòng đăng nhập để sử dụng hệ thống</p>
          <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  // ✅ Loading state
  if (!token || !API_URL) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🎓</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Cổng Sinh viên</h1>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <Account />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Xin chào, {user.name || user.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-purple-100">Quản lý yêu cầu và chứng chỉ của bạn</p>
          {primaryWallet?.address && (
            <div className="mt-4 bg-white/20 rounded-lg p-3 inline-block">
              <p className="text-sm font-mono">{primaryWallet.address}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-8 p-2 flex space-x-2">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FiFileText className="inline mr-2" />
            Tạo yêu cầu
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
              activeTab === 'requests'
                ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FiCheckCircle className="inline mr-2" />
            Danh sách đã yêu cầu
          </button>
          <button
            onClick={() => setActiveTab('claim')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
              activeTab === 'claim'
                ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FiDownload className="inline mr-2" />
            Nhận chứng chỉ về ví
          </button>
        </div>

        {/* TAB 1: TẠO YÊU CẦU */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📝 Tạo yêu cầu chứng chỉ mới</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {/* Dropdown chọn Khoa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiUser className="inline mr-2" />
                    Chọn Khoa xác nhận <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.admin_org_email}
                    onChange={(e) => setFormData({...formData, admin_org_email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">-- Chọn Khoa --</option>
                    {availableAdminOrgs.map((admin) => (
                      <option key={admin.email} value={admin.email}>
                        {admin.display_name} ({admin.org_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiUser className="inline mr-2" />
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={formData.student_name}
                    onChange={(e) => setFormData({...formData, student_name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email sinh viên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    value={formData.student_email}
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã số sinh viên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="VD: 2331540055"
                    value={formData.student_id}
                    onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại chứng chỉ <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.certificate_type}
                    onChange={(e) => setFormData({...formData, certificate_type: e.target.value})}
                  >
                    <option value="">-- Chọn loại chứng chỉ --</option>
                    <option value="Bằng tốt nghiệp">Bằng tốt nghiệp</option>
                    <option value="Chứng chỉ hoàn thành khóa học">Chứng chỉ hoàn thành khóa học</option>
                    <option value="Bằng khen">Bằng khen</option>
                    <option value="Giấy chứng nhận">Giấy chứng nhận</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Điểm / Xếp loại <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  >
                    <option value="">-- Chọn xếp loại --</option>
                    <option value="Xuất sắc">Xuất sắc</option>
                    <option value="Giỏi">Giỏi</option>
                    <option value="Khá">Khá</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Pass">Pass</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày hoàn thành <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.completion_date}
                    onChange={(e) => setFormData({...formData, completion_date: e.target.value})}
                  />
                </div>

                <button
                  onClick={handleSubmitRequest}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50"
                >
                  {loading ? '⏳ Đang gửi...' : '📤 Gửi yêu cầu đến Khoa'}
                </button>
              </div>

              {/* Hướng dẫn bên phải */}
              <div className="bg-purple-50 rounded-xl p-6">
                <h3 className="font-bold text-purple-800 mb-4">📋 Quy trình phê duyệt</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                    <div>
                      <p className="font-semibold text-gray-800">Khoa xác nhận</p>
                      <p className="text-sm text-gray-600">Admin Khoa kiểm tra thông tin và phê duyệt</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                    <div>
                      <p className="font-semibold text-gray-800">Trường xác nhận</p>
                      <p className="text-sm text-gray-600">Trường tạo chứng chỉ và upload lên IPFS</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                    <div>
                      <p className="font-semibold text-gray-800">Bộ GD ký số</p>
                      <p className="text-sm text-gray-600">Bộ Giáo dục xác thực và cấp chứng chỉ NFT</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                    <div>
                      <p className="font-semibold text-gray-800">Nhận chứng chỉ</p>
                      <p className="text-sm text-gray-600">Bạn nhận NFT về ví Sui của mình</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">⚠️ Lưu ý:</span> Vui lòng điền chính xác thông tin. 
                    Yêu cầu sai thông tin có thể bị từ chối.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DANH SÁCH ĐÃ YÊU CẦU */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 Danh sách yêu cầu của bạn</h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Đang tải...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-xl text-gray-500 font-medium">Bạn chưa có yêu cầu nào</p>
                <p className="text-gray-400 mt-2">Hãy tạo yêu cầu đầu tiên của bạn!</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  ➕ Tạo yêu cầu mới
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => {
                  const details = request.note ? JSON.parse(request.note) : {};
                  
                  return (
                    <div key={request.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 mb-1">
                            {details.certificate_type || 'Chứng chỉ'}
                          </h3>
                          <p className="text-sm text-gray-500">Mã: {request.request_code}</p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">👤 Họ tên:</span>
                          <span className="ml-2 font-medium">{details.student_name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">🎓 MSSV:</span>
                          <span className="ml-2 font-medium">{details.student_id || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">📊 Xếp loại:</span>
                          <span className="ml-2 font-medium">{details.grade || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">📅 Hoàn thành:</span>
                          <span className="ml-2 font-medium">{details.completion_date || 'N/A'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600">🕒 Ngày gửi:</span>
                          <span className="ml-2 font-medium">
                            {new Date(request.created_at).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NHẬN CHỨNG CHỈ VỀ VÍ */}
        {activeTab === 'claim' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🎯 Nhận chứng chỉ về ví cá nhân</h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : mintedCertificates.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏆</div>
                <p className="text-xl text-gray-500 font-medium">Chưa có chứng chỉ nào được cấp</p>
                <p className="text-gray-400 mt-2">Chứng chỉ đã được Bộ phê duyệt sẽ xuất hiện ở đây</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mintedCertificates.map((cert) => {
                  const ipfsData = cert.ipfs_cid ? JSON.parse(cert.ipfs_cid) : {};
                  
                  return (
                    <div key={cert.id} className="border-2 border-green-200 rounded-xl p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl">🎓</span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                          ✓ Đã cấp
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-800 mb-2">Chứng chỉ #{cert.cert_id}</h3>
                      
                      <div className="space-y-2 text-sm mb-4">
                        <p className="text-gray-600">
                          <span className="font-medium">Người cấp:</span> {cert.issued_by}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Ngày cấp:</span> {new Date(cert.created_at).toLocaleDateString('vi-VN')}
                        </p>
                        {ipfsData.metadata && (
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${ipfsData.metadata}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs"
                          >
                            📎 Xem metadata trên IPFS
                          </a>
                        )}
                      </div>

                      <button
                        onClick={() => handleClaimCertificate(cert.cert_id, cert.tx_hash)}
                        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                      >
                        <FiDownload className="inline mr-2" />
                        Nhận về ví Sui
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Hướng dẫn */}
            <div className="mt-8 bg-purple-50 rounded-xl p-6">
              <h3 className="font-bold text-purple-800 mb-3">💡 Hướng dẫn nhận chứng chỉ</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Chứng chỉ sẽ được mint thành NFT Soulbound Token trên Sui blockchain</li>
                <li>• NFT sẽ được gửi trực tiếp vào ví Sui của bạn</li>
                <li>• Chứng chỉ NFT không thể chuyển nhượng (Soulbound)</li>
                <li>• Bạn có thể xem và chia sẻ chứng chỉ bất cứ lúc nào</li>
                <li>• Metadata được lưu trữ vĩnh viễn trên IPFS</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 bg-white/50 rounded-2xl p-6 text-center max-w-7xl mx-auto">
        <p className="text-gray-600 font-semibold">EduChain — Hệ thống Chứng chỉ Blockchain</p>
        <p className="text-sm text-gray-500 mt-1">Powered by Sui Network & IPFS</p>
      </footer>
    </div>
  );
}