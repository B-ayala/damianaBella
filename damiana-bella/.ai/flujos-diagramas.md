# FLUJOS DEL SISTEMA — DAMIANA BELLA E-COMMERCE
# Version funcional, orientada a cliente

---

## OBJETIVO DEL DOCUMENTO

Este documento describe que flujos cubre el sistema, como se comporta en cada escenario importante y que casos contempla para evitar errores operativos o de experiencia.

La idea no es explicar la implementacion tecnica ni indicar acciones en formato instructivo, sino presentar con claridad como funciona el producto de punta a punta, que sucede en cada etapa y que situaciones quedan cubiertas.

---

## 1. REGISTRO DE USUARIO

El flujo de registro comienza desde el acceso de cuenta. El sistema presenta el formulario de alta, valida los datos ingresados y, cuando todo es correcto, genera la cuenta y envia un email de confirmacion. Hasta que ese correo no se confirme, la cuenta queda en estado pendiente y no se considera completamente habilitada.

### Casos contemplados

- Si el email ya pertenece a una cuenta activa, el sistema lo informa con claridad.
- Si el email ya fue usado pero todavia no se confirmo, el sistema avisa que hay una confirmacion pendiente.
- Si se intenta registrar demasiadas veces seguidas, el sistema bloquea temporalmente el intento para evitar abuso.
- Si el registro es correcto, se muestra el mensaje para revisar el correo.

---

## 2. CONFIRMACION DE EMAIL

La confirmacion de email completa el alta. Cuando se accede al enlace enviado por correo, el sistema valida que ese enlace siga vigente y, si corresponde, habilita la cuenta para uso normal. Desde ese momento el acceso ya puede realizarse sin restricciones de confirmacion pendiente.

### Casos contemplados

- Si el enlace esta vencido o es invalido, se informa el error.
- Si la confirmacion es correcta, el sistema deja la cuenta habilitada para ingresar.

---

## 3. INICIO DE SESION

El inicio de sesion valida las credenciales de acceso y determina tambien el tipo de permisos con los que entra cada persona. Cuando los datos son correctos, el sistema habilita la sesion correspondiente; si ademas se trata de un perfil administrativo, permite el ingreso al panel de gestion.

### Casos contemplados

- Si el email o la contrasena son incorrectos, el sistema lo informa.
- Si la cuenta todavia no confirmo el correo, el sistema solicita completar ese paso antes de ingresar.
- Si quien ingresa intenta acceder a un area de administracion sin permisos, el acceso se bloquea.
- Si el usuario si tiene permisos de administrador, puede entrar al panel correspondiente.

---

## 4. RECUPERACION DE CONTRASENA

La recuperacion de contrasena permite restablecer el acceso sin intervencion manual. El sistema envia un enlace de recuperacion al correo correspondiente y, a partir de ese enlace, habilita la definicion de una nueva contrasena siempre que la solicitud siga siendo valida.

### Casos contemplados

- Si las contrasenas no coinciden, se informa antes de continuar.
- Si el enlace ya no sirve o esta vencido, el sistema muestra el error.
- Si la nueva contrasena no cumple requisitos, se avisa para corregirla.

---

## 5. RECORRIDO DE COMPRA EN LA TIENDA

### 5.1 Home

La home funciona como puerta de entrada comercial. Puede mostrar mensajes destacados, imagenes principales y productos seleccionados para comunicar identidad de marca y facilitar el acceso rapido a la compra.

### 5.2 Listado de productos

El catalogo organiza la oferta en categorias y subcategorias, y muestra unicamente los productos disponibles para la venta dentro del sitio publico.

### Casos contemplados

- Se pueden aplicar filtros por categoria.
- Se mantiene una navegacion clara para volver atras o cambiar de seccion.

### 5.3 Detalle de producto

Cada producto cuenta con una vista de detalle donde se presenta la informacion comercial necesaria para decidir la compra: imagenes, precio, variantes, descripcion y datos complementarios.

### Casos contemplados

- Si el producto no existe o ya no esta disponible, el sistema lo informa.
- Si el producto tiene descuentos, el precio final se muestra correctamente.
- Si el producto tiene variantes, el sistema contempla la seleccion por opcion.

### 5.4 Busqueda de productos

La busqueda permite localizar productos de forma rapida mediante coincidencias relevantes y facilita el acceso directo al detalle correspondiente.

---

## 6. CARRITO Y COMPRA DIRECTA

### 6.1 Agregar al carrito

