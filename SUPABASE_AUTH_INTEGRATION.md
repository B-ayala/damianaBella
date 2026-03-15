# Integración de Supabase Auth - Guía Completa

## ✅ Cambios Realizados

### 1. **Frontend - Cliente de Supabase**
   - ✅ Creado: `src/config/supabaseClient.ts`
   - ✅ Variables de entorno: `.env.local`
   - Credenciales ya configuradas para tu proyecto Supabase

### 2. **Frontend - Servicio de Usuarios**
   - ✅ Actualizado: `src/services/userService.ts`
   - **Nuevo flujo de registro:**
     1. `createUser()` → `supabase.auth.signUp()` 
     2. Trigger automático crea perfil en `public.profiles`
     3. Actualiza el `name` en el perfil
   
   - **Nuevo flujo de login:**
     1. `loginUser()` → `supabase.auth.signInWithPassword()`
     2. Obtiene datos del perfil desde `public.profiles`
   
   - **Nuevas funciones:**
     - `getCurrentUser()` - obtener usuario actual
     - `logoutUser()` - cerrar sesión

### 3. **Frontend - AdminStore (Estado)**
   - ✅ Actualizado: `src/admin/store/adminStore.ts`
   - Agregado campo `currentUser` para guardar datos del usuario autenticado
   - Método `logout()` ahora es async y limpia la sesión

### 4. **Frontend - AuthModal**
   - ✅ Verificado: `src/components/auth/AuthModal.tsx`
   - Ya maneja errores correctamente
   - Soporta registro y login con Supabase de forma nativa

### 5. **Backend**
   - ✅ Actualizado: `controllers/userController.js`
   - El endpoint `POST /api/users` ahora es obsoleto
   - La creación de usuarios ocurre en el frontend con Supabase Auth

---

## 🔄 NUEVO FLUJO DE AUTENTICACIÓN

### Registro (Sign Up)
```
Frontend (AuthModal)
    ↓
userService.createUser()
    ↓
supabase.auth.signUp()  ← Crea usuario en auth.users
    ↓
Trigger automático (on_auth_user_created)
    ↓
Crea perfil en public.profiles con role='user'
    ↓
userData.updateProfile() ← Actualiza el nombre
    ↓
✅ Usuario registrado y listo para iniciar sesión
```

### Login (Sign In)
```
Frontend (AuthModal)
    ↓
userService.loginUser()
    ↓
supabase.auth.signInWithPassword()
    ↓
Obtiene perfil desde public.profiles
    ↓
Retorna datos al adminStore
    ↓
✅ Usuario autenticado
```

### Logout
```
Frontend
    ↓
userService.logoutUser()
    ↓
supabase.auth.signOut()
    ↓
Limpia localStorage
    ↓
✅ Sesión cerrada
```

---

## 📋 ORDEN DE EJECUCIÓN EN SUPABASE

1. **Trigger Automático:**
   ```sql
   CREATE TRIGGER on_auth_user_created
   AFTER INSERT ON auth.users
   FOR EACH ROW
   EXECUTE FUNCTION public.handle_new_user();
   ```
   - Se ejecuta cuando se crea un usuario en `auth.users`
   - Crea automáticamente un perfil en `public.profiles`
   - Rol inicial: `'user'`

2. **RLS (Row Level Security):**
   ```sql
   CREATE POLICY "Users see their profile"
   ON public.profiles
   FOR SELECT
   USING (auth.uid() = id);
   ```
   - Los usuarios solo ven su propio perfil (seguridad)

3. **Conversión a Admin (Manual):**
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE id = (
     SELECT id FROM auth.users ORDER BY created_at LIMIT 1
   );
   ```
   - Ya ejecutada para tu primer usuario (tú) ✅

---

## ✨ PRUEBAS NECESARIAS

### Test 1: Registro nuevo usuario
```
1. Abre http://localhost:5173
2. Haz clic en "Crear Cuenta"
3. Completa el formulario:
   - Nombre: "Test User"
   - Email: "test@example.com"
   - Password: "Password123"
   - Confirmar: "Password123"
4. ✅ Deberías ver "¡Cuenta creada exitosamente!"
5. Verifica en Supabase: Table > profiles
   - Debe existir un nuevo registro con role='user'
```

### Test 2: Login con usuario creado
```
1. Haz clic en "Iniciar Sesión"
2. Email: "test@example.com"
3. Password: "Password123"
4. ✅ Deberías entrar a la aplicación
5. Nota: Como no es admin, no podrá acceder a /admin
```

### Test 3: Login como admin (TÚ)
```
1. Ya estás configurado como admin
2. Email: Tu email
3. Password: Tu contraseña
4. ✅ Deberías poder acceder a http://localhost:5173/admin
```

### Test 4: Hacer admin a otro usuario (Manual)
```
En Supabase SQL Editor:
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'test@example.com';
```

---

## 🔐 Variables de Entorno

### Frontend (`.env.local`)
```
VITE_API_URL_LOCAL=http://localhost:3000/api
VITE_SUPABASE_URL=https://nakhbsncabvwyrezhfsf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Backend (`.env`)
```
db.nakhbsncabvwyrezhfsf.supabase.coDB_HOST=
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=abj3wp9rfZGmVc2g
DB_NAME=postgres
```

---

## ⚠️ IMPORTANTE

1. **Trigger debe estar activo:** El trigger `on_auth_user_created` debe estar creado en Supabase
2. **RLS habilitado:** La tabla `public.profiles` debe tener Row Level Security activado
3. **Email verificación:** Por defecto, Supabase requiere verificación de email. Puedes desactivarlo en:
   - Supabase Dashboard > Authentication > Providers > Email

---

## 🚀 PRÓXIMOS PASOS (Opcionales)

Si necesitas más seguridad:

1. **Validar tokens de Supabase en el backend:**
   ```javascript
   const { data: { user }, error } = await supabase.auth.getUser(token);
   ```

2. **Proteger rutas de admin:**
   - Verificar que `role === 'admin'` antes de permitir acceso

3. **Enviar emails de confirmación:**
   - Configurar en Supabase Auth > Email Templates

---

## 📞 SOPORTE

Si aún tienes errores:
1. Revisa la consola del navegador (F12)
2. Revisa Supabase Dashboard > Logs
3. Verifica que `.env.local` tenga las credenciales correctas
4. Confirma que el trigger y RLS están creados en Supabase

---

**Última actualización:** 15/03/2026
**Estado:** ✅ Integración completada
