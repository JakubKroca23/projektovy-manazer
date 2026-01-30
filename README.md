# ProjectHub - Webapp pro Řízení Projektů

Moderní webová aplikace pro správu projektů postavená na Next.js 15, Supabase a Vercel.

## ✨ Funkce

- 🔐 Autentizace (Email/Password + Google OAuth)
- 📊 Dashboard s přehledem projektů a úkolů
- 📁 Správa projektů (CRUD operace)
- ✅ Kanban board pro vizualizaci úkolů
- 👥 Team management
- 🎨 Premium glassmorphism design
- ⚡ Real-time updates s Supabase
- 📱 Plně responzivní

## 🚀 Tech Stack

- **Frontend**: Next.js 15 (App Router) + React 19
- **Databáze**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS v4
- **Deployment**: Vercel
- **TypeScript**: Plná type-safety

## 📦 Instalace

1. **Klonovat repozitář**
```bash
git clone <repo-url>
cd projektovy-manazer
```

2. **Instalovat závislosti**
```bash
npm install
```

3. **Nastavit environment variables**

Vytvořte `.env.local` soubor:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. **Spustit Supabase migraci**

V Supabase SQL Editoru spusťte soubor `supabase/migrations/0001_initial_schema.sql`

5. **Spustit dev server**
```bash
npm run dev
```

Otevřete [http://localhost:3000](http://localhost:3000)

## 🌐 Deployment na Vercel

### Metoda 1: Vercel CLI

```bash
# Instalovat Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Metoda 2: GitHub Integration

1. Push kód na GitHub
2. Import projektu na [vercel.com](https://vercel.com)
3. Vercel automaticky detekuje Next.js
4. Nastavit environment variables
5. Deploy!

### Environment Variables na Vercelu

V Vercel Project Settings → Environment Variables přidejte:

```
NEXT_PUBLIC_SUPABASE_URL = your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
```

## 🗄️ Databázové Schéma

### Tables
- `profiles` - Uživatelské profily
- `projects` - Projekty
- `tasks` - Úkoly
- `project_members` - Členové projektů

### Row Level Security
Všechny tabulky mají RLS policies pro bezpečnost dat.

## 🎨 Design System

- **Barvy**: Purple (#8B5CF6) + Cyan (#06B6D4)
- **Background**: Dark gradient
- **Efekty**: Glassmorphism, smooth animations
- **Typography**: System fonts s fallbacky

## 📁 Struktura Projektu

```
projektovy-manazer/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── projekty/
│   │   ├── kanban/
│   │   └── ukoly/
│   └── auth/callback/
├── components/
│   └── layout/
│       ├── header.tsx
│       └── sidebar.tsx
├ ── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   └── utils.ts
├── supabase/
│   └── migrations/
└── middleware.ts
```

## 🔒 Zabezpečení

- Row Level Security (RLS) na všech tabulkách
- Protected routes přes Next.js middleware
- Secure cookies pro session management
- Environment variables pro citlivé údaje

## 📝 License

MIT

## 🤝 Contributing

Pull requesty jsou vítány!

## 📧 Kontakt

Pro otázky a podporu kontaktujte autora.
