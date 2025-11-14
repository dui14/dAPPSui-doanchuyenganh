"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import Account from "../components/account";

export default function RootPage() {
  const router = useRouter();
  const { user, primaryWallet } = useDynamicContext();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!user) return;
    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/certificates/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Lỗi tải dữ liệu");
      const data = await res.json();
      // Bộ chỉ thấy yêu cầu đã được Trường duyệt (org_approved)
      setRequests(data.filter((req: any) => req.status === "org_approved"));
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  const handleMintCertificate = async (id: number) => {
    if (!confirm("Ký số và cấp chứng chỉ NFT chính thức cho yêu cầu này?\nHành động này không thể hoàn tác!")) return;

    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/certificates/requests/${id}/mint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Lỗi mint chứng chỉ");
      }

      const result = await res.json();
      alert(`Cấp chứng chỉ thành công!\nCertID: ${result.cert_id}\nTx Hash: ${result.tx_hash?.slice(0, 20)}...`);
      fetchRequests();
    } catch (e: any) {
      alert("Lỗi khi cấp chứng chỉ: " + e.message);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Từ chối cấp chứng chỉ cho yêu cầu này?")) return;
    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/certificates/requests/${id}`, {
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

  if (!user) {
    router.push("/login");
    return <div className="min-h-screen flex items-center justify-center text-2xl">Đang chuyển về đăng nhập...</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-8 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-2xl font-bold text-red-700">Bộ Giáo dục đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50">
      {/* Header - Màu đỏ quyền lực */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-orange-700 rounded-2xl flex items-center justify-center text-4xl shadow-2xl">
                Bộ
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Cổng Quản trị Bộ Giáo dục & Đào tạo
                </h1>
                <p className="text-sm text-gray-600">Ký số và cấp chứng chỉ Blockchain chính thức</p>
              </div>
            </div>
            <Account />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Card - Màu đỏ quyền lực */}
        <div className="bg-gradient-to-r from-red-600 to-orange-700 rounded-3xl p-10 mb-10 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold mb-3">
                Chào mừng, {user?.name || "Quản trị viên Bộ"}!
              </h1>
              <p className="text-xl text-red-100">Bạn có quyền ký số và cấp chứng chỉ chính thức</p>
              {primaryWallet?.address && (
                <p className="mt-4 text-sm font-mono bg-white/20 rounded-lg px-4 py-2 inline-block">
                  Ví Bộ: {primaryWallet.address.slice(0, 12)}...{primaryWallet.address.slice(-10)}
                </p>
              )}
            </div>
            <div className="text-8xl opacity-20">Seal</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 border border-red-100">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
            <span className="text-4xl">Seal</span>
            Yêu cầu chờ Bộ ký số & cấp NFT ({requests.length})
          </h2>

          {requests.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-9xl mb-8 text-gray-200">No Pending</div>
              <p className="text-3xl font-bold text-red-600 mb-4">Chưa có yêu cầu nào cần ký</p>
              <p className="text-xl text-gray-600">Khi Trường gửi lên, yêu cầu sẽ xuất hiện tại đây</p>
            </div>
          ) : (
            <div className="space-y-8">
              {requests.map((req) => {
                const note = req.note ? JSON.parse(req.note) : {};
                return (
                  <div
                    key={req.id}
                    className="border-4 border-red-300 rounded-3xl p-8 bg-gradient-to-r from-red-50 to-orange-50 shadow-xl hover:shadow-2xl transition-all"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-3xl font-extrabold text-red-800">
                          {note.certificate_type || "Chứng chỉ"}
                        </h3>
                        <p className="text-xl font-mono text-red-700 mt-2">
                          Mã yêu cầu: <strong>{req.request_code}</strong>
                        </p>
                      </div>
                      <span className="bg-red-600 text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg">
                        Chờ Bộ ký số
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-lg">
                      <div className="bg-white/80 rounded-xl p-5 border border-red-200">
                        <p className="font-semibold text-red-700">Sinh viên</p>
                        <p className="text-gray-800 font-medium">{req.student_email}</p>
                      </div>
                      <div className="bg-white/80 rounded-xl p-5 border border-red-200">
                        <p className="font-semibold text-red-700">Khoa duyệt</p>
                        <p className="text-gray-800">{req.admin_org_email}</p>
                      </div>
                      <div className="bg-white/80 rounded-xl p-5 border border-red-200">
                        <p className="font-semibold text-red-700">Trường duyệt</p>
                        <p className="text-gray-800">{req.org_email}</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 mb-8 border-2 border-dashed border-red-300">
                      <p className="font-bold text-red-800 text-xl mb-3">Nội dung chứng chỉ:</p>
                      <p className="text-gray-700 leading-relaxed text-lg">{note.description || "Không có mô tả"}</p>
                    </div>

                    <div className="flex gap-8">
                      <button
                        onClick={() => handleMintCertificate(req.id)}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 text-white py-6 rounded-2xl text-2xl font-extrabold hover:shadow-2xl transform hover:-translate-y-2 transition-all shadow-xl"
                      >
                        Seal Ký số & Cấp NFT
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="px-16 bg-gradient-to-r from-gray-600 to-black text-white py-6 rounded-2xl text-2xl font-bold hover:shadow-2xl transform hover:-translate-y-2 transition-all"
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-20 text-center py-10 bg-white/70 rounded-3xl shadow-lg">
          <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Bộ Giáo dục & Đào tạo Việt Nam
          </p>
          <p className="text-xl text-gray-700 mt-3">
            Hệ thống cấp chứng chỉ Blockchain quốc gia — Minh bạch • Vĩnh viễn • Không thể giả mạo
          </p>
        </footer>
      </div>
    </div>
  );
}