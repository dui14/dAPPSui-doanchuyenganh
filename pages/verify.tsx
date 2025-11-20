
import React, { useState } from 'react';
import Head from 'next/head';
import VerifyInput from '../public/components/verify_input';
import { CheckCircleIcon, XCircleIcon, ExclamationCircleIcon, ClipboardCopyIcon } from '@heroicons/react/solid';

interface VerificationResult {
    success: boolean;
    status: 'Audited' | 'Not Verified' | 'Revoked' | 'Error';
    message: string;
    errors: string[];
    onChainDetails: {
        objectId: string;
        cert_id: string;
        issuer_org_address: string;
        root_admin_address: string;
        metadata_cid: string;
    };
    metadata: {
        student_name: string;
        type: string;
        issuer_org_name: string;
        issue_date: string;
    } | null;
    signatures: {
        issuer: 'Hợp lệ' | 'Không hợp lệ' | 'Chưa kiểm tra';
        root: 'Hợp lệ' | 'Không hợp lệ' | 'Chưa kiểm tra';
    };
}

const STATUS_COLOR: Record<VerificationResult['status'], string> = {
    'Audited': 'bg-blue-600',
    'Not Verified': 'bg-red-600',
    'Revoked': 'bg-yellow-600',
    'Error': 'bg-gray-600',
};

