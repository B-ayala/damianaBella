# Cloudinary Image Management - Setup Guide

## ✅ Implementación Completada

He creado un sistema completo de gestión de imágenes con Cloudinary y Supabase. Aquí está lo que se implementó:

### Backend (Node/Express)

**Nuevos archivos:**
- `lia-ecommerce/controllers/cloudinaryController.js` - Endpoints para firmar uploads y eliminar imágenes
- `lia-ecommerce/controllers/productController.js` - CRUD de productos
- `lia-ecommerce/routes/productRoutes.js` - Rutas de productos
- `lia-ecommerce/middleware/authMiddleware.js` - Actualizado con validación de token Supabase

**Modificados:**
- `lia-ecommerce/routes/cloudinaryRoutes.js` - Agregado endpoint `/delete`
- `lia-ecommerce/server.js` - Montadas nuevas rutas

### Frontend (React)

**Nuevos archivos:**
- `damiana-bella/src/services/productService.ts` - Servicio para llamadas a API
- `damiana-bella/src/admin/components/ProductGallery/ProductGallery.tsx` - Galería de productos
- `damiana-bella/src/admin/components/ProductGallery/ProductGallery.css` - Estilos galería

**Modificados:**
- `damiana-bella/src/admin/components/ProductModal/ProductModal.tsx` - Integración con Cloudinary signed uploads y guardar en Supabase
- `damiana-bella/index.html` - Agregado script de Cloudinary
- `damiana-bella/src/admin/store/adminStore.ts` - Agregados `addProduct` y `updateProduct`

---

## 🔧 Pasos de Configuración

### 1. Crear tabla `productos` en Supabase

Ejecuta este SQL en el SQL Editor de Supabase:

```sql
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null,
  stock integer not null default 0,
  category text,
  image_url text,
  public_id text,
  has_promo boolean default false,
  promo_price numeric(10,2),
  description text,
  status text default 'active' check (status in ('active', 'inactive')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Habilitar RLS y crear política para admins
alter table public.productos enable row level security;

create policy "Admins can CRUD productos"
  on public.productos
  for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');
```

### 2. Configurar variables de entorno

#### Backend (`lia-ecommerce/.env`)

Asegúrate de tener:
```
CLOUDINARY_CLOUD_NAME=dnvmrfidc
CLOUDINARY_API_KEY=212835282461621
CLOUDINARY_API_SECRET=tu_api_secret_aquí    # Reemplaza con tu API Secret real
```

#### Frontend (`damiana-bella/.env.local`)

Asegúrate de tener:
```
VITE_API_URL_LOCAL=http://localhost:3000/api
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### 3. Cloudinary - Configurar Upload Preset

Ve a [https://cloudinary.com/console/settings/upload](https://cloudinary.com/console/settings/upload):

1. **Busca el preset "Liastore"**
2. **Cambia el tipo a "Signed"** (si aún no está así)
3. **En la sección "Folder", asegúrate que sea "productos"**
4. **Guarda los cambios**

### 4. Instalar dependencias backend (si es necesario)

```bash
cd lia-ecommerce
npm install jsonwebtoken  # Para validar tokens Supabase
npm run dev
```

### 5. Iniciar ambos servidores

**Terminal 1 - Backend:**
```bash
cd lia-ecommerce
npm run dev
# Debe escuchar en http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd damiana-bella
npm run dev
# Debe estar en http://localhost:5173
```

---

## 📚 Flujo de Uso

### Para Admin - Subir Producto:

1. Ve a `/admin/products`
2. Haz clic en **"Nuevo Producto"** o **"Editar"**
3. En la tab "Datos Básicos":
   - Ingresa nombre, categoría, precio, stock
   - Haz clic en **"📤 Subir Imagen"**
   - El widget de Cloudinary se abrirá
   - Selecciona una imagen → se subirá a `productos/` en Cloudinary
   - La URL aparecerá en el input debajo
4. Haz clic en **"Guardar Producto"**
   - Se guardará en Supabase tabla `productos`
   - Se mostrará en la galería

### Para Admin - Eliminar Producto:

1. En la galería, busca el producto
2. Haz clic en el botón **"🗑️ Eliminar"**
3. Confirma la eliminación
   - Se elimina de Cloudinary (carpeta `productos/`)
   - Se elimina de Supabase
   - Se remueve de la galería

### Para Clientes - Ver Productos:

- La lista de productos está en `supabase.from('productos').select('*')`
- Pueden usarse en cualquier página pública usando `productService.fetchProducts()`

---

## 🔐 Seguridad

- ✅ **API_SECRET de Cloudinary** nunca llega al frontend (solo en backend)
- ✅ **Firma (signature)** se genera en backend para signed uploads
- ✅ **Eliminación de imágenes** protegida: requiere JWT + rol admin
- ✅ **RLS en Supabase** asegura solo admins pueden modificar `productos`

---

## 📝 API Endpoints

### Cloudinary

```
POST /api/cloudinary/sign
  - Body: vacío
  - Response: { success: true, data: { signature, timestamp, cloudName, apiKey } }

