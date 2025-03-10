// Tipo para os itens armazenados no cache
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

// Classe para gerenciar o cache
class CacheManager {
  private cache: Record<string, CacheItem<any>> = {};
  private defaultDuration = 60 * 1000; // 1 minuto em milissegundos

  // Obter dados do cache, ou undefined se não existir ou expirado
  get<T>(key: string, duration?: number): T | undefined {
    const item = this.cache[key];
    const now = Date.now();
    const cacheDuration = duration || this.defaultDuration;

    // Verificar se o item existe e não expirou
    if (item && now - item.timestamp < cacheDuration) {
      return item.data;
    }

    // Se não existe ou expirou, retornar undefined
    return undefined;
  }

  // Armazenar dados no cache
  set<T>(key: string, data: T): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
    };
  }

  // Verificar se o cache existe e é válido
  isValid(key: string, duration?: number): boolean {
    const item = this.cache[key];
    const now = Date.now();
    const cacheDuration = duration || this.defaultDuration;

    return !!item && now - item.timestamp < cacheDuration;
  }

  // Limpar um item do cache
  invalidate(key: string): void {
    delete this.cache[key];
  }

  // Limpar todos os itens do cache
  clear(): void {
    this.cache = {};
  }

  // Definir duração padrão
  setDefaultDuration(duration: number): void {
    this.defaultDuration = duration;
  }
}

// Exportar uma instância única do gerenciador
export const cacheManager = new CacheManager(); 