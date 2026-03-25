```tsx
import React from 'react';

const Home: React.FC = () => {
  return (
    <div>
      <h1>olá guerreiros</h1>
    </div>
  );
};

export default Home;
```
Observação: Caso você não tenha um arquivo `Home.tsx` criado, você precisará criá-lo. Além disso, certifique-se de que o componente `Home` esteja sendo renderizado na tela inicial do seu aplicativo. Se você estiver usando um arquivo `App.tsx` como ponto de entrada, por exemplo, você precisará importar e renderizar o componente `Home` nele. Por exemplo:

```tsx
// src/App.tsx
import React from 'react';
import Home from './components/Home';

const App: React.FC = () => {
  return (
    <div>
      <Home />
    </div>
  );
};

export default App;
```