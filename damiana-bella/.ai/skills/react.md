# Skill: React + TypeScript (Frontend — damiana-bella)

## Stack
- React 19 + TypeScript + Vite
- Material-UI (MUI v7) + Emotion
- Zustand v5
- TanStack Query v5 (instalado, uso parcial)
- React Router v7
- Supabase JS SDK v2
- Lucide React (iconos)
- Framer Motion (animaciones)
- React Hook Form

## Estructura de carpetas
```
src/
├── admin/              # Panel admin (/admin/*)
│   ├── components/     # CarouselManager, ProductGallery, ProductModal, ProductTable, FeaturedProductsManager
│   ├── layout/         # AdminHeader, AdminSidebar, AdminLayout
│   ├── pages/          # Dashboard, Products, Sales, Dispatches, Users, AboutEditor, FooterEditor, HomeManager, CloudinaryManager
│   ├── routes/         # AdminProtectedRoute
│   └── store/          # adminStore.ts
├── users/              # Area publica
│   ├── components/     # ProductCard, ProductGrid, Carousel, NavBar, TopNavBar, UserProfileDropdown, AuthModal, PurchaseVariantModal
│   ├── layout/         # UserLayout
│   └── pages/          # Home, Products, ProductDetail, Checkout, CheckoutResult, About, Contact, auth/EmailConfirmation
├── components/common/  # Footer, Modal, ConfirmationModal, VariantTable, WhatsAppButton, ScrollToTop
├── config/             # supabaseClient.ts
├── routes/             # AppRouter.tsx
├── services/           # userService.ts, productService.ts, orderService.ts
├── store/              # cartStore.ts
├── types/              # product.ts
└── utils/              # apiFetch.ts, theme.ts, ThemeProvider.tsx, constants.ts, validation.ts
```

## Convenciones de estilos (orden de prioridad)
1. **MUI primero**: usar componentes MUI, prop `sx`, variantes del tema y `theme.ts` — cubre la mayoria de los casos
2. **Emotion segundo**: `css` o `styled` de `@emotion/react` para estilos dinamicos o reutilizables no contemplados por MUI
3. **CSS plano como ultimo recurso**: archivo `.css` colindante al componente (NO CSS Modules, NO styled-components) solo cuando MUI/Emotion no alcanzan
   - Importar: `import './ComponentName.css'`
   - Clases: kebab-case con prefijo descriptivo (ej: `admin-sales-page`, `sale-card-buyer`)
   - Responsive: mobile-first con `@media (min-width: 640px)` y `@media (min-width: 1024px)`

## Patrones de datos
- Leer Supabase directo (publico/admin): `supabase.from('tabla').select().order()`
- Llamar backend Express: `apiFetch()` wrapper o `fetch()` directo con `VITE_API_URL_LOCAL`
- Estado global: Zustand, acceder con hook `useAdminStore()` o `useCartStore()`
- Paginacion local: `slice((page-1)*PER_PAGE, page*PER_PAGE)` + MUI `<Pagination>`

## Routing
| Grupo | Layout | Guard |
|---|---|---|
| Publico | `UserLayout` (NavBar + Footer) | - |
| Admin | `AdminLayout` (Header + Sidebar) | `AdminProtectedRoute` |

Rutas publicas: `/`, `/products`, `/product/:id`, `/checkout`, `/checkout/result`, `/contact`, `/about`
Rutas admin: `/admin/home`, `/admin/products`, `/admin/users`, `/admin/sales`, `/admin/dispatches`, `/admin/about`, `/admin/site-config`, `/admin/cloudinary`

## Auth (frontend)
1. `supabase.auth.signInWithPassword()` → lee `profiles` (name, role)
2. Si `role === 'admin'` → `adminStore.isAuthenticated = true`
3. `AdminProtectedRoute` verifica el store
4. Signup requiere confirmacion de email (OTP via `/auth/confirm`)

## Estado del carrito
- Un solo producto a la vez (by design)
- `cartStore.ts`: `item: CartItem | null`, acciones `setItem` / `clearItem`
- `CartItem`: `{ product, quantity, unitVariants[], unitPrice, totalPrice }`

## Deployment
- GitHub Pages con base path `/LIA/`
- Assets deben usar `import.meta.env.BASE_URL` como prefijo
- Script: `npm run deploy` desde `damiana-bella/`
- El `.nojekyll` se genera automaticamente en `predeploy`
