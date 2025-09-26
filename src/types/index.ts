import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

export interface CameraTarget {
  pos: any; // THREE.Vector3
  look: any; // THREE.Vector3
}

export interface SceneFit {
  center: any; // THREE.Vector3
  radius: number;
}

export interface SceneObjects {
  monitorMesh?: any | null; // THREE.Object3D
  paperMesh?: any | null; // THREE.Object3D
  lampLight?: any | null; // THREE.Light
  lampMesh?: any | null; // THREE.Object3D
  screenMesh?: any | null; // THREE.Object3D
  spotMesh?: any | null; // THREE.Object3D
  planeMesh?: any | null; // THREE.Object3D
  phoneMesh?: any | null; // THREE.Object3D
  plantMesh?: any | null; // THREE.Object3D
  cameraMesh?: any | null; // THREE.Object3D
  shoesMesh?: any | null; // THREE.Object3D
  keyboardMesh?: any | null; // THREE.Object3D
}

export interface ContactInfo {
  email: string;
  phone: string;
  github: string;
  linkedin: string;
}

export interface HobbyInfo {
  title: string;
  description: string;
  details: string[];
}

export interface AppConfig {
  root: HTMLDivElement;
  css3dRoot: HTMLDivElement;
}

export interface RendererSystem {
  renderer: any; // THREE.WebGLRenderer
  css3d: CSS3DRenderer;
}

export interface RaycastResult {
  object: any; // THREE.Object3D
  point: any; // THREE.Vector3
  distance: number;
}
