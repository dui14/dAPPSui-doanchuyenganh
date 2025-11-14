
-- USERS
CREATE TABLE dbo.users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,       -- định danh chính
    display_name NVARCHAR(150) NULL,
    wallet_address NVARCHAR(128) NULL,         -- ví SUI (có thể đổi)
    role NVARCHAR(20) NOT NULL DEFAULT 'user', -- phân quyền trực tiếp
    org_id INT NULL,                           -- FK nếu thuộc 1 Org
    status NVARCHAR(20) DEFAULT 'active',
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT chk_user_role CHECK (role IN ('admin_root','org','admin_org','user')),
    CONSTRAINT chk_user_status CHECK (status IN ('active','suspended','deleted'))
);
GO

-- ORGANIZATIONS
CREATE TABLE dbo.organizations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    org_name NVARCHAR(255) NOT NULL,
    org_email NVARCHAR(255) NOT NULL UNIQUE,     -- email đại diện
    owner_id INT NOT NULL,                       -- user.id của chủ tổ chức
    org_wallet NVARCHAR(128) NULL,               -- ví của tổ chức
    status NVARCHAR(20) DEFAULT 'pending',
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_org_owner FOREIGN KEY (owner_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
    CONSTRAINT chk_org_status CHECK (status IN ('pending','approved','revoked'))
);
GO

--  CERTIFICATES
CREATE TABLE dbo.certificates (
    id INT IDENTITY(1,1) PRIMARY KEY,
    cert_id NVARCHAR(100) NOT NULL UNIQUE,       -- CertID on-chain
    student_email NVARCHAR(255) NOT NULL,        -- người nhận
    issued_by NVARCHAR(255) NOT NULL,            -- email của admin_org
    org_id INT NOT NULL,                         -- tổ chức phát hành
    ipfs_cid NVARCHAR(255) NULL,                 -- metadata file (IPFS)
    status NVARCHAR(20) DEFAULT 'minted',        -- trạng thái NFT
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_cert_org FOREIGN KEY (org_id) REFERENCES dbo.organizations(id) ON DELETE CASCADE,
    CONSTRAINT chk_cert_status CHECK (status IN ('minted','revoked'))
);
GO

CREATE TABLE dbo.certificate_requests (
    id INT IDENTITY(1,1) PRIMARY KEY,
    request_code NVARCHAR(100) NOT NULL UNIQUE,     -- mã định danh request
    student_email NVARCHAR(255) NOT NULL,           -- người yêu cầu
    admin_org_email NVARCHAR(255) NULL,             -- khoa duyệt bước 1
    org_email NVARCHAR(255) NULL,                   -- trường duyệt bước 2
    root_email NVARCHAR(255) NULL,                  -- bộ duyệt bước cuối
    org_id INT NOT NULL,                            -- tổ chức liên quan
    ipfs_cid_list NVARCHAR(MAX) NULL,               -- danh sách nhiều CID (JSON string)
    status NVARCHAR(30) DEFAULT 'pending',          -- pending → org_checked → org_approved → root_signed → minted
    note NVARCHAR(MAX) NULL,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_req_org FOREIGN KEY (org_id) REFERENCES dbo.organizations(id) ON DELETE CASCADE,
    CONSTRAINT chk_req_status CHECK (status IN ('pending','org_checked','org_approved','root_signed','minted','rejected'))
);
GO
-- LOGS (AUDIT TRAIL)
CREATE TABLE dbo.logs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    action NVARCHAR(100) NOT NULL,           -- ví dụ: 'approve_org', 'mint_cert'
    actor_email NVARCHAR(255) NOT NULL,      -- ai thực hiện
    target NVARCHAR(100) NULL,               -- 'org', 'certificate', 'user'
    target_id INT NULL,                      -- id đối tượng
    details NVARCHAR(MAX) NULL,              -- JSON metadata
    created_at DATETIME2 DEFAULT SYSUTCDATETIME()
);
GO




-- Tạo user admin nếu chưa có
IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = 'admin@edu.vn')
BEGIN
    INSERT INTO dbo.users (email, display_name, role, status)
    VALUES ('2331540039@edu.vn', 'System Admin', 'admin_root', 'active');
END

-- Tạo tổ chức mặc định
IF NOT EXISTS (SELECT 1 FROM dbo.organizations WHERE id = 1)
BEGIN
    SET IDENTITY_INSERT dbo.organizations ON;
    INSERT INTO dbo.organizations (id, org_name, org_email, owner_id, status)
    VALUES (1, 'Đại học Bách Khoa Hà Nội', '2331540039@vaa.edu.vn', 
            (SELECT id FROM dbo.users WHERE email = 'admin@edu.vn'), 
            'approved');
    SET IDENTITY_INSERT dbo.organizations OFF;
END



-- BƯỚC 1: XÓA DỮ LIỆU CŨ (NẾU MUỐN RESET)
-- DELETE FROM dbo.certificate_requests;
-- DELETE FROM dbo.certificates;
-- DELETE FROM dbo.organizations;
-- DELETE FROM dbo.users;
-- DBCC CHECKIDENT ('dbo.users', RESEED, 0);
-- DBCC CHECKIDENT ('dbo.organizations', RESEED, 0);
-- GO

-- BƯỚC 2: TẠO 4 USER (THEO THỨ TỰ ID TĂNG DẦN)
SET IDENTITY_INSERT dbo.users ON;

