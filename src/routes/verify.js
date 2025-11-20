// src/routes/verify.js
const express = require('express');
const router = express.Router();
const suiService = require('../services/sui');
const ipfsService = require('../services/ipfs');
const signatureService = require('../services/signature');

router.post('/', async (req, res) => {
    const { objectId } = req.body;

    if (!objectId) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu Object ID của chứng chỉ.'
        });
    }

    try {
        // 1. Lấy thông tin chứng chỉ từ Sui
        const certOnChain = await suiService.getCertificateObject(objectId);

        let result = {
            success: true,
            message: 'Xác thực thành công (Audited).',
            status: 'Audited',
            errors: [],
            onChainDetails: certOnChain,
            metadata: null,
            signatures: {
                issuer: 'Chưa kiểm tra',
                root: 'Chưa kiểm tra'
            }
        };

        // 1.1 Kiểm tra thu hồi
        if (certOnChain.revoked) {
            result.success = false;
            result.status = 'Revoked';
            result.message = 'Chứng chỉ đã bị thu hồi.';
            result.errors.push('Chứng chỉ đã bị thu hồi on-chain.');
            return res.json(result);
        }

        // 1.2 Kiểm tra trạng thái phê duyệt
        if (certOnChain.status_on_chain !== 3) {
            result.success = false;
            result.status = 'Not Verified';
            result.message = 'Chứng chỉ chưa hoàn tất phê duyệt.';
            result.errors.push('Trạng thái on-chain chưa được phê duyệt.');
        }

        // 2. Kiểm tra Metadata + chữ ký
        try {
            const metadata = await ipfsService.fetchMetadata(certOnChain.metadata_cid);
            result.metadata = metadata;

            const issuerPubKey = await signatureService.getPublicKey(certOnChain.issuer_org_address);
            const rootPubKey = await signatureService.getPublicKey(certOnChain.root_admin_address);

            // 2a. Chữ ký Issuer
            const isIssuerValid = await signatureService.verifySignature(
                metadata,
                certOnChain.issuer_signature,
                issuerPubKey
            );
            result.signatures.issuer = isIssuerValid ? 'Hợp lệ' : 'Không hợp lệ';

            // 2b. Chữ ký Root
            let isRootValid = true;
            if (certOnChain.root_signature) {
                isRootValid = await signatureService.verifySignature(
                    metadata,
                    certOnChain.root_signature,
                    rootPubKey
                );
            }
            result.signatures.root = isRootValid ? 'Hợp lệ' : 'Không hợp lệ';

            // 2c. Tổng hợp kết quả chữ ký
            if (!isIssuerValid || !isRootValid) {
                result.success = false;
                result.status = 'Not Verified';
                result.message = 'Chữ ký không hợp lệ.';
                if (!isIssuerValid) result.errors.push('Chữ ký của Tổ chức không hợp lệ.');
                if (!isRootValid) result.errors.push('Chữ ký của Bộ không hợp lệ.');
            }

        } catch (err) {
            result.success = false;
            result.status = 'Not Verified';
            result.message = 'Lỗi IPFS hoặc xác thực chữ ký.';
            result.errors.push(`IPFS/Signature error: ${err.message}`);
        }

        res.json(result);

    } catch (error) {
        console.error('Lỗi xác thực chứng chỉ:', error.message);
        res.status(500).json({
            success: false,
            status: 'Error',
            message: error.message || 'Lỗi hệ thống.'
        });
    }
});

module.exports = router;