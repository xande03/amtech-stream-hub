import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { useCustomColors } from '@/contexts/CustomColorsContext';

const cores = [
  { valor: '#22c55e', label: 'Verde' },
  { valor: '#3b82f6', label: 'Azul' },
  { valor: '#ef4444', label: 'Vermelho' },
  { valor: '#f97316', label: 'Laranja' },
  { valor: '#a855f7', label: 'Roxo' },
  { valor: '#ec4899', label: 'Rosa' },
];

const ColorPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="space-y-2">
    <Label className="text-foreground text-sm">{label}</Label>
    <div className="flex gap-2 flex-wrap">
      {cores.map((cor) => (
        <button
          key={cor.valor}
          type="button"
          onClick={() => onChange(cor.valor)}
          className={`w-8 h-8 rounded-full border-2 transition-all ${value === cor.valor ? 'border-foreground scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
          style={{ backgroundColor: cor.valor }}
          title={cor.label}
        />
      ))}
    </div>
  </div>
);

const Configuracoes = () => {
  const { colors, setColors } = useCustomColors();

  const update = (key: keyof typeof colors, value: string) => {
    setColors({ ...colors, [key]: value });
  };

  return (
    <div className="bg-card rounded-xl p-5 border border-border">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-primary" /> Personalização de Cores
      </h2>

      <div className="space-y-4">
        <ColorPicker label="Cor dos Botões" value={colors.corBotao} onChange={(v) => update('corBotao', v)} />
        <ColorPicker label="Cor dos Indicadores" value={colors.corIndicador} onChange={(v) => update('corIndicador', v)} />
        <ColorPicker label="Cor dos Módulos" value={colors.corModulo} onChange={(v) => update('corModulo', v)} />

        {/* Preview */}
        <div className="space-y-2 pt-2">
          <Label className="text-foreground text-sm">Prévia</Label>
          <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
            <button className="px-4 py-1.5 rounded-md text-white text-xs font-medium" style={{ backgroundColor: colors.corBotao }}>
              Botão
            </button>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: colors.corIndicador }} />
              <span className="text-xs text-muted-foreground">Indicador</span>
            </div>
            <div className="w-16 h-10 rounded-md" style={{ backgroundColor: colors.corModulo, opacity: 0.8 }} />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">As cores são salvas automaticamente.</p>
      </div>
    </div>
  );
};

export default Configuracoes;
