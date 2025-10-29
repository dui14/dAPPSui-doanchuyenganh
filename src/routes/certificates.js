const express = require('express');
const router = express.Router();
const poolPromise = require('../services/db');
const { checkRole } = require('../middleware');

router.get('/requests', checkRole(['admin_root', 'org', 'admin_org']), async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM dbo.certificate_requests WHERE status != \'rejected\'');
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/requests', checkRole(['user']), async (req, res) => {
    const { student_email, org_id } = req.body;
    const request_code = `REQ-${Date.now()}`;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('request_code', request_code)
            .input('student_email', student_email)
            .input('org_id', org_id)
            .query(`
                INSERT INTO dbo.certificate_requests (request_code, student_email, org_id, status)
                VALUES (@request_code, @student_email, @org_id, 'pending')
            `);
        await pool.request()
            .input('action', 'create_request')
            .input('actor_email', student_email)
            .input('target', 'certificate_request')
            .input('details', JSON.stringify({ request_code, org_id }))
            .query(`
                INSERT INTO dbo.logs (action, actor_email, target, details)
                VALUES (@action, @actor_email, @target, @details)
            `);
        res.json({ success: true, request_code });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/requests/:id', checkRole(['admin_root', 'org', 'admin_org']), async (req, res) => {
    const { id } = req.params;
    const { status, admin_org_email, org_email, root_email, ipfs_cid_list } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', id)
            .input('status', status)
            .input('admin_org_email', admin_org_email || null)
            .input('org_email', org_email || null)
            .input('root_email', root_email || null)
            .input('ipfs_cid_list', ipfs_cid_list ? JSON.stringify(ipfs_cid_list) : null)
            .query(`
                UPDATE dbo.certificate_requests
                SET status = @status,
                    admin_org_email = @admin_org_email,
                    org_email = @org_email,
                    root_email = @root_email,
                    ipfs_cid_list = @ipfs_cid_list,
                    updated_at = SYSUTCDATETIME()
                WHERE id = @id
            `);
        await pool.request()
            .input('action', 'update_request')
            .input('actor_email', admin_org_email || org_email || root_email)
            .input('target', 'certificate_request')
            .input('target_id', id)
            .input('details', JSON.stringify({ status, ipfs_cid_list }))
            .query(`
                INSERT INTO dbo.logs (action, actor_email, target, target_id, details)
                VALUES (@action, @actor_email, @target, @target_id, @details)
            `);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/verify', async (req, res) => {
    const { cert_id } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('cert_id', cert_id)
            .query('SELECT * FROM dbo.certificates WHERE cert_id = @cert_id');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Certificate not found' });
        }
        
        res.json(result.recordset[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;