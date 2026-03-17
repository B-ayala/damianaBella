// ─── Contacto & Redes ────────────────────────────────────────────────────────
export const WHATSAPP_NUMBER = '5491141442409'; // +54 9 11 4144-2409
export const WHATSAPP_NUMBER_DISPLAY = '+54 9 11 4144-2409';
export const CONTACT_EMAIL = 'liazapatos2001@gmail.com';
export const WHATSAPP_DEFAULT_MESSAGE = 'Hola, me gustaría recibir más información';

export const SOCIAL_LINKS = {
  whatsapp: `https://wa.me/${WHATSAPP_NUMBER}`,
  tiktok: 'https://www.tiktok.com/@liazapatos',
  tiktokUser: '@liazapatos',
  facebook: 'https://www.facebook.com/zapatos.lia.2020/',
  facebookUser: 'zapatos.lia.2020',
} as const;

// ─── Color Palette (Paleta centralizada) ──────────────────────────────────────
export const COLOR_PALETTE = {
  // Brand colors
  brand: {
    primary: '#B8A5C8',
    primaryLight: '#D4C9E0',
    primaryDark: '#9A86AC',
    primaryBg: '#F5F0FA',
    accent: '#B8377D',
  },
  // Neutral/Grays
  gray: {
    50: '#fdfdfd',
    75: '#f9fafb',
    100: '#f8f8f8',
    125: '#f7f7f7',
    150: '#f5f5f5',
    175: '#f1f5f9',
    200: '#e2e8f0',
    300: '#dddddd',
    400: '#ccc',
    500: '#999999',
    600: '#666666',
    700: '#555555',
    textDark: '#333',
    white: '#ffffff',
    black: '#000000',
  },
  // Semantic colors
  semantic: {
    brandGreen: '#2c5f2d',
    success: '#00a650',
    error: '#ef4444',
    info: '#3483fa',
    infoHover: '#2968c8',
    infoDark: '#1f62c2',
    infoSecondary: '#009ee3',
  },
} as const;

// ─── Mapa de colores de variantes de productos ────────────────────────────────
export const COLOR_MAP: Record<string, string> = {
  Beige: '#F5F5DC',
  Gris: '#808080',
  Negro: '#000000',
  Azul: '#1E90FF',
  Vino: '#722F37',
  Camel: '#C19A6B',
  'Gris Oscuro': '#555555',
  'Azul Marino': '#000080',
  Blanco: '#FFFFFF',
  Rojo: '#FF0000',
  Verde: '#008000',
  Amarillo: '#FFFF00',
  Rosa: '#FFC0CB',
  Morado: '#800080',
  Marrón: '#8B4513',
};

export const COLOR_FALLBACK = '#CCCCCC';
