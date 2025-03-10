module.exports = {
  // Desativar o polling agressivo do hot-reloader
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        // Reduzir o polling para evitar recargas desnecessárias
        poll: false,
        // Ignorar eventos de foco/desfoco da janela
        followSymlinks: false,
        ignored: ['**/node_modules', '**/.git']
      };
    }
    return config;
  },
  // Desativar restauração de scroll que pode causar recargas
  experimental: {
    scrollRestoration: false,
  },
  // Otimizar a estratégia de recarregamento
  onDemandEntries: {
    // Manter páginas em memória por mais tempo
    maxInactiveAge: 60 * 60 * 1000, // 1 hora
    // Não recarregar páginas frequentemente
    pagesBufferLength: 5,
  }
}; 