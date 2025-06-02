import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import swc from 'unplugin-swc'

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/vitest.setup.ts'],
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/interfaces/**',
        '**/node_modules/**',
        '**/test/**',
        '**/types/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/migrations/**',
        'src/common/interfaces/**',
        'src/common/dto/**',
        'src/common/enums/**',
        'src/common/exceptions/**',
        'src/common/filters/**',
        'src/common/interceptors/**',
        'src/common/pipes/**',
        'src/config/**',
        '**/*.entity.ts',
        '**/*.repository.ts',
        '**/*.module.ts',
        '**/*.controller.ts',
        '**/*.dto.ts',
        '**/*.guard.ts',
        '**/*.strategy.ts',
        'src/migrations/**',
      ],
    },
    deps: {
      optimizer: {
        ssr: {
          include: ['@nestjs/common', '@nestjs/core', '@nestjs/testing', '@nestjs/typeorm'],
        },
      },
    },
  },
})
