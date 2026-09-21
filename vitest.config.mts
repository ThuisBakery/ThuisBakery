import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      // Reported, never gated — no `thresholds` here, deliberately.
      // See docs/agents/build-conventions.md.
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      // Generated or Payload-shipped code. Kept in step with the same list in
      // eslint.config.mjs and .prettierignore.
      exclude: [
        'src/payload-types.ts',
        'src/payload-generated-schema.ts',
        'src/migrations/**',
        'src/app/\\(payload\\)/**',
      ],
    },
  },
})
