
const axios = require('axios');

const IPFS_GATEWAY = process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/';

async function fetchMetadata(cid) {
    try {
        const response = await axios.get(`${IPFS_GATEWAY}${cid}`);
        return response.data;  // Metadata JSON
    } catch (error) {
        console.error("Lỗi tải metadata IPFS:", error.message);
        throw new Error("Không thể tải metadata từ IPFS (CID sai hoặc lỗi gateway).");
    }
}

module.exports = { fetchMetadata };