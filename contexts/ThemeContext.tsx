import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'dark' | 'light';

export const THEMES = {
  dark: {
    bg:           '#060d12',
    bgSecondary:  '#0a1628',
    card:         'rgba(255,255,255,0.02)',
    cardBorder:   'rgba(255,255,255,0.05)',
    text:         '#f0faf6',
    textSub:      '#2a7a5e',
    textMuted:    '#1a4a35',
    accent:       '#4dd9ac',
    accentDark:   '#2a7a5e',
    navBg:        '#060d12',
    navBorder:    'rgba(77,217,172,0.1)',
    sheetBg:      '#0a1628',
    inputBg:      'rgba(77,217,172,0.03)',
    inputBorder:  'rgba(77,217,172,0.2)',
  },
  light: {
    bg:           '#f0f7f4',
    bgSecondary:  '#ffffff',
    card:         'rgba(0,0,0,0.03)',
    cardBorder:   'rgba(0,0,0,0.08)',
    text:         '#0a2018',
    textSub:      '#2a7a5e',
    textMuted:    '#6aab8e',
    accent:       '#1a7a5e',
    accentDark:   '#2a7a5e',
    navBg:        '#ffffff',
    navBorder:    'rgba(42,122,94,0.15)',
    sheetBg:      '#ffffff',
    inputBg:      'rgba(42,122,94,0.05)',
    inputBorder:  'rgba(42,122,94,0.2)',
  },
};

interface ThemeContextType {
  theme: Theme;
  colors: typeof THEMES.dark;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  colors: THEMES.dark,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => { loadTheme(); }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('focus_theme');
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    } catch {}
  };

  const toggleTheme = async () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { await AsyncStorage.setItem('focus_theme', next); } catch {}
  };

  return (
    <ThemeContext.Provider value={{ theme, colors: THEMES[theme], toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}