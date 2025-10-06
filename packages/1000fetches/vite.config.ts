import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      dts({
        include: ['src/**/*.ts'],
        exclude: ['src/**/*.test.ts', 'src/testing/**/*'],
        rollupTypes: true,
      }),
      mode === 'analyze' &&
        visualizer({
          filename: 'dist/bundle-analysis.html',
          open: false,
        }),
    ].filter(Boolean),
    build: {
      lib: {
        entry: 'src/index.ts',
        name: 'HttpClient',
        fileName: format => `index.${format}.js`,
        formats: ['es', 'cjs'],
      },
      rollupOptions: {
        external: ['zod', 'valibot', 'arktype'],
        output: {
          globals: {
            zod: 'zod',
            valibot: 'valibot',
            arktype: 'arktype',
          },
          exports: 'named',
          preserveModules: false,
        },
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: [
            'console.log',
            'console.info',
            'console.debug',
            'console.warn',
          ],
          unused: true,
          dead_code: true,
        },
        mangle: {
          keep_fnames: false,
        },
      },
      sourcemap: true,
    },
  }
})
