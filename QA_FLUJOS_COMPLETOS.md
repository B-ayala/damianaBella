# Plan de Testing QA — Damiana Bella E-Commerce

## Convenciones del documento

- **PRE:** Precondiciones necesarias antes de ejecutar el caso
- **PASO:** Acción que ejecuta el tester
- **ESPERADO:** Resultado esperado verificable
- **SEVERIDAD:** Critica / Alta / Media / Baja
- **TIPO:** Funcional / Regresion / Borde / Negativo / Seguridad / Performance

---

# MODULO 1: REGISTRO DE USUARIO

## CP-1.1: Registro exitoso con datos validos

- **TIPO:** Funcional
- **SEVERIDAD:** Critica
- **PRE:** No existe cuenta con el email a usar. No hay rate limit activo.

| # | Paso | Esperado |
|---|------|----------|
| 1 | Abrir modal de autenticacion | Modal visible con opciones Login/Registro |
| 2 | Seleccionar "Registrarse" | Formulario de registro visible: nombre, email, telefono, contrasena |
| 3 | Completar todos los campos con datos validos | Campos aceptan input sin errores de validacion |
| 4 | Click en "Registrarse" | Sistema consulta GET /api/users/signup-status/:email |
| 5 | — | Sistema llama supabase.auth.signUp |
| 6 | — | Trigger handle_new_user() crea fila en profiles con role='user' |
| 7 | — | Modal muestra mensaje "Revisa tu email para confirmar tu cuenta" |
| 8 | Verificar en Supabase que auth.users tiene nueva fila | Fila existe con email correcto |
| 9 | Verificar en profiles que existe fila con id del user | Fila existe con role='user' |

---

## CP-1.2: Registro con email ya confirmado

- **TIPO:** Negativo
- **SEVERIDAD:** Alta
- **PRE:** Existe cuenta confirmada con email test@test.com

| # | Paso | Esperado |
|---|------|----------|
| 1 | Abrir modal registro | Modal visible |
| 2 | Completar con email test@test.com | Campo acepta input |
| 3 | Click en "Registrarse" | Error: "Este email ya tiene una cuenta" |
| 4 | — | No se crea fila nueva en auth.users |
| 5 | — | No se crea fila nueva en profiles |

---

## CP-1.3: Registro con email pendiente de confirmacion

- **TIPO:** Negativo
- **SEVERIDAD:** Alta
- **PRE:** Existe cuenta sin confirmar con email pendiente@test.com

| # | Paso | Esperado |
|---|------|----------|
| 1 | Intentar registro con pendiente@test.com | Error: "Tenes una confirmacion pendiente" |
| 2 | — | No se crea fila duplicada |

---

## CP-1.4: Rate limit de Supabase

- **TIPO:** Negativo / Seguridad
- **SEVERIDAD:** Alta
- **PRE:** Provocar rate limit haciendo multiples signups rapidos

| # | Paso | Esperado |
|---|------|----------|
| 1 | Intentar registro que provoca 429 de Supabase | Frontend llama POST /api/users/signup-ratelimit con email |
| 2 | — | Backend registra cooldown de 60s en memoria |
| 3 | — | Error: "Demasiados intentos" |
| 4 | Intentar registrarse de nuevo con mismo email | GET /api/users/signup-status/:email retorna blocked=true |
| 5 | — | Error: "Espera X segundos" con countdown |
| 6 | Esperar 60 segundos e intentar de nuevo | Registro procede normalmente |

---

## CP-1.5: Rate limit acumulativo (6+ en 1 hora)

- **TIPO:** Borde / Seguridad
- **SEVERIDAD:** Media
- **PRE:** Provocar 6 rate limits en una hora

| # | Paso | Esperado |
|---|------|----------|
| 1 | Provocar 6to rate limit en la hora | Cooldown se extiende progresivamente |
| 2 | — | remainingAttempts = 0 |
| 3 | Verificar que el bloqueo persiste | blocked=true con segundos restantes mayores |

---

## CP-1.6: Confirmacion de email exitosa

- **TIPO:** Funcional
- **SEVERIDAD:** Critica
- **PRE:** Registro completado, email de confirmacion recibido

| # | Paso | Esperado |
|---|------|----------|
| 1 | Click en link del email de confirmacion | Navega a /auth/confirm?token_hash=XXX&code=YYY |
| 2 | — | Pagina EmailConfirmation se monta |
| 3 | — | Llama supabase.auth.verifyOtp con token |
| 4 | — | email_confirmed_at se setea en auth.users |
| 5 | — | profiles.name se sincroniza desde user_metadata |
| 6 | — | BroadcastChannel emite evento |
| 7 | — | localStorage('db_email_confirmation_event') se escribe |
| 8 | Esperar 1.5s | Pestana se cierra automaticamente |
| 9 | Verificar en otra pestana abierta del sitio | Recibe notificacion de confirmacion |

---

## CP-1.7: Token de confirmacion expirado

- **TIPO:** Negativo
- **SEVERIDAD:** Alta
- **PRE:** Link de confirmacion con token expirado

| # | Paso | Esperado |
|---|------|----------|
| 1 | Click en link con token expirado | Navega a /auth/confirm |
| 2 | — | verifyOtp falla |
| 3 | — | Modal de error: "El link de confirmacion expiro" |
| 4 | — | email_confirmed_at sigue en null |

---

## CP-1.8: Token de confirmacion invalido

- **TIPO:** Negativo
- **SEVERIDAD:** Alta
- **PRE:** URL con token_hash manipulado

| # | Paso | Esperado |
|---|------|----------|
| 1 | Navegar a /auth/confirm?token_hash=INVALIDO | Modal de error: "El link no es valido" |
| 2 | — | No se modifica auth.users |

---

## CP-1.9: Sincronizacion de nombre falla (best-effort)

- **TIPO:** Borde
- **SEVERIDAD:** Baja
- **PRE:** RLS bloquea update a profiles antes de confirmar email

| # | Paso | Esperado |
|---|------|----------|
| 1 | Registrarse con nombre "Juan" | Signup exitoso |
| 2 | Verificar profiles.name ANTES de confirmar email | name puede ser null (best-effort fallo silenciosamente) |
| 3 | Confirmar email | profiles.name se sincroniza a "Juan" desde user_metadata |

---

## CP-1.10: Confirmacion sincroniza en multiples pestanas

- **TIPO:** Funcional
- **SEVERIDAD:** Media
- **PRE:** Sitio abierto en 2+ pestanas

| # | Paso | Esperado |
|---|------|----------|
| 1 | Abrir sitio en Pestana A y Pestana B | Ambas cargan normalmente |
| 2 | Confirmar email (se abre Pestana C) | Pestana C procesa confirmacion |
| 3 | — | Pestana A recibe evento via BroadcastChannel |
| 4 | — | Pestana B recibe evento via localStorage |
| 5 | — | Pestana C se cierra automaticamente |

