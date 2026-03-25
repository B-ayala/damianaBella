# Spec: Ventas

## Descripcion
Sistema de registro y gestion de ordenes de compra. Soporta dos metodos de pago: transferencia bancaria (escritura directa a Supabase) y Mercado Pago (via backend Express). El panel admin permite ver, filtrar y actualizar el estado de pago de cada venta.

---

## Tabla `ventas` (Supabase)

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | uuid | PK auto-generado |
| `buyer_name` | text / null | Nombre del comprador |
| `buyer_email` | text / null | Email del comprador |
| `product_id` | int / null | FK a `productos.id` |
| `product_name` | text | Nombre del producto al momento de la venta (snapshot) |
| `product_image` | text / null | URL imagen del producto |
| `quantity` | int | Cantidad de unidades |
| `unit_price` | numeric | Precio por unidad |
| `total_price` | numeric | Precio total |
| `units_config` | jsonb | Array de variantes por unidad `[{ talle: "S", color: "rojo" }, ...]` |
| `payment_method` | text | `'mp'` o `'transfer'` |
| `payment_status` | text | `'pendiente'` o `'pagado'` |
| `shipping_method` | text / null | `'correo'`, `'moto'` o `'local'` |
| `created_at` | timestamptz | Auto |

---

## Flujo de creacion de orden

### Transferencia bancaria
1. Usuario completa el checkout en `Checkout.tsx`
2. Front llama `orderService.createOrder()` — insert directo a Supabase
3. `payment_status` se inicia en `'pendiente'`
4. El admin cambia el estado a `'pagado'` manualmente desde `Sales.tsx`
5. **Nota**: `createOrder` es silent-fail — si el insert falla, el flujo de pago continua igual

### Mercado Pago
1. Usuario elige MP en el checkout
2. Front llama `orderService.createMpPreference()` → `POST /api/orders/mp-preference`
3. El backend crea la preferencia en MP y registra la venta en `ventas`
4. Backend retorna `{ init_point, order_id }`
5. Front redirige al usuario al `init_point` de MP
6. MP redirige al usuario a `/checkout/result` con el estado del pago

---

## Panel Admin — `Sales.tsx` (`/admin/sales`)

### Funcionalidades
- Lista todas las ventas ordenadas por `created_at` DESC
- Busqueda por nombre de producto, nombre de comprador o email
- Filtros: estado de pago (`pendiente` / `pagado`), metodo de pago (`mp` / `transfer`), stock actual (`low_stock` ≤5 / `out_of_stock`)
- Badges de resumen: total, pendientes de pago, pagadas, con producto sin stock
- Alertas de stock: productos activos con `stock <= 5`, ordenados por stock ASC
- Toggle de `payment_status` con clic directo en el badge (actualiza Supabase al instante)
- Paginacion: 10 items por pagina con MUI `Pagination`
- Vista responsiva: cards en mobile, tabla en desktop (≥1024px)

### Metodos de pago — etiquetas
| Valor | Etiqueta |
|---|---|
| `mp` | Mercado Pago |
| `transfer` | Transferencia |

### Metodos de envio — etiquetas
| Valor | Etiqueta |
|---|---|
| `correo` | Correo Argentino |
| `moto` | Envio por moto |
| `local` | Retiro en local |

---

## Panel Admin — `Dispatches.tsx` (`/admin/dispatches`)

Vista paralela sobre la misma tabla `ventas`, enfocada en la logistica. Permite avanzar el estado de despacho de cada orden. Estados de despacho:
- `pendiente` — sin procesar
- `en_preparacion` — preparando envio
- `despachado` — enviado
- `listo_para_retiro` — listo para retirar en local

---

## Tipos TypeScript

```ts
// orderService.ts
interface CreateOrderPayload {
  buyerName: string;
  buyerEmail: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unitsConfig: UnitVariants[];
  paymentMethod: string;
  shippingMethod?: string;
}

interface MpPreferenceResult {
  init_point: string;
  order_id: string;
}

// Sales.tsx (local)
interface Sale {
  id: string;
  buyer_name: string | null;
  buyer_email: string | null;
  product_id: number | null;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  units_config: Record<string, string>[] | null;
  payment_method: string;
  payment_status: 'pendiente' | 'pagado';
  shipping_method: string | null;
  created_at: string;
  current_stock?: number; // join desde productos
}
```

---

## Notas importantes
- El stock **no se descuenta automaticamente** al crear una venta. Se hace manualmente o con un futuro trigger SQL
- `units_config` es JSONB para soportar variantes flexibles sin tablas relacionales adicionales
- El webhook de Mercado Pago aun no esta implementado — `payment_status` para MP se actualiza manualmente igual que en transferencia
- El carrito soporta un solo producto a la vez (by design en `cartStore.ts`) para simplificar el flujo de compra