export default function VerifyPage() {
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [loading, setLoading] = useState(false);

    const handleVerify = async (searchTerm: string) => {
        setLoading(true);
        setResult(null);

        try {
            const mockDataVerified: VerificationResult = {
                success: true,
                status: 'Audited',
                message: 'Chứng chỉ hợp lệ và đã được xác thực.',
                errors: [],
                onChainDetails: {
                    objectId: '0x1A2B3C...D4E5F6',
                    cert_id: 'CERT-2024-001',
                    issuer_org_address: '0xOrgA...1234',
                    root_admin_address: '0xRoot...5678',
                    metadata_cid: 'QmHASH...CIDexample',
                },
                metadata: {
                    student_name: 'Nguyễn Văn An',
                    type: 'Cử nhân Khoa học Máy tính',
                    issuer_org_name: 'Đại học SUI Technology',
                    issue_date: '15/06/2024',
                },
                signatures: { issuer: 'Hợp lệ', root: 'Hợp lệ' },
            };

            if (searchTerm.includes('wrong')) {
                setResult({
                    ...mockDataVerified,
                    success: false,
                    status: 'Not Verified',
                    message: 'Xác thực thất bại.',
                    errors: [
                        'Chữ ký của Tổ chức không hợp lệ.',
                        'Trạng thái on-chain không phải là Đã Phê Duyệt.'
                    ],
                    signatures: { issuer: 'Không hợp lệ', root: 'Hợp lệ' }
                });
            } else {
                setResult(mockDataVerified);
            }
        } catch {
            setResult({
                success: false,
                status: 'Error',
                message: 'Lỗi kết nối.',
                errors: [],
                onChainDetails: {} as any,
                metadata: null,
                signatures: { issuer: 'Chưa kiểm tra', root: 'Chưa kiểm tra' }
            });
        } finally {
            setLoading(false);
        }
    };

    const renderResultCard = () => {
        if (!result || result.status === 'Error') return null;

        const statusColorClass = STATUS_COLOR[result.status];
        const isVerified = result.status === 'Audited';
        const meta = result.metadata;
        const onChain = result.onChainDetails;
        const statusText = isVerified ? 'ĐÃ XÁC THỰC' : (result.status === 'Revoked' ? 'ĐÃ THU HỒI' : 'KHÔNG HỢP LỆ');

        return (
            <div className="mt-8 max-w-2xl mx-auto">
                <div className={`p-4 rounded-t-xl flex justify-between items-center text-white ${statusColorClass}`}>
                    <h3 className="text-xl font-extrabold">THÔNG TIN CHỨNG CHỈ</h3>
                    <span className="px-3 py-1 rounded-full text-sm font-extrabold border-2 border-white bg-opacity-20">
                        {statusText}
                    </span>
                </div>

                <div className="bg-white p-6 rounded-b-xl shadow-2xl border-x border-b border-gray-100">
                    <div className="grid grid-cols-2 gap-y-5 gap-x-8 text-gray-700 mb-6 border-b pb-4">
                        <FieldRow label="TÊN SINH VIÊN" value={meta?.student_name || 'N/A'} isMainInfo />
                        <FieldRow label="LOẠI CHỨNG CHỈ" value={meta?.type || 'N/A'} isMainInfo />
                        <FieldRow label="TỔ CHỨC PHÁT HÀNH" value={meta?.issuer_org_name || 'N/A'} />
                        <FieldRow label="NGÀY PHÁT HÀNH" value={meta?.issue_date || 'N/A'} />
                    </div>

                    <h4 className="text-lg font-bold mb-3 text-gray-800 border-b-2 pb-1">Dữ liệu On-Chain</h4>
                    <div className="space-y-3 mb-6">
                        <InfoRow label="CERT ID" value={onChain.cert_id || 'N/A'} />
                        <InfoRow label="OBJECT ID" value={onChain.objectId} copyable />
                        <InfoRow
                            label="IPFS CID"
                            value={onChain.metadata_cid}
                            copyable
                            link={`https://ipfs.io/ipfs/${onChain.metadata_cid}`}
                            linkText="Xem"
                        />
                    </div>

                    <h4 className="text-lg font-bold mb-3 text-gray-800 border-b-2 pb-1">Xác minh Chữ ký số</h4>
                    <div className="space-y-3">
                        <SignatureRow label="CHỮ KÝ TRƯỜNG" address={onChain.issuer_org_address} status={result.signatures.issuer} />
                        <SignatureRow label="CHỮ KÝ BỘ GIÁO DỤC" address={onChain.root_admin_address} status={result.signatures.root} />
                    </div>

                    {result.errors.length > 0 && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-300 text-sm text-red-800 rounded-lg flex items-start space-x-2">
                            <ExclamationCircleIcon className="w-5 h-5 mt-0.5" />
                            <div>
                                <p className="font-bold mb-1">Xác thực thất bại:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>Xác minh chứng chỉ - CertChain</title>
            </Head>

            <main className="max-w-4xl mx-auto py-12 px-4">
                <header className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-900">Xác minh chứng chỉ</h1>
                    <p className="mt-3 text-lg text-gray-600">
                        Kiểm tra tính hợp lệ và chữ ký số của chứng chỉ trên Sui Blockchain.
                    </p>
                </header>

                <VerifyInput
                    onSubmit={handleVerify}
                    loading={loading}
                />

                {result && renderResultCard()}

                {result?.status === 'Error' && (
                    <div className="mt-8 p-6 max-w-2xl mx-auto bg-gray-100 border border-gray-400 text-gray-700 rounded-lg shadow-lg">
                        <p className="font-bold">Lỗi hệ thống hoặc không tìm thấy Object ID:</p>
                        <p>{result.message}</p>
                    </div>
                )}
            </main>
        </div>
    );
}

const FieldRow = ({ label, value, isMainInfo = false }: { label: string, value: string, isMainInfo?: boolean }) => (
    <div>
        <p className="font-medium text-gray-500 text-xs uppercase">{label}</p>
        <p className={`${isMainInfo ? 'font-extrabold text-xl text-gray-900' : 'font-semibold text-base'}`}>{value}</p>
    </div>
);

const InfoRow = ({ label, value, copyable = false, link = '', linkText = '' }: { label: string, value: string, copyable?: boolean, link?: string, linkText?: string }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        alert(`Đã copy ID: ${value.substring(0, 8)}...`);
    };

    return (
        <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
            <span className="text-sm font-medium text-gray-500 uppercase">{label}</span>
            <div className="flex items-center space-x-3 text-gray-800">
                <span className="font-mono text-sm break-all">{value}</span>
                {copyable && (
                    <button type="button" className="text-blue-500 hover:text-blue-700 text-sm flex items-center" onClick={handleCopy}>
                        <ClipboardCopyIcon className="w-4 h-4 mr-1" />
                        Copy
                    </button>
                )}
                {link && (
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-700 text-sm font-semibold">
                        {linkText}
                    </a>
                )}
            </div>
        </div>
    );
};

const SignatureRow = ({ label, address, status }: { label: string, address: string, status: 'Hợp lệ' | 'Không hợp lệ' | 'Chưa kiểm tra' }) => {
    let colorClass = 'bg-gray-100 border-gray-300';
    let Icon = ExclamationCircleIcon;
    let statusText = 'CHƯA KIỂM TRA';

    if (status === 'Hợp lệ') {
        colorClass = 'bg-green-50 border-green-300';
        Icon = CheckCircleIcon;
        statusText = 'HỢP LỆ';
    } else if (status === 'Không hợp lệ') {
        colorClass = 'bg-red-50 border-red-300';
        Icon = XCircleIcon;
        statusText = 'KHÔNG HỢP LỆ';
    }

    return (
        <div className={`p-3 rounded-lg flex justify-between items-center border ${colorClass}`}>
            <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5`} />
                <span className="font-medium text-gray-700">{label}</span>
            </div>
            <div className="text-sm flex items-center">
                <span className="font-mono text-gray-500">{address.slice(0, 6)}...{address.slice(-4)}</span>
                <span className="ml-4 text-xs font-bold px-2 py-0.5 rounded-full">
                    {statusText}
                </span>
            </div>
        </div>
    );
};