El carrito conserva la seleccion realizada sobre cada producto, incluyendo cantidad y variantes necesarias. Esa informacion se mantiene de forma consistente para que el proceso de compra pueda retomarse sin perder datos validos.

### Casos contemplados

- Si faltan variantes obligatorias, no deja avanzar.
- Si no hay stock suficiente para la combinacion elegida, lo informa.
- Si el producto ya estaba en el carrito, actualiza la seleccion en lugar de duplicar de forma inconsistente.

### 6.2 Comprar ahora

La compra directa ofrece un atajo desde el producto hacia el checkout, pero mantiene las mismas validaciones de integridad que el carrito tradicional.

### Casos contemplados

- Se aplican las mismas validaciones que en el carrito.
- Si algo esta incompleto o sin stock, la compra no avanza.

### 6.3 Persistencia de carrito

El sistema conserva el estado del carrito cuando corresponde y valida su contenido al volver a cargar la aplicacion para evitar cantidades o configuraciones invalidas.

---

## 7. CHECKOUT

### 7.1 Inicio del checkout

El checkout concentra la informacion final de la compra. Antes de avanzar, el sistema verifica que exista una sesion valida y que haya productos listos para procesar. Cuando ambas condiciones se cumplen, se habilita la continuidad hacia envio y pago.

### Casos contemplados

- Checkout bloqueado si no hay sesion iniciada.
- Checkout bloqueado si no hay productos cargados.
- Autocompletado de datos basicos del usuario cuando ya estan disponibles.

### 7.2 Seleccion de envio

El sistema contempla tres modalidades de entrega:

1. Correo Argentino.
2. Envio en moto dentro de condiciones definidas.
3. Retiro en local.

### Casos contemplados

- Para correo, se solicita direccion completa.
- Para moto, se valida que la direccion exista y que este dentro de la zona habilitada.
- Para moto, el sistema contempla zonas restringidas y tambien limite de distancia.
- Para retiro en local, no se pide direccion.

---

## 8. PAGO

### 8.1 Pago online

En el pago online, el sistema arma la orden, reserva el stock involucrado y deriva la operacion al proveedor externo de cobro. Una vez finalizada esa instancia, el sitio recibe el resultado y actualiza el estado de la compra segun corresponda.

### Casos contemplados

- Si al intentar pagar ya no hay stock suficiente, la operacion se frena y se informa.
- Si la orden no puede prepararse correctamente, no se deja una reserva inconsistente.
- Si el pago es aprobado, la compra se confirma.
- Si el pago queda pendiente, el sistema lo refleja sin dar una confirmacion falsa.
- Si el pago falla o es rechazado, se cancela la operacion y el stock se recompone.
- Si el usuario no completa el pago a tiempo, la reserva expira y el stock se libera automaticamente.

### 8.2 Transferencia bancaria

En la modalidad por transferencia, el sistema registra el pedido y deja el estado pendiente hasta que exista una confirmacion posterior. De ese modo, se diferencia claramente una orden generada de una orden efectivamente pagada.

### Casos contemplados

- Si los datos del pedido no son validos, la orden no se genera.
- El sistema diferencia este flujo del pago online para no marcar como pagado algo que todavia no fue acreditado.

### 8.3 Resultado del pago

Al volver del proveedor de pago, el sistema contempla estos escenarios:

- Pago aprobado.
- Pago pendiente.
- Pago rechazado.
- Estado no concluyente.

En cada uno de esos casos, el sistema muestra un resultado acorde y resuelve la consistencia entre carrito, stock y estado de la orden.

---

## 9. GESTION AUTOMATICA DE PEDIDOS Y STOCK

El sistema cubre tambien los procesos que no dependen de una accion manual del usuario:

- Confirmacion automatica del pago cuando el proveedor informa que fue aprobado.
- Marcado de pagos fallidos cuando el proveedor informa rechazo o cancelacion.
- Liberacion automatica de reservas vencidas para que el stock vuelva a estar disponible.

Esto evita ventas duplicadas, productos bloqueados sin necesidad y estados de pedido contradictorios.

---

## 10. ACCESO AL PANEL ADMINISTRATIVO

El acceso al panel administrativo se encuentra condicionado por dos validaciones consecutivas: una sesion activa y permisos de administracion. Solo cuando ambas estan presentes, el sistema habilita el entorno de gestion.

### Casos contemplados

- Si no hay sesion, se rechaza el ingreso.
- Si hay sesion pero no permisos de administrador, tambien se rechaza.
- Si el usuario es administrador, puede operar normalmente dentro del panel.

---

## 11. GESTION DE PRODUCTOS

