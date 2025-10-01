## Đề tài: Xây dựng dApp lưu trữ dữ liệu phi tập trung tích hợp Token Economy trên Sui Blockchain

Kiến trúc tổng quan dự kiến dApp (app.ark.xyz)
1. Login (Kết nối ví Sui)
- Dùng **Sui.js SDK** hoặc **wallet adapter** (Ethos, Suiet, Sui Wallet) để login.
- Sau khi login, hệ thống lấy:
  - Địa chỉ ví.
  - Balance token (**SUI**, **USDC testnet**, **ARK**).
- Sign ví, tạo **account id** duy nhất cho user.

---

2. Home
- **File list**: hiển thị file user đã upload (metadata lấy từ DB).
- **Asset info**: balance token SUI, USDC, ARK + giá trị LP đang cung cấp.
- **Chart & Swap tool**:
  - Chart dùng **Recharts/Chart.js** để vẽ, hiển thị giá token từ **CoinGecko API** hoặc **CoinMarketCap API**.
  - Swap tool: cài widget của [FlowX](https://testnet.flowx.finance/).

---

3. Earn
- Add liquidity vào pool **SUI–USDC** (smart contract Move).
- Smart contract sẽ:
  - Mint **LP token** cho user (ví dụ `LP-SUIUSDC`).
  - Ví dụ logic: Claim reward **ARK** theo công thức:
    - Nếu pool `< 10 SUI–USDC` → `1 ARK/ngày`.
    - Nếu pool `≥ 10` → reward giảm theo %.
- UI hiển thị:
  - Liquidity user đang cung cấp.
  - Reward ARK có thể claim.

---

4. File
- Có 2 lựa chọn mua gói:
  1. Bằng **ARK** (token dự án).
  2. Bằng **SUI** (native coin, testnet/mainnet).
- Khi mua gói → tạo **Vault** (xem luồng hoạt động bên dưới).
- Xóa file:
  - Xóa record trong DB.

---

5. Account
- Thông tin user.
- Liên kết MXH (optional, lưu off-chain trong DB).
- Cho phép đổi mật khẩu / đặt tên hiển thị (UI thôi, vì auth = ví).

- **Frontend**: React/Next.js + TailwindCSS.  
- **Blockchain (Sui Testnet)**:
  - Move contract cho:
    - Fungible Token (ARK).
    - Liquidity Mining (reward ARK).
    - Vault Object (gói lưu trữ).
  - **Sui.js** để kết nối ví + gọi contract.
- **Storage**:
  - File: **IPFS** (có thể dùng Walrus nhưng phức tạp hơn).
  - Metadata: **MongoDB/Postgres**.
- **Backend**:
  - Node.js/Express hoặc Python/FastAPI → lưu metadata, handle encryption trước khi upload IPFS.
- **Chart/Swap UI**:
  - Recharts/Chart.js + form swap (call contract).

---

Luồng hoạt động với Vault
1. Tạo Vault khi mua gói
- User chọn gói → dApp gọi smart contract tạo **Vault Object** trên chain:
  - `vaultId`: ID duy nhất, ghi on-chain.
  - `quota`: dung lượng.
  - `owner`: địa chỉ ví user.
- Backend sinh **VaultKey (AES)** → mã hóa bằng public key ví user → chỉ user có private key mới giải được.
- User có thể tạo nhiều vault tùy ý.
- Nếu mất VaultKey (hoặc mất ví) → không truy cập được dữ liệu.

2. Upload file vào Vault
- User → Encrypt file bằng **VaultKey** → nhận ciphertext.
- Upload ciphertext lên **IPFS** → sinh **CID**.
- Lưu metadata off-chain (SQL/MongoDB):  
  `fileId, vaultId, cidHash, size, uploadDate`
- Blockchain chỉ lưu:  
  `{ vaultId, cidHash, owner }`

# Cài package va SUI CLI
1. SUI CLI (https://docs.sui.io/guides/developer/getting-started)
- Cài Homebrew hoặc Chocolatey
- Sau khi cài gõ sui --version để kiểm tra 

2. Cài package và các module
cd public
npm install

3. Sau khi cài kiểm tra
npm list
suistorage@1.0.0 D:\AppDev\code\suistorage\public
├── @mysten/dapp-kit@0.14.53
├── @mysten/sui@1.38.0
├── @types/node@24.6.1
├── @types/react-dom@18.3.0
├── @types/react@18.3.11
├── autoprefixer@10.4.21
├── axios@1.12.2
├── chart.js@4.5.0
├── next@15.5.4
├── postcss@8.5.6
├── react-chartjs-2@5.3.0
├── react-dom@18.3.1
├── react@18.3.1
├── recharts@2.15.4
├── swr@2.3.6
├── tailwindcss@3.4.17
└── typescript@5.9.2
