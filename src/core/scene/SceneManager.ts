import * as THREE from 'three';
import { SceneObjects, SceneFit } from '../../types';
import { SCENE_OBJECTS, RENDERER_CONFIG } from '../../constants';

export class SceneManager {
  private scene: any; // THREE.Scene
  private objects: SceneObjects = {};
  private sceneFit: SceneFit | null = null;

  constructor(scene: any) { // THREE.Scene
    this.scene = scene;
    this.setupScene();
  }

  private setupScene(): void {
    this.scene.background = new THREE.Color(0x888888);
    this.createFallbackEnvironment();
  }

  private createFallbackEnvironment(): void {
    // Simple procedural environment
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.4);
    this.scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(-1, 3, 2);
    directionalLight.castShadow = true;
    this.configureDirectionalLight(directionalLight);
    this.scene.add(directionalLight);
  }

  private configureDirectionalLight(light: any): void {
    light.shadow.mapSize.width = RENDERER_CONFIG.SHADOW_MAP_SIZE;
    light.shadow.mapSize.height = RENDERER_CONFIG.SHADOW_MAP_SIZE;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 50;

    const d = 8;
    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;
    light.shadow.bias = -0.0001;
  }

  addModel(model: any): void {
    this.scene.add(model);
    this.extractObjects(model);
    this.configureShadows(model);
    this.configureModelLights(model);
    this.calculateSceneFit(model);
  }

  private extractObjects(root: any): void {
    // Extract named objects from the model
    this.objects.monitorMesh = root.getObjectByName(SCENE_OBJECTS.MONITOR) || null;
    this.objects.paperMesh = root.getObjectByName(SCENE_OBJECTS.PAPER) || null;
    this.objects.lampMesh = root.getObjectByName(SCENE_OBJECTS.LAMP) || null;
    this.objects.screenMesh = root.getObjectByName(SCENE_OBJECTS.SCREEN) || null;
    this.objects.spotMesh = root.getObjectByName(SCENE_OBJECTS.SPOT) || null;
    this.objects.planeMesh = root.getObjectByName(SCENE_OBJECTS.PLANE) || null;
    this.objects.phoneMesh = root.getObjectByName(SCENE_OBJECTS.PHONE) || null;
    this.objects.plantMesh = root.getObjectByName(SCENE_OBJECTS.PLANT) || null;
    this.objects.cameraMesh = root.getObjectByName(SCENE_OBJECTS.CAMERA) || null;
    this.objects.shoesMesh = root.getObjectByName(SCENE_OBJECTS.SHOES) || null;
    this.objects.keyboardMesh = root.getObjectByName(SCENE_OBJECTS.KEYBOARD) || null;

    // Try case-insensitive fallback for keyboard mesh
    if (!this.objects.keyboardMesh) {
      root.traverse((o: any) => {
        if (!this.objects.keyboardMesh && o?.name && typeof o.name === 'string' && /keyboard/i.test(o.name)) {
          this.objects.keyboardMesh = o;
        }
      });
    }

    // Try case-insensitive fallback for screen mesh
    if (!this.objects.screenMesh) {
      root.traverse((o: any) => {
        if (!this.objects.screenMesh && o?.name && typeof o.name === 'string' && /screen/i.test(o.name)) {
          this.objects.screenMesh = o;
        }
      });
    }

    // Find shoes with case-insensitive partial matching
    if (!this.objects.shoesMesh) {
      root.traverse((o: any) => {
        const name = o?.name?.toLowerCase() || '';
        if (!this.objects.shoesMesh && (/shoe/i.test(name) || /sneaker/i.test(name))) {
          this.objects.shoesMesh = o;
        }
      });
    }

    this.logFoundObjects();
  }

  private logFoundObjects(): void {
    const objectChecks = [
      { name: 'Monitor', obj: this.objects.monitorMesh },
      { name: 'Paper', obj: this.objects.paperMesh },
      { name: 'Screen', obj: this.objects.screenMesh, optional: true },
      { name: 'Spot', obj: this.objects.spotMesh, optional: true },
      { name: 'Phone', obj: this.objects.phoneMesh, optional: true },
      { name: 'Plant', obj: this.objects.plantMesh, optional: true },
      { name: 'Camera', obj: this.objects.cameraMesh, optional: true },
      { name: 'Shoes', obj: this.objects.shoesMesh, optional: true },
      { name: 'Keyboard', obj: this.objects.keyboardMesh, optional: true },
    ];

    objectChecks.forEach(({ name, obj, optional }) => {
      if (!obj && !optional) {
        console.warn(`${name} node not found`);
      } else if (obj) {
        console.log(`${name} node found${optional ? ' (optional)' : ''}`);
      }
    });

    if (this.objects.planeMesh) {
      console.log('Plane node found - adjusting camera for interior view');
    }
  }

  private configureShadows(root: any): void {
    root.traverse((o: any) => {
      if (o.isMesh) {
        const mesh = o as any;
        const name = mesh.name?.toLowerCase() || '';

        // Configure shadow casting/receiving based on object type
        if (name.includes('desk') || name.includes('chair') || name.includes('book') || 
            name.includes('cup') || name.includes('keyboard') || name.includes('mouse')) {
          mesh.castShadow = true;
          mesh.receiveShadow = false;
        } else if (name.includes('plane') || name.includes('floor') || name.includes('ground')) {
          mesh.castShadow = false;
          mesh.receiveShadow = true;
        } else if (name.includes('wall') || name.includes('ceiling')) {
          mesh.castShadow = false;
          mesh.receiveShadow = false;
        } else {
          mesh.castShadow = true;
          mesh.receiveShadow = false;
        }

        // Set emissive properties
        if (mesh.material?.emissive) {
          mesh.material.emissiveIntensity = 0.8;
        }
      }
    });

    // Special configuration for plane mesh
    if (this.objects.planeMesh) {
      this.objects.planeMesh.traverse((o: any) => {
        if (o.isMesh) {
          const mesh = o as any;
          mesh.castShadow = false;
          mesh.receiveShadow = true;
        }
      });
    }
  }

  private configureModelLights(root: any): void {
    const lights: any[] = [];
    
    root.traverse((object: any) => {
      if (object.isLight) {
        lights.push(object);
        object.castShadow = true;
        
        if (object.isDirectionalLight) {
          this.configureDirectionalLight(object);
        } else if (object.isPointLight) {
          object.shadow.mapSize.width = RENDERER_CONFIG.SHADOW_MAP_SIZE;
          object.shadow.mapSize.height = RENDERER_CONFIG.SHADOW_MAP_SIZE;
          object.shadow.camera.near = 0.1;
          object.shadow.camera.far = 25;
          object.shadow.bias = -0.0001;
          
          // Store reference to lamp light if it exists (matching original logic)
          if (!this.objects.lampLight && object.name && 
              (object.name.toLowerCase().includes('lamp') || object.name.toLowerCase().includes('spot'))) {
            this.objects.lampLight = object;
          }
        } else if (object.isSpotLight) {
          object.shadow.mapSize.width = RENDERER_CONFIG.SHADOW_MAP_SIZE;
          object.shadow.mapSize.height = RENDERER_CONFIG.SHADOW_MAP_SIZE;
          object.shadow.camera.near = 0.1;
          object.shadow.camera.far = 25;
          object.shadow.bias = -0.0001;
          object.angle = Math.min(object.angle, Math.PI / 3);
          object.penumbra = 0.3;
          
          // Store reference to lamp light if it exists (matching original logic)
          if (!this.objects.lampLight && object.name && 
              (object.name.toLowerCase().includes('lamp') || object.name.toLowerCase().includes('spot'))) {
            this.objects.lampLight = object;
          }
        }
      }
    });

    console.log(`Configured ${lights.length} lights for shadow casting`);
  }

  private calculateSceneFit(root: any): void {
    let boundingObjects = [root];

    if (this.objects.planeMesh) {
      boundingObjects = [
        this.objects.monitorMesh,
        this.objects.paperMesh,
        this.objects.lampMesh,
        this.objects.screenMesh,
        this.objects.spotMesh
      ].filter(Boolean);

      if (boundingObjects.length === 0) {
        boundingObjects = [root];
      }
    }

    const box = new THREE.Box3();
    if (boundingObjects.length === 1 && boundingObjects[0] === root) {
      box.setFromObject(root);
    } else {
      boundingObjects.forEach(obj => {
        const tempBox = new THREE.Box3().setFromObject(obj);
        box.union(tempBox);
      });
    }

    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const radius = size.length() * 0.5;

    this.sceneFit = { center, radius };
  }

  getObjects(): SceneObjects {
    return this.objects;
  }

  getSceneFit(): SceneFit | null {
    return this.sceneFit;
  }

  getScene(): any { // THREE.Scene
    return this.scene;
  }
}
