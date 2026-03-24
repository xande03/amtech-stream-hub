import React, { useState } from 'react';

interface CorOpcao {
  nome: string;
  valor: string;
}

const opcoesCores: CorOpcao[] = [
  { nome: 'Verde', valor: 'verde' },
  { nome: 'Azul', valor: 'azul' },
  { nome: 'Vermelho', valor: 'vermelho' },
  { nome: 'Laranja', valor: 'laranja' }
];

export function Configuracoes() {
  const [corBotao, setCorBotao] = useState('verde');
  const [corIndicador, setCorIndicador] = useState('azul');
  const [corModulo, setCorModulo] = useState('vermelho');

  const handleMudarCorBotao = (cor: string) => {
    setCorBotao(cor);
  };

  const handleMudarCorIndicador = (cor: string) => {
    setCorIndicador(cor);
  };

  const handleMudarCorModulo = (cor: string) => {
    setCorModulo(cor);
  };

  return (
    <div>
      <h2>Configurações</h2>
      <div>
        <label>Cor dos botões:</label>
        <select value={corBotao} onChange={(e) => handleMudarCorBotao(e.target.value)}>
          {opcoesCores.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>{opcao.nome}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Cor dos indicadores:</label>
        <select value={corIndicador} onChange={(e) => handleMudarCorIndicador(e.target.value)}>
          {opcoesCores.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>{opcao.nome}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Cor dos módulos:</label>
        <select value={corModulo} onChange={(e) => handleMudarCorModulo(e.target.value)}>
          {opcoesCores.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>{opcao.nome}</option>
          ))}
        </select>
      </div>
    </div>
  );
}