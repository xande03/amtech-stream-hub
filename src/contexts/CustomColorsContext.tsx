import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CustomColors {
  corBotao: string;
  corIndicador: string;
  corModulo: string;
  paleta: string;
}

export const paletas = [
  { id: 'verde', label: 'Verde', cor: '#22c55e' },
  { id: 'amarelo', label: 'Amarelo', cor: '#eab308' },
  { id: 'vermelho', label: 'Vermelho', cor: '#ef4444' },
  { id: 'azul', label: 'Azul', cor: '#3b82f6' },
];

const STORAGE_KEY = 'xerife_custom_colors';

const defaultColors: CustomColors = {
  corBotao: '#22c55e',
  corIndicador: '#22c55e',
  corModulo: '#22c55e',
  paleta: 'verde',
};

interface CustomColorsContextType {
  colors: CustomColors;
  setColors: (colors: CustomColors) => void;
  setPaleta: (paletaId: string) => void;
}

const CustomColorsContext = createContext<CustomColorsContextType>({
  colors: defaultColors,
  setColors: () => {},
  setPaleta: () => {},
});

export const useCustomColors = () => useContext(CustomColorsContext);

export const CustomColorsProvider = ({ children }: { children: ReactNode }) => {
  const [colors, setColorsState] = useState<CustomColors>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...defaultColors, ...JSON.parse(saved) };
    } catch {}
    return defaultColors;
  });

  const setColors = (newColors: CustomColors) => {
    setColorsState(newColors);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newColors));
  };

  const setPaleta = (paletaId: string) => {
    const paleta = paletas.find((p) => p.id === paletaId);
    if (!paleta) return;
    const newColors: CustomColors = {
      corBotao: paleta.cor,
      corIndicador: paleta.cor,
      corModulo: paleta.cor,
      paleta: paletaId,
    };
    setColors(newColors);
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--color-botao', colors.corBotao);
    document.documentElement.style.setProperty('--color-indicador', colors.corIndicador);
    document.documentElement.style.setProperty('--color-modulo', colors.corModulo);
  }, [colors]);

  return (
    <CustomColorsContext.Provider value={{ colors, setColors, setPaleta }}>
      {children}
    </CustomColorsContext.Provider>
  );
};