INSERT INTO dbo.users (id, email, display_name, wallet_address, role, org_id, status, created_at, updated_at)
VALUES 
(1, '2331540039@vaa.edu.vn', 'Học Viên Hàng Không', NULL, 'org', NULL, 'active', 
 '2025-11-11 06:03:22.3578619', '2025-11-11 06:03:22.3578619'),

(2, 'luukhoi780@gmail.com', 'Khoa CNTT', 
 '0xb99792cf597c2a38b921ac08a38c36904f8bb264447a81c7a6f2b1b46f32c8a9', 
 'admin_org', NULL, 'active', 
 '2025-11-11 06:03:22.3578619', '2025-11-11 06:56:29.4700000'),

(3, 'luunguyenminhkhoi156@gmail.com', 'luunguyenminhkhoi156', 
 '0xb99792cf597c2a38b921ac08a38c36904f8bb2644d7a81c7a6f2b1b46f32c8a9', 
 'user', 1, 'active', 
 '2025-11-11 06:41:41.6445925', '2025-11-12 12:28:29.2901643'),

(4, 'luukhoi156@gmail.com', 'Lưu Khôi', 
 '0xbd6db1b46632ca69528eb54fa19cedc02d74cd4868e68a73fb28c33dd6ce50fa', 
 'admin_org', NULL, 'active', 
 '2025-11-12 11:22:54.8780024', '2025-11-12 12:08:39.4859820');

SET IDENTITY_INSERT dbo.users OFF;
GO

-- BƯỚC 3: TẠO TỔ CHỨC "Khoa CNTT" VỚI EMAIL luukhoi156@gmail.com
SET IDENTITY_INSERT dbo.organizations ON;

INSERT INTO dbo.organizations (id, org_name, org_email, owner_id, status)
VALUES (
    1,
    'Khoa Công nghệ Thông tin - Học viện Hàng không',
    'luukhoi156@gmail.com',
    4, -- owner_id = id của luukhoi156@gmail.com
    'approved'
);

SET IDENTITY_INSERT dbo.organizations OFF;
GO

-- BƯỚC 4: GÁN org_id = 1 CHO USER luunguyenminhkhoi156@gmail.com
UPDATE dbo.users
SET org_id = 1,
    updated_at = SYSUTCDATETIME()
WHERE email = 'luunguyenminhkhoi156@gmail.com';
GO

-- BƯỚC 5: KIỂM TRA KẾT QUẢ
SELECT id, email, display_name, wallet_address, role, org_id, status, created_at, updated_at
FROM dbo.users
ORDER BY id;

SELECT id, org_name, org_email, owner_id, status
FROM dbo.organizations;


-- BƯỚC 1: TẠO TÀI KHOẢN BỘ GIÁO DỤC (role: admin_root)
IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = 'bo@giaoduc.vn')
BEGIN
    INSERT INTO dbo.users (email, display_name, role, status, wallet_address)
    VALUES (
        'luongkhang156@gmail.com', 
        'Bộ Giáo dục & Đào tạo', 
        'admin_root', 
        'active',
        '0xde85db2440be6d97eebdfa7a0dce84bf4bf4dc1ca0abed4cf586461cbb26aee0'  -- Ví mẫu của Bộ
    );
    PRINT 'Tạo tài khoản Bộ thành công: luongkhang156@gmail.com';
END
ELSE
BEGIN
    PRINT 'Tài khoản luongkhang156@gmail.com đã tồn tại';
END
GO

-- BƯỚC 2: TẠO TỔ CHỨC "BỘ GIÁO DỤC & ĐÀO TẠO" (id = 999 để phân biệt)
IF NOT EXISTS (SELECT 1 FROM dbo.organizations WHERE org_email = 'luongkhang156@gmail.com')
BEGIN
    -- Lấy user_id của Bộ vừa tạo
    DECLARE @bo_user_id INT = (SELECT id FROM dbo.users WHERE email = 'luongkhang156@gmail.com');

    SET IDENTITY_INSERT dbo.organizations ON;
    INSERT INTO dbo.organizations (id, org_name, org_email, owner_id, org_wallet, status)
    VALUES (
        999, 
        'Bộ Giáo dục và Đào tạo Việt Nam', 
        'luongkhang156@gmail.com', 
        @bo_user_id,
        '0xde85db2440be6d97eebdfa7a0dce84bf4bf4dc1ca0abed4cf586461cbb26aee0',
        'approved'
    );
    SET IDENTITY_INSERT dbo.organizations OFF;

    PRINT 'Tạo tổ chức Bộ Giáo dục thành công (id = 999)';
END
GO

-- BƯỚC 3: CẬP NHẬT org_id cho user Bộ (nếu cần)
UPDATE dbo.users 
SET org_id = 999 
WHERE email = 'luongkhang156@gmail.com';
GO

-- BƯỚC 4: KIỂM TRA KẾT QUẢ (CHẠY ĐỂ XEM)
PRINT '=== DANH SÁCH TÀI KHOẢN QUAN TRỌNG ===';
SELECT 
    id, 
    email, 
    display_name, 
    role, 
    org_id,
    wallet_address
FROM dbo.users 
WHERE role IN ('org', 'admin_org', 'admin_root')
ORDER BY role DESC;

PRINT '=== DANH SÁCH TỔ CHỨC ===';
SELECT 
    id, 
    org_name, 
    org_email, 
    owner_id, 
    status 
FROM dbo.organizations 
ORDER BY id;
GO

ALTER TABLE dbo.certificates 
ADD tx_hash NVARCHAR(255) NULL;