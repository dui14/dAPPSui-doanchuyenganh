const axios = require('axios');

const SUI_RPC_URL = process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io/';
const CERTIFICATE_MOVE_TYPE = 'package::certificate::Certificate';

async function getCertificateObject(objectId) {
    try {
        const response = await axios.post(SUI_RPC_URL, {
            jsonrpc: "2.0",
            id: 1,
            method: "sui_getObject",
            params: [objectId, { options: { showContent: true } }]
        });

        const data = response.data.result;

        if (
            !data ||
            !data.content ||
            data.content.dataType !== 'moveObject' ||
            !data.content.type.includes(CERTIFICATE_MOVE_TYPE)
        ) {
            throw new Error("Object không hợp lệ hoặc không phải Certificate.");
        }

        const fields = data.content.fields;

        return {
            objectId,
            cert_id: fields.cert_id.toString(),
            issuer_org_address: fields.issuer,
            root_admin_address: fields.root_admin,
            metadata_cid: Buffer.from(fields.metadata_cid).toString('utf8'),
            issuer_signature: fields.issuer_signature,
            root_signature: fields.root_signature,
            revoked: fields.revoked,
            status_on_chain: fields.status,
        };

    } catch (error) {
        console.error("Lỗi Sui RPC:", error.message);

        if (error.response?.data?.error?.code === -32000) {
            throw new Error("Không tìm thấy Object ID trên Sui Blockchain.");
        }

        throw new Error(`Lỗi giao tiếp với Sui: ${error.message}`);
    }
}

module.exports = { getCertificateObject };