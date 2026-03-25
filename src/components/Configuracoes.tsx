import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, Palette } from 'lucide-react';
import { toast } from 'sonner';

const cores = [
  { valor: '#22c55e', label: 'Verde' },
  { valor: '#3b82f6', label: 'Azul' },
  { valor: '#ef4444', label: 'Vermelho' },
  { valor: '#f97316', label: 'Laranja' },
  { valor: '#a855f7', label: 'Roxo' },
  { valor: '#ec4899', label: 'Rosa' },
];

const STORAGE_KEY = 'xerife_custom_colors';

function loadColors() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { corBotao: '#22c55e', corIndicador: '#22c55e', corModulo: '#22c55e' };
}

const Configuracoes = () => {
  const [corBotao, setCorBotao] = useState('#22c55e');
  const [corIndicador, setCorIndicador] = useState('#22c55e');
  const [corModulo, setCorModulo] = useState('#22c55e');

  useEffect(() => {
    const saved = loadColors();
    setCorBotao(saved.corBotao);
    setCorIndicador(saved.corIndicador);
    setCorModulo(saved.corModulo);
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ corBotao, corIndicador, corModulo }));
    toast.success('Cores salvas com sucesso!');
  };

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

  return (
    <div className="bg-card rounded-xl p-5 border border-border">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-primary" /> Personalização de Cores
      </h2>

      <div className="space-y-4">
        <ColorPicker label="Cor dos Botões" value={corBotao} onChange={setCorBotao} />
        <ColorPicker label="Cor dos Indicadores" value={corIndicador} onChange={setCorIndicador} />
        <ColorPicker label="Cor dos Módulos" value={corModulo} onChange={setCorModulo} />

        {/* Preview */}
        <div className="space-y-2 pt-2">
          <Label className="text-foreground text-sm">Prévia</Label>
          <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
            <button className="px-4 py-1.5 rounded-md text-white text-xs font-medium" style={{ backgroundColor: corBotao }}>
              Botão
            </button>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: corIndicador }} />
              <span className="text-xs text-muted-foreground">Indicador</span>
            </div>
            <div className="w-16 h-10 rounded-md" style={{ backgroundColor: corModulo, opacity: 0.8 }} />
          </div>
        </div>

        <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground">
          <Save className="w-4 h-4 mr-2" /> Salvar Cores
        </Button>
      </div>
    </div>
  );
};

export default Configuracoes;
