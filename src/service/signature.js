const { subtle } = require('crypto').webcrypto;

/** Lấy Public Key mô phỏng dựa trên walletAddress */
async function getPublicKey(walletAddress) {
    if (walletAddress.startsWith('0xOrg')) return 'Org_Public_Key_Example';
    if (walletAddress.startsWith('0xRoot')) return 'Root_Public_Key_Example';
    throw new Error(`Không tìm thấy Public Key cho ví: ${walletAddress}`);
}

/**
 * Xác thực chữ ký số (mô phỏng)
 * @param {object} dataContent - Metadata gốc
 * @param {string} signature - Chữ ký on-chain
 * @param {string} publicKey - Public key của người ký
 */
async function verifySignature(dataContent, signature, publicKey) {
    const dataToVerify = JSON.stringify(dataContent);
    console.log(`Verifying signature...`);

    // Mô phỏng điều kiện chữ ký hợp lệ
    const isVerified =
        signature.length > 10 &&
        dataToVerify.length > 100;

    return isVerified;
}

module.exports = {
    getPublicKey,
    verifySignature,
};