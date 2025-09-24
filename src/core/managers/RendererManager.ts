import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { RendererSystem } from '../../types';
import { RENDERER_CONFIG } from '../../constants';

export class RendererManager {
  private renderer: any; // THREE.WebGLRenderer
  private css3d: CSS3DRenderer;
  private root: HTMLDivElement;
  private css3dRoot: HTMLDivElement;

  constructor(root: HTMLDivElement, css3dRoot: HTMLDivElement) {
    this.root = root;
    this.css3dRoot = css3dRoot;
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.css3d = new CSS3DRenderer();
    
    this.setupRenderer();
    this.setupCSS3D();
  }

  private setupRenderer(): void {
    // Optimize pixel ratio for touch devices
    const pixelRatio = this.isTouchDevice() ? 
      Math.min(window.devicePixelRatio, 2) : 
      Math.min(window.devicePixelRatio, RENDERER_CONFIG.PIXEL_RATIO_MAX);
      
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(this.root.clientWidth, this.root.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.physicallyCorrectLights = true;
    
    // Enable shadows with performance optimization for mobile
    this.renderer.shadowMap.enabled = true;
    // Use less expensive shadow mapping on touch devices
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Additional mobile optimizations
    if (this.isTouchDevice()) {
      this.renderer.powerPreference = 'high-performance';
      // Reduce quality slightly for better performance on mobile
      this.renderer.setPixelRatio(Math.min(pixelRatio, 1.5));
    }
    
    this.root.appendChild(this.renderer.domElement);
  }

  private isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  private setupCSS3D(): void {
    this.css3d.setSize(this.root.clientWidth, this.root.clientHeight);
    this.css3d.domElement.style.position = 'absolute';
    this.css3d.domElement.style.top = '0';
    this.css3d.domElement.style.left = '0';
    this.css3dRoot.appendChild(this.css3d.domElement);
  }

  render(scene: any, camera: any): void { // THREE.Scene, THREE.Camera
    this.renderer.render(scene, camera);
    this.css3d.render(scene, camera);
  }

  onResize(): void {
    const width = this.root.clientWidth;
    const height = this.root.clientHeight;
    
    this.renderer.setSize(width, height);
    this.css3d.setSize(width, height);
  }

  getRenderer(): any { // THREE.WebGLRenderer
    return this.renderer;
  }

  getCSS3D(): CSS3DRenderer {
    return this.css3d;
  }

  getDomElement(): HTMLElement {
    return this.renderer.domElement;
  }

  getSystem(): RendererSystem {
    return {
      renderer: this.renderer,
      css3d: this.css3d
    };
  }
}
