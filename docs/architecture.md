dapp-sui/
│
├public/  
│ pages/
│   ├── index.tsx           # Landing / Home
│
│   ├── admin/
│   │   ├── root.tsx        # Admin Root (Bộ)
│   │   ├── org.tsx         # Org (Trường)
│   │   └── admin_org.tsx      # Admin (Khoa)
│
│   ├── user.tsx            # User (Sinh viên)
│
│   ├── verify.tsx          # Public verify / explorer
│
│   ├── login.tsx           # Login / Wallet connect
│   ├── _app.tsx            # Provider, Layout
│
│
├── components/
│   ├── walletconnect.tsx       # Kết nối Sui wallet
│   ├── certificate_list.tsx    # Hiển thị danh sách các chứng chỉ theo từng vai trò
│   ├── table.tsx               # Bảng quản lý phân quyền
│   ├── request.tsx             # Thẻ hiển thị yêu cầu cấp chứng chỉ
│   ├── approve.tsx             # Modal popup để phê duyệt chứng chỉ
│   ├── create.tsx              # Tạo chứng chỉ request 
│   ├── account.tsx             # Hiển thị tài khoản liên kết
│   └── verify_input.tsx        # Input form cho Verifier
│
├── utils/
│   ├── sui.ts              # Sui.js SDK config
│   ├── api.ts              # Call backend API
│   └── ipfs.ts             # Upload IPFS (nếu cần)
│
├── styles/                 # TailwindCSS
│
├── contracts/              # Move modules
│   ├── token/
│   │   └── cer_token.move
│   ├── cert/
│   │   ├── certificate.move
│   │   └── certificate_request.move
│   ├── org/
│       └── org_registry.move
│
├backend             # Node.js / Express (giữ nguyên style cũ)
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── user.js    
│   │   │   ├── certificate.js      # Upload file, metadata, create request
│   │   │   ├── verify.js           # Truy vấn chứng chỉ
│   │   │   └── organizations.js    # Quản lý org
│   │   ├── services/
│   │   │   ├── cache.js  
│   │   │   ├── jwt.js  
│   │   │   ├── ipfs.js
│   │   │   ├── db.js
│   │   │   └── sign.js          # Ký metadata, handle signature
│   │   └── app.js
│   ├── package.json
│
├── database/
│   ├── db1.sql          
│   └── models/
│
└── docs/
    ├── architecture.md
    ├── flow.md
    ├── readme.md
    └── api-design.md
