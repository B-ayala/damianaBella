/**
 * Utilidades de validación reutilizables
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida si un email tiene un formato válido
 */
export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};
