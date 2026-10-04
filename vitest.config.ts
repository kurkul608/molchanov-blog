import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@app': fromRoot('./src/app'),
      '@widgets': fromRoot('./src/widgets'),
      '@features': fromRoot('./src/features'),
      '@entities': fromRoot('./src/entities'),
      '@shared': fromRoot('./src/shared'),
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'functions/**/*.test.ts', 'tests/**/*.test.ts'],
    environment: 'node',
  },
});
