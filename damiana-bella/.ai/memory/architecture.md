# Frontend Architecture — damiana-bella

## Stack

- React 18 + TypeScript + Vite
- Material-UI (MUI) + Emotion (CSS-in-JS)
- Zustand (state management)
- React Query / TanStack Query (caching, instalado pero uso parcial)
- React Router v6
- Supabase JS SDK
- Axios / fetch nativo (`apiFetch` wrapper)

---

## Estructura de `src/`

```
src/
├── admin/                  # Todo lo relacionado al panel admin
│   ├── components/         # CarouselManager, ProductGallery, ProductModal, ProductTable, FeaturedProductsManager
│   ├── layout/             # AdminHeader, AdminSidebar, AdminLayout
│   ├── pages/              # Dashboard, Products, Users, Sales, Dispatches, AboutEditor, FooterEditor, HomeManager, CloudinaryManager
│   ├── routes/             # AdminProtectedRoute
│   └── store/              # adminStore.ts (Zustand)
├── users/                  # Todo lo relacionado al usuario público
│   ├── components/         # ProductCard, ProductGrid, Carousel, NavBar, TopNavBar, AuthModal, PurchaseVariantModal
│   ├── layout/             # UserLayout
│   └── pages/              # Home, Products, ProductDetail, Checkout, CheckoutResult, About, Contact, auth/EmailConfirmation
├── components/
│   └── common/             # Footer, Modal, ConfirmationModal, WhatsAppButton, ScrollToTop, VariantTable
├── config/
│   └── supabaseClient.ts   # Instancia única del cliente Supabase
├── routes/
│   └── AppRouter.tsx       # Árbol de rutas principal
├── services/               # Capa de acceso a datos
│   ├── userService.ts
│   ├── productService.ts
│   └── orderService.ts
├── store/
│   └── cartStore.ts        # Zustand — carrito (un solo item a la vez)
├── types/
│   └── product.ts          # Product, Variant, Specification, FAQ, Review
└── utils/
    ├── apiFetch.ts         # Wrapper sobre fetch (base URL, headers)
    ├── theme.ts            # Tema MUI personalizado
    ├── ThemeProvider.tsx
    ├── constants.ts
    └── validation.ts
```

---

## Routing — `AppRouter.tsx`

Tres grupos de rutas:

| Grupo | Layout | Guard |
|---|---|---|
| Auth | ninguno | — |
| Público | `UserLayout` (NavBar + Footer) | — |
| Admin | `AdminLayout` (Header + Sidebar) | `AdminProtectedRoute` |

### Rutas públicas
- `/` — Home
- `/products` — listado
- `/product/:id` — detalle
- `/checkout` — checkout
- `/checkout/result` — resultado de pago
- `/contact`, `/about`

### Rutas admin (`/admin/*`)
- `home` — HomeManager (carousel + destacados)
- `products` — CRUD de productos
- `users` — gestión de usuarios
- `about` — editor de página About
- `site-config` — editor de Footer
- `cloudinary` — gestor de imágenes
- `sales` — ventas
- `dispatches` — despachos

---

## State Management (Zustand)

### `adminStore.ts` — `useAdminStore`
Estado global del panel admin. Contiene:
- `isAuthenticated`, `currentUser` — sesión admin
- `products: AdminProduct[]`
- `users: AdminUser[]`
- `carouselImages: CarouselImage[]`
- `aboutInfo: AboutInfo`
- `footerInfo: FooterInfo`
- Acciones: login/logout, CRUD de productos, carousel, usuarios, about, footer

El login llama a `userService.loginUser()` y solo autentica si `role === 'admin'`.

### `cartStore.ts` — `useCartStore`
Carrito de un solo item (un producto a la vez):
- `item: CartItem | null` — producto, cantidad, variantes por unidad, precios
- `setItem`, `clearItem`

---

## Servicios (`src/services/`)

### `userService.ts`
- **Supabase Auth**: `createUser`, `loginUser`, `logoutUser`, `getCurrentUser`, `changePassword`, `resendConfirmationEmail`, `verifyEmailConfirmation`
- **Backend API** (Express): `getAdminUsers`, `deleteAdminUser`, `updateUserRole`
- **Rate limit helpers**: `getSignupStatus`, `notifyRateLimit`

Signup flow:
1. Verifica cooldown en backend
2. Llama a `supabase.auth.signUp()`
3. El trigger `handle_new_user()` crea la fila en `profiles`
4. Intenta best-effort update del nombre en `profiles`

### `productService.ts`
- **Supabase directo** (lectura): `fetchProducts`, `fetchAllProducts`, `fetchProductById`, `fetchFeaturedProducts`, `fetchCategories`, `fetchCategoriesTree`, carousel CRUD
- **Backend API** (escritura/admin): `createProduct`, `updateProduct`, `deleteProduct`, Cloudinary (sign, folders, images, delete, config)
- `mapDbRowToProduct()` — normaliza la fila de Supabase al tipo `Product`

### `orderService.ts`
- `createOrder()` — inserta en `ventas` directamente via Supabase (pago por transferencia bancaria)
- `createMpPreference()` — llama al backend para crear preferencia de Mercado Pago, retorna `init_point` + `order_id`

---

## Auth Flow (frontend)

1. Login via `supabase.auth.signInWithPassword()`
2. Se lee `profiles` para obtener `name` y `role`
3. Si `role === 'admin'` → `adminStore.isAuthenticated = true`
4. `AdminProtectedRoute` verifica `isAuthenticated` del store
5. Signup requiere confirmación de email (`/auth/confirm` con token OTP)

---

## Data Layer — Supabase Tables (usadas desde el front)

| Tabla | Operaciones |
|---|---|
| `auth.users` | Supabase Auth (transparente) |
| `profiles` | read (role, name) — write via backend o trigger |
| `productos` | read (público), write via backend API |
| `carousel_images` | read/write directo Supabase |
| `categories` | read/write directo Supabase |
| `ventas` | write directo Supabase (transferencia) |

---

## Tipos principales (`types/product.ts`)

```ts
Product { id, name, price, image, images[], description, category, discount,
          stock, condition, freeShipping, variants[], specifications[], features[],
          faqs[], reviews[], warranty, returnPolicy }

Variant        { name, options[] }
Specification  { label, value }
FAQ            { question, answer }
CartItem       { product, quantity, unitVariants[], unitPrice, totalPrice }
```

---

## Styling

- Tema MUI personalizado en `utils/theme.ts`, provisto por `utils/ThemeProvider.tsx`
- Emotion para estilos inline/CSS-in-JS
- Antes de agregar estilos nuevos, reutilizar estilos globales, tema y patrones visuales existentes para mantener consistencia y evitar duplicacion
- Si un componente necesita estilos propios, definirlos de forma aislada en su archivo colindante o en su capa local de estilos, evitando impacto sobre otros componentes
- Deployment a GitHub Pages con `basePath: /LIA/` — los imports de assets deben respetar `import.meta.env.BASE_URL`
