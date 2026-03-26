# Sistema de Cache e Pré-carregamento

## Visão Geral

O Xerife Player agora possui um sistema robusto de pré-carregamento de conteúdo que garante uma experiência fluida para o usuário. Quando o usuário clica em "ENTRAR" na tela de splash, todo o conteúdo é carregado previamente antes de acessar o aplicativo.

## Funcionalidades Implementadas

### 1. Tela de Splash com Carregamento Inteligente

**Arquivo:** `src/components/SplashScreen.tsx`

A tela de splash agora:
- Exibe um botão "ENTRAR" que inicia o pré-carregamento
- Mostra uma barra de progresso durante o carregamento
- Exibe mensagens de status para cada etapa
- Desabilita o botão durante o carregamento
- Permite entrada imediata se o usuário não estiver configurado

**Etapas de Carregamento:**
1. **Categorias** (0-20%): Carrega todas as categorias de Live TV, Filmes e Séries
2. **Canais ao Vivo** (20-40%): Carrega streams das 5 principais categorias de TV
3. **Filmes** (40-70%): Carrega filmes das 5 principais categorias
4. **Séries** (70-90%): Carrega séries das 5 principais categorias
5. **Otimização** (90-100%): Finaliza e prepara o cache

### 2. Sistema de Cache Global

**Arquivo:** `src/hooks/useContentCache.ts`

Implementado com Zustand + Persist para:
- Armazenar categorias e streams em memória
- Persistir dados no localStorage
- Cache com duração de 30 minutos
- Verificação automática de dados obsoletos

**Estrutura do Cache:**
```typescript
{
  liveCategories: Category[]
  vodCategories: Category[]
  seriesCategories: Category[]
  liveStreams: Record<string, LiveStream[]>
  vodStreams: Record<string, VodStream[]>
  seriesList: Record<string, Series[]>
  lastUpdated: number | null
}
```

**Métodos Disponíveis:**
- `setLiveCategories(categories)` - Salva categorias de TV ao vivo
- `setVodCategories(categories)` - Salva categorias de filmes
- `setSeriesCategories(categories)` - Salva categorias de séries
- `setLiveStreams(categoryId, streams)` - Salva streams de uma categoria
- `setVodStreams(categoryId, streams)` - Salva filmes de uma categoria
- `setSeriesList(categoryId, series)` - Salva séries de uma categoria
- `clearCache()` - Limpa todo o cache
- `isStale()` - Verifica se o cache está desatualizado

## Como Usar o Cache nas Páginas

### Exemplo de Uso Básico

```typescript
import { useContentCache } from '@/hooks/useContentCache';

function MyComponent() {
  const cache = useContentCache();
  
  // Verificar se há dados em cache
  const hasCache = cache.vodCategories.length > 0;
  
  // Usar dados do cache
  const categories = cache.vodCategories;
  const moviesFromCategory = cache.vodStreams['category_id'];
  
  // Verificar se cache está desatualizado
  if (cache.isStale()) {
    // Recarregar dados
  }
  
  return (
    <div>
      {categories.map(cat => (
        <div key={cat.category_id}>{cat.category_name}</div>
      ))}
    </div>
  );
}
```

### Exemplo com Fallback para API

```typescript
import { useContentCache } from '@/hooks/useContentCache';
import { getVodCategories } from '@/services/xtreamApi';
import { useAuth } from '@/contexts/AuthContext';

function MoviesPage() {
  const cache = useContentCache();
  const { accessCode } = useAuth();
  const [categories, setCategories] = useState(cache.vodCategories);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Se não há cache ou está desatualizado, buscar da API
    if (categories.length === 0 || cache.isStale()) {
      setLoading(true);
      getVodCategories(accessCode!)
        .then(data => {
          cache.setVodCategories(data);
          setCategories(data);
        })
        .finally(() => setLoading(false));
    }
  }, [accessCode]);
  
  if (loading) return <LoadingSkeleton />;
  
  return (
    <div>
      {categories.map(cat => (
        <CategorySection key={cat.category_id} category={cat} />
      ))}
    </div>
  );
}
```

## Benefícios

1. **Performance**: Conteúdo carregado uma única vez no início
2. **Experiência do Usuário**: Navegação instantânea entre páginas
3. **Redução de Requisições**: Menos chamadas à API
4. **Offline-First**: Dados persistidos no localStorage
5. **Cache Inteligente**: Atualização automática após 30 minutos

## Configuração

### Ajustar Duração do Cache

Edite `src/hooks/useContentCache.ts`:

```typescript
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutos (padrão)
// Altere para o valor desejado em milissegundos
```

### Ajustar Quantidade de Categorias Pré-carregadas

Edite `src/components/SplashScreen.tsx`:

```typescript
// Atualmente carrega 5 categorias de cada tipo
const topLiveCategories = liveCategories.slice(0, 5);
const topVodCategories = vodCategories.slice(0, 5);
const topSeriesCategories = seriesCategories.slice(0, 5);

// Altere o número conforme necessário
```

## Dependências Adicionadas

- `zustand` - Gerenciamento de estado global
- `zustand/middleware` - Persistência no localStorage

## Próximos Passos Sugeridos

1. Implementar pré-carregamento de imagens (posters/capas)
2. Adicionar cache para detalhes de filmes/séries individuais
3. Implementar estratégia de cache LRU (Least Recently Used)
4. Adicionar indicador visual de conteúdo em cache
5. Implementar sincronização em background
