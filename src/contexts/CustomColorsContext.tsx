import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CustomColors {
  corBotao: string;
  corIndicador: string;
  corModulo: string;
}

const STORAGE_KEY = 'xerife_custom_colors';

const defaultColors: CustomColors = {
  corBotao: '#22c55e',
  corIndicador: '#22c55e',
  corModulo: '#22c55e',
};

interface CustomColorsContextType {
  colors: CustomColors;
  setColors: (colors: CustomColors) => void;
}

const CustomColorsContext = createContext<CustomColorsContextType>({
  colors: defaultColors,
  setColors: () => {},
});

export const useCustomColors = () => useContext(CustomColorsContext);

export const CustomColorsProvider = ({ children }: { children: ReactNode }) => {
  const [colors, setColorsState] = useState<CustomColors>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultColors;
  });

  const setColors = (newColors: CustomColors) => {
    setColorsState(newColors);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newColors));
  };

  // Apply as CSS custom properties globally
  useEffect(() => {
    document.documentElement.style.setProperty('--color-botao', colors.corBotao);
    document.documentElement.style.setProperty('--color-indicador', colors.corIndicador);
    document.documentElement.style.setProperty('--color-modulo', colors.corModulo);
  }, [colors]);

  return (
    <CustomColorsContext.Provider value={{ colors, setColors }}>
      {children}
    </CustomColorsContext.Provider>
  );
};
