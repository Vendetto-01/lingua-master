import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // 1. localStorage'dan oku
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      return storedTheme;
    }
    // 2. Sistem tercihini kontrol et (isteğe bağlı ama iyi bir pratik)
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    // 3. Varsayılan olarak 'light'
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  // Belirli bir temayı ayarlamak için fonksiyon (isteğe bağlı)
  const setCurrentTheme = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setTheme(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setCurrentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};