import { defineConfig } from 'vite';

export default defineConfig({
  base: '/train-fight/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  }
});
