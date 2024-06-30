import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import preview from 'vite-live-preview';
import { data } from 'vite-plugin-data';

process.chdir(__dirname);

export default defineConfig((env) => {
  return {
    plugins: [
      react(),
      data(),
      preview(),
    ],
    css: {
      modules: {
        localsConvention: 'camelCaseOnly' as const,
      },
    },
    build: {
      sourcemap: true,
      chunkSizeWarningLimit: env.mode === 'production' ? undefined : Infinity,
    },
    preview: {
      host: true,
    },
  };
});
