import React from 'react';
import { Label } from '@/components/ui/label';
import { Palette, Check } from 'lucide-react';
import { useCustomColors, paletas } from '@/contexts/CustomColorsContext';

const Configuracoes = () => {
  const { colors, setPaleta } = useCustomColors();

  return (
    <div className="bg-card rounded-xl p-5 border border-border">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-primary" /> Paleta de Cores
      </h2>

      <p className="text-sm text-muted-foreground mb-4">
        Escolha uma paleta global para botões, símbolos, módulos e informativos.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {paletas.map((paleta) => {
          const isActive = colors.paleta === paleta.id;
          return (
            <button
              key={paleta.id}
              type="button"
              onClick={() => setPaleta(paleta.id)}
              className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                isActive
                  ? 'border-foreground bg-secondary/80 scale-[1.02]'
                  : 'border-border bg-secondary/30 hover:bg-secondary/50 hover:border-muted-foreground'
              }`}
            >
              <div
                className="w-10 h-10 rounded-full shrink-0 shadow-lg"
                style={{ backgroundColor: paleta.cor }}
              />
              <span className="text-sm font-medium text-foreground">{paleta.label}</span>
              {isActive && (
                <div
                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: paleta.cor }}
                >
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Preview */}
      <div className="space-y-2 pt-4">
        <Label className="text-foreground text-sm">Prévia</Label>
        <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
          <button
            className="px-4 py-1.5 rounded-md text-white text-xs font-medium"
            style={{ backgroundColor: colors.corBotao }}
          >
            Botão
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: colors.corIndicador }}
            />
            <span className="text-xs text-muted-foreground">Indicador</span>
          </div>
          <div
            className="w-16 h-10 rounded-md"
            style={{ backgroundColor: colors.corModulo, opacity: 0.8 }}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3">As cores são aplicadas automaticamente.</p>
    </div>
  );
};

export default Configuracoes;
