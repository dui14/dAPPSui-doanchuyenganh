const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_JWT = process.env.PINATA_JWT;

/**
 * Upload file lên Pinata IPFS
 * @param {Buffer} fileBuffer - Nội dung file dạng buffer
 * @param {string} fileName - Tên file
 * @returns {Promise<string>} - IPFS CID
 */
async function uploadToPinata(fileBuffer, fileName) {
  try {
    const formData = new FormData();
    formData.append('file', fileBuffer, fileName);

    // Metadata (tùy chọn)
    const metadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        type: 'certificate',
        uploadedBy: 'EduChain',
        timestamp: new Date().toISOString()
      }
    });
    formData.append('pinataMetadata', metadata);

    // Pinata options
    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', pinataOptions);

    // Gọi API Pinata
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${PINATA_JWT}` // Dùng JWT nếu có
          // Hoặc dùng API Key:
          // 'pinata_api_key': PINATA_API_KEY,
          // 'pinata_secret_api_key': PINATA_SECRET_KEY
        }
      }
    );

    console.log(`✅ Uploaded to IPFS: ${response.data.IpfsHash}`);
    return response.data.IpfsHash; // CID
  } catch (error) {
    console.error('❌ Pinata upload error:', error.response?.data || error.message);
    throw new Error('Failed to upload to IPFS');
  }
}

/**
 * Upload JSON metadata lên Pinata
 * @param {object} metadata - Object chứa thông tin chứng chỉ
 * @returns {Promise<string>} - IPFS CID
 */
async function uploadMetadataToPinata(metadata) {
  try {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadata,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PINATA_JWT}`
        }
      }
    );

    console.log(`✅ Metadata uploaded to IPFS: ${response.data.IpfsHash}`);
    return response.data.IpfsHash;
  } catch (error) {
    console.error('❌ Pinata metadata upload error:', error.response?.data || error.message);
    throw new Error('Failed to upload metadata to IPFS');
  }
}

/**
 * Lấy URL công khai từ IPFS Gateway
 * @param {string} cid - IPFS CID
 * @returns {string} - URL truy cập file
 */
function getIPFSUrl(cid) {
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}

module.exports = {
  uploadToPinata,
  uploadMetadataToPinata,
  getIPFSUrl
};