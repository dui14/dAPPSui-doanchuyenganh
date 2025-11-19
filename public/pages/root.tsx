"use client";

import { useRouter } from "next/router";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useEffect, useState } from "react";
import Account from "../components/account";
import { 
  sendToMinistryOnChain, 
  approveByMinistryOnChain, 
  rejectByMinistryOnChain 
} from "../utils/sui";

export default function RootPage() {
  const router = useRouter();
  const { user, primaryWallet } = useDynamicContext();
  const [activeTab, setActiveTab] = useState("overview");

  const [requests, setRequests] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [showOrgForm, setShowOrgForm] = useState(false);
  
  const [orgFormData, setOrgFormData] = useState({
    org_name: "",
    org_email: "",
    owner_email: "",          
    owner_display_name: "", 
    org_wallet: ""
  });

  // ✅ SỬA LỖI: Chỉ lấy token khi đã render trên client
  const [token, setToken] = useState<string | null>(null);
  const [API_URL, setAPIUrl] = useState<string>("");

  useEffect(() => {
    // ✅ Chỉ chạy trên browser (client-side)
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem("auth_token"));
      setAPIUrl(process.env.NEXT_PUBLIC_API_URL || "");
    }
  }, []);

  // Fetch dữ liệu theo tab
  useEffect(() => {
    if (!user || !token || !API_URL) return; // ← Đợi token load xong
    
    if (activeTab === "overview") {
      fetchStats();
    } else if (activeTab === "requests") {
      fetchRequests();
    } else if (activeTab === "organizations") {
      fetchOrganizations();
    }
  }, [user, activeTab, token, API_URL]); // ← Thêm token và API_URL vào dependencies

  const fetchStats = async () => {
    if (!token || !API_URL) return; // ← Kiểm tra trước khi fetch
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/organizations/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Lỗi tải thống kê");
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    if (!token || !API_URL) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/certificates/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Lỗi tải dữ liệu");
      const data = await res.json();
      setRequests(data.filter((req: any) => req.status === "org_approved"));
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    if (!token || !API_URL) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/organizations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Lỗi tải tổ chức");
      const data = await res.json();
      setOrganizations(data);
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!token || !API_URL) return;
    
    // Validate
    if (!orgFormData.org_name || !orgFormData.org_email || 
        !orgFormData.owner_email || !orgFormData.owner_display_name) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/organizations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orgFormData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      
      const result = await res.json();
      alert(`✅ Tạo tổ chức thành công!\nOwner ID: ${result.owner_id}`);
      
      setShowOrgForm(false);
      setOrgFormData({ 
        org_name: "", 
        org_email: "", 
        owner_email: "", 
        owner_display_name: "", 
        org_wallet: "" 
      });
      fetchOrganizations();
    } catch (e: any) {
      alert("❌ Lỗi: " + e.message);
    }
  };

  const handleUpdateOrganization = async (id: number) => {
    if (!token || !API_URL) return;
    
    try {
      const res = await fetch(`${API_URL}/api/organizations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingOrg),
      });

      if (!res.ok) throw new Error("Lỗi cập nhật");
      
      alert("Cập nhật thành công!");
      setEditingOrg(null);
      fetchOrganizations();
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    }
  };

  const handleDeleteOrganization = async (id: number) => {
    if (!token || !API_URL) return;
    if (!confirm("Xác nhận xóa tổ chức này?")) return;

    try {
      const res = await fetch(`${API_URL}/api/organizations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      
      alert("Xóa thành công!");
      fetchOrganizations();
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    }
  };

  const handleMintCertificate = async (id: number) => {
    if (!token || !API_URL) return;
    if (!confirm("Ký số và cấp chứng chỉ NFT cho yêu cầu này?")) return;

    try {
      const res = await fetch(`${API_URL}/api/certificates/requests/${id}/mint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Lỗi mint chứng chỉ");

      const result = await res.json();
      alert(`Cấp chứng chỉ thành công!\nCertID: ${result.cert_id}`);
      fetchRequests();
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    }
  };

  const handleRejectRequest = async (id: number) => {
    if (!token || !API_URL) return;
    if (!confirm("Từ chối yêu cầu này?")) return;

    try {
      const res = await fetch(`${API_URL}/api/certificates/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "rejected", root_email: user?.email }),
      });
      if (!res.ok) throw new Error("Lỗi từ chối");
      alert("Đã từ chối yêu cầu");
      fetchRequests();
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    }
  };

  // ✅ Kiểm tra user trước khi redirect
  if (!user) {
    if (typeof window !== 'undefined') {
      router.push("/login");
    }
    return <div className="min-h-screen flex items-center justify-center">Đang chuyển hướng...</div>;
  }

  // ✅ Hiển thị loading khi chưa có token
  if (!token || !API_URL) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-red-600"></div>
      </div>
    );
  }

  if (loading && activeTab === "overview") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50">
      {/* ==================== HEADER ==================== */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">🏛️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Bộ Giáo Dục & Đào Tạo
                </h1>
                <p className="text-xs text-gray-500">Quản trị hệ thống chứng chỉ</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">{user?.email}</p>
                {primaryWallet?.address && (
                  <p className="text-xs text-gray-500 font-mono">
                    {primaryWallet.address.slice(0, 6)}...{primaryWallet.address.slice(-4)}
                  </p>
                )}
              </div>
              <Account />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* ==================== TABS ==================== */}
        <div className="bg-white rounded-xl shadow-md mb-8 p-2 flex space-x-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              activeTab === "overview"
                ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            📊 Tổng quan hệ thống
          </button>
          <button
            onClick={() => setActiveTab("organizations")}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              activeTab === "organizations"
                ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            🏢 Quản lý Tổ chức
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              activeTab === "requests"
                ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            📋 Yêu cầu chứng chỉ
          </button>
        </div>

        {/* ==================== TAB: TỔNG QUAN ==================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">📊 Tổng quan hệ thống</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card: Tổ chức */}
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold text-blue-600">{stats.total_orgs || 0}</div>
                    <div className="text-gray-600 mt-2 font-medium">Tổ chức đã phê duyệt</div>
                  </div>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl">🏢</span>
                  </div>
                </div>
              </div>

              {/* Card: Chứng chỉ */}
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold text-green-600">{stats.total_certs || 0}</div>
                    <div className="text-gray-600 mt-2 font-medium">Chứng chỉ đã cấp</div>
                  </div>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl">🎓</span>
                  </div>
                </div>
              </div>

              {/* Card: Yêu cầu */}
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold text-yellow-600">{stats.pending_requests || 0}</div>
                    <div className="text-gray-600 mt-2 font-medium">Yêu cầu chờ duyệt</div>
                  </div>
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl">⏳</span>
                  </div>
                </div>
              </div>

              {/* Card: Người dùng */}
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold text-purple-600">{stats.total_users || 0}</div>
                    <div className="text-gray-600 mt-2 font-medium">Người dùng hoạt động</div>
                  </div>
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl">👥</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: QUẢN LÝ TỔ CHỨC ==================== */}
        {activeTab === "organizations" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-800">🏢 Danh sách Tổ chức</h2>
              <button
                onClick={() => setShowOrgForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center space-x-2"
              >
                <span className="text-xl">+</span>
                <span>Thêm Tổ chức</span>
              </button>
            </div>

            {/* ✅ Form tạo tổ chức MỚI */}
            {showOrgForm && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-2xl font-bold mb-6 text-gray-800">📝 Thêm Tổ chức mới</h3>
                
                <div className="space-y-6">
                  {/* Section: Thông tin tổ chức */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3 text-lg">🏢 Thông tin Tổ chức</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tên tổ chức <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="VD: Đại học Bách Khoa Hà Nội"
                          value={orgFormData.org_name}
                          onChange={(e) => setOrgFormData({ ...orgFormData, org_name: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email tổ chức <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="hust@edu.vn"
                          value={orgFormData.org_email}
                          onChange={(e) => setOrgFormData({ ...orgFormData, org_email: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Địa chỉ ví (Wallet) <span className="text-gray-400">(tùy chọn)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="0x..."
                          value={orgFormData.org_wallet}
                          onChange={(e) => setOrgFormData({ ...orgFormData, org_wallet: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section: Thông tin Owner */}
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-700 mb-3 text-lg">👤 Thông tin Chủ sở hữu (Owner)</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-blue-800">
                        <span className="font-semibold">💡 Lưu ý:</span> Nếu email chưa tồn tại trong hệ thống, 
                        tài khoản owner sẽ được tự động tạo với role <code className="bg-blue-200 px-2 py-0.5 rounded">"org"</code> 
                        và trạng thái <code className="bg-green-200 px-2 py-0.5 rounded">"active"</code>
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Owner <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="owner@hust.edu.vn"
                          value={orgFormData.owner_email}
                          onChange={(e) => setOrgFormData({ ...orgFormData, owner_email: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tên hiển thị Owner <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Nguyễn Văn A"
                          value={orgFormData.owner_display_name}
                          onChange={(e) => setOrgFormData({ ...orgFormData, owner_display_name: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex space-x-3 mt-8 pt-6 border-t">
                  <button
                    onClick={handleCreateOrganization}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                  >
                    ✅ Tạo Tổ chức
                  </button>
                  <button
                    onClick={() => {
                      setShowOrgForm(false);
                      setOrgFormData({ 
                        org_name: "", 
                        org_email: "", 
                        owner_email: "", 
                        owner_display_name: "", 
                        org_wallet: "" 
                      });
                    }}
                    className="px-8 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all font-semibold"
                  >
                    ❌ Hủy
                  </button>
                </div>
              </div>
            )}

            {/* Bảng danh sách tổ chức */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tên Tổ chức</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Wallet</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Chưa có tổ chức nào. Nhấn "Thêm Tổ chức" để bắt đầu.
                      </td>
                    </tr>
                  ) : (
                    organizations.map((org) => (
                      <tr key={org.id} className="border-t hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-sm text-gray-600">{org.id}</td>
                        <td className="px-6 py-4">
                          {editingOrg?.id === org.id ? (
                            <input
                              value={editingOrg.org_name}
                              onChange={(e) => setEditingOrg({ ...editingOrg, org_name: e.target.value })}
                              className="border border-gray-300 rounded px-3 py-1 w-full focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="font-medium text-gray-800">{org.org_name}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingOrg?.id === org.id ? (
                            <input
                              value={editingOrg.org_email}
                              onChange={(e) => setEditingOrg({ ...editingOrg, org_email: e.target.value })}
                              className="border border-gray-300 rounded px-3 py-1 w-full focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="text-sm text-gray-600">{org.org_email}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-500 font-mono">
                            {org.org_wallet ? `${org.org_wallet.slice(0, 6)}...${org.org_wallet.slice(-4)}` : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {editingOrg?.id === org.id ? (
                            <select
                              value={editingOrg.status}
                              onChange={(e) => setEditingOrg({ ...editingOrg, status: e.target.value })}
                              className="border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="pending">Chờ duyệt</option>
                              <option value="approved">Đã duyệt</option>
                              <option value="revoked">Đã thu hồi</option>
                            </select>
                          ) : (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                org.status === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : org.status === "pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {org.status === "approved" ? "✅ Đã duyệt" : org.status === "pending" ? "⏳ Chờ duyệt" : "🚫 Đã thu hồi"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            {editingOrg?.id === org.id ? (
                              <>
                                <button
                                  onClick={() => handleUpdateOrganization(org.id)}
                                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                >
                                  💾 Lưu
                                </button>
                                <button
                                  onClick={() => setEditingOrg(null)}
                                  className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                                >
                                  ❌ Hủy
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setEditingOrg(org)}
                                  className="px-3 py-1.5 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
                                >
                                  ✏️ Sửa
                                </button>
                                <button
                                  onClick={() => handleDeleteOrganization(org.id)}
                                  className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                                >
                                  🗑️ Xóa
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB: YÊU CẦU CHỨNG CHỈ ==================== */}
        {activeTab === "requests" && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">📋 Yêu cầu Chứng chỉ Chờ Duyệt</h2>

            {requests.length === 0 ? (
              <div className="bg-white rounded-xl p-16 text-center shadow-lg">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-xl text-gray-500 font-medium">Không có yêu cầu nào chờ duyệt</p>
                <p className="text-sm text-gray-400 mt-2">Các yêu cầu mới sẽ xuất hiện ở đây</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {requests.map((req) => (
                  <div key={req.id} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-orange-500">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                            {req.request_code}
                          </span>
                          <span className="text-xs text-gray-400">ID: {req.id}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold text-gray-700">👤 Sinh viên:</span> {req.student_email}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold text-gray-700">🏢 Tổ chức:</span> Org ID {req.org_id}
                          </p>
                          {req.note && (
                            <p className="text-sm text-gray-500 mt-3 p-3 bg-gray-50 rounded-lg">
                              <span className="font-semibold">📝 Ghi chú:</span> {req.note}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col space-y-3 ml-6">
                        <button
                          onClick={() => handleMintCertificate(req.id)}
                          className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold whitespace-nowrap"
                        >
                          ✅ Phê duyệt & Mint NFT
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold"
                        >
                          ❌ Từ chối
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}