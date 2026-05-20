# Project — General

## Stack

| Area | Technology |
|------|------------|
| Framework | Next.js (App Router) |
| UI | Tailwind CSS + shadcn/ui |
| Backend | Supabase (PostgreSQL) |
| State (UI) | Zustand |
| State (Data) | TanStack Query |
| Email | Resend |
| Deploy | Vercel + Supabase Cloud |
---


## Naming Conventions

- DB table names: `snake_case` (`personel`, `maas_gecmisi`, `employment_periods`)
- DB column names: `snake_case` (`baslangic_tarihi`, `maas_net`)
- TypeScript types: `PascalCase` (`Personel`, `MaasGecmisi`)
- Component names: `PascalCase` (`PersonelListesi`, `MaasBordroForm`)
- Hook names: `camelCase`, `use` prefix (`usePersonelList`, `useMaasBordro`)
- Store names: `camelCase`, `Store` suffix (`personelStore`, `maasStore`)
- Utility functions: `camelCase` (`hesaplaSaatUcreti`, `formatTarih`)

---

## Data Structure

### Core Tables

**personel**
- `id` uuid PK
- `ad`, `soyad`, `tc` required
- `dogum_tarihi`, `cinsiyet`, `sgk_sicil`, `gorev_unvan` optional
- `banka_adi`, `sube_kodu`, `hesap_no`, `iban` — one is sufficient

**employment_periods**
- Tracks employee active periods (entry/exit)
- `bitis_tarihi` null = currently employed
- All modules filter employee lists using this table

> Period query:
> `baslangic <= end_of_month AND (bitis >= start_of_month OR bitis IS NULL)`

**maas_gecmisi**
- Each raise creates a new record, previous one is closed
- `gecerlilik_bitis` null = current salary
- First record is auto-created when employee is added

**maas_bordro**
- Monthly payroll data entry
- `ek_odemeler`, `ek_kesintiler` JSON (max 4)
- `notlar` JSON (max 4)

**banka_odeme**
- Saved independently from payroll data
- `banka` and `bes` are pulled from payroll — see editability rules

---

## Calculation Rules

```
hourly_rate         = maas_net / monthly_work_hours
work_days           = calisma_saati / daily_hours (default: 8, from settings)
hak_edis            = calisma_saati * hourly_rate
mesai_bedeli        = mesai_saati * hourly_rate  // 1x multiplier, no overtime bonus
total_payment       = hak_edis + mesai_bedeli + yol + yemek + prim + tazminat + senelik_izin + ek_odemeler
total_deduction     = banka + bes + avans + icra + iceri_avans_kesinti + ek_kesintiler
elden               = total_payment - total_deduction

// Bank payment page only:
elden_bank_page     = total_payment - (banka + bes + tazminat + avans)

iceri_avans_carry   = (carried_over + given_this_month) - deducted_this_month
```

---

## Rules

### Clean Code
- Each component has a single responsibility
- Business logic stays out of components → `hooks/` or `lib/utils/`
- No magic numbers → move to constants file (`DAILY_WORK_HOURS = 8`)
- Each module has its own `components/modules/<module>/` folder
- **Do not create module-specific single-use components. Use shadcn/ui components directly. A new component is only created if it will be reused in multiple places.**

### Supabase
- Client-side queries: `supabase/client.ts`
- Server-side (RSC, API routes): `supabase/server.ts`
- Types imported from `supabase/types.ts`
- RLS (Row Level Security) enabled

### TanStack Query
- Every data fetch has a defined query key
- Related queries are invalidated after mutations
- Loading and error states are always handled

### Zustand
- UI state only (open modals, selected period, filters, etc.)
- Server data is never stored here → use TanStack Query

### General
- Dates stored in ISO 8601 format
- Currency stored as `number`, formatted on display
- All employee lists are filtered by `employment_periods` for the selected period
- `maas_net` is not stored in `personel` table → fetched from `maas_gecmisi`

---

## Modules

| Module | Status |
|--------|--------|
| Personnel Management | Designed |
| Payroll Management | Designed |
| Timesheet | Pending |
| Current / Invoice | Pending |
| Reports | Pending |
| Document Management | Pending |
| Settings | Pending |

---

## Settings (Note)

- Daily work hours (default: 8)
- Monthly work hours
- Public holiday calendar (Turkey, editable)
