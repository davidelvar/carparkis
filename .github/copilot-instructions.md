# KEF Parking - AI Coding Instructions

## Architecture Overview

This is a **Next.js 15 App Router** application for airport parking bookings at Keflavík Airport (Iceland). It features three user portals (Customer, Operator, Admin) with bilingual support (Icelandic primary, English secondary).

### Route Structure
- `app/[locale]/` — All pages are locale-prefixed (`is`/`en`), configured via `next-intl`
- Route groups: `(auth)`, `(customer)`, `(operator)`, `(admin)` — organize by user role without affecting URL
- API routes under `app/api/` — do NOT include locale prefix

### Key Data Flow
1. **Booking creation**: `VehicleStep` → `FlightStep` → `AddonsStep` → `SummaryStep` → `POST /api/bookings`
2. **Vehicle lookup**: License plate → `/api/vehicles/lookup` → Samgöngustofa API → auto-detect vehicle type
3. **Accounting sync**: Booking confirmed → `syncBookingToRegla()` → Creates customer/invoice in Regla.is

## External Integrations

| Service | Client Location | Purpose |
|---------|-----------------|---------|
| **Samgöngustofa** | `lib/samgongustofa/client.ts` | Icelandic vehicle registry lookup |
| **Regla.is** | `lib/regla/client.ts`, `sync-service.ts` | Accounting (customers, invoices, payments) |
| **Isavia** | `lib/isavia/` | Flight schedule lookup (optional) |

When modifying integrations, always update the corresponding types in `lib/regla/types.ts` or `types/index.ts`.

## Database & Prisma Conventions

- Schema: `prisma/schema.prisma` — organized into sections (Users, Vehicles, Lots, Bookings, Regla sync)
- All monetary values stored as **integers in ISK** (no decimals)
- Use `@prisma/client` generated types; extended types with relations in `types/index.ts`
- Run `pnpm db:generate` after schema changes, `pnpm db:push` for development sync

```typescript
// Correct: Use relation types from types/index.ts
import type { BookingWithRelations } from '@/types';

// Correct: Include relations when querying
const booking = await prisma.booking.findUnique({
  where: { id },
  include: { user: true, vehicle: { include: { vehicleType: true } }, addons: { include: { service: true } } }
});
```

## Internationalization (i18n)

- Locales: `is` (default, Icelandic), `en` (English) — see `lib/i18n/config.ts`
- Translation files: `messages/is.json`, `messages/en.json` — keep both in sync
- Always use `useTranslations()` hook in client components, `getTranslations()` in server components
- Database fields use paired columns: `name`/`nameEn`, `description`/`descriptionEn`

```typescript
// Client component pattern
const t = useTranslations('booking');
const locale = useLocale();
return <h1>{t('title')}</h1>;
```

## Component Patterns

- **Booking wizard steps**: Each step in `components/booking/` receives `data`, `onUpdate`, `onNext`, `onBack` props
- **Form validation**: Use Zod schemas in API routes (see `app/api/bookings/route.ts`)
- **Styling**: Tailwind CSS with custom utility classes (`btn-primary`, `card`, `input`, `label`) in `globals.css`
- **Icons**: Use `lucide-react` exclusively
- **Animation**: `framer-motion` for page transitions and UI feedback

```typescript
// Use cn() utility for conditional classes
import { cn } from '@/lib/utils';
<button className={cn('btn-primary', isLoading && 'opacity-50')} />
```

## Common Commands

```bash
pnpm dev           # Start development server
pnpm db:studio     # Open Prisma Studio (database GUI)
pnpm db:seed       # Seed database with test data
pnpm lint          # Run ESLint
```

## Code Patterns to Follow

1. **API responses**: Always return `{ success: boolean, data?: T, error?: string }`
2. **Price formatting**: Use `formatPrice(amount, locale)` from `lib/utils`
3. **License plates**: Validate with `isValidIcelandicLicensePlate()`, normalize with `normalizeLicensePlate()`
4. **Booking references**: Generate with `generateBookingReference()` → format `KEF-YYYY-XXXXXX`
5. **Auth**: NextAuth v5 with email provider, database sessions — config in `lib/auth/config.ts`

## File Naming & Organization

- Page components: `page.tsx` (Next.js convention)
- Reusable components: PascalCase in appropriate subdirectory (`components/booking/`, `components/admin/`)
- API clients: `lib/{service}/client.ts` for external APIs
- Utility functions: Add to `lib/utils/index.ts`
