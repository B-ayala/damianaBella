import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { theme } from './theme';

type Theme = typeof theme;

const ThemeContext = createContext<Theme>(theme);

export const useTheme = () => {
  return useContext(ThemeContext);
};

interface ThemeProviderProps {
  children: ReactNode;
  theme: Theme;
}

export const ThemeProvider = ({ children, theme }: ThemeProviderProps) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
