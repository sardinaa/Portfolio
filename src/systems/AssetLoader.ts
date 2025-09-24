import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export class AssetLoader {
  private pmrem: any; // THREE.PMREMGenerator
  private gltfLoader: GLTFLoader;
  private rgbeLoader: RGBELoader;
  private ktx2Loader: KTX2Loader;

  constructor(renderer: any) { // THREE.WebGLRenderer
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.gltfLoader = new GLTFLoader();
    this.rgbeLoader = new RGBELoader();
    this.ktx2Loader = new KTX2Loader();
    
    this.setupLoaders(renderer);
  }

  private setupLoaders(renderer: any): void {
    // Setup RGBE loader for HDR textures
    this.rgbeLoader.setDataType((THREE as any).HalfFloatType);
    
    // Setup KTX2 loader for compressed textures
    this.ktx2Loader.setTranscoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/basis/').detectSupport(renderer);
    this.gltfLoader.setKTX2Loader(this.ktx2Loader);
  }

  async loadGLTF(url: string, onProgress?: (progress: number) => void): Promise<any> {
    try {
      console.log('Loading GLTF model from:', url);
      
      // Simulate progress for now since loadAsync doesn't provide progress callbacks
      if (onProgress) {
        const progressSteps = [10, 30, 50, 70, 85, 95];
        for (let i = 0; i < progressSteps.length; i++) {
          setTimeout(() => onProgress(progressSteps[i]), i * 200);
        }
      }
      
      const gltf = await this.gltfLoader.loadAsync(url);
      
      // Final progress update
      if (onProgress) {
        onProgress(100);
      }
      
      // Validate that we have a scene
      if (!gltf || !gltf.scene) {
        throw new Error('GLTF file loaded but contains no scene data');
      }
      
      console.log('GLTF model loaded successfully');
      return gltf.scene;
    } catch (error) {
      console.error('Failed to load GLTF:', error);
      throw error;
    }
  }

  async loadHDR(url: string, scene: any): Promise<boolean> {
    try {
      console.log('Loading HDR environment from:', url);
      
      // Check if the HDR file actually exists before trying to load it
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (!response.ok) {
          console.log('HDR file not found (404), skipping HDR loading');
          return false;
        }
        
        // Check if the content type suggests it's not a binary file
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          console.log('HDR file request returned HTML (likely 404 page), skipping HDR loading');
          return false;
        }
      } catch (fetchError) {
        console.log('Could not check HDR file existence, skipping HDR loading');
        return false;
      }
      
      const texture = await this.rgbeLoader.loadAsync(url);
      
      // Validate texture data - add more defensive checks
      if (!texture) {
        console.warn('HDR texture loading returned null/undefined');
        return false;
      }
      
      if (!texture.image) {
        console.warn('HDR texture loaded but has no image property');
        return false;
      }
      
      if (!texture.image.data) {
        console.warn('HDR texture loaded but missing image data');
        return false;
      }
      
      const envMap = this.pmrem.fromEquirectangular(texture).texture;
      
      // Validate environment map
      if (!envMap) {
        console.warn('Failed to generate environment map from HDR texture');
        return false;
      }
      
      scene.background = envMap;
      scene.environment = envMap;
      
      texture.dispose();
      console.log('HDR environment loaded successfully');
      return true;
    } catch (error) {
      console.log('HDR environment loading failed:', error);
      return false;
    }
  }

  dispose(): void {
    this.pmrem.dispose();
    // Note: KTX2Loader disposal is handled automatically
  }
}
