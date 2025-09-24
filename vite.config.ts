import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Portfolio/',
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: 'esnext',
    sourcemap: false, // Disable source maps in build to avoid warnings
    outDir: 'dist',
  },
  optimizeDeps: {
    include: ['three', 'three/examples/jsm/loaders/GLTFLoader.js', 'three/examples/jsm/loaders/RGBELoader.js']
  },
  // Suppress source map warnings in development
  css: {
    devSourcemap: false
  }
});