### Funcionalidades cubiertas

La gestion de productos cubre el ciclo completo de administracion del catalogo:

1. Ver todos los productos.
2. Filtrar por nombre, categoria, estado y stock.
3. Crear nuevos productos.
4. Editar productos existentes.
5. Eliminar productos.

### Casos contemplados

- Productos activos e inactivos.
- Productos con poco stock o agotados.
- Productos con variantes y stock por opcion.
- Confirmacion antes de eliminar.
- Consistencia entre imagen principal, galeria y datos visibles del producto.

---

## 12. GESTION DE USUARIOS

### Funcionalidades cubiertas

La gestion de usuarios permite administrar los perfiles registrados y controlar los permisos de acceso:

1. Ver usuarios registrados.
2. Cambiar roles.
3. Eliminar usuarios.

### Casos contemplados

- El sistema evita que un administrador se quite a si mismo los permisos por error.
- El sistema evita que un administrador se elimine a si mismo.
- Las acciones sensibles requieren control para no romper el acceso administrativo.

---

## 13. GESTION DE VENTAS Y DESPACHOS

### Ventas

La vista de ventas permite seguir las compras realizadas, su estado de pago, el metodo elegido y alertas vinculadas al stock.

### Despachos

El despacho evoluciona segun el avance logistico del pedido:

1. Pendiente.
2. En preparacion.
3. Despachado, cuando corresponde envio.
4. Listo para retiro, cuando corresponde retiro en local.

### Casos contemplados

- Seguimiento diferenciado segun metodo de entrega.
- Identificacion de pedidos listos para salir o para retirar.
- Separacion clara entre estado de pago y estado de despacho.

---

## 14. GESTION DE CONTENIDO DEL SITIO

### Funcionalidades cubiertas

El sistema contempla una gestion editable del contenido visible del sitio:

1. Seccion institucional.
2. Banner superior.
3. Footer.
4. Carrusel de home.

### Casos contemplados

- Activar o desactivar elementos visuales.
- Reordenar imagenes del carrusel.
- Mantener contenido editable sin depender de cambios de codigo.

---

## 15. GESTION DE IMAGENES

### Funcionalidades cubiertas

La gestion de imagenes contempla:

1. Subir imagenes.
2. Organizar carpetas.
3. Visualizar recursos disponibles.
4. Eliminar imagenes.
5. Controlar el uso del almacenamiento.

### Casos contemplados

- Navegacion por carpetas.
- Prevencion de errores al intentar borrar contenido que no deberia eliminarse sin control.
- Seguimiento del uso general del espacio de imagenes.

---

## 16. MANEJO DE ERRORES Y MENSAJES AL USUARIO

El sistema contempla errores de negocio y de experiencia con mensajes pensados para que el usuario entienda que ocurrio y como interpretar el estado de la operacion, sin exponer tecnicismos innecesarios.

### Casos contemplados

- Errores de autenticacion.
- Errores de stock.
- Errores de pago.
- Errores de direccion o envio.
- Errores de conexion.
- Casos donde no se encuentra un producto o una seccion.

La intencion es que los mensajes sean claros, comprensibles y no tecnicos.

---

## 17. RESUMEN DE COBERTURA

### Experiencia del usuario final

El producto cubre:

1. Registro, confirmacion y acceso.
2. Recuperacion de contrasena.
3. Exploracion del catalogo.
4. Busqueda y detalle de producto.
5. Seleccion de variantes y control de stock.
6. Carrito y compra directa.
7. Checkout con validacion de sesion.
8. Envio segun modalidad.
9. Pago online o por transferencia.
10. Resolucion de aprobacion, pendiente, rechazo o expiracion.

### Operacion administrativa

El producto cubre:

1. Control de acceso administrativo.
2. Gestion de productos.
3. Gestion de usuarios.
4. Seguimiento de ventas.
5. Gestion de despachos.
6. Edicion de contenido del sitio.
7. Administracion de imagenes.

### Seguridad operativa y consistencia

El producto contempla:

1. Bloqueos temporales ante abuso en registro.
2. Restriccion de accesos no autorizados.
3. Validacion de stock antes y durante la compra.
4. Liberacion automatica de reservas vencidas.
5. Reversion de stock ante pagos no concretados.
6. Mensajes claros ante errores o estados no concluyentes.

---

## CONCLUSION

Este sistema no solo cubre el flujo ideal de compra, sino tambien los casos limite y las excepciones mas importantes para operar un e-commerce con menor riesgo de errores, menor friccion para el usuario y mejor control desde administracion.

