"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import Account from "../components/account";
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { 
  sendToMinistryOnChain, 
  getMinistryRequests,
  getRequestDetails,
  createRequestOnChain
} from '../utils/sui';

export default function OrgPage() {
  const router = useRouter();
  const { user, primaryWallet } = useDynamicContext();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  const [eligibleStudents, setEligibleStudents] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [adminKhoas, setAdminKhoas] = useState<any[]>([]);
  const [mintableCerts, setMintableCerts] = useState<any[]>([]);
  const [auditRequests, setAuditRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgInfo, setOrgInfo] = useState<any>(null);
  const [pendingTxs, setPendingTxs] = useState<{ [key: number]: string }>({});
  const [blockchainRequests, setBlockchainRequests] = useState<any[]>([]); // Danh sách requests trên blockchain
  
  
  // Form states
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [adminFormData, setAdminFormData] = useState({
    email: "",
    display_name: "",
    wallet_address: ""
  });

  const [certFormData, setCertFormData] = useState({
    student_email: "",
    admin_org_email: "",
    certificate_type: "",
    description: "",
    certificate_image: null as File | null
  });

  const [token, setToken] = useState<string | null>(null);
  const [API_URL, setAPIUrl] = useState<string>("");

  // check mounted
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load token SAU KHI mounted
  useEffect(() => {
    if (!isMounted) return;

    const storedToken = localStorage.getItem("auth_token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

    console.log("🔍 Checking token...", { storedToken: storedToken?.substring(0, 20) });

    if (!storedToken) {
      console.log("❌ No token found → Redirect to login");
      router.push("/login");
      return;
    }

    setToken(storedToken);
    setAPIUrl(apiUrl);
    setIsAuthChecking(false);
  }, [isMounted, router]);

  // Khởi tạo token
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem("auth_token"));
      setAPIUrl(process.env.NEXT_PUBLIC_API_URL || "");
    }
  }, []);

  // Fetch thông tin tổ chức
    useEffect(() => {
    const fetchOrgInfo = async () => {
      if (!user || !token || !API_URL) {
        console.log("⏳ Waiting for user/token/API_URL...");
        return;
      }
      
      try {
        console.log("📡 Fetching user info...");
        const userRes = await fetch(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!userRes.ok) {
          throw new Error(`HTTP ${userRes.status}: ${await userRes.text()}`);
        }
        
        const userData = await userRes.json();
        console.log("✅ User data:", userData);

        if (!userData.org_id) {
          alert("⚠️ Tài khoản chưa được liên kết với tổ chức.\n\nVui lòng liên hệ admin.");
          router.push("/login");
          return;
        }

        console.log("📡 Fetching organization info...");
        const orgRes = await fetch(`${API_URL}/api/organizations/${userData.org_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!orgRes.ok) {
          const errorData = await orgRes.json();
          throw new Error(errorData.error || "Không thể tải thông tin tổ chức");
        }

        const orgData = await orgRes.json();
        console.log("✅ Organization data:", orgData);
        
        if (orgData.status !== "approved") {
          alert(`⚠️ Tổ chức "${orgData.org_name}" chưa được phê duyệt.\n\nTrạng thái: ${orgData.status}`);
          router.push("/login");
          return;
        }

        setOrgInfo(orgData);
      } catch (err: any) {
        console.error("❌ Lỗi fetch org info:", err);
        alert(`Lỗi: ${err.message}\n\nVui lòng đăng nhập lại.`);
        
        // THÊM: Xóa token lỗi và redirect
        localStorage.removeItem("auth_token");
        router.push("/login");
      }
    };

    fetchOrgInfo();
  }, [user, token, API_URL, router]);

  // Fetch data theo activeTab
  useEffect(() => {
  if (!orgInfo || !token || !API_URL) return;

  if (activeTab === "overview") {
    fetchEligibleStudents();
    fetchPendingRequests();
    fetchMintableCerts();
  } else if (activeTab === "admins") {
    fetchAdminKhoas(); 
  } else if (activeTab === "create") {
    fetchEligibleStudents();
    fetchPendingRequests();
  } else if (activeTab === "mint") {
    fetchMintableCerts();
  } else if (activeTab === "audit") {
    fetchAuditRequests();
    fetchBlockchainRequests();
  }
}, [activeTab, orgInfo, token, API_URL]);

  // Fetch sinh viên đủ điều kiện (đã được Khoa duyệt)
  const fetchEligibleStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/certificates/eligible-students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Lỗi tải sinh viên");
      const data = await res.json();
      setEligibleStudents(data);
    } catch (err: any) {
      console.error("Lỗi:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch yêu cầu đang chờ (hiển thị trong tab "Tạo yêu cầu")
  const fetchPendingRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/api/certificates/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPendingRequests(data.filter((req: any) => 
        req.org_id === orgInfo.id && req.status === "org_checked"
      ));
    } catch (err: any) {
      console.error("Lỗi:", err.message);
    }
  };
  // Fetch Admin Khoa
  const fetchAdminKhoas = async () => {
    if (!orgInfo) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/organizations/${orgInfo.id}/admins`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAdminKhoas(data);
    } catch (err: any) {
      console.error("Lỗi:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch chứng chỉ sẵn sàng mint (status = org_approved)
  const fetchMintableCerts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/certificates/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      // ✅ THAY ĐỔI: Chỉ lấy request có status = 'root_signed' (Bộ đã duyệt)
      setMintableCerts(data.filter((req: any) => 
        req.org_id === orgInfo.id && req.status === "root_signed"
      ));
    } catch (err: any) {
      console.error("Lỗi:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch yêu cầu audit (gửi lên Bộ)
  const fetchAuditRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/certificates/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAuditRequests(data.filter((req: any) => 
        req.org_id === orgInfo.id && req.status === "org_approved"
      ));
    } catch (err: any) {
      console.error("Lỗi:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // === CRUD Admin Khoa (giữ nguyên từ code cũ) ===
  const handleCreateAdmin = async () => {
    if (!adminFormData.email || !adminFormData.display_name) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/organizations/${orgInfo.id}/admins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(adminFormData),
      });

      if (!res.ok) throw new Error((await res.json()).error);

      alert("✅ Thêm Admin Khoa thành công!");
      setShowAdminForm(false);
      setAdminFormData({ email: "", display_name: "", wallet_address: "" });
      fetchAdminKhoas();
    } catch (e: any) {
      alert("❌ Lỗi: " + e.message);
    }
  };

  const handleUpdateAdmin = async (userId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/organizations/${orgInfo.id}/admins/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editingAdmin),
      });

      if (!res.ok) throw new Error("Lỗi cập nhật");

      alert("Cập nhật thành công!");
      setEditingAdmin(null);
      fetchAdminKhoas();
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    }
  };

  const handleDeleteAdmin = async (userId: number) => {
    if (!confirm("Xác nhận xóa Admin Khoa này?")) return;

    try {
      const res = await fetch(`${API_URL}/api/organizations/${orgInfo.id}/admins/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Lỗi xóa");

      alert("Xóa thành công!");
      fetchAdminKhoas();
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    }
  };

  // === Tạo chứng chỉ mới (upload IPFS) ===
  const handleCreateCertificate = async () => {
    // ✅ THAY ĐỔI: Validation đầy đủ
    if (!certFormData.student_email || !certFormData.admin_org_email || 
        !certFormData.certificate_type || !certFormData.description) {
      alert("❌ Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (!certFormData.certificate_image) {
      alert("❌ Vui lòng upload ảnh chứng chỉ!");
      return;
    }

    // ✅ THÊM: Confirm trước khi submit
    if (!confirm(`Xác nhận tạo chứng chỉ cho sinh viên:\n${certFormData.student_email}\n\nLoại: ${certFormData.certificate_type}`)) {
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('student_email', certFormData.student_email);
      formData.append('admin_org_email', certFormData.admin_org_email);
      formData.append('certificate_type', certFormData.certificate_type);
      formData.append('description', certFormData.description);
      formData.append('certificate_image', certFormData.certificate_image);

      console.log('📤 Đang gửi request tạo chứng chỉ...');
      
      const res = await fetch(`${API_URL}/api/certificates/requests/org`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Không thể tạo chứng chỉ');
      }

      const result = await res.json();
      
      alert(`✅ Tạo chứng chỉ thành công!\n\n` +
            `📋 Mã yêu cầu: ${result.request_code}\n` +
            `🖼️ IPFS Image: ${result.ipfs_image || 'N/A'}\n` +
            `📄 IPFS Metadata: ${result.ipfs_metadata}\n\n` +
            `⏳ Đã gửi lên Bộ GD để xét duyệt cuối cùng.`);
      
      // ✅ Reset form
      setCertFormData({ 
        student_email: "", 
        admin_org_email: "", 
        certificate_type: "", 
        description: "",
        certificate_image: null
      });
      
      // ✅ Refresh data
      fetchEligibleStudents();
      fetchPendingRequests();
      fetchMintableCerts();
    } catch (e: any) {
      console.error('❌ Lỗi tạo chứng chỉ:', e);
      alert(`❌ Lỗi: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // === Mint NFT Soulbound ===
  const handleMintNFT = async (requestId: number, ipfs_cid: string) => {
    if (!primaryWallet) {
      alert("Vui lòng kết nối ví Sui trước!");
      return;
    }

    if (!confirm("Xác nhận mint NFT Soulbound cho chứng chỉ này?")) return;

    try {
      // TODO: Tích hợp với Sui smart contract để mint NFT
      alert(`🔗 Đang mint NFT...\nIPFS: ${ipfs_cid}\nRequest ID: ${requestId}`);

      // Giả lập transaction (thay bằng @mysten/sui.js thực tế)
      const tx_hash = `0x${'a'.repeat(64)}`; // Giả lập

      // Cập nhật status thành "minted"
      await fetch(`${API_URL}/api/certificates/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          status: "minted",
          tx_hash: tx_hash
        }),
      });

      alert("✅ Mint thành công! Chứng chỉ đã được cấp cho sinh viên.");
      fetchMintableCerts();
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    }
  };

  // === Gửi Audit lên Sui Blockchain ===
  const handleSendAudit = async (requestId: number) => {
    if (!primaryWallet || !primaryWallet.address) {
      alert("❌ Vui lòng kết nối ví Sui trước!");
      return;
    }

    if (!confirm("Xác nhận gửi yêu cầu audit lên Bộ GD qua Sui Blockchain?")) return;

    setLoading(true);
    try {
      // Bước 1: Lấy thông tin request từ database
      const res = await fetch(`${API_URL}/api/certificates/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Không thể tải thông tin yêu cầu");
      
      const allRequests = await res.json();
      const request = allRequests.find((r: any) => r.id === requestId);
      
      if (!request) {
        throw new Error("Không tìm thấy yêu cầu");
      }

      // Bước 2: Tạo transaction gọi send_to_ministry
      console.log("📤 Đang tạo transaction gửi lên blockchain...");
      
      const tx = await sendToMinistryOnChain(
        [request.request_code],
        primaryWallet.address
      );

      // ✅ THAY ĐỔI: Sử dụng signTransaction thay vì signAndExecuteTransactionBlock
      console.log("✍️ Đang ký transaction...");
      
      // Serialize transaction
      const txBytes = await tx.build({ client: suiClient });
      
      // Gọi ví Sui qua Dynamic SDK
      const connector = primaryWallet.connector;
      if (!connector) throw new Error("Connector không khả dụng");

      // ✅ CÁCH MỚI: Sử dụng signTransaction + executeTransaction
      const signedTx = await connector.signTransaction({
        transaction: txBytes,
        account: primaryWallet.address,
        chain: 'sui:testnet'
      });

      // Execute transaction
      const { SuiClient } = await import('@mysten/sui.js/client');
      const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });
      
      const result = await client.executeTransactionBlock({
        transactionBlock: signedTx.signature,
        signature: signedTx.signature,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      console.log("✅ Transaction thành công:", result.digest);

      // Bước 4: Cập nhật database
      const updateRes = await fetch(`${API_URL}/api/certificates/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'root_pending',
          root_email: 'ministry@edu.gov.vn',
          tx_hash: result.digest
        })
      });

      if (!updateRes.ok) throw new Error("Không thể cập nhật database");

      setPendingTxs(prev => ({ ...prev, [requestId]: result.digest }));

      alert(`✅ Đã gửi lên Bộ GD thành công!\n\nTransaction: ${result.digest.slice(0, 10)}...`);
      
      fetchAuditRequests();

    } catch (error: any) {
      console.error("❌ Lỗi gửi audit:", error);
      alert(`Lỗi: ${error.message || 'Không thể gửi transaction'}`);
    } finally {
      setLoading(false);
    }
  };

const fetchBlockchainRequests = async () => {
  try {
    console.log("🔍 Đang lấy danh sách requests từ blockchain...");
    const requestIds = await getMinistryRequests();
    
    const details = await Promise.all(
      requestIds.map(id => getRequestDetails(id))
    );

    setBlockchainRequests(details.filter(d => d !== null));
    console.log("✅ Đã tải", details.length, "requests từ blockchain");
  } catch (error) {
    console.error("❌ Lỗi tải blockchain data:", error);
  }
};

  if (!user) {
    router.push("/login");
    return <div className="min-h-screen flex items-center justify-center">Đang chuyển hướng...</div>;
  }

  // Kiểm tra mounted trước khi render
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 mb-4 mx-auto"></div>
          <p className="text-gray-600">Đang chuyển hướng đến trang đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (!token || !API_URL || !orgInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 mb-4 mx-auto"></div>
          <p className="text-gray-600">Đang tải thông tin tổ chức...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                🏢
              </div>
              <div>
                <span className="font-bold text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {orgInfo?.org_name}
                </span>
                <p className="text-xs text-gray-500">Quản lý Trường Đại học</p>
              </div>
            </div>
            <Account />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Xin chào, {user?.name || user?.email?.split("@")[0]}!
              </h1>
              <p className="text-indigo-100 mb-4">🏢 {orgInfo?.org_name}</p>
              {primaryWallet?.address && (
                <p className="text-sm font-mono bg-white/20 rounded px-3 py-1 inline-block">
                  {primaryWallet.address.slice(0, 10)}...{primaryWallet.address.slice(-8)}
                </p>
              )}
            </div>
            <div className="text-7xl opacity-20">🎓</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 py-4 px-6 font-medium whitespace-nowrap transition-all ${
                activeTab === "overview"
                  ? "border-b-4 border-indigo-600 text-indigo-600"
                  : "text-gray-500 hover:text-indigo-600"
              }`}
            >
              📊 Tổng quan
            </button>
            <button
              onClick={() => setActiveTab("admins")}
              className={`flex-1 py-4 px-6 font-medium whitespace-nowrap transition-all ${
                activeTab === "admins"
                  ? "border-b-4 border-indigo-600 text-indigo-600"
                  : "text-gray-500 hover:text-indigo-600"
              }`}
            >
              👥 Quản lý Khoa
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`flex-1 py-4 px-6 font-medium whitespace-nowrap transition-all ${
                activeTab === "create"
                  ? "border-b-4 border-indigo-600 text-indigo-600"
                  : "text-gray-500 hover:text-indigo-600"
              }`}
            >
              ➕ Tạo chứng chỉ ({pendingRequests.length})
            </button>
            <button
              onClick={() => setActiveTab("mint")}
              className={`flex-1 py-4 px-6 font-medium whitespace-nowrap transition-all ${
                activeTab === "mint"
                  ? "border-b-4 border-indigo-600 text-indigo-600"
                  : "text-gray-500 hover:text-indigo-600"
              }`}
            >
              🎓 Mint NFT Soulbound ({mintableCerts.length})
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`flex-1 py-4 px-6 font-medium whitespace-nowrap transition-all ${
                activeTab === "audit"
                  ? "border-b-4 border-indigo-600 text-indigo-600"
                  : "text-gray-500 hover:text-indigo-600"
              }`}
            >
              🔗 Gửi Audit (Blockchain)
            </button>
          </div>
        </div>

        {/* TAB: Tổng quan */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">📊 Tổng quan hệ thống</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-4xl mb-2">👥</div>
                <div className="text-3xl font-bold text-indigo-600">{adminKhoas.length}</div>
                <div className="text-gray-600">Admin Khoa</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-4xl mb-2">⏳</div>
                <div className="text-3xl font-bold text-orange-600">{pendingRequests.length}</div>
                <div className="text-gray-600">Yêu cầu từ Khoa</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-4xl mb-2">🎓</div>
                <div className="text-3xl font-bold text-green-600">{mintableCerts.length}</div>
                <div className="text-gray-600">Chứng chỉ sẵn sàng</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-4xl mb-2">👨‍🎓</div>
                <div className="text-3xl font-bold text-blue-600">{eligibleStudents.length}</div>
                <div className="text-gray-600">Sinh viên đủ điều kiện</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Quản lý Khoa */}
        {activeTab === "admins" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-800">👥 Danh sách Admin Khoa</h2>
              <button
                onClick={() => setShowAdminForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center space-x-2"
              >
                <span className="text-xl">+</span>
                <span>Thêm Admin Khoa</span>
              </button>
            </div>

            {/* Form tạo Admin Khoa mới */}
            {showAdminForm && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-2xl font-bold mb-6 text-gray-800">📝 Thêm Admin Khoa mới</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      placeholder="admin@khoa.vn"
                      value={adminFormData.email}
                      onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên hiển thị *</label>
                    <input
                      type="text"
                      placeholder="VD: Trưởng Khoa CNTT"
                      value={adminFormData.display_name}
                      onChange={(e) => setAdminFormData({ ...adminFormData, display_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ ví Sui (tùy chọn)</label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={adminFormData.wallet_address}
                      onChange={(e) => setAdminFormData({ ...adminFormData, wallet_address: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleCreateAdmin}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                  >
                    ✅ Tạo Admin Khoa
                  </button>
                  <button
                    onClick={() => {
                      setShowAdminForm(false);
                      setAdminFormData({ email: "", display_name: "", wallet_address: "" });
                    }}
                    className="px-8 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all font-semibold"
                  >
                    ❌ Hủy
                  </button>
                </div>
              </div>
            )}

            {/* Bảng danh sách Admin Khoa */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tên</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Địa chỉ ví</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ngày tạo</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {adminKhoas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        <div className="text-6xl mb-4">📋</div>
                        <p>Chưa có Admin Khoa nào</p>
                      </td>
                    </tr>
                  ) : (
                    adminKhoas.map((admin) => (
                      <tr key={admin.id} className="border-t hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-800">{admin.id}</td>
                        <td className="px-6 py-4">
                          {editingAdmin?.id === admin.id ? (
                            <input
                              type="text"
                              value={editingAdmin.display_name}
                              onChange={(e) => setEditingAdmin({ ...editingAdmin, display_name: e.target.value })}
                              className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                            />
                          ) : (
                            <span className="font-medium text-gray-800">{admin.display_name}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{admin.email}</td>
                        <td className="px-6 py-4">
                          {editingAdmin?.id === admin.id ? (
                            <input
                              type="text"
                              value={editingAdmin.wallet_address || ""}
                              onChange={(e) => setEditingAdmin({ ...editingAdmin, wallet_address: e.target.value })}
                              className="border border-gray-300 rounded px-2 py-1 text-xs font-mono w-full"
                            />
                          ) : (
                            <span className="text-xs font-mono text-gray-600">
                              {admin.wallet_address 
                                ? `${admin.wallet_address.slice(0, 6)}...${admin.wallet_address.slice(-4)}`
                                : "—"
                              }
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingAdmin?.id === admin.id ? (
                            <select
                              value={editingAdmin.status}
                              onChange={(e) => setEditingAdmin({ ...editingAdmin, status: e.target.value })}
                              className="border border-gray-300 rounded px-2 py-1 text-sm"
                            >
                              <option value="active">Active</option>
                              <option value="suspended">Suspended</option>
                            </select>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              admin.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {admin.status === 'active' ? '✅ Hoạt động' : '🚫 Khóa'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(admin.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {editingAdmin?.id === admin.id ? (
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => handleUpdateAdmin(admin.id)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-all"
                              >
                                💾 Lưu
                              </button>
                              <button
                                onClick={() => setEditingAdmin(null)}
                                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 text-sm transition-all"
                              >
                                ❌ Hủy
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => setEditingAdmin(admin)}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm transition-all"
                              >
                                ✏️ Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteAdmin(admin.id)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm transition-all"
                              >
                                🗑️ Xóa
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: Tạo chứng chỉ (GỘP yêu cầu chờ duyệt vào đây) */}
        {activeTab === "create" && (
          <div className="space-y-6">
            {/* Form tạo chứng chỉ MỚI */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-indigo-800 mb-6">📝 Tạo Chứng chỉ Mới</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dropdown chọn sinh viên */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    👤 Chọn Sinh viên đã được Khoa phê duyệt <span className="text-red-500">*</span>
                  </label>
                  
                  {/* ✅ THÊM: Debug log */}
                  {eligibleStudents.length === 0 && (
                    <div className="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                      ⚠️ Không tìm thấy sinh viên nào. Kiểm tra:
                      <ul className="ml-4 mt-1 list-disc text-xs">
                        <li>Có yêu cầu nào có status = 'org_checked' không?</li>
                        <li>org_id của bạn: {orgInfo?.id}</li>
                        <li>Console logs để xem API response</li>
                      </ul>
                    </div>
                  )}

                  <select
                    value={certFormData.student_email}
                    onChange={(e) => {
                      const selected = eligibleStudents.find(s => s.student_email === e.target.value);
                      console.log('Selected student:', selected); // ← DEBUG
                      setCertFormData({
                        ...certFormData,
                        student_email: e.target.value,
                        admin_org_email: selected?.admin_org_email || ''
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">-- Chọn Sinh viên --</option>
                    {eligibleStudents.length === 0 ? (
                      <option disabled>⚠️ Không có sinh viên nào đủ điều kiện</option>
                    ) : (
                      eligibleStudents.map((student) => (
                        <option key={student.student_email} value={student.student_email}>
                          {student.student_email} (Khoa: {student.admin_org_name || student.admin_org_email})
                        </option>
                      ))
                    )}
                  </select>
                  
                  {certFormData.student_email && certFormData.admin_org_email && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        ✓ Đã được phê duyệt bởi: <strong>{certFormData.admin_org_email}</strong>
                      </p>
                    </div>
                  )}
                </div>

                {/* Loại chứng chỉ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📜 Loại Chứng chỉ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={certFormData.certificate_type}
                    onChange={(e) => setCertFormData({...certFormData, certificate_type: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">-- Chọn loại --</option>
                    <option value="Bằng tốt nghiệp">Bằng tốt nghiệp</option>
                    <option value="Chứng chỉ hoàn thành khóa học">Chứng chỉ hoàn thành khóa học</option>
                    <option value="Bằng khen">Bằng khen</option>
                    <option value="Giấy chứng nhận">Giấy chứng nhận</option>
                  </select>
                </div>

                {/* Mô tả */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📝 Mô tả <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={certFormData.description}
                    onChange={(e) => setCertFormData({...certFormData, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={4}
                    placeholder="VD: Sinh viên đã hoàn thành xuất sắc khóa học Blockchain và Ứng dụng..."
                    required
                  />
                </div>

                {/* Upload ảnh */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🖼️ Upload Ảnh Chứng chỉ (PDF/PNG/JPG) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setCertFormData({
                      ...certFormData, 
                      certificate_image: e.target.files?.[0] || null
                    })}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ⚠️ File sẽ được upload lên IPFS Pinata và lưu trữ vĩnh viễn
                  </p>
                </div>
              </div>

              {/* Nút tạo chứng chỉ */}
              <div className="mt-6 flex space-x-4">
                <button
                  onClick={handleCreateCertificate}
                  disabled={loading || !certFormData.student_email || !certFormData.certificate_type || !certFormData.description || !certFormData.certificate_image}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳ Đang tạo...' : '✅ Tạo Chứng chỉ & Upload IPFS'}
                </button>
                <button
                  onClick={() => {
                    setCertFormData({
                      student_email: "",
                      admin_org_email: "",
                      certificate_type: "",
                      description: "",
                      certificate_image: null
                    });
                  }}
                  className="px-8 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all font-semibold"
                >
                  🔄 Làm mới
                </button>
              </div>
            </div>

            {/* ✅ THAY ĐỔI: Danh sách request - KHÔNG PARSE nếu description là text thường */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Danh sách yêu cầu đang chờ xử lý</h3>
              
              {pendingRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Không có yêu cầu nào chờ xử lý</p>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((req: any) => {
                    // ✅ THAY ĐỔI: Parse JSON an toàn - KHÔNG crash nếu lỗi
                    let note: any = {};
                    let description: any = {};

                    try {
                      // Bước 1: Parse note
                      note = req.note ? JSON.parse(req.note) : {};
                      
                      // Bước 2: Kiểm tra description
                      if (note.description) {
                        // ✅ THÊM: Kiểm tra xem có phải JSON hợp lệ không
                        if (typeof note.description === 'string') {
                          const trimmed = note.description.trim();
                          // Chỉ parse nếu bắt đầu bằng { hoặc [
                          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                            try {
                              description = JSON.parse(note.description);
                            } catch {
                              // ✅ FALLBACK: Nếu không parse được, coi như text thường
                              description = { raw_text: note.description };
                            }
                          } else {
                            // ✅ FALLBACK: Là text thường, không phải JSON
                            description = { raw_text: note.description };
                          }
                        } else if (typeof note.description === 'object') {
                          description = note.description;
                        }
                      }
                    } catch (error) {
                      console.error('❌ Lỗi parse JSON request:', req.id, error);
                      note = { certificate_type: 'N/A' };
                      description = {};
                    }
                    
                    return (
                      <div key={req.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-bold text-gray-800">{note.certificate_type || 'Chứng chỉ'}</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Khoa đã duyệt
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Mã:</strong> {req.request_code}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Sinh viên:</strong> {req.student_email}
                            </p>
                            
                            {/* ✅ THAY ĐỔI: Hiển thị description linh hoạt */}
                            {description.student_name && (
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>Họ tên:</strong> {description.student_name}
                              </p>
                            )}
                            {description.student_id && (
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>MSSV:</strong> {description.student_id}
                              </p>
                            )}
                            {description.grade && (
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>Xếp loại:</strong> {description.grade}
                              </p>
                            )}
                            {description.raw_text && (
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>Mô tả:</strong> {description.raw_text}
                              </p>
                            )}
                            
                            <p className="text-sm text-gray-600">
                              <strong>Khoa đã duyệt:</strong> {req.admin_org_email}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            ⏳ Chờ Trường xử lý
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Mint NFT Soulbound */}
        {activeTab === "mint" && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-indigo-800 mb-6">🎯 Mint NFT Soulbound cho Sinh viên</h2>

            {mintableCerts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⏳</div>
                <p className="text-xl text-gray-500 font-medium">Chưa có chứng chỉ nào được Bộ phê duyệt</p>
                <p className="text-gray-400 mt-2">Các request đã được Bộ GD ký số sẽ xuất hiện ở đây</p>
              </div>
            ) : (
              <div className="space-y-4">
                {mintableCerts.map((req) => {
                  const note = req.note ? JSON.parse(req.note) : {};
                  let ipfsData = { image: null, metadata: null };
                  
                  try {
                    ipfsData = req.ipfs_cid_list ? JSON.parse(req.ipfs_cid_list) : {};
                  } catch (error) {
                    console.error('Error parsing IPFS:', error);
                  }

                  // ✅ THÊM: Kiểm tra status để enable/disable button
                  const isApprovedByMinistry = req.status === 'root_signed';

                  return (
                    <div key={req.id} className="border rounded-lg p-6 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="font-bold text-gray-800">#{req.request_code}</span>
                            {isApprovedByMinistry ? (
                              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                ✅ Bộ đã duyệt - Sẵn sàng mint
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                ⏳ Chờ Bộ phê duyệt
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 text-sm text-gray-600">
                            <p><strong>👨‍🎓 Sinh viên:</strong> {req.student_email}</p>
                            <p><strong>📜 Loại:</strong> {note.certificate_type || 'N/A'}</p>
                            
                            {ipfsData.image && (
                              <p className="flex items-center space-x-2">
                                <strong>🖼️ Chứng chỉ:</strong>
                                <a
                                  href={`https://ipfs.io/ipfs/${ipfsData.image}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  Xem ảnh →
                                </a>
                              </p>
                            )}

                            {ipfsData.metadata && (
                              <p className="flex items-center space-x-2">
                                <strong>📄 Metadata:</strong>
                                <a
                                  href={`https://ipfs.io/ipfs/${ipfsData.metadata}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-600 hover:underline"
                                >
                                  Xem JSON →
                                </a>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* ✅ THAY ĐỔI: Button chỉ enable khi Bộ đã duyệt */}
                        <button
                          onClick={() => handleMintNFT(req.id, ipfsData.metadata || '')}
                          disabled={!isApprovedByMinistry || loading}
                          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                            isApprovedByMinistry
                              ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:shadow-lg'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                          title={!isApprovedByMinistry ? 'Chờ Bộ GD phê duyệt trước' : 'Click để mint NFT'}
                        >
                          {isApprovedByMinistry ? '🎯 Cấp chứng chỉ cho sinh viên' : '🔒 Chưa được duyệt'}
                        </button>
                      </div>

                      {/* ✅ THÊM: Hiển thị thông báo nếu chưa được duyệt */}
                      {!isApprovedByMinistry && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            ⚠️ Yêu cầu này đang chờ Bộ Giáo Dục xét duyệt cuối cùng trên blockchain.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: Gửi Audit Blockchain */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            {/* Yêu cầu chờ gửi lên Bộ */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-indigo-800 mb-6">📤 Yêu cầu chờ gửi lên Bộ</h2>

              {auditRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Không có yêu cầu nào chờ audit</p>
              ) : (
                <div className="space-y-4">
                  {auditRequests.map((req) => {
                    // ✅ THAY ĐỔI: Parse IPFS CID đúng cách
                    const note = req.note ? JSON.parse(req.note) : {};
                    let ipfsData = { image: null, metadata: null };
                    
                    try {
                      ipfsData = req.ipfs_cid_list ? JSON.parse(req.ipfs_cid_list) : {};
                    } catch (error) {
                      console.error('Error parsing IPFS data:', error);
                    }

                    return (
                      <div key={req.id} className="border rounded-lg p-6 hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-3">
                              <span className="font-bold text-gray-800 text-lg">#{req.request_code}</span>
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                Chờ gửi lên Bộ
                              </span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                              <p>
                                <strong>👨‍🎓 Sinh viên:</strong> {req.student_email}
                              </p>
                              <p>
                                <strong>📜 Loại:</strong> {note.certificate_type || 'N/A'}
                              </p>
                              
                              {/* ✅ THAY ĐỔI: Hiển thị IPFS link đẹp */}
                              {ipfsData.image && (
                                <p className="flex items-center space-x-2">
                                  <strong>🖼️ Chứng chỉ:</strong>
                                  <a
                                    href={`https://ipfs.io/ipfs/${ipfsData.image}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                  >
                                    Xem ảnh chứng chỉ →
                                  </a>
                                </p>
                              )}
                              
                              {ipfsData.metadata && (
                                <p className="flex items-center space-x-2">
                                  <strong>📄 Metadata:</strong>
                                  <a
                                    href={`https://ipfs.io/ipfs/${ipfsData.metadata}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-600 hover:text-purple-800 hover:underline font-medium"
                                  >
                                    Xem metadata JSON →
                                  </a>
                                </p>
                              )}

                              <p>
                                <strong>🕒 Ngày tạo:</strong> {new Date(req.created_at).toLocaleString('vi-VN')}
                              </p>
                            </div>
                          </div>

                          {/* ✅ Button gửi audit */}
                          <button
                            onClick={() => handleSendAudit(req.id)}
                            disabled={loading || pendingTxs[req.id]}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {pendingTxs[req.id] ? '⏳ Đang xử lý...' : '📤 Gửi lên Bộ GD'}
                          </button>
                        </div>

                        {/* ✅ Hiển thị Transaction Hash nếu đã gửi */}
                        {pendingTxs[req.id] && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                              ✅ Đã gửi lên blockchain
                            </p>
                            <a
                              href={`https://suiscan.xyz/testnet/tx/${pendingTxs[req.id]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline font-mono break-all"
                            >
                              TX: {pendingTxs[req.id]}
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Danh sách đã gửi lên Bộ (từ blockchain) */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-indigo-800 mb-6">⛓️ Danh sách đã gửi lên Blockchain</h2>

              {blockchainRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Chưa có request nào trên blockchain</p>
              ) : (
                <div className="space-y-4">
                  {blockchainRequests.map((req, index) => (
                    <div key={index} className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <p><strong>Student:</strong> {req.student_email}</p>
                        <p><strong>Status:</strong> <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">{req.status}</span></p>
                        <p><strong>Admin Org:</strong> {req.admin_org_email}</p>
                        <p><strong>Org Email:</strong> {req.org_email}</p>
                        <p className="col-span-2"><strong>IPFS CID:</strong> <span className="font-mono text-xs">{req.ipfs_cid}</span></p>
                        <p className="col-span-2"><strong>Created:</strong> {new Date(req.created_at).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
    </div>

      {/* Footer */}
      <footer className="mt-20 text-center py-8 bg-white/50 rounded-2xl">
        <p className="text-xl font-bold text-indigo-700">EduChain — Hệ thống Chứng chỉ Blockchain</p>
        <p className="text-gray-600 mt-2">Powered by Sui Network & IPFS Pinata</p>
      </footer>
    </div>
  );
}