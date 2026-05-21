# CTS — Creative Technologies and Simulation Lab — STEM Innovation Showcase

A cinematic, immersive landing page for **Creative Technologies and Simulation Lab (CTS)** at the Posts & Telecommunications Institute of Technology (PTIT). Designed with an editorial dark aesthetic inspired by [landonorris.com](https://landonorris.com/), featuring horizontal scroll galleries, GSAP-powered animations, and a full CMS backend for content management.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.2.4 | React framework (App Router, Turbopack) |
| **React** | 19 | UI library |
| **TypeScript** | 5 | Type safety |
| **Tailwind CSS** | 4 | Utility-first styling |
| **Payload CMS** | 3.84 | Headless CMS (admin dashboard, REST API, localization) |
| **GSAP** | 3.15+ | Animation engine (ScrollTrigger, SplitText) |
| **Lenis** | 1.3 | Smooth scrolling engine |
| **Three.js** | 0.184 | 3D globe + particle effects (React Three Fiber) |
| **SQLite** | — | Local database via @payloadcms/db-sqlite |
| **Lucide React** | — | Icon library |

## Features

### 🎬 Cinematic Animations (GSAP + Lenis)
- **Hero section** — Letter-by-letter "CTS LAB" reveal with red glow parallax and 3D globe background
- **Horizontal scroll gallery** — Pinned section with `containerAnimation` pattern, projects slide horizontally as you scroll vertically
- **Scroll-triggered reveals** — Every section animates in with staggered entrance effects
- **Smooth scrolling** — Lenis engine synced with GSAP ScrollTrigger for 60fps butter-smooth navigation

### 🖥️ Editorial Design (landonorris.com inspired)
- **Red + White theme** — Primary `#DC2626` on `#FFFFFF` background with subtle grain texture overlay
- **Massive typography** — `clamp(3rem, 12vw, 10rem)` hero headlines using Space Grotesk
- **Split-screen sections** — Research / Products side-by-side with scroll-triggered reveals
- **Hall of Fame grid** — Staggered product cards with hover zoom and category badges
- **Editorial team cards** — Large grayscale photos with social link overlays on hover
- **Minimal footer** — Red accent line, social icons, clean layout

### 🗄️ Full CMS Backend (Payload CMS v3)
- **Admin dashboard** at `/admin` — Manage all content without touching code
- **Collections**: Products, Team Members, Media uploads, Contact Submissions, Users
- **Globals**: Site Settings (hero text, mission, contact info, social links), Partners
- **Built-in localization** — English / Vietnamese, managed from admin panel
- **REST API** at `/api/products`, `/api/team`, `/api/site-settings`, etc.
- **Contact form** — Submissions stored in database, viewable in admin

### 🌐 3D Elements (Three.js / React Three Fiber)
- **Red wireframe globe** — Rotating sphere with floating particles in the hero
- **Background particles** — Ambient red particle system across the viewport
- Both styled to match the red/white design system

### 🎥 VR Virtual Tour
- **360° campus tour** — Embedded KRPano-based VR tour at `/vr-tour`
- Walk through buildings, labs, library, classrooms, and more
- Interactive hotspots with info popups and Vietnamese TTS narration

### 📱 Responsive Design
- Mobile-first with `sm:`, `lg:` breakpoints
- Hamburger navigation on mobile
- All animations respect `prefers-reduced-motion`

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Seed database with sample content (products, team, partners, settings)
npm run seed

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Admin Dashboard

Navigate to [http://localhost:3000/admin](http://localhost:3000/admin) to manage content:

- **Email**: `admin@cts.ptit.edu.vn`
- **Password**: `admin123`

From the admin you can:
- Add/edit/delete **Products** with images, categories, tags, and featured flags
- Manage **Team Members** with photos, bios, and social links
- Upload **Media** (images are automatically resized to thumbnail, card, and hero sizes)
- Edit **Site Settings** (hero headline, mission statement, contact info, social links)
- Manage **Partners** (logo grid on the homepage)
- View **Contact Submissions** from the contact form
- Switch between **English and Vietnamese** for all localized content

## Project Structure

```
src/
├── app/
│   ├── globals.css              # Red/black design system tokens
│   ├── layout.tsx               # Root layout (fonts, SmoothScroll)
│   ├── page.tsx                 # Homepage assembly (all sections)
│   └── (payload)/               # Payload CMS routes
│       ├── admin/[...segments]/ # Admin dashboard at /admin
│       ├── api/[...slug]/       # REST API at /api/*
│       └── importMap.ts         # Payload import map
├── collections/                 # Payload CMS collections
│   ├── Products.ts              # Product schema (title, category, year, image, tags)
│   ├── Team.ts                  # Team member schema (name, role, bio, social)
│   ├── Media.ts                 # Image uploads with responsive sizes
│   ├── ContactSubmissions.ts    # Contact form entries
│   └── Users.ts                 # Admin users (auth)
├── globals/                     # Payload CMS globals
│   ├── SiteSettings.ts          # Hero text, mission, contact, social links
│   └── Partners.ts              # Partner logos grid data
├── components/                  # React components
│   ├── Hero.tsx                 # Full-viewport hero with SplitText animation
│   ├── HeroGlobe.tsx            # Three.js red wireframe globe
│   ├── Navbar.tsx               # Transparent → solid on scroll
│   ├── HorizontalScroll.tsx     # GSAP containerAnimation horizontal gallery
│   ├── ShowcaseSection.tsx      # Horizontal scroll showcase wrapper
│   ├── AboutSection.tsx         # Pull-quote mission statement
│   ├── SplitSection.tsx         # Research / Products split-screen
│   ├── ProductShowcase.tsx      # Hall of Fame product grid
│   ├── Team.tsx                 # Editorial team cards
│   ├── Partners.tsx             # Partner logo grid
│   ├── Contact.tsx              # Contact form → Payload API
│   ├── Footer.tsx               # Minimal footer with social links
│   ├── ParticleBackground.tsx   # Red ambient particle system
│   └── SmoothScroll.tsx         # Lenis + GSAP ScrollTrigger sync
├── lib/
│   ├── gsap.ts                  # GSAP plugin registration + defaults
│   ├── lenis.ts                 # Lenis smooth scroll singleton
│   └── payload.ts               # Frontend API client helpers
├── payload.config.ts            # Payload CMS configuration
└── seed.ts                      # Database seed script
```

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#DC2626` | Red accent, CTAs, highlights |
| `--color-bg` | `#FFFFFF` | Main background |
| `--color-surface` | `#FFFFFF` | Card backgrounds |
| `--color-surface-elevated` | `#F3F4F6` | Elevated surfaces |
| `--color-text` | `#111111` | Primary text |
| `--color-text-muted` | `#6B7280` | Secondary text |

**Fonts**: Space Grotesk (headlines) + Be Vietnam Pro (body, Vietnamese support)

## License

This project is for educational and demonstration purposes.
```

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **GSAP over anime.js** | GSAP 3.15+ | ScrollTrigger, SplitText, Draggable — all free. Industry standard for scroll-driven animations |
| **Dark-only theme** | No toggle | Both reference sites (landonorris.com, dverso.io) use dark themes. Cleaner UX without toggle |
| **Cyan accent** | `#06b6d4` | More vibrant on dark backgrounds than red. Tech-forward feel |
| **View Transitions** | Experimental | Graceful degradation in unsupported browsers. Smooth page morphs |
| **Gacha Machine** | GSAP Draggable | Gamified product discovery. Mobile tap fallback |

## References

- [landonorris.com](https://landonorris.com/) — Scroll-driven color transitions, horizontal scroll gallery, cinematic reveals
- [dverso.io/bgremove](https://tools.dverso.io/bgremove/) — Minimal dark atmosphere, centered focus, ambient animation
- [GSAP](https://gsap.com/) — Animation library (now fully free thanks to Webflow)
- [Next.js 16 Docs](https://nextjs.org/docs) — App Router, View Transitions, Turbopack

## License

© 2026 CTS, PTIT. All rights reserved.
