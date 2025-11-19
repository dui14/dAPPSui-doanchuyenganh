
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
    tx_hash NVARCHAR(255) NULL,
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
