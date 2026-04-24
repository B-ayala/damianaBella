# Tasks: Ventas

## Completadas
- [x] Tabla `ventas` en Supabase con todos los campos necesarios
- [x] `orderService.createOrder()` — insercion directa a Supabase para transferencia bancaria
- [x] `orderService.createMpPreference()` — crea preferencia MP via backend `POST /api/orders/mp-preference`
- [x] Panel admin `Sales.tsx` con lista, filtros, busqueda y paginacion (10 items/pagina)
- [x] Toggle manual de `payment_status` desde el admin (clic en badge)
- [x] Alertas de stock bajo en panel de ventas (productos activos con stock <= 5)
- [x] Vista responsiva en Sales: cards mobile / tabla desktop
- [x] Vista `Dispatches.tsx` para gestion logistica de ordenes (estado de despacho)
- [x] `CheckoutResult.tsx` — pagina de resultado post-pago con Mercado Pago

## Pendientes / Backlog
- [ ] **Webhook de Mercado Pago**: actualizar `payment_status` a `'pagado'` automaticamente al confirmar el pago desde MP
- [ ] **Descuento de stock automatico**: trigger SQL o logica en backend para decrementar `productos.stock` al confirmar una venta
- [ ] **Notificacion por email al comprador**: al confirmar pago o cambiar estado de despacho
- [ ] **Exportacion CSV**: boton en el panel admin para descargar el historial de ventas como CSV
- [ ] **Metricas en Dashboard**: ingresos totales, ventas por periodo, producto mas vendido
- [ ] **Filtro por rango de fechas** en ventas y despachos
- [ ] **Busqueda por ID de orden** en el panel admin

## Decisiones tecnicas registradas
- El carrito soporta un solo producto a la vez — by design para simplificar el flujo de compra
- `units_config` es JSONB para soportar variantes flexibles sin necesidad de tablas relacionales adicionales
- `createOrder` (transferencia) es silent-fail: si falla el insert en Supabase, el flujo de pago al usuario continua igual
- `payment_status` para MP se actualiza manualmente igual que para transferencia hasta que se implemente el webhook
- El `product_name` e imagen se guardan como snapshot al momento de la venta (no FK) para preservar el historial si el producto cambia
