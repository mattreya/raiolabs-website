import { defineConfig } from 'vite';

// Relative base './' ensures built assets load cleanly on both:
// 1. GitHub Pages staging subpaths (e.g., https://mattreya.github.io/raiolabs-website/)
// 2. Root custom domain (https://raiolabs.com/)
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
