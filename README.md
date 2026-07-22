# 🪙 EkubLink — Ethiopian Digital Ekub Platform

> A full-stack web application digitizing the traditional Ethiopian Ekub (rotating savings and credit association).

## Project Structure

```
EkubLink/
├── frontend/          # Vue 3 + Vite (deploy to Vercel)
│   ├── src/
│   │   ├── router/    # Vue Router with role guards
│   │   ├── stores/    # Pinia state management
│   │   ├── views/
│   │   │   ├── auth/       # Login & Signup
│   │   │   ├── collector/  # Collector-only pages
│   │   │   └── giver/      # Giver-only pages
│   │   ├── layouts/   # CollectorLayout, GiverLayout
│   │   └── services/  # Axios API client
│   └── vite.config.js
│
└── backend/           # Node.js + Express + Prisma
    ├── prisma/
    │   └── schema.prisma
    └── src/
        ├── server.js
        ├── controllers/
        ├── routes/
        ├── middleware/
        └── utils/
```

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env  # Fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Key Features
- **Strict Role Separation**: COLLECTOR vs GIVER with Vue Router navigation guards
- **CBE Payment Flow**: Receipt upload + manual CBE reference number verification
- **Draw System**: Random or fixed-order lottery from approved-payment members
- **JWT Authentication**: Secure token-based auth with role embedded in payload
- **Prisma ORM**: Type-safe PostgreSQL queries with full relational schema
