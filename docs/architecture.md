dapp-sui-storage/
│
├── public/                  # Next.js + Tailwind
│   ├── pages/
│   │   ├── index.tsx          # Home
│   │   ├── login.tsx          # Login page
│   │   ├── earn.tsx           # Earn page
│   │   ├── file.tsx           # File management
│   │   ├── account.tsx        # Account info
│   │   ├── _app.tsx           # Provider 
│   │
│   ├── components/
│   │   ├── walletconnet.tsx  # Connect Sui wallet
│   │   ├── flielist.tsx
│   │   ├── asset.tsx
│   │   ├── chart.tsx
│   │   ├── swap.tsx
│   │   ├── liquidity.tsx
│   │   └── Vault.tsx
│   │
│   ├── utils/
│   │   ├── sui.ts             # Sui.js SDK config
│   │   ├── api.ts             # Call backend API
│   │   └── chartApi.ts        # Fetch token price
│   │
│   └── styles/                # Tailwind custom styles
│
├── contracts/                 # Move contracts
│   ├── ABC/                   # Fungible token
│   ├── liquidity/             # Liquidity mining
│   └── vault/                 # Storage Vault
│
├ backend                # Node.js/Express
│   ├── src/
│   │   ├── routes/
│   │   │   ├── file.js        # Upload, delete, metadata
│   │   │   └── vault.js       # Vault management
│   │   ├── services/
│   │   │   ├── ipfs.js        # Upload to IPFS
│   │   │   ├── encrypt.js     # AES encryption
│   │   │   └── db.js          # DB connection
│   │   └── app.js             # Express init
│   │
│   └── package.json
│
├── database/
│   ├── schema.sql             # Nếu dùng Postgres
│   └── models/                # ORM (Sequelize/Mongoose)
│
└── docs/                      # Tài liệu nhóm
    ├── architecture.md
    ├── api-design.md
    └── readme.md
