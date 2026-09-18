# Changelog

Todas las modificaciones notables se documentan en este archivo.
El formato sigue [Keep a Changelog](https://keepachangelog.com) y el proyecto adhiere a [SemVer](https://semver.org).

## [Unreleased]

### Changed
- **Sesión sin token persistido en `localStorage`**: el login (`services/authService.ts`)
  ahora pasa por el backend (`POST /api/auth/login`), que deja el refresh
  token de Supabase en una cookie `httpOnly` (nunca llega a JS). El access
  token vive solo en memoria (`services/authTokenStore.ts`) y se renueva solo
  antes de expirar (`POST /api/auth/refresh`, usa la cookie automáticamente).
  Al recargar la página, la sesión se recupera con esa cookie en vez de leerse
  de `localStorage` (bootstrap en `App.tsx`). `config/supabaseClient.ts` pasa
  a `persistSession: false` / `autoRefreshToken: false`. Las queries directas
  a Supabase (perfil, productos, admin, despachos) siguen igual: usan el
  access token en memoria vía `supabase.auth.setSession()`.
- Mitiga robo persistente del token de sesión vía XSS (antes: `localStorage`,
  legible por cualquier script).

### Fixed
- El header ya no puede mostrar un usuario "logueado" con el token muerto
  tras una sesión vencida (bug conocido: quedaba el nombre cacheado en
  `localStorage` aunque `/auth/v1/user` ya devolviera 403).
