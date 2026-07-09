import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    main: {
      build: {
        sourcemap: !isProd,
        rollupOptions: {
          output: {
            format: 'cjs',
            entryFileNames: '[name].cjs',
          },
        },
      },
    },
    preload: {
      build: {
        sourcemap: !isProd,
        rollupOptions: {
          output: {
            format: 'cjs',
            entryFileNames: '[name].js',
          },
        },
      },
    },
    renderer: {
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src/renderer'),
          '@main': path.resolve(__dirname, 'src/main'),
          '@shared': path.resolve(__dirname, 'src/shared'),
          '@preload': path.resolve(__dirname, 'src/preload'),
        },
      },
      build: {
        sourcemap: false,
        minify: isProd ? 'esbuild' : false,
      },
    },
  };
});
