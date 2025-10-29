# Đề tài: Xây dựng hệ thống quản lý và xác thực chứng chỉ học tập phi tập trung trên Sui Blockchain
1. Tree
/docs/architecture.md

# Cài env, package và SUI CLI
1. SUI CLI (https://docs.sui.io/guides/developer/getting-started)
- Cài Homebrew hoặc Chocolatey
- Sau khi cài gõ sui --version để kiểm tra 

2. Cài package và các module
cd public
npm install

3. Sau khi cài kiểm tra
npm list

├── @dynamic-labs/sdk-react-core@4.39.0
├── @dynamic-labs/sui@4.39.0
├── @mysten/dapp-kit@0.14.53
├── @mysten/sui@1.38.0
├── @types/node@24.6.1
├── @types/react-dom@18.3.0
├── @types/react@18.3.11
├── autoprefixer@10.4.21
├── axios@1.12.2
├── next@15.5.4
├── postcss@8.5.6
├── react-dom@18.3.1
├── react@18.3.1
├── swr@2.3.6
├── tailwindcss@3.4.17
└── typescript@5.9.2

4. Cài đặt Dynamic SDK
- Tạo suidapp\public\.env.local
NEXT_PUBLIC_DYNAMIC_ENV_ID=7e2c57a4-316f-467f-b11a-cafc5df99993
NEXT_PUBLIC_API_URL=http://localhost:5000

- Tạo \suidapp\.env
PORT=5000
FRONTEND_URL=http://localhost:3000

DB_USER=your_user
DB_PASSWORD=your_password
DB_SERVER=localhost
DB_NAME=your_database

JWT_PUBLIC_KEY_URL=https://app.dynamic.xyz/api/v0/sdk/7e2c57a4-316f-467f-b11a-cafc5df99993/.well-known/jwks