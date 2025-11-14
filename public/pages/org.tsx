"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import Account from "../components/account";

export default function OrgPage() {
  const router = useRouter();
  const { user, primaryWallet } = useDynamicContext();
  const [activeTab, setActiveTab] = useState("requests");
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
      setRequests(data.filter((req: any) => req.status === "org_checked"));
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  const handleApprove = async (id: number) => {
    if (!confirm("Phê duyệt và gửi yêu cầu này lên Bộ Giáo dục?")) return;
    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/certificates/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "org_approved", org_email: user?.email }),
      });
      if (!res.ok) throw new Error("Lỗi phê duyệt");
      alert("Đã phê duyệt thành công!");
      fetchRequests();
    } catch (e: any) { alert("Lỗi: " + e.message); }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Từ chối yêu cầu này?")) return;
    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/certificates/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "rejected", org_email: user?.email }),
      });
      if (!res.ok) throw new Error("Lỗi từ chối");
      alert("Đã từ chối");
      fetchRequests();
    } catch (e: any) { alert("Lỗi: " + e.message); }
  };

  if (!user) {
    router.push("/login");
    return <div className="min-h-screen flex items-center justify-center text-2xl">Đang chuyển về đăng nhập...</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-8 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-xl font-medium text-indigo-700">Đang tải yêu cầu từ các Khoa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                University
              </div>
              <div>
                <span className="font-bold text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  University Portal
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
              <p className="text-indigo-100 mb-4">Chào mừng đến với cổng quản trị Trường</p>
              {primaryWallet?.address && (
                <p className="text-sm font-mono bg-white/20 rounded px-3 py-1 inline-block">
                  {primaryWallet.address.slice(0, 10)}...{primaryWallet.address.slice(-8)}
                </p>
              )}
            </div>
            <div className="text-7xl opacity-20">University</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex-1 py-4 font-medium text-lg transition-all ${
                activeTab === "requests"
                  ? "border-b-4 border-indigo-600 text-indigo-600"
                  : "text-gray-500 hover:text-indigo-600"
              }`}
            >
              Yêu cầu từ Khoa ({requests.length})
            </button>
          </div>
        </div>

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Yêu cầu chờ Trường phê duyệt
            </h2>

            {requests.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-8xl mb-6">No Requests</div>
                <p className="text-2xl">Chưa có yêu cầu nào từ các Khoa</p>
                <p className="text-lg mt-3">Khi Khoa gửi lên, bạn sẽ thấy ngay tại đây!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {requests.map((req) => {
                  const note = req.note ? JSON.parse(req.note) : {};
                  return (
                    <div
                      key={req.id}
                      className="border-2 border-indigo-200 rounded-2xl p-8 bg-gradient-to-r from-indigo-50 to-purple-50 hover:shadow-xl transition-all"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-indigo-900">
                            {note.certificate_type || "Chứng chỉ"}
                          </h3>
                          <p className="text-lg font-mono text-indigo-700 mt-1">
                            Mã yêu cầu: <strong>{req.request_code}</strong>
                          </p>
                          <div className="mt-4 space-y-2 text-gray-700">
                            <p><strong>Sinh viên:</strong> {req.student_email}</p>
                            <p><strong>Khoa đã duyệt:</strong> {req.admin_org_email}</p>
                            <p><strong>Ngày gửi:</strong> {new Date(req.created_at).toLocaleDateString("vi-VN")}</p>
                          </div>
                        </div>
                        <span className="bg-orange-500 text-white px-6 py-3 rounded-full text-lg font-bold">
                          Chờ Trường duyệt
                        </span>
                      </div>

                      <div className="bg-white/80 rounded-xl p-6 mb-6 border border-indigo-100">
                        <p className="font-semibold text-indigo-800 mb-2">Lý do cấp chứng chỉ:</p>
                        <p className="text-gray-700 leading-relaxed">{note.description || "Không có mô tả"}</p>
                      </div>

                      <div className="flex gap-6">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-5 rounded-xl text-xl font-bold hover:shadow-2xl transform hover:-translate-y-1 transition-all"
                        >
                          Approved → Gửi lên Bộ
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="px-12 bg-gradient-to-r from-red-500 to-pink-600 text-white py-5 rounded-xl text-xl font-bold hover:shadow-2xl transform hover:-translate-y-1 transition-all"
                        >
                          Rejected
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-20 text-center py-8 bg-white/50 rounded-2xl">
        <p className="text-xl font-bold text-indigo-700">EduChain — Hệ thống Chứng chỉ Blockchain</p>
        <p className="text-gray-600 mt-2">Khoa → Trường → Bộ Giáo dục → Minh bạch vĩnh viễn</p>
      </footer>
    </div>
  );
}