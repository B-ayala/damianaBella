# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## AI Context (.ai/)

Al inicio de cada conversacion, leer los siguientes archivos para tener contexto completo del proyecto:

- `damiana-bella/.ai/config.json` — stack, arquitectura, puertos, tablas de BD
- `damiana-bella/.ai/personality.md` — rol, principios y forma de trabajar
- `damiana-bella/.ai/memory/architecture.md` — arquitectura detallada del frontend
- `damiana-bella/.ai/skills/react.md` — convenciones, patrones y estructura del frontend
- `damiana-bella/.ai/skills/node.md` — convenciones y rutas del backend

Si el prompt involucra ventas, despachos o el flujo de compra, leer tambien:
- `damiana-bella/.ai/specs/ventas.md` — spec completa del modulo de ventas
- `damiana-bella/.ai/tasks/ventas-tasks.md` — tareas completadas y pendientes

---

## Project Overview

Full-stack e-commerce application for a fashion brand. Two sub-projects:
- `damiana-bella/` — React + Vite + TypeScript frontend
- `lia-ecommerce/` — Express + PostgreSQL backend

## Commands

### Frontend (damiana-bella/)
```bash
cd damiana-bella
npm run dev        # Start dev server on port 5173
npm run build      # TypeScript check + Vite build
npm run lint       # ESLint
npm run preview    # Preview production build locally
npm run deploy     # Build + deploy to GitHub Pages
```

### Backend (lia-ecommerce/)
```bash
cd lia-ecommerce
npm run dev        # Start with nodemon (port 3000)
npm start          # Start without nodemon
npm run init-db    # Initialize/reset PostgreSQL schema
```

## Architecture

### Auth Flow
Supabase Auth handles all authentication. On signup, a Supabase database trigger automatically creates a row in `public.profiles` with `role='user'`. The backend (`lia-ecommerce`) is a thin layer for querying that profiles table — most auth logic lives in `damiana-bella/src/services/userService.ts`.

Admin access is gated by `role === 'admin'` in the profiles table, enforced client-side via `admin/routes/AdminProtectedRoute.tsx` and the Zustand store.

### State Management
A single Zustand store at `admin/store/adminStore.ts` holds all global state: authenticated user, products, users list, carousel images, about/footer content. Most data is loaded into this store on the admin side.

### Frontend Routing
Two route groups in `routes/AppRouter.tsx`:
1. **Public routes** — wrapped in a layout with NavBar + Footer
2. **Admin routes** — wrapped in `AdminProtectedRoute` + admin layout (Header + Sidebar)

### API Calls
- Supabase JS SDK (`config/supabaseClient.ts`) for auth and direct DB reads
- Axios for calls to the Express backend (`VITE_API_URL_LOCAL`)
- React Query (`@tanstack/react-query`) is installed for caching

### Styling
Material-UI with a custom theme defined in `utils/theme.ts`. Emotion for CSS-in-JS.

### Deployment
Frontend deploys to GitHub Pages. Vite base path is `/LIA/` (see `vite.config.ts`). The `predeploy` script adds a `.nojekyll` file to `dist/` to prevent GitHub Pages from ignoring underscore-prefixed files.

## Environment Variables

### Frontend (.env.local)
```
VITE_API_URL_LOCAL=http://localhost:3000/api
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Backend (.env)
```
PORT=3000
DB_HOST=...    # Supabase PostgreSQL host
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=...
DB_NAME=postgres
FRONTEND_URL=http://localhost:5173
```

## Database

Single table: `public.profiles` (Supabase PostgreSQL)
- `user_id` — FK to Supabase `auth.users`
- `role` — `'user'` | `'admin'`
- Auto-updated `updated_at` trigger

Backend REST API: `GET|POST|PUT|DELETE /api/users`, plus `GET /api/users/auth/:userId` to look up by Supabase auth UID.

# Claude Orchestrator

skills:
  - C:\Users\Brian\.claude\skills\sdd-propose
  - C:\Users\Brian\.claude\skills\sdd-verify
