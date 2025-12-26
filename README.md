# KEF Parking

A modern, bilingual (Icelandic/English) Progressive Web App for airport parking bookings at Keflavík International Airport.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)
![Prisma](https://img.shields.io/badge/Prisma-6.1-2d3748)

---

## Overview

KEF Parking is a complete parking management solution featuring:

- **Customer Portal** — Book parking with automatic vehicle lookup, flight integration, and add-on services
- **Operator Dashboard** — Manage daily arrivals, departures, and service fulfillment
- **Admin Panel** — Control pricing, capacity, and view analytics
- **Accounting Integration** — Automatic sync with Regla.is for invoicing

---

## Features

### 🚗 Customer Booking Flow

| Step | Feature |
|------|---------|
| 1. Vehicle | License plate lookup via ROGG API → auto-detect vehicle type |
| 2. Travel | Flight number integration, drop-off/pick-up scheduling |
| 3. Add-ons | Interior/exterior cleaning, EV charging, winter service, premium spots |
| 4. Payment | Price summary with VAT, secure Rapyd hosted checkout |

### 👤 Customer Portal

- View and manage bookings
- Register and manage vehicles
- Account settings with profile management
- GDPR-compliant data export
- Booking history and receipts

### 📊 Operator Dashboard

- Real-time arrivals and departures for today
- Cars currently on-site counter
- Service task queue with completion tracking
- One-click check-in/check-out workflow
- Search by license plate or booking reference

### ⚙️ Admin Panel

- Revenue analytics with interactive charts
- Pricing management per vehicle type per lot
- Service configuration and availability
- Multi-lot support with individual capacity
- User management (Customer/Operator/Admin roles)

### 🔗 Integrations

| Service | Purpose |
|---------|---------|
| **ROGG (Samgöngustofa)** | Vehicle registry lookup (make, model, type, fuel) |
| **Regla.is** | Accounting — customers, invoices, payments |
| **Isavia (kefairport.com)** | Flight schedules via web scraper (departures/arrivals) |
| **Rapyd** | Payment gateway with hosted checkout |

---

## Tech Stack

```
Framework       Next.js 15 (App Router, Server Components)
Language        TypeScript 5.7
Database        PostgreSQL + Prisma ORM
Authentication  NextAuth.js v5
Styling         Tailwind CSS 3.4
Internationalization  next-intl (IS/EN)
Charts          Recharts
Forms           React Hook Form + Zod
Animations      Framer Motion
```

---

## Project Structure

```
kef-parking/
├── app/
│   ├── [locale]/                    # Locale-based routing
│   │   ├── page.tsx                 # Landing page
│   │   ├── layout.tsx               # i18n provider wrapper
│   │   ├── (auth)/                  # Login, register
│   │   ├── (customer)/              # Booking flow, my bookings
│   │   ├── (operator)/              # Operator dashboard
│   │   └── (admin)/                 # Admin panel
│   ├── api/
│   │   ├── auth/[...nextauth]/      # NextAuth endpoints
│   │   ├── bookings/                # Booking CRUD
│   │   ├── payments/                # Rapyd checkout, status, refunds
│   │   ├── vehicles/                # Lookup + user vehicle management
│   │   ├── account/                 # User account & data export
│   │   ├── webhooks/                # Payment & external webhooks
│   │   └── lots/                    # Parking lot data
│   ├── globals.css                  # Tailwind + custom styles
│   └── layout.tsx                   # Root layout
│
├── components/
│   ├── booking/                     # Multi-step wizard components
│   │   ├── VehicleStep.tsx
│   │   ├── FlightStep.tsx
│   │   ├── AddonsStep.tsx
│   │   ├── SummaryStep.tsx
│   │   ├── PaymentButton.tsx
│   │   └── QuickBookingCard.tsx
│   ├── layout/                      # Header, Footer
│   ├── ui/                          # Reusable UI primitives
│   ├── providers/                   # React context providers
│   ├── customer/                    # Customer portal components
│   ├── operator/                    # Operator-specific components
│   └── admin/                       # Admin-specific components
│
├── lib/
│   ├── db/prisma.ts                 # Prisma client singleton
│   ├── auth/                        # NextAuth configuration
│   ├── rapyd/                       # Rapyd payment gateway
│   │   ├── client.ts                # API client with signature auth
│   │   └── types.ts                 # TypeScript interfaces
│   ├── regla/                       # Regla.is accounting client
│   │   ├── client.ts                # REST API wrapper
│   │   ├── types.ts                 # TypeScript interfaces
│   │   └── sync-service.ts          # Booking → Invoice sync
│   ├── samgongustofa/               # Vehicle registry client (ROGG API)
│   ├── isavia/                      # Flight schedule lookup
│   ├── i18n/                        # Internationalization config
│   ├── settings/                    # App settings management
│   └── utils/                       # Helpers (formatting, validation)
│
├── prisma/
│   ├── schema.prisma                # Database schema (13 models)
│   └── seed.ts                      # Initial data seeding
│
├── messages/
│   ├── is.json                      # Icelandic translations
│   └── en.json                      # English translations
│
├── types/
│   └── index.ts                     # Shared TypeScript types
│
├── public/
│   └── manifest.json                # PWA manifest
│
└── middleware.ts                    # i18n routing middleware
```

---

## Database Schema

The Prisma schema includes 13 interconnected models:

```
Users & Auth          User, Account, Session, VerificationToken
Vehicles              Vehicle, VehicleType
Parking               Lot, LotPricing, LotService
Services              Service, BookingAddon
Bookings              Booking, Payment
Accounting            ReglaCustomer, ReglaInvoice, ReglaPayment, ReglaSyncLog
Configuration         Setting, FlightCache
```

### Key Relationships

```
User ──┬── Booking ──┬── Vehicle ── VehicleType
       │             ├── Lot ────── LotPricing
       │             ├── BookingAddon ── Service
       │             └── Payment
       └── ReglaCustomer
```

---

## Getting Started

### Prerequisites

- Node.js 20+ 
- PostgreSQL 15+
- pnpm, npm, or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/kef-parking.git
cd kef-parking

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
```

### Environment Configuration

Edit `.env.local` with your values:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/kef_parking"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Email (SMTP)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your_username"
SMTP_PASSWORD="your_password"
SMTP_FROM="noreply@carpark.is"
SMTP_FROM_NAME="CarPark"

# Regla Accounting
REGLA_USERNAME="your_username"
REGLA_PASSWORD="your_password"

# ROGG API Credentials
ROGG_API_USER="your_username"
ROGG_API_PASSWORD="your_password"

# Rapyd Payment Gateway
RAPYD_ACCESS_KEY="your_access_key"
RAPYD_SECRET_KEY="your_secret_key"
RAPYD_WEBHOOK_SECRET="your_webhook_secret"
RAPYD_API_URL="https://sandboxapi.rapyd.net"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_DEFAULT_LOCALE="is"
```

### Database Setup

```bash
# Push schema to database
npm run db:push

# Seed initial data (vehicle types, services, pricing, users)
npm run db:seed

# Open Prisma Studio (optional)
npm run db:studio
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## API Reference

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/bookings` | List bookings (filter by status, date) |
| `POST` | `/api/bookings` | Create new booking |
| `GET` | `/api/bookings/[id]` | Get booking by ID or reference |
| `PATCH` | `/api/bookings/[id]` | Update booking status |
| `DELETE` | `/api/bookings/[id]` | Cancel booking |
| `POST` | `/api/bookings/[id]/sync-regla` | Sync to Regla accounting |

### Vehicles

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/vehicles/lookup?plate=ABC123` | Lookup vehicle by license plate |
| `GET` | `/api/vehicles` | List user's registered vehicles |
| `POST` | `/api/vehicles` | Register a vehicle to user account |
| `DELETE` | `/api/vehicles?id=xxx` | Remove vehicle from account |
| `GET` | `/api/vehicles/my-vehicles` | Get vehicles for booking (owned + previously used) |

### Account

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/account` | Get user account details |
| `PATCH` | `/api/account` | Update user profile |
| `GET` | `/api/account/export` | Export all user data (GDPR) |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments/checkout` | Create Rapyd checkout session |
| `GET` | `/api/payments/status?bookingId=xxx` | Get payment status |
| `POST` | `/api/payments/refund` | Process refund (admin only) |

### Lots

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/lots` | List active parking lots with pricing |

---

## Regla.is Integration

The application integrates with Regla.is accounting software via their REST API.

### Configuration

1. Create API credentials in Regla: **Stjórnun → Fyrirtækið**
2. Add credentials to `.env.local`

### Sync Flow

```
Booking Completed
       ↓
Check/Create Customer in Regla
       ↓
Create Invoice with Line Items
       ↓
Register Payment
       ↓
Store References in Database
```

### Supported Operations

```typescript
// Authentication
regla.login() → token

// Customers
regla.getCustomer(customerNumber)
regla.getCustomerByKennitala(kennitala)
regla.createCustomer(customer)

// Invoices
regla.createInvoice(invoice)
regla.getInvoice(invoiceNumber)

// Payments
regla.getPaymentMethods()
regla.registerPayment(invoiceNumber, amount, paymentMethod)
```

---

## Rapyd Payment Gateway

The application uses Rapyd's hosted checkout for secure payment processing.

### Configuration

1. Create a Rapyd account at [rapyd.net](https://www.rapyd.net)
2. Get your API credentials from the Rapyd Dashboard
3. Add the following to your `.env` file:

```env
# Rapyd Payment Gateway
RAPYD_ACCESS_KEY=your_access_key
RAPYD_SECRET_KEY=your_secret_key
RAPYD_WEBHOOK_SECRET=your_webhook_secret
```

4. Toggle between Sandbox/Production in **Admin → Settings → Payments → Test Mode**

### Webhook Setup

In your Rapyd Dashboard, configure webhooks to point to:

```
https://yourdomain.com/api/webhooks/rapyd
```

Enable the following webhook events:
- `PAYMENT_COMPLETED`
- `PAYMENT_FAILED`
- `PAYMENT_CANCELED`
- `REFUND_COMPLETED`

### Payment Flow

```
Customer completes booking
         ↓
Booking created with PENDING payment
         ↓
Redirect to Rapyd hosted checkout
         ↓
Customer completes payment
         ↓
Rapyd sends webhook (PAYMENT_COMPLETED)
         ↓
Payment updated to COMPLETED
Booking updated to CONFIRMED
         ↓
Customer redirected to confirmation page
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments/checkout` | Create checkout session |
| `GET` | `/api/payments/status?bookingId=xxx` | Get payment status |
| `POST` | `/api/payments/refund` | Process refund (admin only) |
| `POST` | `/api/webhooks/rapyd` | Webhook handler |

### Client Functions

```typescript
import { createCheckout, getPayment, refundPayment } from '@/lib/rapyd/client';

// Create checkout session
const checkout = await createCheckout({
  amount: 15000,
  currency: 'ISK',
  country: 'IS',
  complete_checkout_url: 'https://yoursite.com/booking/confirmation?bookingId=xxx',
  cancel_checkout_url: 'https://yoursite.com/booking?canceled=true',
  merchant_reference_id: 'booking-id',
});

// Get payment details
const payment = await getPayment(paymentId);

// Process refund
const refund = await refundPayment(paymentId, amount, 'Customer requested');
```

---

## Internationalization

The app supports Icelandic (default) and English.

### Adding Translations

Edit files in `/messages/`:

```json
// messages/is.json
{
  "booking": {
    "title": "Bóka bílastæði",
    "licensePlate": "Bílnúmer"
  }
}

// messages/en.json
{
  "booking": {
    "title": "Book Parking",
    "licensePlate": "License Plate"
  }
}
```

### Usage in Components

```tsx
import { useTranslations } from 'next-intl';

export default function BookingPage() {
  const t = useTranslations('booking');
  
  return <h1>{t('title')}</h1>;
}
```

### Language Switching

The header includes a language toggle. URLs follow the pattern:
- Icelandic: `/is/booking`
- English: `/en/booking`

---

## Pricing Structure

Default pricing (configurable in admin):

| Vehicle Type | Daily Rate (ISK) |
|--------------|------------------|
| Fólksbíll (Sedan) | 1,990 |
| Jeppi/SUV | 2,490 |
| Sendibíll (Van) | 2,990 |

### Add-on Services

| Service | Price (ISK) |
|---------|-------------|
| Interior Cleaning | 4,990 |
| Exterior Wash | 3,990 |
| Full Detail | 9,990 |
| EV Charging | 2,990 |
| Winter Service | 1,990 |
| Premium Spot | 990/day |

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

### Environment Variables for Production

Ensure these are set in your deployment platform:

- `DATABASE_URL` — Production PostgreSQL connection string
- `NEXTAUTH_SECRET` — Strong random secret
- `NEXTAUTH_URL` — Production URL
- `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` — Email server credentials
- `REGLA_USERNAME` / `REGLA_PASSWORD` — Accounting credentials
- `ROGG_API_USER` / `ROGG_API_PASSWORD` — Vehicle registry API credentials
- `RAPYD_ACCESS_KEY` / `RAPYD_SECRET_KEY` — Payment gateway credentials
- `RAPYD_WEBHOOK_SECRET` — Webhook signature verification
- `NETGIRO_APPLICATION_ID` / `NETGIRO_SECRET_KEY` / `NETGIRO_PROVIDER_ID` — Netgíró payment credentials
- `GOOGLE_PLACES_API_KEY` / `GOOGLE_PLACE_ID` — Google rating on homepage (optional)

**Note:** Sandbox/Production mode is controlled via Admin Settings, not environment variables.

### Google Places API Setup (Optional)

The homepage displays a live Google rating fetched from the Google Places API. To enable:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or select existing)
3. Enable the **Places API**
4. Create an API key and restrict it to the Places API
5. Find your business Place ID:
   - Go to [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
   - Search for your business location
   - Copy the Place ID
6. Add to your `.env`:
   ```
   GOOGLE_PLACES_API_KEY="your_api_key_here"
   GOOGLE_PLACE_ID="your_place_id_here"
   ```

The rating is cached for 24 hours to minimize API calls. If not configured, a default rating of 4.9 is displayed.

---

## Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Create migration |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |

---

## Default Users

After seeding, these users are available:

| Email | Role | Purpose |
|-------|------|---------|
| `admin@carpark.is` | ADMIN | Full access to admin panel |
| `operator@carpark.is` | OPERATOR | Operator dashboard access |
| `demo@carpark.is` | CUSTOMER | Demo customer for testing |

---

## Roadmap

- [x] Payment gateway integration (Rapyd)
- [x] Email notifications (booking confirmation, reminders, check-in)
- [ ] SMS notifications
- [ ] Mobile app (React Native)

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Proprietary — All rights reserved.

---

## Support

For questions or issues, contact:

- **Email**: dev@carpark.is
- **Documentation**: [docs.carpark.is](https://docs.carpark.is)
