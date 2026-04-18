import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  define: {
    'import.meta.env.VITE_OPENCODE_URL': JSON.stringify(process.env.OPENCODE_URL || 'http://127.0.0.1:10090')
  }
});
