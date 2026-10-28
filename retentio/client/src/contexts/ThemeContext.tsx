import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'dark' | 'light';

export const THEME_KEY = 'retentio_theme';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    if (typeof window !== 'undefined') {
      const isPublicOrLanding = window.location.pathname === '/' || window.location.pathname === '/login' || window.location.pathname === '/signup';
      const root = document.documentElement;
      if (isPublicOrLanding) {
        root.setAttribute('data-theme', 'dark');
        root.classList.remove('theme-light');
        root.classList.add('theme-dark');
      } else {
        root.setAttribute('data-theme', theme);
        root.classList.remove('theme-dark', 'theme-light');
        root.classList.add(`theme-${theme}`);
      }
    }
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
