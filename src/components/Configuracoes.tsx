```typescript
import React, { useState } from 'react';

interface Cor {
  nome: string;
  valor: string;
}

const cores: Cor[] = [
  { nome: 'Verde', valor: 'green' },
  { nome: 'Azul', valor: 'blue' },
  { nome: 'Vermelho', valor: 'red' },
  { nome: 'Laranja', valor: 'orange' },
];

const Configuracoes = () => {
  const [corBotao, setCorBotao] = useState('green');
  const [corIndicador, setCorIndicador] = useState('green');
  const [corModulo, setCorModulo] = useState('green');

  const handleCorBotao = (cor: string) => {
    setCorBotao(cor);
  };

  const handleCorIndicador = (cor: string) => {
    setCorIndicador(cor);
  };

  const handleCorModulo = (cor: string) => {
    setCorModulo(cor);
  };

  return (
    <div>
      <h2>Configurações</h2>
      <div>
        <label>Cor do botão:</label>
        <select value={corBotao} onChange={(e) => handleCorBotao(e.target.value)}>
          {cores.map((cor) => (
            <option key={cor.valor} value={cor.valor}>
              {cor.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Cor do indicador:</label>
        <select value={corIndicador} onChange={(e) => handleCorIndicador(e.target.value)}>
          {cores.map((cor) => (
            <option key={cor.valor} value={cor.valor}>
              {cor.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Cor do módulo:</label>
        <select value={corModulo} onChange={(e) => handleCorModulo(e.target.value)}>
          {cores.map((cor) => (
            <option key={cor.valor} value={cor.valor}>
              {cor.nome}
            </option>
          ))}
        </select>
      </div>
      <button style={{ backgroundColor: corBotao }}>Botão</button>
      <div style={{ backgroundColor: corIndicador, width: 20, height: 20 }}></div>
      <div style={{ backgroundColor: corModulo, width: 50, height: 50 }}></div>
    </div>
  );
};

export default Configuracoes;
```