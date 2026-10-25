import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Relative base './' ensures built assets load cleanly on both:
// 1. GitHub Pages staging subpaths (e.g., https://mattreya.github.io/raiolabs-website/)
// 2. Root custom domain (https://raiolabs.com/)
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        resume: resolve(__dirname, 'resume.html')
      }
    }
  }
});
