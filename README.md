# 🍀 Clover — Smart Job Application Tracker

A full-stack SaaS for job seekers. Upload resume → get skill-matched jobs → apply in one click → track everything.

## Features
- 🔐 Auth (register, login, forgot/reset password)
- 📄 Resume upload + AI skill extraction (Gemini)
- 🎯 Skill-matched job feed (Remotive + Arbeitnow + Web3.career)
- ⚡ One-click email apply via Resend (CC to your email)
- 📊 Kanban tracker (Applied → Interview → Offer → Rejected)
- 🎯 Weekly goal tracker
- 🔖 Bookmark jobs
- 📝 Notes per application
- 🤝 Referral network (Snapchat-style connect)
- 💬 Real-time chat (Supabase Realtime)
- 📧 Daily job digest email (Vercel Cron)
- 🌙 Dark mode
- 📱 PWA (installable on mobile)
- 👑 Admin panel
- 🔒 Privacy Policy + Terms pages
- 🔍 SEO optimized

## Stack
- **Frontend/Backend**: Next.js 14 (App Router) → Vercel (free)
- **Database**: Supabase PostgreSQL (free)
- **Storage**: Supabase Storage (free)
- **Auth**: Supabase Auth (free)
- **Email**: Resend (free, 3000/month)
- **PDF Parse**: pdf-parse + Gemini API (free)
- **Animations**: GSAP

## Setup (30 minutes)

### 1. Clone & install
```bash
git clone <your-repo>
cd clover
npm install
```

### 2. Create .env.local
```
cp .env.example .env.local
# Fill in your keys (see below)
```

### 3. Supabase setup
1. Go to supabase.com → New project
2. Copy Project URL + anon key + service role key
3. Go to SQL Editor → paste contents of lib/supabase/schema.sql → Run
4. Go to Storage → Create bucket named `resumes` → Set to Public

### 4. Resend setup
1. Already verified rahulpatle.xyz → copy API key
2. Set EMAIL_FROM=noreply@rahulpatle.xyz

### 5. Gemini API (free)
1. Go to aistudio.google.com
2. Get API key (free, 15 req/min)

### 6. Deploy to Vercel
1. Push to GitHub
2. Import on vercel.com
3. Add all env variables in Vercel dashboard
4. Deploy → Done 🚀

### 7. Make yourself admin
Run in Supabase SQL Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'rahulpatle.dev@gmail.com';
```

## Env Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
EMAIL_FROM=noreply@rahulpatle.xyz
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=https://clover.rahulpatle.xyz
NEXT_PUBLIC_APP_NAME=Clover
```
