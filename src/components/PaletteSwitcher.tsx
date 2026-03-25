```tsx
import React, { useState } from 'react';
import { Button, Select } from '@mui/material';

interface Palette {
  name: string;
  colors: {
    primary: string;
    secondary: string;
  };
}

const palettes: Palette[] = [
  {
    name: 'Paleta 1',
    colors: {
      primary: '#333',
      secondary: '#666',
    },
  },
  {
    name: 'Paleta 2',
    colors: {
      primary: '#f00',
      secondary: '#0f0',
    },
  },
  {
    name: 'Paleta 3',
    colors: {
      primary: '#00f',
      secondary: '#ff0',
    },
  },
];

const PaletteSwitcher = () => {
  const [selectedPalette, setSelectedPalette] = useState(palettes[0]);

  const handlePaletteChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const selectedPaletteName = event.target.value as string;
    const newPalette = palettes.find((palette) => palette.name === selectedPaletteName);
    if (newPalette) {
      setSelectedPalette(newPalette);
    }
  };

  return (
    <div>
      <Select
        value={selectedPalette.name}
        onChange={handlePaletteChange}
        sx={{ width: '200px' }}
      >
        {palettes.map((palette) => (
          <option key={palette.name} value={palette.name}>
            {palette.name}
          </option>
        ))}
      </Select>
      <Button
        sx={{
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
```