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

const Configuracoes: React.FC = () => {
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
        <label>Cor dos Botões:</label>
        <select value={corBotao} onChange={(e) => handleCorBotao(e.target.value)}>
          {cores.map((cor) => (
            <option key={cor.valor} value={cor.valor}>
              {cor.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Cor dos Indicadores:</label>
        <select value={corIndicador} onChange={(e) => handleCorIndicador(e.target.value)}>
          {cores.map((cor) => (
            <option key={cor.valor} value={cor.valor}>
              {cor.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Cor dos Módulos:</label>
        <select value={corModulo} onChange={(e) => handleCorModulo(e.target.value)}>
          {cores.map((cor) => (
            <option key={cor.valor} value={cor.valor}>
              {cor.nome}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Configuracoes;