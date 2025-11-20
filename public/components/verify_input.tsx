
import React, { useState } from 'react';

interface VerifyInputProps {
    onSubmit: (searchTerm: string) => void;
    loading: boolean;
}

export default function VerifyInput({ onSubmit, loading }: VerifyInputProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) onSubmit(searchTerm.trim());
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex max-w-2xl mx-auto shadow-md rounded-xl bg-white p-1 border"
        >
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nhập Object ID, CertID hoặc CID..."
                required
                className="flex-grow p-3 text-lg border-none focus:ring-0 rounded-l-xl"
            />
            <button
                type="submit"
                disabled={loading || !searchTerm.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
            >
                {loading ? 'Đang tra cứu...' : 'Tra cứu'}
            </button>
        </form>
    );
}