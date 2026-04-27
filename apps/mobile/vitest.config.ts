import { defineConfig } from 'vitest/config';

// Mobile vitest only covers pure-logic helpers (format, schema-shaping).
// Component tests will land later under detox / RN testing-library.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
    },
  },
});
