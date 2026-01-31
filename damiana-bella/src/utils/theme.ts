export const theme = {
  colors: {
    primary: '#B8A5C8',
    primaryLight: '#D4C9E0',
    primaryDark: '#9A86AC',
    textDark: '#333',
    textLight: '#666',
    bgLight: '#F5F0FA',
    white: '#fff',
    black: '#000',
  },
  fonts: {
    main: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1400px',
  },
};

// Only export Theme type in .ts files, not .tsx
// Remove export type Theme for JS/TSX compatibility