---

# MODULO 2: LOGIN

## CP-2.1: Login exitoso (usuario publico)

- **TIPO:** Funcional
- **SEVERIDAD:** Critica
- **PRE:** Cuenta confirmada con email user@test.com y contrasena valida

| # | Paso | Esperado |
|---|------|----------|
| 1 | Abrir modal autenticacion → "Iniciar sesion" | Formulario login visible |
| 2 | Ingresar email y contrasena validos | Campos aceptan input |
| 3 | Click en "Iniciar sesion" | supabase.auth.signInWithPassword ejecuta |
| 4 | — | Consulta profiles para obtener name y role |
| 5 | — | Sesion activa en Supabase SDK |
| 6 | — | Modal se cierra |
| 7 | Verificar UI | Nombre del usuario visible en NavBar |

---

## CP-2.2: Login exitoso (admin)

- **TIPO:** Funcional
- **SEVERIDAD:** Critica
- **PRE:** Cuenta con role='admin'

| # | Paso | Esperado |
|---|------|----------|
| 1 | Acceder a /admin → ingresar credenciales admin | Login exitoso |
| 2 | — | adminStore.isAuthenticated = true |
| 3 | — | adminStore.currentUser tiene id, name, email, role='admin' |
| 4 | — | Redirige a /admin/home |
| 5 | Verificar sidebar admin | Todas las opciones visibles |

---

## CP-2.3: Login con credenciales incorrectas

- **TIPO:** Negativo
- **SEVERIDAD:** Alta
- **PRE:** Ninguna

| # | Paso | Esperado |
|---|------|----------|
| 1 | Ingresar email existente + contrasena incorrecta | Error: "Credenciales incorrectas" |
| 2 | Ingresar email inexistente + cualquier contrasena | Error: "Credenciales incorrectas" (mismo mensaje por seguridad) |
| 3 | — | No se crea sesion |

---

## CP-2.4: Login con email no confirmado

- **TIPO:** Negativo
- **SEVERIDAD:** Alta
- **PRE:** Cuenta registrada sin confirmar email

| # | Paso | Esperado |
|---|------|----------|
| 1 | Intentar login con email sin confirmar | Error: "Confirma tu email primero" |
| 2 | — | No se crea sesion |

---

## CP-2.5: Acceso admin con usuario no-admin

- **TIPO:** Seguridad
- **SEVERIDAD:** Critica
- **PRE:** Cuenta con role='user'

