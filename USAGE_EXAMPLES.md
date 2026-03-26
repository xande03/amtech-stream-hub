# 💡 Exemplos Práticos de Uso do Sistema de Cache

## 📚 Índice
1. [Uso Básico](#uso-básico)
2. [Integração em Páginas](#integração-em-páginas)
3. [Verificação de Cache](#verificação-de-cache)
4. [Atualização de Dados](#atualização-de-dados)
5. [Limpeza de Cache](#limpeza-de-cache)

---

## 1. Uso Básico

### Importar o Hook
```typescript
import { useContentCache } from '@/hooks/useContentCache';
```

### Acessar Dados do Cache
```typescript
function MyComponent() {
  const cache = useContentCache();
  
  // Acessar categorias
  const liveCategories = cache.liveCategories;
  const vodCategories = cache.vodCategories;
  const seriesCategories = cache.seriesCategories;
  
  // Acessar streams por categoria
  const moviesFromCategory = cache.vodStreams['123']; // ID da categoria
  const seriesFromCategory = cache.seriesList['456'];
  const liveChannels = cache.liveStreams['789'];
  
  return (
    <div>
      <h2>Categorias: {vodCategories.length}</h2>
    </div>
  );
}
```

---

## 2. Integração em Páginas

### Exemplo: Página de Filmes

```typescript
import { useState, useEffect } from 'react';
import { useContentCache } from '@/hooks/useContentCache';
import { useAuth } from '@/contexts/AuthContext';
import { getVodStreams } from '@/services/xtreamApi';

function MoviesPage() {
  const cache = useContentCache();
  const { accessCode } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Usar categorias do cache
  const categories = cache.vodCategories;
  
  useEffect(() => {
    if (!selectedCategory) return;
    
    // Verificar se já tem no cache
    const cachedMovies = cache.vodStreams[selectedCategory];
    
    if (cachedMovies && cachedMovies.length > 0) {
      // Usar dados do cache
      setMovies(cachedMovies);
    } else {
      // Buscar da API e salvar no cache
      setLoading(true);
      getVodStreams(accessCode!, selectedCategory)
        .then(data => {
          cache.setVodStreams(selectedCategory, data);
          setMovies(data);
        })
        .finally(() => setLoading(false));
    }
  }, [selectedCategory]);
  
  return (
    <div>
      <select onChange={(e) => setSelectedCategory(e.target.value)}>
        {categories.map(cat => (
          <option key={cat.category_id} value={cat.category_id}>
            {cat.category_name}
          </option>
        ))}
      </select>
      
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="grid">
          {movies.map(movie => (
            <MovieCard key={movie.stream_id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Exemplo: Página Home com Cache

```typescript
import { useContentCache } from '@/hooks/useContentCache';

function HomePage() {
  const cache = useContentCache();
  
  // Pegar filmes de múltiplas categorias do cache
  const allMovies = Object.values(cache.vodStreams).flat();
  const allSeries = Object.values(cache.seriesList).flat();
  
  // Filtrar por mais recentes
  const recentMovies = allMovies
    .sort((a, b) => Number(b.added) - Number(a.added))
    .slice(0, 10);
  
  // Filtrar por melhor avaliação
  const topRated = allMovies
    .sort((a, b) => Number(b.rating_5based) - Number(a.rating_5based))
    .slice(0, 10);
  
  return (
    <div>
      <Section title="Adicionados Recentemente">
        {recentMovies.map(movie => (
          <MovieCard key={movie.stream_id} movie={movie} />
        ))}
      </Section>
      
      <Section title="Mais Bem Avaliados">
        {topRated.map(movie => (
          <MovieCard key={movie.stream_id} movie={movie} />
        ))}
      </Section>
    </div>
  );
}
```

---

## 3. Verificação de Cache

### Verificar se Cache Está Desatualizado

```typescript
function DataManager() {
  const cache = useContentCache();
  const { accessCode } = useAuth();
  
  useEffect(() => {
    // Verificar se precisa atualizar
    if (cache.isStale()) {
      console.log('Cache desatualizado, recarregando...');
      reloadData();
    }
  }, []);
  
  const reloadData = async () => {
    // Recarregar categorias
    const categories = await getVodCategories(accessCode!);
    cache.setVodCategories(categories);
    
    // Recarregar streams das categorias principais
    for (const cat of categories.slice(0, 5)) {
      const streams = await getVodStreams(accessCode!, cat.category_id);
      cache.setVodStreams(cat.category_id, streams);
    }
  };
  
  return <div>Gerenciador de Dados</div>;
}
```

### Verificar se Há Dados em Cache

```typescript
function ContentChecker() {
  const cache = useContentCache();
  
  const hasCache = 
    cache.vodCategories.length > 0 ||
    cache.seriesCategories.length > 0 ||
    cache.liveCategories.length > 0;
  
  if (!hasCache) {
    return <EmptyState message="Nenhum conteúdo carregado" />;
  }
  
  return (
    <div>
      <p>Categorias de Filmes: {cache.vodCategories.length}</p>
      <p>Categorias de Séries: {cache.seriesCategories.length}</p>
      <p>Categorias de TV: {cache.liveCategories.length}</p>
    </div>
  );
}
```

---

## 4. Atualização de Dados

### Atualizar Cache Manualmente

```typescript
function RefreshButton() {
  const cache = useContentCache();
  const { accessCode } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      // Recarregar todas as categorias
      const [live, vod, series] = await Promise.all([
        getLiveCategories(accessCode!),
        getVodCategories(accessCode!),
        getSeriesCategories(accessCode!),
      ]);
      
      cache.setLiveCategories(live);
      cache.setVodCategories(vod);
      cache.setSeriesCategories(series);
      
      toast.success('Cache atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar cache');
    } finally {
      setRefreshing(false);
    }
  };
  
  return (
    <Button onClick={handleRefresh} disabled={refreshing}>
      {refreshing ? 'Atualizando...' : 'Atualizar Cache'}
    </Button>
  );
}
```

### Atualização em Background

```typescript
function BackgroundSync() {
  const cache = useContentCache();
  const { accessCode } = useAuth();
  
  useEffect(() => {
    // Atualizar cache a cada 30 minutos
    const interval = setInterval(() => {
      if (cache.isStale()) {
        console.log('Atualizando cache em background...');
        updateCache();
      }
    }, 1000 * 60 * 5); // Verificar a cada 5 minutos
    
    return () => clearInterval(interval);
  }, []);
  
  const updateCache = async () => {
    // Atualizar silenciosamente
    const categories = await getVodCategories(accessCode!).catch(() => []);
    if (categories.length > 0) {
      cache.setVodCategories(categories);
    }
  };
  
  return null; // Componente invisível
}
```

---

## 5. Limpeza de Cache

### Limpar Cache ao Fazer Logout

```typescript
function LogoutButton() {
  const cache = useContentCache();
  const { clearConfig } = useAuth();
  
  const handleLogout = () => {
    // Limpar configuração
    clearConfig();
    
    // Limpar cache
    cache.clearCache();
    
    // Redirecionar
    navigate('/settings');
  };
  
  return (
    <Button onClick={handleLogout}>
      Sair
    </Button>
  );
}
```

### Limpar Cache de Categoria Específica

```typescript
function CategoryManager() {
  const cache = useContentCache();
  
  const clearCategoryCache = (categoryId: string) => {
    // Criar novo objeto sem a categoria
    const { [categoryId]: removed, ...rest } = cache.vodStreams;
    
    // Atualizar cache (você precisaria adicionar este método ao hook)
    // Por enquanto, recarregue a categoria
    cache.setVodStreams(categoryId, []);
  };
  
  return (
    <div>
      {cache.vodCategories.map(cat => (
        <div key={cat.category_id}>
          <span>{cat.category_name}</span>
          <Button onClick={() => clearCategoryCache(cat.category_id)}>
            Limpar
          </Button>
        </div>
      ))}
    </div>
  );
}
```

---

## 🎯 Boas Práticas

### 1. Sempre Verificar se Há Dados
```typescript
const movies = cache.vodStreams[categoryId] || [];
```

### 2. Usar Fallback para API
```typescript
const data = cache.vodCategories.length > 0 
  ? cache.vodCategories 
  : await getVodCategories(accessCode!);
```

### 3. Verificar Validade do Cache
```typescript
if (cache.isStale()) {
  // Recarregar dados
}
```

### 4. Tratar Erros
```typescript
try {
  const data = await getVodStreams(accessCode!, categoryId);
  cache.setVodStreams(categoryId, data);
} catch (error) {
  console.error('Erro ao carregar:', error);
  // Usar dados do cache mesmo que desatualizados
  return cache.vodStreams[categoryId] || [];
}
```

### 5. Loading States
```typescript
const [loading, setLoading] = useState(!cache.vodCategories.length);
```

---

## 🚀 Dicas de Performance

1. **Pré-carregar na Splash**: Já implementado ✅
2. **Usar dados do cache primeiro**: Sempre verificar cache antes de chamar API
3. **Atualizar em background**: Não bloquear UI durante atualizações
4. **Limpar cache antigo**: Implementar limpeza automática de dados não usados
5. **Comprimir dados**: Considerar compressão para grandes volumes

---

## 📊 Monitoramento

### Verificar Tamanho do Cache
```typescript
function CacheStats() {
  const cache = useContentCache();
  
  const stats = {
    categories: cache.vodCategories.length + 
                cache.seriesCategories.length + 
                cache.liveCategories.length,
    movies: Object.values(cache.vodStreams).flat().length,
    series: Object.values(cache.seriesList).flat().length,
    channels: Object.values(cache.liveStreams).flat().length,
  };
  
  return (
    <div>
      <h3>Estatísticas do Cache</h3>
      <p>Categorias: {stats.categories}</p>
      <p>Filmes: {stats.movies}</p>
      <p>Séries: {stats.series}</p>
      <p>Canais: {stats.channels}</p>
    </div>
  );
}
```

---

Estes exemplos cobrem os casos de uso mais comuns. Adapte conforme necessário para seu projeto! 🎉
