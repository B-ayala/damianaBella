/**
 * Middleware de autenticación para Supabase
 * 
 * Uso en rutas protegidas:
 * router.get('/protected', authMiddleware, controllerFunction)
 */

const authMiddleware = (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido'
      });
    }

    const token = authHeader.substring(7);
    
    // Aquí iría la validación del token con Supabase
    // Para ahora, simplemente lo pasamos al siguiente middleware
    req.token = token;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido',
      error: error.message
    });
  }
};

/**
 * Middleware para validar rol de administrador
 * Debe usarse DESPUÉS de authMiddleware
 */
const adminMiddleware = async (req, res, next) => {
  try {
    // Aquí buscarías el user_id del token y verificarías su rol
    // Ejemplo simplificado:
    
    const userRole = req.user?.role; // req.user debe ser establecido por authMiddleware
    
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: se requieren permisos de administrador'
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al validar rol',
      error: error.message
    });
  }
};

/**
 * Middleware para manejo de errores de validación
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Error de base de datos
  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({
      success: false,
      message: 'Error en la base de datos',
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }
  
  // Error genérico
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  errorHandler
};