| # | Paso | Esperado |
|---|------|----------|
| 1 | Intentar login desde panel admin | Login exitoso en Supabase |
| 2 | — | adminStore verifica role != 'admin' |
| 3 | — | Error: "No tenes permisos de administrador" |
| 4 | — | isAuthenticated = false |
| 5 | Intentar navegar a /admin/* directamente | AdminProtectedRoute redirige a / |

---

## CP-2.6: Logout

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Usuario logueado

| # | Paso | Esperado |
|---|------|----------|
| 1 | Click en logout (dropdown o sidebar admin) | supabase.auth.signOut() ejecuta |
| 2 | — | adminStore se limpia (si era admin) |
| 3 | — | Redirige a home |
| 4 | Intentar navegar a /admin | Redirige a / |
| 5 | Verificar que no hay sesion activa | NavBar muestra opciones de login |

---

# MODULO 3: RECUPERACION DE CONTRASENA

## CP-3.1: Solicitud de recovery exitosa

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Cuenta confirmada existente

| # | Paso | Esperado |
|---|------|----------|
| 1 | Click "Olvide mi contrasena" en AuthModal | Campo de email visible |
| 2 | Ingresar email existente | Campo acepta |
| 3 | Submit | Mensaje: "Si el email existe, te enviamos un link" |
| 4 | — | Email de recovery recibido con magic link |

---

## CP-3.2: Solicitud con email inexistente

- **TIPO:** Seguridad
- **SEVERIDAD:** Alta
- **PRE:** Email no registrado

| # | Paso | Esperado |
|---|------|----------|
| 1 | Ingresar email inexistente y submit | Mismo mensaje: "Si el email existe, te enviamos un link" |
| 2 | — | NO se envia email (pero usuario no lo sabe — seguridad) |

---

## CP-3.3: Reset de contrasena exitoso

- **TIPO:** Funcional
- **SEVERIDAD:** Critica
- **PRE:** Email de recovery recibido

| # | Paso | Esperado |
|---|------|----------|
| 1 | Click en link del email | Navega a /auth/reset-password?code=XXX |
| 2 | — | Supabase establece sesion recovery |
| 3 | Ingresar nueva contrasena + confirmacion (coinciden) | Campos aceptan |
| 4 | Submit | supabase.auth.updateUser({ password }) ejecuta |
| 5 | — | Contrasena actualizada |
| 6 | — | Redirige a home |
| 7 | Login con nueva contrasena | Login exitoso |
| 8 | Login con contrasena vieja | Falla |

---

## CP-3.4: Contrasenas no coinciden

- **TIPO:** Negativo
- **SEVERIDAD:** Media
- **PRE:** Pagina de reset abierta

| # | Paso | Esperado |
|---|------|----------|
| 1 | Ingresar contrasena "abc123" y confirmacion "abc456" | Error: "Las contrasenas no coinciden" |
| 2 | — | No se actualiza la contrasena |

---

## CP-3.5: Code de recovery expirado

- **TIPO:** Negativo
- **SEVERIDAD:** Alta
- **PRE:** Link de recovery viejo/expirado

| # | Paso | Esperado |
|---|------|----------|
| 1 | Navegar con code expirado | Error al intentar resetear |
| 2 | — | Contrasena no cambia |

---

# MODULO 4: NAVEGACION DEL CATALOGO

## CP-4.1: Carga de Home Page

- **TIPO:** Funcional
- **SEVERIDAD:** Critica
- **PRE:** Ninguna

| # | Paso | Esperado |
|---|------|----------|
| 1 | Navegar a / | Home page carga |
| 2 | — | Banner: si visible=true, se muestra con texto correcto |
| 3 | — | Carousel: imagenes activas ordenadas por campo order |
| 4 | — | Productos destacados: max 10, solo featured=true y status='activo' |
| 5 | — | Footer carga con datos de site_content |

---

## CP-4.2: Banner oculto

- **TIPO:** Funcional
- **SEVERIDAD:** Baja
- **PRE:** site_content banner con visible=false

| # | Paso | Esperado |
|---|------|----------|
| 1 | Navegar a / | Banner NO se muestra |

---

## CP-4.3: Listado de productos con filtro de categoria

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Productos activos en multiples categorias

| # | Paso | Esperado |
|---|------|----------|
| 1 | Navegar a /products | Todos los productos activos visibles |
| 2 | Seleccionar categoria padre "Ropa" | Solo productos de Ropa y todas sus subcategorias |
| 3 | — | URL actualiza a ?category=Ropa |
| 4 | — | Breadcrumbs muestran "Home > Ropa" |
| 5 | Seleccionar subcategoria "Vestidos" | Filtra a Vestidos y sus sub-subcategorias |
| 6 | — | URL actualiza a ?category=Ropa&subcategory=Vestidos |

---

## CP-4.4: Listado sin productos activos

- **TIPO:** Borde
- **SEVERIDAD:** Media
- **PRE:** Todos los productos con status='inactivo'

| # | Paso | Esperado |
|---|------|----------|
| 1 | Navegar a /products | Mensaje de "No hay productos disponibles" o grilla vacia |

---

## CP-4.5: Detalle de producto existente

- **TIPO:** Funcional
- **SEVERIDAD:** Critica
- **PRE:** Producto activo con variantes, imagenes, specs, FAQs

| # | Paso | Esperado |
|---|------|----------|
| 1 | Navegar a /product/:id | Producto carga correctamente |
| 2 | — | Galeria muestra todas las imagenes |
| 3 | — | Variantes renderizadas (Talle: S/M/L/XL, Color) |
| 4 | — | Precio final calculado correctamente segun descuento |
| 5 | — | Tabs de especificaciones y FAQ visibles |
| 6 | — | Stock visible |

---

## CP-4.6: Detalle de producto inexistente

- **TIPO:** Negativo
- **SEVERIDAD:** Media
- **PRE:** ID que no existe

| # | Paso | Esperado |
|---|------|----------|
| 1 | Navegar a /product/99999 | Mensaje "Producto no encontrado" |

---

## CP-4.7: Calculo de precio — con originalPrice

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Producto con originalPrice=1000, price=800

| # | Paso | Esperado |
|---|------|----------|
| 1 | Ver detalle del producto | finalPrice = 800 |
| 2 | — | Precio tachado = 1000 |
| 3 | — | discountPercentage = 20% |
| 4 | — | hasPromotion = true |

---

## CP-4.8: Calculo de precio — con discount porcentaje

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Producto con price=1000, discount=15, sin originalPrice

| # | Paso | Esperado |
|---|------|----------|
| 1 | Ver detalle | finalPrice = 850 |
| 2 | — | discountPercentage = 15% |

---

## CP-4.9: Calculo de precio — sin descuento

- **TIPO:** Funcional
- **SEVERIDAD:** Media
- **PRE:** Producto con price=500, sin discount ni originalPrice

| # | Paso | Esperado |
|---|------|----------|
| 1 | Ver detalle | finalPrice = 500, hasPromotion = false |

---

## CP-4.10: Busqueda de productos

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Productos activos con nombres variados

| # | Paso | Esperado |
|---|------|----------|
| 1 | Escribir "vestido" en search bar | Dropdown con resultados que matchean nombre, categoria o descripcion |
| 2 | — | Maximo 8 resultados |
| 3 | — | Solo productos con status='activo' |
| 4 | Click en un resultado | Navega a /product/:id del producto seleccionado |

---

## CP-4.11: Busqueda sin resultados

- **TIPO:** Borde
- **SEVERIDAD:** Baja
- **PRE:** Ningun producto matchea

| # | Paso | Esperado |
|---|------|----------|
| 1 | Buscar "xyznoexiste123" | Dropdown vacio o mensaje "Sin resultados" |

---

# MODULO 5: CARRITO DE COMPRAS

## CP-5.1: Agregar al carrito con variantes validas

- **TIPO:** Funcional
- **SEVERIDAD:** Critica
- **PRE:** Producto con variante Talle (S:5, M:3, L:0) y Color

| # | Paso | Esperado |
|---|------|----------|
| 1 | Seleccionar Talle=M, Color=Negro para unidad 1 | Variantes seleccionadas |
| 2 | Click "Agregar al carrito" | Validacion pasa |
| 3 | — | Item aparece en carrito con qty=1 |
| 4 | — | localStorage('damiana-bella-cart') actualizado |
| 5 | — | Badge del carrito en NavBar muestra 1 |

---

## CP-5.2: Agregar al carrito sin completar variantes

- **TIPO:** Negativo
- **SEVERIDAD:** Alta
- **PRE:** Producto con variantes obligatorias

| # | Paso | Esperado |
|---|------|----------|
| 1 | No seleccionar Talle (dejar vacio) | — |
| 2 | Click "Agregar al carrito" | Error: "Completa todas las variantes" |
| 3 | — | Carrito no se modifica |

---

## CP-5.3: Agregar al carrito con talla sin stock

- **TIPO:** Negativo
- **SEVERIDAD:** Alta
- **PRE:** Producto con Talle L stock=0

| # | Paso | Esperado |
|---|------|----------|
| 1 | Seleccionar Talle=L | Opcion deshabilitada o con indicador "Sin stock" |
| 2 | Intentar agregar | Error: "Stock insuficiente para esta talla" |

---

## CP-5.4: Compra directa ("Comprar ahora")

- **TIPO:** Funcional
- **SEVERIDAD:** Critica
- **PRE:** Producto con stock disponible

| # | Paso | Esperado |
|---|------|----------|
| 1 | Seleccionar variantes validas | — |
| 2 | Click "Comprar ahora" | cartStore.item se setea con source='direct' |
| 3 | — | unitPrice = finalPrice calculado |
| 4 | — | Navega a /checkout |

---

## CP-5.5: Producto duplicado en carrito

- **TIPO:** Borde
- **SEVERIDAD:** Media
- **PRE:** Producto ya en carrito

| # | Paso | Esperado |
|---|------|----------|
| 1 | Agregar mismo producto de nuevo | Cantidad y variantes se ACTUALIZAN (no se duplica) |

---

## CP-5.6: Persistencia del carrito (refresh)

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Items en el carrito

| # | Paso | Esperado |
|---|------|----------|
| 1 | Agregar producto al carrito | Carrito tiene 1 item |
| 2 | Refrescar pagina (F5) | Carrito sigue con 1 item (leido de localStorage) |
| 3 | — | sanitizeCartItems() valida estructura al cargar |

---

## CP-5.7: Modificar cantidad en carrito

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Item en carrito con qty=2, stock=3

| # | Paso | Esperado |
|---|------|----------|
| 1 | Incrementar cantidad (+1) | qty = 3 |
| 2 | Intentar incrementar de nuevo | Bloqueado (qty >= stock) |
| 3 | Decrementar cantidad (-1) | qty = 2 |
| 4 | Decrementar hasta 0 | Item se elimina del carrito |

---

## CP-5.8: Eliminar item del carrito

- **TIPO:** Funcional
- **SEVERIDAD:** Media
- **PRE:** Item en carrito

| # | Paso | Esperado |
|---|------|----------|
| 1 | Click en eliminar item | Item removido |
| 2 | — | localStorage actualizado |
| 3 | — | Badge del carrito actualizado |

---

# MODULO 6: CHECKOUT

## CP-6.1: Acceso a checkout sin autenticacion

- **TIPO:** Seguridad
- **SEVERIDAD:** Critica
- **PRE:** Usuario no logueado con items en carrito

| # | Paso | Esperado |
|---|------|----------|
| 1 | Navegar a /checkout | AuthModal aparece automaticamente |
| 2 | — | No se puede proceder sin loguearse |
| 3 | Loguearse exitosamente | Checkout continua con datos auto-completados |

---

## CP-6.2: Checkout con carrito vacio

- **TIPO:** Borde
- **SEVERIDAD:** Media
- **PRE:** Sin items en carrito ni checkout item

| # | Paso | Esperado |
|---|------|----------|
| 1 | Navegar a /checkout | Mensaje "Tu carrito esta vacio" |
| 2 | — | No se puede proceder |

---

## CP-6.3: Envio por Correo Argentino

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Items en checkout, usuario logueado

| # | Paso | Esperado |
|---|------|----------|
| 1 | Seleccionar "Correo Argentino" | Costo = ARS 4,400 |
| 2 | Completar direccion con codigo postal | GeoRef API autocompleta ciudad y provincia |
| 3 | — | Direccion aceptada |

---

## CP-6.4: Envio por Moto — direccion valida CABA

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Direccion en CABA, dentro de 18km, fuera de zona restringida

| # | Paso | Esperado |
|---|------|----------|
| 1 | Seleccionar "Moto" | — |
| 2 | Ingresar direccion valida CABA | GET /api/shipping/validate retorna valid=true |
| 3 | — | Distancia y direccion normalizada mostradas |

---

## CP-6.5: Envio por Moto — zona restringida

- **TIPO:** Negativo
- **SEVERIDAD:** Alta
- **PRE:** Direccion en La Boca o Barracas

| # | Paso | Esperado |
|---|------|----------|
| 1 | Ingresar direccion en zona restringida | valid=false, reason='restricted_zone' |
| 2 | — | Error: "No hay envio por moto a esta zona" |

---

## CP-6.6: Envio por Moto — fuera de rango

- **TIPO:** Negativo
- **SEVERIDAD:** Alta
- **PRE:** Direccion a mas de 18km de la tienda

| # | Paso | Esperado |
|---|------|----------|
| 1 | Ingresar direccion lejana | valid=false, reason='out_of_range' |
| 2 | — | Error: "Fuera del rango de envio por moto" |

---

## CP-6.7: Envio por Moto — direccion no encontrada

- **TIPO:** Negativo
- **SEVERIDAD:** Media
- **PRE:** Direccion invalida o inexistente

| # | Paso | Esperado |
|---|------|----------|
| 1 | Ingresar "Calle Inventada 99999" | valid=false, reason='address_not_found' |
| 2 | — | Error: "Direccion no encontrada" |

---

## CP-6.8: Retiro en local

- **TIPO:** Funcional
- **SEVERIDAD:** Media
- **PRE:** Items en checkout

| # | Paso | Esperado |
|---|------|----------|
| 1 | Seleccionar "Retiro en local" | Costo = $0 |
| 2 | — | No se pide direccion |
| 3 | — | Se puede proceder al pago |

---

## CP-6.9: Pago MercadoPago — flujo exitoso

- **TIPO:** Funcional
- **SEVERIDAD:** Critica
- **PRE:** Items en checkout, envio seleccionado, usuario logueado

| # | Paso | Esperado |
|---|------|----------|
| 1 | Seleccionar "Mercado Pago" | — |
| 2 | Confirmar compra | POST /api/orders/mp-preference ejecuta |
| 3 | — | Backend: BEGIN transaccion |
| 4 | — | Backend: stock decrementado atomicamente para cada item |
| 5 | — | Backend: INSERT en ventas con payment_status='pendiente' |
| 6 | — | Backend: Preference creada en MP API |
| 7 | — | Backend: COMMIT |
| 8 | — | Frontend recibe init_point + order_ids |
| 9 | — | Datos guardados en sessionStorage |
| 10 | — | Redirige a MercadoPago |
| 11 | Completar pago en MP (aprobado) | MP redirige a /checkout/result?status=approved |
| 12 | — | Mensaje "Pago aprobado!" |
| 13 | — | Carrito se limpia |
| 14 | — | Resumen de orden visible |

---

## CP-6.10: Pago MercadoPago — stock insuficiente

- **TIPO:** Negativo
- **SEVERIDAD:** Critica
- **PRE:** Producto con stock=1, intentar comprar qty=2

| # | Paso | Esperado |
|---|------|----------|
| 1 | Confirmar compra con MP | POST /api/orders/mp-preference |
| 2 | — | Backend: UPDATE stock WHERE stock >= qty falla (rowCount=0) |
| 3 | — | ROLLBACK |
| 4 | — | Respuesta 409: "Stock insuficiente para [nombre]" |
| 5 | — | Frontend muestra error |
| 6 | — | Stock NO se modifico (rollback) |

---

## CP-6.11: Pago MercadoPago — MP falla al crear preference

- **TIPO:** Negativo
- **SEVERIDAD:** Alta
- **PRE:** Error de MercadoPago API

| # | Paso | Esperado |
|---|------|----------|
| 1 | Confirmar compra | Backend intenta crear Preference |
| 2 | — | MP API retorna error |
| 3 | — | ROLLBACK |
| 4 | — | Stock restaurado para cada item |
| 5 | — | Ordenes marcadas como 'cancelado' |
| 6 | — | Frontend recibe 500 |

---

## CP-6.12: Resultado de pago — rechazado

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Pago rechazado en MP

| # | Paso | Esperado |
|---|------|----------|
| 1 | MP redirige con status=failure | Pagina muestra "El pago fue rechazado" |
| 2 | — | Para cada order_id: POST /api/orders/:id/cancel |
| 3 | — | ventas.payment_status = 'cancelado' |
| 4 | — | Stock restaurado |

---

## CP-6.13: Resultado de pago — pendiente

- **TIPO:** Funcional
- **SEVERIDAD:** Media
- **PRE:** Pago pendiente en MP

| # | Paso | Esperado |
|---|------|----------|
| 1 | MP redirige con status=pending | Mensaje "Pago pendiente de confirmacion" |
| 2 | — | Carrito NO se limpia |

---

## CP-6.14: Resultado de pago — status desconocido

- **TIPO:** Borde
- **SEVERIDAD:** Media
- **PRE:** URL sin query params de status

| # | Paso | Esperado |
|---|------|----------|
| 1 | Navegar a /checkout/result sin params | Mensaje "No pudimos determinar el estado del pago" |

---

## CP-6.15: Pago Transferencia — flujo exitoso

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Items en checkout

| # | Paso | Esperado |
|---|------|----------|
| 1 | Seleccionar "Transferencia bancaria" | — |
| 2 | Confirmar compra | POST /api/orders |
| 3 | — | Backend: INSERT en pedidos con status='pendiente' |
| 4 | — | Stock NO se descuenta |
| 5 | — | Frontend muestra datos bancarios |

---

## CP-6.16: Pago Transferencia — fallo silencioso

- **TIPO:** Borde
- **SEVERIDAD:** Alta
- **PRE:** Error en INSERT a pedidos (simular fallo de DB)

| # | Paso | Esperado |
|---|------|----------|
| 1 | Confirmar compra por transferencia | INSERT falla |
| 2 | — | Frontend IGNORA el error silenciosamente |
| 3 | — | Muestra datos bancarios igual |
| 4 | — | No hay orden registrada en DB |

---

## CP-6.17: cancelMpOrder falla silenciosamente

- **TIPO:** Borde
- **SEVERIDAD:** Media
- **PRE:** Pago rechazado, backend caido

| # | Paso | Esperado |
|---|------|----------|
| 1 | Status=failure, frontend llama cancelMpOrder | POST falla (backend caido) |
| 2 | — | Error se ignora silenciosamente |
| 3 | — | Orden queda en 'pendiente' hasta que cron la expire |

---

# MODULO 7: WEBHOOK MERCADOPAGO

## CP-7.1: Webhook — pago aprobado

- **TIPO:** Funcional
- **SEVERIDAD:** Critica
- **PRE:** Orden en ventas con payment_status='pendiente'

| # | Paso | Esperado |
|---|------|----------|
| 1 | MP envia POST /api/orders/mp-webhook { type: 'payment', data: { id: 123 } } | Backend responde 200 inmediatamente |
| 2 | — | Backend llama Payment.get(123) |
| 3 | — | Status = 'approved' |
| 4 | — | UPDATE ventas SET payment_status='pagado' WHERE payment_status='pendiente' |
| 5 | Verificar en DB | payment_status = 'pagado' |

---

## CP-7.2: Webhook — pago rechazado

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Orden pendiente en ventas

| # | Paso | Esperado |
|---|------|----------|
| 1 | Webhook con status='rejected' | payment_status = 'fallido' |
| 2 | — | Stock restaurado en productos |

---

## CP-7.3: Webhook — orden ya procesada (idempotencia)

- **TIPO:** Borde
- **SEVERIDAD:** Alta
- **PRE:** Orden ya en payment_status='pagado'

| # | Paso | Esperado |
|---|------|----------|
| 1 | Webhook llega de nuevo para misma orden | UPDATE WHERE payment_status='pendiente' no encuentra filas |
| 2 | — | No se modifica nada |
| 3 | — | Log warning emitido |

---

## CP-7.4: Webhook — pago aprobado pero orden expirada por cron

- **TIPO:** Borde
- **SEVERIDAD:** Critica
- **PRE:** Orden expirada (>15min), stock ya restaurado, webhook llega tarde

| # | Paso | Esperado |
|---|------|----------|
| 1 | Webhook approved llega | Orden tiene payment_status='expirado' |
| 2 | — | UPDATE WHERE payment_status='pendiente' no matchea |
| 3 | — | Log warning: "Pago aprobado para orden ya procesada" |
| 4 | — | REQUIERE revision manual del admin |

---

## CP-7.5: Webhook — type != 'payment'

- **TIPO:** Borde
- **SEVERIDAD:** Baja
- **PRE:** Webhook con type='merchant_order'

| # | Paso | Esperado |
|---|------|----------|
| 1 | Webhook con type distinto a 'payment' | Responde 200 |
| 2 | — | Se ignora, no procesa nada |

---

## CP-7.6: Webhook — dos webhooks simultaneos (race condition)

- **TIPO:** Borde / Concurrencia
- **SEVERIDAD:** Alta
- **PRE:** Dos webhooks para la misma orden al mismo tiempo

| # | Paso | Esperado |
|---|------|----------|
| 1 | Webhook A y Webhook B llegan simultaneamente | Ambos responden 200 |
| 2 | — | Solo uno logra UPDATE WHERE payment_status='pendiente' |
| 3 | — | El segundo no encuentra filas |
| 4 | — | Stock no se duplica |

---

# MODULO 8: CRON — LIBERACION DE RESERVAS

## CP-8.1: Expiracion de ordenes MP pendientes >15min

- **TIPO:** Funcional
- **SEVERIDAD:** Critica
- **PRE:** Orden MP con payment_status='pendiente' creada hace 16 minutos

| # | Paso | Esperado |
|---|------|----------|
| 1 | Cron ejecuta releaseExpiredReservations() | BEGIN transaccion |
| 2 | — | UPDATE ventas SET payment_status='expirado' WHERE mp + pendiente + >15min |
| 3 | — | Stock restaurado para cada orden expirada |
| 4 | — | COMMIT |
| 5 | Verificar DB | payment_status = 'expirado', stock incrementado |

---

## CP-8.2: Cron no afecta ordenes recientes

- **TIPO:** Negativo
- **SEVERIDAD:** Alta
- **PRE:** Orden MP pendiente creada hace 5 minutos

| # | Paso | Esperado |
|---|------|----------|
| 1 | Cron ejecuta | Orden NO es afectada (created_at < 15min) |
| 2 | — | payment_status sigue 'pendiente' |

---

## CP-8.3: Cron no afecta transferencias

- **TIPO:** Negativo
- **SEVERIDAD:** Alta
- **PRE:** Orden de transferencia pendiente hace 1 hora

| # | Paso | Esperado |
|---|------|----------|
| 1 | Cron ejecuta | WHERE payment_method='mp' no matchea transferencias |
| 2 | — | Orden de transferencia sigue 'pendiente' |

---

## CP-8.4: Cron — idempotencia

- **TIPO:** Borde
- **SEVERIDAD:** Media
- **PRE:** Cron ya proceso ordenes expiradas

| # | Paso | Esperado |
|---|------|----------|
| 1 | Cron ejecuta de nuevo | WHERE payment_status='pendiente' no encuentra las ya expiradas |
| 2 | — | No se modifica nada |

---

## CP-8.5: Cron — error en transaccion

- **TIPO:** Borde
- **SEVERIDAD:** Alta
- **PRE:** Error de DB durante el cron

| # | Paso | Esperado |
|---|------|----------|
| 1 | Error durante UPDATE | ROLLBACK completo |
| 2 | — | Ningun stock modificado |
| 3 | — | Error logueado en console.error |
| 4 | — | Siguiente ejecucion del cron reintenta |

---

# MODULO 9: ADMIN — GESTION DE PRODUCTOS

## CP-9.1: Crear producto exitoso

- **TIPO:** Funcional
- **SEVERIDAD:** Critica
- **PRE:** Admin logueado

| # | Paso | Esperado |
|---|------|----------|
| 1 | Navegar a /admin/products | Lista de productos carga |
| 2 | Click "Crear producto" | Modal abierto |
| 3 | Completar nombre y precio (minimo) | — |
| 4 | Agregar variante Talle con stockByOption: {S:5, M:3} | — |
| 5 | Subir imagen via Cloudinary | POST /api/cloudinary/sign → firma → upload directo |
| 6 | Submit | POST /api/products (auth + admin) |
| 7 | — | stock total calculado = 5+3 = 8 |
| 8 | — | image_url = images[0] |
| 9 | — | INSERT en productos |
| 10 | — | Producto aparece en lista |

---

## CP-9.2: Crear producto sin nombre o precio

- **TIPO:** Negativo
- **SEVERIDAD:** Alta
- **PRE:** Admin logueado

| # | Paso | Esperado |
|---|------|----------|
| 1 | Submit sin nombre | Error 400: campo requerido |
| 2 | Submit sin precio | Error 400: campo requerido |

---

## CP-9.3: Actualizar producto (partial update)

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Producto existente

| # | Paso | Esperado |
|---|------|----------|
| 1 | Editar solo el precio | PUT /api/products/:id con { price: nuevoValor } |
| 2 | — | Solo price se actualiza, demas campos intactos |
| 3 | — | stock recalculado si variantes cambiaron |
| 4 | — | image_url sincronizado con images[0] |

---

## CP-9.4: Eliminar producto con imagen en Cloudinary

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Producto con public_id en Cloudinary

| # | Paso | Esperado |
|---|------|----------|
| 1 | Confirmar eliminacion | DELETE /api/products/:id |
| 2 | — | Backend intenta DELETE en Cloudinary |
| 3 | — | DELETE FROM productos |
| 4 | — | Producto desaparece de lista |

---

## CP-9.5: Eliminar producto — Cloudinary falla

- **TIPO:** Borde
- **SEVERIDAD:** Media
- **PRE:** Cloudinary no responde

| # | Paso | Esperado |
|---|------|----------|
| 1 | Confirmar eliminacion | Cloudinary DELETE falla |
| 2 | — | Warning logueado |
| 3 | — | Producto SE ELIMINA de DB igual (continua) |
| 4 | — | Imagen queda huerfana en Cloudinary |

---

## CP-9.6: Producto no encontrado al eliminar

- **TIPO:** Negativo
- **SEVERIDAD:** Media
- **PRE:** ID inexistente

| # | Paso | Esperado |
|---|------|----------|
| 1 | DELETE /api/products/99999 | Respuesta 404 |

---

# MODULO 10: ADMIN — GESTION DE USUARIOS

## CP-10.1: Listar usuarios paginado

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Mas de 5 usuarios en profiles

| # | Paso | Esperado |
|---|------|----------|
| 1 | Navegar a /admin/users | Tabla con 5 usuarios (pagina 1) |
| 2 | Ir a pagina 2 | Siguientes 5 usuarios |
| 3 | — | Ordenados por created_at DESC |

---

## CP-10.2: Cambiar rol de usuario a admin

- **TIPO:** Funcional
- **SEVERIDAD:** Critica
- **PRE:** Usuario con role='user'

| # | Paso | Esperado |
|---|------|----------|
| 1 | Toggle de rol para usuario X | PUT /api/users/:id { role: 'admin' } |
| 2 | — | profiles.role = 'admin' |
| 3 | — | Usuario X puede acceder a /admin |

---

## CP-10.3: Cambiar propio rol (bloqueado)

- **TIPO:** Seguridad
- **SEVERIDAD:** Critica
- **PRE:** Admin logueado

| # | Paso | Esperado |
|---|------|----------|
| 1 | Intentar cambiar su propio rol | Accion bloqueada en frontend |
| 2 | — | No se envia request |

---

## CP-10.4: Eliminar usuario

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Usuario que no sea el admin actual

| # | Paso | Esperado |
|---|------|----------|
| 1 | Click eliminar → confirmar | DELETE /api/users/:id |
| 2 | — | BEGIN transaccion |
| 3 | — | DELETE FROM profiles |
| 4 | — | DELETE FROM auth.users |
| 5 | — | COMMIT |
| 6 | — | Usuario desaparece de la lista |

---

## CP-10.5: Auto-eliminacion (bloqueada)

- **TIPO:** Seguridad
- **SEVERIDAD:** Critica
- **PRE:** Admin logueado

| # | Paso | Esperado |
|---|------|----------|
| 1 | Intentar eliminarse a si mismo | Accion bloqueada en frontend |

---

# MODULO 11: ADMIN — VENTAS

## CP-11.1: Listar ventas con filtros

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Ventas con distintos estados y metodos

| # | Paso | Esperado |
|---|------|----------|
| 1 | Navegar a /admin/sales | Tabla con todas las ventas |
| 2 | Filtrar por payment_status='pagado' | Solo ventas pagadas |
| 3 | Filtrar por payment_method='mp' | Solo ventas MP |
| 4 | Filtrar por stock bajo | Productos con stock <= 5 |
| 5 | Buscar por nombre de comprador | Resultados filtrados |

---

## CP-11.2: Cambiar estado de pago manualmente

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Venta de transferencia en 'pendiente'

| # | Paso | Esperado |
|---|------|----------|
| 1 | Click en badge de estado | Dropdown con opciones |
| 2 | Seleccionar 'pagado' | UPDATE ventas SET payment_status='pagado' |
| 3 | — | Badge cambia de color |
| 4 | — | Stock NO se modifica automaticamente |

---

## CP-11.3: Alertas de stock

- **TIPO:** Funcional
- **SEVERIDAD:** Media
- **PRE:** Producto con stock=3 y otro con stock=0

| # | Paso | Esperado |
|---|------|----------|
| 1 | Navegar a /admin/sales | Seccion de alertas visible |
| 2 | — | Producto stock=3 → low_stock |
| 3 | — | Producto stock=0 → out_of_stock |

---

# MODULO 12: ADMIN — DESPACHOS

## CP-12.1: Transicion de estado — envio normal

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Orden con shipping_method != 'local', dispatch_status='pendiente'

| # | Paso | Esperado |
|---|------|----------|
| 1 | Cambiar a 'en_preparacion' | UPDATE dispatch_status exitoso |
| 2 | Cambiar a 'despachado' | UPDATE exitoso (no 'listo_para_retiro' porque no es local) |

---

## CP-12.2: Transicion de estado — retiro en local

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Orden con shipping_method='local', dispatch_status='en_preparacion'

| # | Paso | Esperado |
|---|------|----------|
| 1 | Cambiar estado | Opcion disponible: 'listo_para_retiro' (no 'despachado') |
| 2 | Seleccionar 'listo_para_retiro' | UPDATE exitoso |

---

# MODULO 13: ADMIN — CONTENIDO DEL SITIO

## CP-13.1: Editar About page

- **TIPO:** Funcional
- **SEVERIDAD:** Media
- **PRE:** Admin logueado

| # | Paso | Esperado |
|---|------|----------|
| 1 | Navegar a /admin/about | Formulario carga datos actuales de site_content('about') |
| 2 | Modificar titulo y mision | — |
| 3 | Guardar | UPSERT en site_content key='about' |
| 4 | Verificar en sitio publico /about | Cambios reflejados |

---

## CP-13.2: Editar hero image

- **TIPO:** Funcional
- **SEVERIDAD:** Media
- **PRE:** Admin logueado

| # | Paso | Esperado |
|---|------|----------|
| 1 | Cambiar URL, alt text, titulo, background position | — |
| 2 | Guardar | UPSERT en site_content key='hero_image' |
| 3 | Verificar en /about | Hero image actualizada |

---

## CP-13.3: Editar footer

- **TIPO:** Funcional
- **SEVERIDAD:** Media
- **PRE:** Admin logueado

| # | Paso | Esperado |
|---|------|----------|
| 1 | Navegar a /admin/site-config | Datos del footer cargan |
| 2 | Modificar whatsapp, email, redes sociales | — |
| 3 | Guardar | UPSERT en site_content key='footer' |
| 4 | Verificar en sitio publico (footer) | Cambios reflejados |

---

## CP-13.4: Toggle banner visibilidad

- **TIPO:** Funcional
- **SEVERIDAD:** Baja
- **PRE:** Banner actualmente visible

| # | Paso | Esperado |
|---|------|----------|
| 1 | Toggle visible = false | UPSERT banner con visible=false |
| 2 | Verificar en home | Banner no se muestra |
| 3 | Toggle visible = true | Banner aparece con texto correcto |

---

# MODULO 14: ADMIN — CAROUSEL

## CP-14.1: Agregar imagen al carousel

- **TIPO:** Funcional
- **SEVERIDAD:** Media
- **PRE:** Admin logueado

| # | Paso | Esperado |
|---|------|----------|
| 1 | Subir imagen via Cloudinary | Upload exitoso |
| 2 | — | INSERT en carousel_images con url, order, device_type |
| 3 | Verificar en home | Imagen aparece en carousel (si is_active=true) |

---

## CP-14.2: Reordenar carousel

- **TIPO:** Funcional
- **SEVERIDAD:** Media
- **PRE:** 3+ imagenes en carousel

| # | Paso | Esperado |
|---|------|----------|
| 1 | Drag and drop para cambiar orden | Batch UPDATE de campo order |
| 2 | Verificar en home | Carousel respeta nuevo orden |

---

## CP-14.3: Desactivar imagen del carousel

- **TIPO:** Funcional
- **SEVERIDAD:** Baja
- **PRE:** Imagen activa en carousel

| # | Paso | Esperado |
|---|------|----------|
| 1 | Toggle is_active = false | UPDATE exitoso |
| 2 | Verificar en home | Imagen no aparece en carousel |

---

# MODULO 15: ADMIN — CLOUDINARY

## CP-15.1: Navegar carpetas y ver imagenes

- **TIPO:** Funcional
- **SEVERIDAD:** Media
- **PRE:** Admin logueado, carpetas con imagenes en Cloudinary

| # | Paso | Esperado |
|---|------|----------|
| 1 | Navegar a /admin/cloudinary | Arbol de carpetas carga |
| 2 | Click en carpeta | Imagenes de esa carpeta se muestran |
| 3 | — | Paginacion funciona con next_cursor |

---

## CP-15.2: Subir imagen firmada

- **TIPO:** Funcional
- **SEVERIDAD:** Alta
- **PRE:** Admin logueado

| # | Paso | Esperado |
|---|------|----------|
| 1 | Seleccionar archivo | — |
| 2 | — | POST /api/cloudinary/sign genera firma SHA1 |
| 3 | — | Upload directo a Cloudinary con firma |
| 4 | — | Imagen aparece en la carpeta |

---

## CP-15.3: Eliminar imagen

- **TIPO:** Funcional
- **SEVERIDAD:** Media
- **PRE:** Imagen existente en Cloudinary

| # | Paso | Esperado |
|---|------|----------|
| 1 | Confirmar eliminacion | POST /api/cloudinary/delete con publicId |
| 2 | — | Imagen removida de Cloudinary |
| 3 | — | Imagen desaparece de la lista |

---

## CP-15.4: Crear y eliminar carpeta

- **TIPO:** Funcional
- **SEVERIDAD:** Baja
- **PRE:** Admin logueado

| # | Paso | Esperado |
|---|------|----------|
| 1 | Crear carpeta "test-folder" | POST /api/cloudinary/folders → carpeta creada |
| 2 | Eliminar carpeta vacia | DELETE /api/cloudinary/folders → carpeta eliminada |
| 3 | Intentar eliminar carpeta con contenido | Error (Cloudinary no permite) |

---

# MODULO 16: MIDDLEWARE DE AUTENTICACION (BACKEND)

## CP-16.1: Request sin token

- **TIPO:** Seguridad
- **SEVERIDAD:** Critica
- **PRE:** Endpoint protegido (ej: POST /api/products)

| # | Paso | Esperado |
|---|------|----------|
| 1 | Enviar request sin header Authorization | 401 "Token de autenticacion requerido" |

---

## CP-16.2: Token invalido

- **TIPO:** Seguridad
- **SEVERIDAD:** Critica
- **PRE:** Token malformado

| # | Paso | Esperado |
|---|------|----------|
| 1 | Enviar request con Authorization: Bearer INVALID | 401 "Token invalido" |

---

## CP-16.3: Token valido pero usuario no en profiles

- **TIPO:** Seguridad / Borde
- **SEVERIDAD:** Alta
- **PRE:** JWT valido de Supabase pero sin fila en profiles

| # | Paso | Esperado |
|---|------|----------|
| 1 | Enviar request con JWT de usuario sin profile | 401 "Usuario no encontrado en la base de datos" |

---

## CP-16.4: Token valido, usuario no-admin en endpoint admin

- **TIPO:** Seguridad
- **SEVERIDAD:** Critica
- **PRE:** JWT de usuario con role='user'

| # | Paso | Esperado |
|---|------|----------|
| 1 | Enviar POST /api/products con token de user | authMiddleware pasa (usuario valido) |
| 2 | — | adminMiddleware bloquea: 403 "No autorizado" |

---

## CP-16.5: Token valido, admin, endpoint admin

- **TIPO:** Funcional
- **SEVERIDAD:** Critica
- **PRE:** JWT de admin

| # | Paso | Esperado |
|---|------|----------|
| 1 | Enviar POST /api/products con token admin | authMiddleware pasa |
| 2 | — | adminMiddleware pasa |
| 3 | — | Controller ejecuta normalmente |

---

# MODULO 17: VALIDACION DE ENVIO (BACKEND)

## CP-17.1: Calculo de costo por zona

- **TIPO:** Funcional
- **SEVERIDAD:** Media
- **PRE:** Ninguna

| # | Paso | Esperado |
|---|------|----------|
| 1 | GET /api/shipping?postalCode=C1234 (CABA) | cost=$150, 2-3 dias |
| 2 | GET /api/shipping?postalCode=1900 (GBA) | cost=$250, 3-5 dias |
| 3 | GET /api/shipping?postalCode=5000 (Interior) | cost=$450, 5-7 dias |

---

## CP-17.2: Validar direccion — campos faltantes

- **TIPO:** Negativo
- **SEVERIDAD:** Media
- **PRE:** Ninguna

| # | Paso | Esperado |
|---|------|----------|
| 1 | GET /api/shipping/validate sin params | 400 "Campos faltantes" |
| 2 | GET /api/shipping/validate?street=X (sin number) | 400 |

---

# MODULO 18: HEALTH CHECK Y RUTAS NO MAPEADAS

## CP-18.1: Health check

- **TIPO:** Funcional
- **SEVERIDAD:** Baja
- **PRE:** Backend corriendo

| # | Paso | Esperado |
|---|------|----------|
| 1 | GET / | Respuesta con info de la API |
| 2 | GET /health | 200 OK |

---

## CP-18.2: Ruta inexistente

- **TIPO:** Negativo
- **SEVERIDAD:** Baja
- **PRE:** Ninguna

| # | Paso | Esperado |
|---|------|----------|
| 1 | GET /api/noexiste | 404 "Ruta no encontrada" |

---

# MODULO 19: CORS

## CP-19.1: Origin permitido

- **TIPO:** Seguridad
- **SEVERIDAD:** Alta
- **PRE:** FRONTEND_URL configurado

| # | Paso | Esperado |
|---|------|----------|
| 1 | Request desde origin en whitelist | Respuesta normal con headers CORS |

---

## CP-19.2: Origin no permitido

- **TIPO:** Seguridad
- **SEVERIDAD:** Alta
- **PRE:** Origin fuera de whitelist

| # | Paso | Esperado |
|---|------|----------|
| 1 | Request desde origin no autorizado | Error CORS |

---

## CP-19.3: Request sin origin (server-to-server)

- **TIPO:** Borde
- **SEVERIDAD:** Media
- **PRE:** Request desde Postman o backend

| # | Paso | Esperado |
|---|------|----------|
| 1 | Request sin header Origin | Permitido (config: !origin → callback(null, true)) |

---

# BUGS CONOCIDOS Y DEUDA TECNICA PARA QA

| ID | Descripcion | Severidad | Modulo |
|----|-------------|-----------|--------|
| BUG-1 | User.findByEmail() no implementado — endpoint /api/users/login falla en runtime | Critica | Backend Users |
| BUG-2 | User.findByUserId() no implementado — endpoint /api/users/auth/:userId falla en runtime | Critica | Backend Users |
| BUG-3 | Webhook MP sin validacion de firma X-Signature — cualquier POST puede simular webhook | Critica | Seguridad |
| BUG-4 | Cron sin locking — ejecuciones simultaneas posibles si tarda >5min | Alta | Cron |
| BUG-5 | Ordenes de transferencia sin expiracion — quedan pendientes indefinidamente | Media | Ventas |
| BUG-6 | Cambio de estado de pago sin validacion de transicion — admin puede setear cualquier estado | Media | Admin Ventas |
| BUG-7 | Stock no se descuenta en transferencias — depende de gestion manual | Media | Checkout |
| BUG-8 | Fallo silencioso en INSERT de transferencia — usuario ve datos bancarios sin orden creada | Alta | Checkout |
| BUG-9 | Imagen huerfana en Cloudinary si delete falla al eliminar producto | Baja | Productos |

---

# MATRIZ DE COBERTURA POR ROL

| Modulo | Anonimo | Autenticado | Admin |
|--------|---------|-------------|-------|
| Home / Catalogo / Busqueda | SI | SI | SI |
| Detalle producto | SI | SI | SI |
| Carrito (agregar/modificar) | SI | SI | SI |
| Checkout | NO | SI | SI |
| Panel admin | NO | NO | SI |
| CRUD productos | NO | NO | SI |
| Gestion usuarios | NO | NO | SI |
| Ventas / Despachos | NO | NO | SI |
| Contenido del sitio | NO | NO | SI |
| Cloudinary | NO | NO | SI |

---

# RESUMEN DE CASOS DE PRUEBA

| Modulo | Total CPs | Criticos | Altos | Medios | Bajos |
|--------|-----------|----------|-------|--------|-------|
| Registro | 10 | 2 | 5 | 2 | 1 |
| Login | 6 | 2 | 3 | 0 | 1 |
| Recovery | 5 | 1 | 2 | 1 | 1 |
| Catalogo | 11 | 2 | 4 | 3 | 2 |
| Carrito | 8 | 2 | 3 | 2 | 1 |
| Checkout | 17 | 4 | 6 | 5 | 2 |
| Webhook MP | 6 | 2 | 2 | 1 | 1 |
| Cron | 5 | 1 | 2 | 1 | 1 |
| Admin Productos | 6 | 1 | 3 | 2 | 0 |
| Admin Usuarios | 5 | 2 | 1 | 1 | 1 |
| Admin Ventas | 3 | 0 | 1 | 2 | 0 |
| Admin Despachos | 2 | 0 | 2 | 0 | 0 |
| Admin Contenido | 4 | 0 | 0 | 3 | 1 |
| Admin Carousel | 3 | 0 | 0 | 2 | 1 |
| Admin Cloudinary | 4 | 0 | 1 | 2 | 1 |
| Middleware Auth | 5 | 3 | 1 | 0 | 1 |
| Shipping | 2 | 0 | 0 | 2 | 0 |
| Health/404/CORS | 5 | 0 | 2 | 1 | 2 |
| **TOTAL** | **107** | **22** | **38** | **30** | **17** |
