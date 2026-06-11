# RentEase 🏠✨
> Premium Property Rental Platform (Indian Market Focus)

RentEase is a premium, feature-rich property rental platform designed to streamline real-time communication, explore premium properties across major Indian cities, and handle secure digital lease agreements and rental payments.

---

## 🚀 Key Features

### 👥 Role-Based Portals & Access Control
- **Tenants**: Explore premium properties via an interactive map, schedule viewings, initiate real-time chats with landlords, sign lease agreements, and pay rent securely.
- **Landlords**: List and manage properties, review tenant applications, upload property media, manage lease agreements, view real-time rental income metrics, and track monthly payments.
- **Admins**: Monitor system-wide activity, manage users, approve/reject property listings, and oversee payment histories.

### 📍 Indian Market Localization
- **Currency**: Centered entirely around Indian Rupees (`₹`) across all frontend views, transaction receipt breakdowns, total rental estimators, and notifications.
- **City Directory**: Seeded with premium listings in major Indian metros: Mumbai, Chennai, Bengaluru, Gurugram, Noida, Hyderabad, Jaipur, and Delhi.
- **Interactive Maps**: A mapping client centered natively on India (`lat: 20.5937, lng: 78.9629`) with location-specific markers.

### 💬 Real-Time Messaging & Chat Sync
- Integrated Socket.IO WebSocket protocol for instantaneous communication.
- **Message Landlord**: Start conversations directly from property detail pages.
- Chat UI includes typing indicators, online/offline status, read receipts, and historic message retrieval.

### 💳 Payments Engine & Stripe Integration
- Integrated Stripe checkout & payment flows for deposits and rent.
- **Simulated Dev Mode**: Supports instant payments in development mode via a mock card details interface, while still verifying transactional logic and firing database hooks.
- **Stripe Webhook Listener**: Auto-forwards events in the background for instant server reconciliation.

---

## 📁 Repository Structure

```
├── backend/                  # Express REST API & WebSockets Server
│   ├── src/
│   │   ├── config/           # Database, Stripe, and Socket connection setups
│   │   ├── controllers/      # Route controllers (Auth, Payments, Bookings, Chat)
│   │   ├── middlewares/      # Security, Auth, & Error Handlers
│   │   ├── routes/           # Router groups (v1 namespace)
│   │   ├── services/         # Business logic layer
│   │   └── webhooks/         # Stripe payment success/failure webhooks
│   ├── prisma/               # Prisma Schema & Database Seeder
│   └── package.json
├── frontend/                 # React (Vite) Single Page Application
│   ├── src/
│   │   ├── components/       # Reusable layout and UI elements (Map, Form fields)
│   │   ├── context/          # Authentication & Socket connection state
│   │   ├── hooks/            # Custom logic hooks (useSocketChatSync, etc.)
│   │   ├── pages/            # View pages (Explore, PropertyDetail, Dashboard, Admin)
│   │   └── main.jsx
│   └── package.json
└── README.md
```

---

## 🛠️ Getting Started

### 📋 Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL Instance running locally or in the cloud
- Stripe CLI (for webhook events in local development)

### 1. Setup Backend
1. Navigate into the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (refer to `.env.example`):
   ```bash
   cp .env.example .env
   ```
4. Update the `DATABASE_URL` in `.env` with your PostgreSQL credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/rentease?schema=public"
   ```
5. Apply database migrations:
   ```bash
   npx prisma migrate dev
   ```
6. Seed the database with premium properties and default users:
   ```bash
   npx prisma db seed
   ```
7. Start the backend development server (runs on `http://localhost:5005`):
   ```bash
   npm run dev
   ```

### 2. Setup Frontend
1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (refer to `.env.example`):
   ```bash
   cp .env.example .env
   ```
4. Start the frontend development server (runs on `http://localhost:5173`):
   ```bash
   npm run dev
   ```

### 3. Stripe Local Webhook Integration (Optional for full flow)
To test webhook updates when making test payments, run:
```bash
stripe login
stripe listen --forward-to localhost:5005/api/v1/webhooks/stripe
```
Copy the webhook signing secret returned by the listener (e.g. `whsec_...`) and update `STRIPE_WEBHOOK_SECRET` in your backend `.env` file, then restart the backend.

---

## 🔑 Demo Credentials

The database seeder initializes the following accounts:

| Role | Email | Password |
|---|---|---|
| **Tenant** | `tenant@rentease.com` | `Tenant@123` |
| **Landlord** | `landlord@rentease.com` | `Landlord@123` |
| **Admin** | `admin@rentease.com` | `Admin@123` |

---

## ⚙️ Development Highlights
- **Rate Limit Adjustments**: In development mode, the rate limiter allows up to 10,000 requests per 15 minutes to prevent local HMR cycles and WebSocket retries from getting blocked (compared to the strict 100/15m threshold applied in production).
- **Graceful Mock Fallbacks**: Automatically falls back to mock engines if Firebase Admin credentials are not provided.