POST /api/cloudinary/delete
  - Headers: Authorization: Bearer {token}
  - Body: { publicId: "..." }
  - Response: { success: true, data: { deleted: {...} } }
```

### Products

```
GET /api/products
  - Query: ?limit=50&offset=0
  - Response: { success: true, data: [...], count, limit, offset }

GET /api/products/:id
  - Response: { success: true, data: {...} }

POST /api/products (ADMIN)
  - Headers: Authorization: Bearer {token}
  - Body: { name, price, stock, category, imageUrl, publicId, ... }
  - Response: { success: true, data: {...} }

PUT /api/products/:id (ADMIN)
  - Headers: Authorization: Bearer {token}
  - Body: { name, price, stock, ... }
  - Response: { success: true, data: {...} }

DELETE /api/products/:id (ADMIN)
  - Headers: Authorization: Bearer {token}
  - Response: { success: true, message: "Product deleted successfully" }
  - Nota: También elimina la imagen de Cloudinary
```

---

## 🧪 Pruebas Rápidas

### Test Cloudinary Signature:
```bash
curl -X POST http://localhost:3000/api/cloudinary/sign
# Debe devolver: { success: true, data: { signature, timestamp, cloudName, apiKey } }
```

### Test Product Creation:
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "name": "Test Product",
    "price": 99.99,
    "stock": 10,
    "category": "Test",
    "imageUrl": "https://...",
    "publicId": "test-image"
  }'
```

---

## ⚠️ Problemas Comunes

### Error: "Invalid Signature"
- **Causa**: `CLOUDINARY_API_SECRET` es incorrecto o inválido
- **Solución**: Verifica tu API Secret en Cloudinary console

### Error: "Upload preset must be whitelisted for unsigned uploads"
- **Causa**: Preset está configurado como "Signed" pero se intenta unsigned upload
- **Solución**: Asegúrate que en el widget se pasen `uploadSignature` y `uploadSignatureTimestamp`

### Error: "User not authenticated"
- **Causa**: JWT token inválido o expirado
- **Solución**: Vuelve a iniciar sesión en el admin

### Imagen no aparece en galería
- **Causa**: Posible que la tabla no tenga permisos RLS correctos
- **Solución**: Verifica que `auth.jwt() ->> 'role' = 'admin'` está en la política

---

## 📦 Estructura de Carpetas

```
lia-ecommerce/
  ├── controllers/
  │   ├── cloudinaryController.js  (NUEVO)
  │   └── productController.js     (NUEVO)
  ├── routes/
  │   ├── cloudinaryRoutes.js      (ACTUALIZADO)
  │   └── productRoutes.js         (NUEVO)
  ├── middleware/
  │   └── authMiddleware.js        (ACTUALIZADO)
  └── server.js                    (ACTUALIZADO)

damiana-bella/
  ├── src/
  │   ├── services/
  │   │   └── productService.ts    (NUEVO)
  │   ├── admin/
  │   │   ├── components/
  │   │   │   ├── ProductModal/
  │   │   │   │   └── ProductModal.tsx (ACTUALIZADO)
  │   │   │   └── ProductGallery/  (NUEVO)
  │   │   │       ├── ProductGallery.tsx
  │   │   │       └── ProductGallery.css
  │   │   └── store/
  │   │       └── adminStore.ts    (ACTUALIZADO)
  └── index.html                   (ACTUALIZADO)
```

---

## 🚀 Próximos Pasos

1. **Integrar ProductGallery en la página de Products del admin**
   - En `damiana-bella/src/admin/pages/Products/Products.tsx`
   - Importa ProductGallery y úsalo para listar productos

2. **Agregar más campos al producto** (descripción, especificaciones, FAQ, etc.)
   - Actualiza el componente ProductModal para los otros tabs

3. **Implementar búsqueda y filtros** en la galería
   - Agregar inputs de búsqueda en ProductGallery

4. **Mostrar productos en la tienda pública**
   - Usar `productService.fetchProducts()` en páginas de inicio/catálogo
   - Crear componentes de visualización para clientes

---

¡Listo! Ahora puedes subir, listar y eliminar imágenes con Cloudinary integrado a tu e-commerce. 🎉
