```tsx
import React from 'react';

interface Props {
  nome: string;
}

const Saudacao: React.FC<Props> = ({ nome }) => {
  return <h1>Olá, {nome}!</h1>;
};

export default Saudacao;
```