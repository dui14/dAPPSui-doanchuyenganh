"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Account from "../components/account";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { 
  FiHome, FiFileText, FiCheckCircle, FiSend, 
  FiUser, FiCalendar, FiX 
} from "react-icons/fi";

interface CertificateRequest {
  id: number;
  request_code: string;
  student_email: string;
  org_id: number;
  ipfs_cid_list: string;
  status: string;
  note: string;
  created_at: string;
  updated_at: string;
}

interface Certificate {
  id: number;
  cert_id: string;
  student_email: string;
  issued_by: string;
  org_id: number;
  ipfs_cid: string;
  status: string;
  created_at: string;
}

export default function AdminOrgPage() {
  const router = useRouter();
  const { user, primaryWallet } = useDynamicContext();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [pendingRequests, setPendingRequests] = useState<CertificateRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<CertificateRequest[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalCertificates: 0
  });

  const [token, setToken] = useState<string | null>(null);
  const [API_URL, setAPIUrl] = useState<string>("");

  // ✅ Load token khi component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem("auth_token"));
      setAPIUrl(process.env.NEXT_PUBLIC_API_URL || "");
    }
  }, []);

  // ✅ Kiểm tra quyền truy cập
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const checkRole = async () => {
      if (!token || !API_URL) return;

      try {
        const res = await fetch(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.role !== 'admin_org') {
          alert("Bạn không có quyền truy cập trang này!");
          router.push("/login");
        }
      } catch (error) {
        console.error("Error checking role:", error);
      }
    };

    checkRole();
  }, [user, token, API_URL, router]);

  // ✅ Fetch data theo tab
  useEffect(() => {
    if (!token || !API_URL) return;

    if (activeTab === "overview") {
      fetchOverview();
    } else if (activeTab === "approve") {
      fetchPendingRequests();
    } else if (activeTab === "certificates") {
      fetchCertificates();
    }
  }, [activeTab, token, API_URL]);

  // === API Functions ===

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/certificates/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to fetch requests");
      
      const data = await res.json();
      
      const myRequests = data.filter((req: CertificateRequest) => 
        req.status === 'pending' || req.status === 'org_checked'
      );

      setStats({
        totalPending: myRequests.filter((r: CertificateRequest) => r.status === 'pending').length,
        totalApproved: myRequests.filter((r: CertificateRequest) => r.status === 'org_checked').length,
        totalCertificates: 0
      });
    } catch (error) {
      console.error("Error fetching overview:", error);
      alert("Lỗi khi tải dữ liệu tổng quan");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/certificates/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to fetch requests");
      
      const data = await res.json();
      
      // Lọc requests được gửi đến admin_org hiện tại
      const pending = data.filter((req: CertificateRequest) => 
        req.status === 'pending' && req.admin_org_email === user?.email
      );
      
      const approved = data.filter((req: CertificateRequest) => 
        req.status === 'org_checked' && req.admin_org_email === user?.email
      );

      setPendingRequests(pending);
      setApprovedRequests(approved);
    } catch (error) {
      console.error("Error fetching requests:", error);
      alert("Lỗi khi tải danh sách yêu cầu");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/certificates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to fetch certificates");
      
      const data = await res.json();
      setCertificates(data);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      alert("Lỗi khi tải danh sách chứng chỉ");
    } finally {
      setLoading(false);
    }
  };

  // === Handler Functions ===

  // THAY ĐỔI: Phê duyệt yêu cầu của sinh viên (pending → org_checked)
  const handleApproveRequest = async (requestId: number, studentEmail: string) => {
    if (!confirm(`Xác nhận rằng sinh viên ${studentEmail} đã đủ điều kiện nhận chứng chỉ?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/certificates/requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "org_checked",
          admin_org_email: user?.email
        })
      });

      if (!res.ok) throw new Error("Failed to approve request");

      alert("✅ Đã xác nhận sinh viên đủ điều kiện! Yêu cầu đã chuyển sang trạng thái 'Đã kiểm tra'.");
      fetchPendingRequests();
      fetchOverview();
    } catch (error: any) {
      console.error("Error approving request:", error);
      alert(`❌ Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // THAY ĐỔI: Từ chối yêu cầu
  const handleRejectRequest = async (requestId: number) => {
    const reason = prompt("Lý do từ chối:");
    if (!reason) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/certificates/requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "rejected",
          admin_org_email: user?.email,
          note: JSON.stringify({ rejected_reason: reason })
        })
      });

      if (!res.ok) throw new Error("Failed to reject request");

      alert("❌ Đã từ chối yêu cầu.");
      fetchPendingRequests();
      fetchOverview();
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      alert(`❌ Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // === Render ===

  if (!user || !token || !API_URL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-cyan-100">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                <FiFileText className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Hệ thống Quản lý Khoa</h1>
                <p className="text-xs text-gray-500">Admin Khoa - {user?.email}</p>
              </div>
            </div>
            <Account />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-md p-2 mb-6 flex space-x-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
              activeTab === "overview"
                ? "bg-gradient-to-r from-green-500 to-teal-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FiHome className="inline mr-2" />
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab("approve")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
              activeTab === "approve"
                ? "bg-gradient-to-r from-green-500 to-teal-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FiCheckCircle className="inline mr-2" />
            Phê duyệt sinh viên
          </button>
          <button
            onClick={() => setActiveTab("certificates")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
              activeTab === "certificates"
                ? "bg-gradient-to-r from-green-500 to-teal-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FiFileText className="inline mr-2" />
            Danh sách chứng chỉ
          </button>
        </div>

        {/* TAB: Tổng quan */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Thống kê tổng quan</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-6 text-white">
                <FiFileText className="text-3xl mb-2" />
                <h3 className="text-lg font-semibold">Yêu cầu chờ duyệt</h3>
                <p className="text-4xl font-bold mt-2">{stats.totalPending}</p>
              </div>

              <div className="bg-gradient-to-br from-green-400 to-teal-500 rounded-xl p-6 text-white">
                <FiCheckCircle className="text-3xl mb-2" />
                <h3 className="text-lg font-semibold">Đã phê duyệt</h3>
                <p className="text-4xl font-bold mt-2">{stats.totalApproved}</p>
              </div>

              <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl p-6 text-white">
                <FiSend className="text-3xl mb-2" />
                <h3 className="text-lg font-semibold">Chứng chỉ đã cấp</h3>
                <p className="text-4xl font-bold mt-2">{stats.totalCertificates}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Phê duyệt sinh viên */}
        {activeTab === "approve" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">✅ Phê duyệt yêu cầu sinh viên</h2>

            {/* Yêu cầu chờ duyệt */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">⏳ Yêu cầu chờ phê duyệt</h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                </div>
              ) : pendingRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Không có yêu cầu nào chờ duyệt</p>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((req) => {
                    const note = req.note ? JSON.parse(req.note) : {};
                    return (
                      <div key={req.id} className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-bold text-gray-800">{req.request_code}</span>
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                Chờ duyệt
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <FiUser className="inline mr-1" />
                              Sinh viên: {req.student_email}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <FiCalendar className="inline mr-1" />
                              Ngày tạo: {new Date(req.created_at).toLocaleString('vi-VN')}
                            </p>
                            {note.certificate_type && (
                              <p className="text-sm text-gray-600 mb-1">
                                📜 Loại: {note.certificate_type}
                              </p>
                            )}
                            {note.description && (
                              <p className="text-sm text-gray-600">
                                📝 Mô tả: {note.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() => handleApproveRequest(req.id, req.student_email)}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                            >
                              <FiCheckCircle className="inline mr-1" />
                              Phê duyệt
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req.id)}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                            >
                              <FiX className="inline mr-1" />
                              Từ chối
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Danh sách đã duyệt */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">✅ Đã phê duyệt - Chờ Trường xử lý</h3>
              {approvedRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Không có yêu cầu nào</p>
              ) : (
                <div className="space-y-4">
                  {approvedRequests.map((req) => {
                    const note = req.note ? JSON.parse(req.note) : {};
                    return (
                      <div key={req.id} className="border rounded-lg p-4 bg-green-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-bold text-gray-800">{req.request_code}</span>
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Đã duyệt bởi Khoa
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <FiUser className="inline mr-1" />
                              Sinh viên: {req.student_email}
                            </p>
                            <p className="text-sm text-gray-600">
                              ✅ Đã xác nhận đủ điều kiện - Đang chờ Trường xử lý tiếp
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Danh sách chứng chỉ */}
        {activeTab === "certificates" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">📜 Danh sách chứng chỉ đã cấp</h2>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                </div>
              ) : certificates.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Chưa có chứng chỉ nào được cấp</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã chứng chỉ</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sinh viên</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người cấp</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày cấp</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IPFS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {certificates.map((cert) => (
                        <tr key={cert.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{cert.cert_id}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{cert.student_email}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{cert.issued_by}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(cert.created_at).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {cert.ipfs_cid && (
                              <a
                                href={`https://gateway.pinata.cloud/ipfs/${cert.ipfs_cid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Xem file →
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}