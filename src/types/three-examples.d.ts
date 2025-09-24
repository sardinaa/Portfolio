declare module 'three/examples/jsm/loaders/GLTFLoader.js' {
  export class GLTFLoader {
    setKTX2Loader(_: any): this;
    loadAsync(url: string): Promise<any>;
  }
}

declare module 'three/examples/jsm/loaders/KTX2Loader.js' {
  export class KTX2Loader {
    setTranscoderPath(path: string): this;
    detectSupport(renderer: any): this;
  }
}

declare module 'three/examples/jsm/loaders/RGBELoader.js' {
  export class RGBELoader {
    setDataType(_: any): this;
    loadAsync(url: string): Promise<any>;
  }
}

declare module 'three/examples/jsm/controls/OrbitControls.js' {
  import { Camera, EventDispatcher, MOUSE, TOUCH } from 'three';
  export class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement);
    enableDamping: boolean;
    dampingFactor: number;
    minDistance: number;
    maxDistance: number;
    target: any;
    update(): void;
  }
}

declare module 'three/examples/jsm/renderers/CSS3DRenderer.js' {
  import { Camera, Scene } from 'three';
  export class CSS3DObject {
    constructor(element: HTMLElement);
    element: HTMLElement;
    position: { set: (x: number, y: number, z: number) => void };
    rotation: { set: (x: number, y: number, z: number) => void };
    scale: { setScalar: (s: number) => void };
  }
  export class CSS3DRenderer {
    domElement: HTMLElement;
    setSize(width: number, height: number): void;
    render(scene: Scene, camera: Camera): void;
  }
}
