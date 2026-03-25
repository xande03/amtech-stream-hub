import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Palette {
  name: string;
  colors: {
    primary: string;
    secondary: string;
  };
}

const palettes: Palette[] = [
  { name: 'Paleta 1', colors: { primary: '#333', secondary: '#666' } },
  { name: 'Paleta 2', colors: { primary: '#f00', secondary: '#0f0' } },
  { name: 'Paleta 3', colors: { primary: '#00f', secondary: '#ff0' } },
];

const PaletteSwitcher = () => {
  const [selectedPalette, setSelectedPalette] = useState(palettes[0]);

  const handlePaletteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPalette = palettes.find((p) => p.name === e.target.value);
    if (newPalette) setSelectedPalette(newPalette);
  };

  return (
    <div className="flex items-center gap-3">
      <select
        value={selectedPalette.name}
        onChange={handlePaletteChange}
        className="rounded-md border border-border bg-background px-3 py-2 text-foreground"
      >
        {palettes.map((palette) => (
          <option key={palette.name} value={palette.name}>
            {palette.name}
          </option>
        ))}
      </select>
      <Button
        style={{
          backgroundColor: selectedPalette.colors.primary,
          color: selectedPalette.colors.secondary,
        }}
      >
        Trocar Paleta
      </Button>
    </div>
  );
};

export default PaletteSwitcher;
