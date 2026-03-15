# Email Confirmation Flow - Configuración de Supabase

## Resumen de Cambios

Se ha implementado un flujo completo de confirmación de email que incluye:

1. **Mensaje mejorado de registro**: 
   - Usuarios ven: "¡Cuenta creada! Revisa tu correo electrónico para confirmar tu cuenta."
   - El mensaje se muestra por 3.5 segundos antes de volver a login

2. **Página de confirmación de email** (`/auth/confirm`):
   - Verifica automáticamente el token de confirmación
   - Muestra mensajes de éxito o error con iconos
   - Redirige automáticamente al usuario a la home tras confirmación exitosa

3. **Componente ConfirmationModal reutilizable**:
   - Se puede usar en múltiples partes de la aplicación
   - Soporta estados: success, error, info
   - Configurables: título, mensaje, botones

## Configuración en Supabase

Para que el flujo de confirmación funcione, debes configurar la URL de redireccionamiento en Supabase:

### 1. Ir a Supabase Dashboard
- Navega a tu proyecto en https://supabase.com
- Ve a **Authentication** → **Providers** → **Email**

### 2. Configurar URL de Confirmación
En la sección **Email Confirmation/Email Change Settings**, agrega las siguientes URLs:

**Email Confirmation:**
```
https://tudominio.com/LIA/auth/confirm
```

**Email Change:**
(Opcional, pero recomendado)
```
https://tudominio.com/LIA/auth/confirm
```

**Para desarrollo local:**
```
http://localhost:5173/auth/confirm
```

### 3. Validación del Flujo

El flujo funcionará así:

1. Usuario se registra en AuthModal
2. Supabase envía un email con un link de confirmación
3. El link redirige a: `http://localhost:5173/auth/confirm?token_hash=xxx`
4. La página `EmailConfirmation` verifica el token automáticamente
5. Se muestra un modal con el resultado (éxito o error)
6. Si es exitoso, se redirige a la home

## Archivos Modificados

### Frontend
- `src/components/auth/AuthModal.tsx` - Mensaje de éxito mejorado
- `src/services/userService.ts` - Función `verifyEmailConfirmation()`
- `src/routes/AppRouter.tsx` - Nueva ruta `/auth/confirm`

### Nuevos Archivos
- `src/pages/auth/EmailConfirmation.tsx` - Página de confirmación
- `src/pages/auth/EmailConfirmation.css` - Estilos
- `src/components/common/Modal/ConfirmationModal.tsx` - Modal reutilizable
- `src/components/common/Modal/ConfirmationModal.css` - Estilos

## Flujo Técnico

### Registro
```
Usuario completa formulario
    ↓
AuthModal llama createUser()
    ↓
supabase.auth.signUp()
    ↓
Email sent por Supabase
    ↓
Modal muestra: "Revisa tu correo electrónico para confirmar tu cuenta"
    ↓
Vuelve a login view después de 3.5s
```

### Confirmación
```
Usuario makes click en link del email
    ↓
Redirige a: /auth/confirm?token_hash=xxx
    ↓
EmailConfirmation page verifica token
    ↓
verifyEmailConfirmation() llama supabase.auth.verifyOtp()
    ↓
ConfirmationModal muestra el resultado
    ↓
Si éxito: redirige a home después de 0.5s
```

## Uso del ConfirmationModal en Otros Lugares

El componente `ConfirmationModal` es reutilizable y se puede usar en cualquier parte de la aplicación:

```tsx
import ConfirmationModal from '../../components/common/Modal/ConfirmationModal';

const [isOpen, setIsOpen] = useState(false);

<ConfirmationModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  status="success"
  title="¡Éxito!"
  message="Tu acción se completó correctamente."
  actionButtonText="Continuar"
  onActionClick={() => {
    // Hacer algo aquí
  }}
/>
```

## Validaciones Mejoradas

El formulario de registro ya incluye validaciones:
- ✅ Nombre requerido
- ✅ Email válido (regex)
- ✅ Contraseña mínimo 6 caracteres
- ✅ Contraseñas coincidentes
- ✅ Errores mostrados en tiempo real

## Próximas Mejoras (Opcionales)

1. **Recuperación de contraseña**:
   - Crear flujo similar para reset de password
   - URL: `/auth/reset-password?token_hash=xxx`

2. **Reenviar email de confirmación**:
   - Agregar opción en login si la cuenta aún no está confirmada

3. **Actualización de email**:
   - Similar al flujo de confirmación pero para cambio de email

## Testing

Para probar el flujo lokalmente:

1. Iniciaza el servidor: `npm run dev`
2. Ve a http://localhost:5173/
3. Abre el auth modal y registrate
4. Revisa los logs de Supabase para el email
5. Copia el link de confirmación
6. Abre el link en el navegador
7. Deberías ver la página de confirmación y un modal de éxito
