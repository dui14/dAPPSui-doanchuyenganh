// pages/user.tsx
import React, { useState, useEffect } from "react";
import styles from "../styles/User.module.css";

type RequestItem = {
    id: string;
    title: string;
    status: "pending" | "approved" | "rejected" | "claimed";
    createdAt: string;
    cid?: string; // ipfs cid
    certId?: string;
};

const mockRequests: RequestItem[] = [
    {
        id: "req-001",
        title: "Yêu cầu: Chứng chỉ Toán 101",
        status: "pending",
        createdAt: "2025-09-30",
    },
    {
        id: "req-002",
        title: "Yêu cầu: Chứng chỉ Lập trình Web",
        status: "approved",
        createdAt: "2025-09-20",
        cid: "bafybeiexamplecid123",
    },
];

export default function UserPage() {
    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [detail, setDetail] = useState("");
    const [selected, setSelected] = useState<RequestItem | null>(null);

    useEffect(() => {
        // mock fetch
        setRequests(mockRequests);
    }, []);

    const createRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return alert("Nhập tiêu đề yêu cầu");
        setLoading(true);
        // mock: simulate upload to IPFS + create on backend
        await new Promise((r) => setTimeout(r, 800));
        const newReq: RequestItem = {
            id: `req-${Date.now()}`,
            title,
            status: "pending",
            createdAt: new Date().toLocaleDateString(),
        };
        setRequests((p) => [newReq, ...p]);
        setTitle("");
        setDetail("");
        setLoading(false);
    };

    const claimCertificate = async (req: RequestItem) => {
        if (req.status !== "approved" || !req.cid) {
            return alert("Chỉ thể claim khi request đã approved và có CID.");
        }
        setLoading(true);
        // mock claim: call backend to mint/transfer soulbound NFT
        await new Promise((r) => setTimeout(r, 1200));
        setRequests((p) =>
            p.map((x) => (x.id === req.id ? { ...x, status: "claimed", certId: "CERT-" + Date.now() } : x))
        );
        setLoading(false);
        alert("Đã claim chứng chỉ về ví (mock).");
    };

    const viewDetail = (r: RequestItem) => {
        setSelected(r);
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1>Trang người dùng — Quản lý chứng chỉ</h1>
                <p className={styles.subtitle}>Gửi yêu cầu, theo dõi trạng thái và nhận chứng chỉ về ví</p>
            </header>

            <main className={styles.container}>
                <section className={styles.left}>
                    <div className={styles.card}>
                        <h2>Tạo yêu cầu mới</h2>
                        <form onSubmit={createRequest} className={styles.form}>
                            <label>
                                Tiêu đề
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="VD: Chứng chỉ Lập trình React"
                                />
                            </label>
                            <label>
                                Mô tả (tùy chọn)
                                <textarea value={detail} onChange={(e) => setDetail(e.target.value)} />
                            </label>
                            <div className={styles.formActions}>
                                <button type="submit" disabled={loading}>
                                    {loading ? "Đang gửi..." : "Gửi yêu cầu"}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className={styles.card}>
                        <h2>Danh sách đã yêu cầu</h2>
                        <ul className={styles.list}>
                            {requests.length === 0 && <li className={styles.empty}>Chưa có yêu cầu nào</li>}
                            {requests.map((r) => (
                                <li key={r.id} className={styles.item}>
                                    <div>
                                        <strong>{r.title}</strong>
                                        <div className={styles.meta}>
                                            <span>ID: {r.id}</span>
                                            <span>Ngày: {r.createdAt}</span>
                                        </div>
                                    </div>
                                    <div className={styles.actions}>
                                        <button onClick={() => viewDetail(r)}>Chi tiết</button>
                                        {r.status === "approved" && r.cid && (
                                            <button onClick={() => claimCertificate(r)}>Nhận chứng chỉ</button>
                                        )}
                                        <span className={`${styles.badge} ${styles[r.status]}`}>{r.status}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <aside className={styles.right}>
                    <div className={styles.card}>
                        <h3>Chi tiết yêu cầu</h3>
                        {!selected && <p>Chọn một yêu cầu để xem chi tiết</p>}
                        {selected && (
                            <div>
                                <p><strong>Tiêu đề:</strong> {selected.title}</p>
                                <p><strong>Trạng thái:</strong> {selected.status}</p>
                                <p><strong>CID (IPFS):</strong> {selected.cid ?? "Chưa có"}</p>
                                <p><strong>CertID:</strong> {selected.certId ?? "Chưa có"}</p>
                                <div style={{ marginTop: 12 }}>
                                    {selected.status === "approved" && selected.cid && (
                                        <button onClick={() => claimCertificate(selected)}>Claim về ví</button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.card}>
                        <h3>Hướng dẫn nhanh</h3>
                        <ol>
                            <li>Gửi yêu cầu với tiêu đề và mô tả</li>
                            <li>Khoa/Trường sẽ upload chứng chỉ lên IPFS và phê duyệt</li>
                            <li>Khi approved, bấm "Nhận chứng chỉ" để claim NFT về ví</li>
                        </ol>
                    </div>
                </aside>
            </main>

            <footer className={styles.footer}>
                <small>© Nhóm DAPP — Hệ thống chứng chỉ Sui Blockchain</small>
            </footer>
        </div>
    );
}
