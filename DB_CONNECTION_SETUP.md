# 🔧 Solución - Error de Conexión PostgreSQL/Supabase

## ✅ Cambios Realizados

1. **Mejorado logging de errores** en `config/database.js`
2. **Actualizado `initDatabase.js`** para ser compatible con Supabase
3. **Simplificado modelo `User.js`** para usar JOINs con `auth.users`
4. **Agregado script** `npm run init-db`

---

## 🚀 Pasos para Resolver el Error

### Paso 1: Verificar que npm esté actualizado
```bash
cd c:\Users\Brian\Desktop\DamianaBella\lia-ecommerce
npm install
```

### Paso 2: Verificar archivo `.env`
Asegúrate que el archivo `.env` en `lia-ecommerce/` tenga:
```
NODE_ENV=development
PORT=3000

DB_HOST=db.nakhbsncabvwyrezhfsf.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=abj3wp9rfZGmVc2g
DB_NAME=postgres

FRONTEND_URL=http://localhost:5173
```

**⚠️ Importante:** Si cambiaste la contraseña en Supabase, actualízala aquí.

### Paso 3: Inicializar la Base de Datos
```bash
npm run init-db
```

Este comando:
- ✅ Verifica conexión a Supabase
- ✅ Crea/verifica tablas
- ✅ Inserta funciones y triggers
- ✅ Activa Row Level Security

**Salida esperada:**
```
🔧 Inicializando estructura de base de datos...

✓ Tabla profiles ya existe en Supabase
  Columnas:
    - id (uuid)
    - name (character varying)
    - role (character varying)
    - created_at (timestamp without time zone)

✓ RLS habilitado en profiles
✓ Política RLS ya existe: Users see their profile
✓ Función handle_new_user ya existe
✓ Trigger on_auth_user_created ya existe
✓ Índices verificados

✅ Base de datos inicializada correctamente
```

### Paso 4: Iniciar el servidor
```bash
npm run dev
```

**Salida esperada:**
```
📡 PostgreSQL conectado a db.nakhbsncabvwyrezhfsf.supabase.co:5432
✓ Conexión a PostgreSQL/Supabase establecida correctamente
✓ Tabla profiles verificada
🚀 Servidor corriendo en puerto 3000
```

---

## 🔍 Si Aún Hay Errores

### Error: `ECONNREFUSED` o `connect ETIMEDOUT`
**Causa:** No hay conexión a PostgreSQL

**Solución:**
```bash
# 1. Verifica que Supabase esté funcionando
# https://app.supabase.com → Project → Status

# 2. Verifica que el host sea correcto
ping db.nakhbsncabvwyrezhfsf.supabase.co

# 3. Verifica credenciales en Supabase Dashboard
# Auth > Databasehower > Connection string
```

### Error: `fatal: Ident authentication failed for user "postgres"`
**Causa:** Contraseña incorrecta

**Solución:**
```bash
# 1. Ve a Supabase Dashboard
# 2. Project Settings > Database > Password
# 3. Copia la contraseña exactamente
# 4. Actualiza .env -> DB_PASSWORD
# 5. Ejecuta: npm run init-db
```

### Error: `"public.profiles" does not exist`
**Causa:** Supabase Auth no fue configurado

**Solución:**
```bash
npm run init-db
```

Esto creará todas las tablas y triggers necesarios.

---

## ✨ Verificación Final

Una vez que todo esté configurado:

### 1. Backend funcionando
```
http://localhost:3000 → {"message": "API MVC..."}
http://localhost:3000/health → {"status": "OK"}
```

### 2. Frontend funcionando
```bash
cd c:\Users\Brian\Desktop\DamianaBella\damiana-bella
npm run dev
```
Accede a `http://localhost:5173`

### 3. Intentar Registro
- Haz clic en "Crear Cuenta"
- Completa el formulario
- Deberías ver "¡Cuenta creada exitosamente!"

### 4. Verificar en Supabase
- Supabase Dashboard > SQL Editor
- Ejecuta:
  ```sql
  SELECT id, name, role, created_at FROM public.profiles;
  ```
- Deberías ver tu usuario nuevo

---

## 📞 Checklist de Debugging

- [ ] Archivo `.env` está en `lia-ecommerce/` con credenciales correctas
- [ ] `npm install` se ejecutó correctamente
- [ ] `npm run init-db` se ejecutó sin errores
- [ ] `npm run dev` inicia el servidor sin crashes
- [ ] Backend responde en `http://localhost:3000`
- [ ] Frontend está en `http://localhost:5173`
- [ ] Tabla `profiles` existe en Supabase
- [ ] Trigger `on_auth_user_created` existe
- [ ] Política RLS está activa

---

**¿Algún error específico? Comparte el mensaje de consola completo y te ayudaré.**
