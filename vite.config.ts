import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: 'esnext',
    sourcemap: false, // Disable source maps in build to avoid warnings
  },
  optimizeDeps: {
    include: ['three', 'three/examples/jsm/loaders/GLTFLoader.js', 'three/examples/jsm/loaders/RGBELoader.js']
  },
  // Suppress source map warnings in development
  css: {
    devSourcemap: false
  }
});
