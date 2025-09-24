import * as THREE from 'three';
// Using relaxed types to keep setup simple across environments
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

import { MiniSite } from '../ui/miniSite.ts';
import { PdfViewer } from '../ui/pdfViewer.ts';

export class App {
  private root: HTMLDivElement;
  private css3dRoot: HTMLDivElement;

  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  private renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  private css3d = new CSS3DRenderer();
  private controls!: OrbitControls;

  private pmrem = new THREE.PMREMGenerator(this.renderer);
  private gltfLoader = new GLTFLoader();

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  // Nodes
  private monitorMesh: any | null = null;
  private paperMesh: any | null = null;
  private lampLight: any | null = null;
  private lampMesh: any | null = null;
  private screenMesh: any | null = null;
  private spotMesh: any | null = null;
  private planeMesh: any | null = null;
  private phoneMesh: any | null = null;
  private plantMesh: any | null = null;
  private cameraMesh: any | null = null;
  private shoesMesh: any | null = null;

  // Contact marker (needle + bulb + HTML label)
  private contactMarker: any | null = null;
  private contactVisible = false;
  private contactLabel: HTMLDivElement | null = null;
  private contactInfo = {
    email: 'developer@portfolio.com',
    phone: '+1 (555) 123-4567',
    github: 'https://github.com/sardinaa',
    linkedin: 'https://www.linkedin.com/in/oscarpalomod',
  };

  // Hobby markers and labels
  private hobbyMarker: any | null = null;
  private hobbyVisible = false;
  private hobbyLabel: HTMLDivElement | null = null;
  private currentHobby: string | null = null;
  private hobbies = {
    plant: {
      title: '🌱 Gardening & Plants',
      description: 'I love cultivating plants and creating green spaces. There\'s something therapeutic about watching life grow and flourish.',
      details: ['Indoor plant collection', 'Herb gardening', 'Sustainable living', 'Nature photography']
    },
    camera: {
      title: '📸 Photography',
      description: 'Capturing moments and exploring the world through different perspectives. Always learning new techniques and styles.',
      details: ['Landscape photography', 'Street photography', 'Digital editing', 'Film photography']
    },
    shoes: {
      title: '👟 Running & Fitness',
  description: 'I enjoy staying active with easy jogs, long runs, and trail adventures — and I love hiking whenever I can get out into nature.',
  details: ['Long distance running', 'Trail running','Outdoor adventures']
    }
  };

  // Interactions
  private hovered: THREE.Object3D | null = null;

  // UI
  private miniSite: MiniSite;
  private pdfViewer: PdfViewer;

  // Camera targets
  private targets = {
  default: { pos: new THREE.Vector3(-2.6, 1.8, 3.4), look: new THREE.Vector3(0.0, 1.0, 0.0) },
  monitor: { pos: new THREE.Vector3(1.2, 1.4, 1.5), look: new THREE.Vector3(0.0, 1.1, 0.0) },
  paper: { pos: new THREE.Vector3(0.3, 2.0, 0.2), look: new THREE.Vector3(0.3, 0.9, 0.2) },
  phone: { pos: new THREE.Vector3(), look: new THREE.Vector3() },
  plant: { pos: new THREE.Vector3(), look: new THREE.Vector3() },
  camera: { pos: new THREE.Vector3(), look: new THREE.Vector3() },
  shoes: { pos: new THREE.Vector3(), look: new THREE.Vector3() },
  } as const;

  private currentTarget: keyof App['targets'] = 'default';
  private t = 0;
  private sceneFit: { center: any; radius: number } | null = null;
  private freeCam = false;

  constructor(root: HTMLDivElement, css3dRoot: HTMLDivElement) {
    this.root = root;
    this.css3dRoot = css3dRoot;

    this.miniSite = new MiniSite();
    this.pdfViewer = new PdfViewer();
    
    // Set up mini-site close callback
    this.miniSite.onClose = () => {
      this.focusDefault();
    };
    
    // Set up PDF viewer close callback
    this.pdfViewer.onClose = () => {
      this.focusDefault();
    };

    this.onResize = this.onResize.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  start() {
    // Renderer setup
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.root.clientWidth, this.root.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.physicallyCorrectLights = true;
    
    // Enable shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // PCFSoftShadowMap for softer shadows and less artifacts
    
    this.root.appendChild(this.renderer.domElement);

    // CSS3D
    this.css3d.setSize(this.root.clientWidth, this.root.clientHeight);
    this.css3d.domElement.style.position = 'absolute';
    this.css3d.domElement.style.top = '0';
    this.css3d.domElement.style.left = '0';
    this.css3dRoot.appendChild(this.css3d.domElement);

    // Camera & controls
    this.camera.position.copy(this.targets.default.pos);
    this.camera.lookAt(this.targets.default.look);
  // Ensure correct aspect from the start
  this.onResize();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1.0;
    this.controls.maxDistance = 8.0;
    this.controls.target.copy(this.targets.default.look);

  // Environment (simple color if no HDR)
  this.scene.background = new THREE.Color(0x888888);
  
  // Create a simple procedural environment as fallback
  this.createFallbackEnvironment();
  
  // Try to load optional env.hdr (will override fallback if successful)
  const baseUrl = import.meta.env.BASE_URL || '/';
  this.tryLoadHDR(`${baseUrl}env.hdr`).catch((error) => {
    console.log('HDR environment not found, using fallback lighting');
    // You can add an HDR file to the public folder to enable environment mapping
  });

  // Load GLB (cache-bust in dev to avoid stale assets)
  const glbUrl = `${baseUrl}desk.glb` + (import.meta.env?.DEV ? `?v=${Date.now()}` : '');
  this.loadGLB(glbUrl).catch((error) => {
    console.error('Failed to load GLB model:', error);
    // Application will continue without the 3D model
  });

    // Events
    window.addEventListener('resize', this.onResize);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.addEventListener('click', this.onClick);
    
    // Handle clicks on CSS3D root (when mini-site is active)
    this.css3dRoot.addEventListener('click', this.onCss3dClick.bind(this));

  this.animate(0);

  // Keyboard accessibility
  window.addEventListener('keydown', this.onKeyDown);
  }

  private configureModelLights(root: any) {
    // Find all lights in the loaded model and configure them for shadows
    const lights: any[] = [];
    
    root.traverse((object: any) => {
      if (object.isLight) {
        lights.push(object);
        
        // Enable shadow casting for all lights
        object.castShadow = true;
        
        // Configure shadow settings based on light type
        if (object.isDirectionalLight) {
          object.shadow.mapSize.width = 2048;
          object.shadow.mapSize.height = 2048;
          object.shadow.camera.near = 0.5;
          object.shadow.camera.far = 50;
          
          // Set up shadow camera bounds
          const d = 8;
          object.shadow.camera.left = -d;
          object.shadow.camera.right = d;
          object.shadow.camera.top = d;
          object.shadow.camera.bottom = -d;
          
          object.shadow.bias = -0.0001;
          console.log('Configured DirectionalLight for shadows:', object.name || 'unnamed');
          
        } else if (object.isPointLight) {
          object.shadow.mapSize.width = 1024;
          object.shadow.mapSize.height = 1024;
          object.shadow.camera.near = 0.1;
          object.shadow.camera.far = 25;
          object.shadow.bias = -0.0001;
          console.log('Configured PointLight for shadows:', object.name || 'unnamed');
          
          // Store reference to lamp light if it exists
          if (!this.lampLight && (object.name?.toLowerCase().includes('lamp') || object.name?.toLowerCase().includes('spot'))) {
            this.lampLight = object;
          }
          
        } else if (object.isSpotLight) {
          object.shadow.mapSize.width = 1024;
          object.shadow.mapSize.height = 1024;
          object.shadow.camera.near = 0.1;
          object.shadow.camera.far = 25;
          object.shadow.bias = -0.0001;
          console.log('Configured SpotLight for shadows:', object.name || 'unnamed');
          
          // Store reference to lamp light if it exists
          if (!this.lampLight && (object.name?.toLowerCase().includes('lamp') || object.name?.toLowerCase().includes('spot'))) {
            this.lampLight = object;
          }
        }
      }
    });
    
    console.log(`Found and configured ${lights.length} lights from the model for shadow casting`);
    
    // Add soft ambient light for gentle overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 5); // Soft gray light with low intensity
    this.scene.add(ambientLight);
    console.log('Added soft ambient light for overall illumination');
    
    // If no lights were found in the model, increase ambient intensity
    if (lights.length === 0) {
      console.warn('No lights found in model, increasing ambient light intensity');
      ambientLight.intensity = 0.6;
    }
    
    return lights;
  }

  private async loadGLB(url: string) {
    // Setup KTX2 if needed
    const ktx2 = new KTX2Loader().setTranscoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/basis/');
    ktx2.detectSupport(this.renderer);
    this.gltfLoader.setKTX2Loader(ktx2);

  const gltf = await this.gltfLoader.loadAsync(url);
  const root = gltf.scene;
  root.updateWorldMatrix(true, true);
    root.traverse((o: any) => {
      if ((o as any).isMesh) {
        const m = o as any;
        
        // Configure shadows based on object name
        if (m.name && typeof m.name === 'string') {
          const name = m.name.toLowerCase();
          
          // Objects that should cast shadows (furniture, desk items)
          if (name.includes('monitor') || name.includes('lamp') || name.includes('paper') || 
              name.includes('desk') || name.includes('chair') || name.includes('book') || 
              name.includes('cup') || name.includes('keyboard') || name.includes('mouse')) {
            m.castShadow = true;
            m.receiveShadow = false; // Most objects don't need to receive shadows
          }
          // Ground/floor objects that should receive shadows but not cast them
          else if (name.includes('plane') || name.includes('floor') || name.includes('ground')) {
            m.castShadow = false;
            m.receiveShadow = true;
          }
          // Walls should not cast or receive shadows to avoid artifacts
          else if (name.includes('wall') || name.includes('ceiling')) {
            m.castShadow = false;
            m.receiveShadow = false;
          }
          // Default for other smaller objects
          else {
            m.castShadow = true;
            m.receiveShadow = false; // Reduce artifacts by limiting receivers
          }
        } else {
          // Default shadow settings for unnamed objects - be conservative
          m.castShadow = true;
          m.receiveShadow = false;
        }
        
        if ((m.material as any).emissive) {
          (m.material as any).emissiveIntensity = 0.8;
        }
      }
    });

  // Configure lights from the model for shadow casting
  this.configureModelLights(root);

  this.monitorMesh = root.getObjectByName('Monitor') || null;
  this.paperMesh = root.getObjectByName('Paper') || null;
  this.lampMesh = root.getObjectByName('Lamp') || null;
  this.screenMesh = root.getObjectByName('Screen') || null;
  this.spotMesh = root.getObjectByName('Spot') || null;
  this.planeMesh = root.getObjectByName('Plane') || null;
  this.phoneMesh = root.getObjectByName('Phone') || null;
  this.plantMesh = root.getObjectByName('Plant') || null;
  this.cameraMesh = root.getObjectByName('Camera') || null;
  this.shoesMesh = root.getObjectByName('Shoes') || null;
  
  if (!this.phoneMesh) {
    // Case-insensitive fallback search
    root.traverse((o: any) => {
      if (!this.phoneMesh && o?.name && typeof o.name === 'string' && /phone/i.test(o.name)) {
        this.phoneMesh = o;
      }
    });
  }
  
  // Fallback search for hobby nodes
  if (!this.plantMesh || !this.cameraMesh || !this.shoesMesh) {
    root.traverse((o: any) => {
      if (o?.name && typeof o.name === 'string') {
        const name = o.name.toLowerCase();
        if (!this.plantMesh && /plant/i.test(name)) this.plantMesh = o;
        if (!this.cameraMesh && /camera/i.test(name)) this.cameraMesh = o;
        if (!this.shoesMesh && (/shoe/i.test(name) || /sneaker/i.test(name))) this.shoesMesh = o;
      }
    });
  }
  
  // Ensure the plane receives shadows properly
  if (this.planeMesh) {
    this.planeMesh.traverse((o: any) => {
      if ((o as any).isMesh) {
        const m = o as any;
        m.castShadow = false; // Plane doesn't cast shadows
        m.receiveShadow = true; // But receives them from furniture
      }
    });
  }
  if (!this.screenMesh) {
    // Case-insensitive, partial match fallback
    root.traverse((o: any) => {
      if (!this.screenMesh && o?.name && typeof o.name === 'string' && /screen/i.test(o.name)) {
        this.screenMesh = o;
      }
    });
  }

    if (!this.monitorMesh) console.warn('Monitor node not found');
    if (!this.paperMesh) console.warn('Paper node not found');
    if (!this.screenMesh) console.warn('Screen node not found (optional, used for CSS3D alignment)');
    if (!this.spotMesh) console.warn('Spot node not found (optional, used for lamp light effect)');
    if (this.planeMesh) console.log('Plane node found - adjusting camera for interior view');
    if (!this.phoneMesh) console.warn('Phone node not found (optional, enables contact pin)');
    if (!this.plantMesh) console.warn('Plant node not found (optional, enables hobby info)');
    if (!this.cameraMesh) console.warn('Camera node not found (optional, enables hobby info)');
    if (!this.shoesMesh) console.warn('Shoes node not found (optional, enables hobby info)');  this.scene.add(root);  
  
  // Fit camera to scene bounds - adjust for interior views when Plane is present
  let boundingObjects = [root];
  if (this.planeMesh) {
    // If we have a plane (room), calculate bounds based on interior objects only
    boundingObjects = [];
    if (this.monitorMesh) boundingObjects.push(this.monitorMesh);
    if (this.paperMesh) boundingObjects.push(this.paperMesh);
    if (this.lampMesh) boundingObjects.push(this.lampMesh);
    if (this.screenMesh) boundingObjects.push(this.screenMesh);
    if (this.spotMesh) boundingObjects.push(this.spotMesh);
    
    // If no interior objects found, fallback to scene but with adjusted camera position
    if (boundingObjects.length === 0) {
      boundingObjects = [root];
    }
  }
  
  const box = new THREE.Box3();
  if (boundingObjects.length === 1 && boundingObjects[0] === root) {
    box.setFromObject(root);
  } else {
    // Calculate bounding box from interior objects only
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

  // Update camera frustum based on radius
  this.camera.near = Math.max(0.01, radius / 200);
  this.camera.far = radius * 50;
  this.camera.updateProjectionMatrix();

  // Place camera at a diagonal view and set controls limits
  let pos;
  if (this.planeMesh) {
    // For rooms with planes, position camera inside looking at the desk area
    // Use a more conservative multiplier to stay inside the room
    pos = center.clone().add(new THREE.Vector3(-1, 0.5, 1).normalize().multiplyScalar(radius * 4));
    
    // Ensure camera is at a reasonable height inside the room
    const minHeight = center.y + 0.5; // Stay above the desk surface
    const maxHeight = center.y + 2.0; // Don't go too high
    pos.y = Math.max(minHeight, Math.min(maxHeight, pos.y));
  } else {
    // Original positioning for non-room scenes
    pos = center.clone().add(new THREE.Vector3(-1, 0.5, 1).normalize().multiplyScalar(radius * 2.2));
  }
  this.camera.position.copy(pos);
  this.controls.target.copy(center);
  this.controls.minDistance = Math.max(radius * 0.2, 0.2);
  this.controls.maxDistance = this.planeMesh ? radius * 5 : radius * 10; // Limit range in rooms
  
  // Additional constraints for rooms with planes
  if (this.planeMesh) {
    // Limit vertical angle to prevent looking through floor/ceiling
    (this.controls as any).maxPolarAngle = Math.PI * 0.85; // Don't look too far down
    (this.controls as any).minPolarAngle = Math.PI * 0.15; // Don't look too far up
    
    // Enable dampening for smoother movement in confined spaces
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1; // Smoother movement
  }
  
  // Update default target positions
  this.targets.default.pos.copy(pos);
  this.targets.default.look.copy(center);

    // Create CSS3D for monitor content (initially hidden)
    if (this.monitorMesh || this.screenMesh) {
      this.miniSite.attachTo(this.screenMesh ?? this.monitorMesh, this.css3d, this.camera);
      // Compute a framed monitor view target
      const mb = new THREE.Box3().setFromObject(this.screenMesh ?? this.monitorMesh);
      const mCenter = new THREE.Vector3();
      mb.getCenter(mCenter);
      const mSize = new THREE.Vector3();
      mb.getSize(mSize);
      const q = new THREE.Quaternion();
      (this.screenMesh ?? this.monitorMesh).getWorldQuaternion(q);
      const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(q).normalize();
      const mDist = Math.max(mSize.x, mSize.y, mSize.z) * 0.8;
      const mPos = mCenter.clone().add(normal.multiplyScalar(mDist));
      this.targets.monitor.pos.copy(mPos);
      this.targets.monitor.look.copy(mCenter);
    }

    if (this.paperMesh) {
      const pb = new THREE.Box3().setFromObject(this.paperMesh);
      const pCenter = new THREE.Vector3();
      pb.getCenter(pCenter);
      const pSize = new THREE.Vector3();
      pb.getSize(pSize);
      const up = new THREE.Vector3(0, 1, 0);
      const pDist = Math.max(pSize.x, pSize.y, pSize.z) * 0.9;
      // Position camera directly above the paper for top-down view
      const pPos = pCenter.clone().add(up.multiplyScalar(pDist));
      this.targets.paper.pos.copy(pPos);
      this.targets.paper.look.copy(pCenter);
    }

    // Compute phone focus target
    if (this.phoneMesh) {
      const phb = new THREE.Box3().setFromObject(this.phoneMesh);
      const phCenter = new THREE.Vector3();
      phb.getCenter(phCenter);
      const phSize = new THREE.Vector3();
      phb.getSize(phSize);
      const maxDim = Math.max(phSize.x, phSize.y, phSize.z);
      const q = new THREE.Quaternion();
      this.phoneMesh.getWorldQuaternion(q);
      // Try using local +Z as facing normal; if pointing too vertical, use diagonal view
      let normal = new THREE.Vector3(0, 0, 1).applyQuaternion(q).normalize();
      if (Math.abs(normal.y) > 0.75) {
        normal = new THREE.Vector3(1, 0.3, 1).normalize();
      }
      const distance = Math.max(0.4, maxDim * 2.0);
      const offset = normal.clone().multiplyScalar(distance).add(new THREE.Vector3(0, Math.max(0.15, maxDim * 0.5), 0));
      const phPos = phCenter.clone().add(offset);
      this.targets.phone.pos.copy(phPos);
      this.targets.phone.look.copy(phCenter);
    }

    // Compute hobby focus targets
    const computeHobbyTarget = (mesh: any, targetName: keyof typeof this.targets) => {
      if (!mesh) return;
      const hb = new THREE.Box3().setFromObject(mesh);
      const hCenter = new THREE.Vector3();
      hb.getCenter(hCenter);
      const hSize = new THREE.Vector3();
      hb.getSize(hSize);
      const maxDim = Math.max(hSize.x, hSize.y, hSize.z);
      const q = new THREE.Quaternion();
      mesh.getWorldQuaternion(q);
      // Try using local +Z as facing normal; if pointing too vertical, use diagonal view
      let normal = new THREE.Vector3(0, 0, 1).applyQuaternion(q).normalize();
      if (Math.abs(normal.y) > 0.75) {
        normal = new THREE.Vector3(1, 0.3, 1).normalize();
      }
      const distance = Math.max(0.4, maxDim * 2.0);
      const offset = normal.clone().multiplyScalar(distance).add(new THREE.Vector3(0, Math.max(0.15, maxDim * 0.5), 0));
      const hPos = hCenter.clone().add(offset);
      this.targets[targetName].pos.copy(hPos);
      this.targets[targetName].look.copy(hCenter);
    };

    computeHobbyTarget(this.plantMesh, 'plant');
    computeHobbyTarget(this.cameraMesh, 'camera');
    computeHobbyTarget(this.shoesMesh, 'shoes');
  }

  private onResize() {
    const w = this.root.clientWidth;
    const h = this.root.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  this.renderer.setSize(w, h, false);
  // Ensure CSS size matches drawing buffer to avoid stretching
  const canvas = this.renderer.domElement as HTMLCanvasElement;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
    this.css3d.setSize(w, h);
  }

  private raycastInteractive(pointer: { x: number; y: number }) {
    if (!this.monitorMesh && !this.paperMesh && !this.screenMesh && !this.lampMesh && !this.phoneMesh && !this.plantMesh && !this.cameraMesh && !this.shoesMesh) return null;
    this.raycaster.setFromCamera(pointer as any, this.camera);
  const targets: any[] = [];
    if (this.monitorMesh) targets.push(this.monitorMesh);
    if (this.paperMesh) targets.push(this.paperMesh);
    if (this.screenMesh) targets.push(this.screenMesh);
    if (this.lampMesh) targets.push(this.lampMesh);
    if (this.phoneMesh) targets.push(this.phoneMesh);
    if (this.plantMesh) targets.push(this.plantMesh);
    if (this.cameraMesh) targets.push(this.cameraMesh);
    if (this.shoesMesh) targets.push(this.shoesMesh);
    const intersects = this.raycaster.intersectObjects(targets, true);
    const hit = intersects[0]?.object;
    if (!hit) return null;
    
    // Return the specific named node that was targeted, not a child mesh
    if (this.paperMesh && this.isDescendantOf(hit, this.paperMesh)) return this.paperMesh;
    if (this.monitorMesh && this.isDescendantOf(hit, this.monitorMesh)) return this.monitorMesh;
    if (this.screenMesh && this.isDescendantOf(hit, this.screenMesh)) return this.screenMesh;
    if (this.lampMesh && this.isDescendantOf(hit, this.lampMesh)) return this.lampMesh;
    if (this.phoneMesh && this.isDescendantOf(hit, this.phoneMesh)) return this.phoneMesh;
    if (this.plantMesh && this.isDescendantOf(hit, this.plantMesh)) return this.plantMesh;
    if (this.cameraMesh && this.isDescendantOf(hit, this.cameraMesh)) return this.cameraMesh;
    if (this.shoesMesh && this.isDescendantOf(hit, this.shoesMesh)) return this.shoesMesh;
    return hit;
  }  private onPointerMove(e: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const hit = this.raycastInteractive(this.mouse);
    const isHover = hit && this.isInteractive(hit);

    if (isHover && !this.freeCam) {
      this.root.style.cursor = 'pointer';
      this.setEmissive(hit!, 0.6);
      if (this.hovered && this.hovered !== hit) this.setEmissive(this.hovered, 0.0);
      this.hovered = hit!;
    } else {
      this.root.style.cursor = 'default';
      if (this.hovered) this.setEmissive(this.hovered, 0.0);
      this.hovered = null;
    }
  }

  private onClick() {
    // Fresh raycast to include optional interactions (e.g., lamp)
    const hit = this.raycastInteractive(this.mouse) || this.raycastSpecific([this.lampMesh].filter(Boolean) as any[]);
    
    if (!hit) {
      // Clicked outside of any interactive object - return to default view only if not in free cam
      if (!this.freeCam) {
        this.focusDefault();
      }
      return;
    }
    
    // Skip object interactions when in free cam mode
    if (this.freeCam) {
      return;
    }
    
    if ((this.monitorMesh && this.isDescendantOf(hit, this.monitorMesh)) || (this.screenMesh && this.isDescendantOf(hit, this.screenMesh))) {
      this.openMonitor();
    } else if (this.paperMesh && this.isDescendantOf(hit, this.paperMesh)) {
      // Two-step interaction: first click zooms in, second click opens PDF
      if (this.currentTarget === 'paper') {
        // Already focused on paper, open the PDF
        this.openResume();
      } else {
        // Not focused on paper yet, zoom in first
        this.openPaper();
      }
    } else if (this.lampMesh && this.isDescendantOf(hit, this.lampMesh)) {
      this.toggleLamp();
    } else if (this.phoneMesh && this.isDescendantOf(hit, this.phoneMesh)) {
      // Toggle marker and focus camera on the phone
      if (this.currentTarget === 'phone' && this.contactVisible) {
        this.hideContactMarker();
        this.focusDefault();
      } else {
        this.showContactMarker();
        this.focusPhone();
      }
    } else if (this.plantMesh && this.isDescendantOf(hit, this.plantMesh)) {
      this.showHobbyInfo('plant');
      this.focusHobby('plant');
    } else if (this.cameraMesh && this.isDescendantOf(hit, this.cameraMesh)) {
      this.showHobbyInfo('camera');
      this.focusHobby('camera');
    } else if (this.shoesMesh && this.isDescendantOf(hit, this.shoesMesh)) {
      this.showHobbyInfo('shoes');
      this.focusHobby('shoes');
    }
  }

  private onCss3dClick(e: MouseEvent) {
    // Only handle clicks when mini-site is visible
    if (!this.miniSite.isVisible()) return;
    
    // Check if the click was on the mini-site content or outside it
    const miniSiteElement = e.target as HTMLElement;
    const isClickOnMiniSite = miniSiteElement.closest('.mini-site');
    
    if (!isClickOnMiniSite) {
      // Clicked outside the mini-site content - return to default view
      this.focusDefault();
    }
  }

  private isInteractive(obj: any) {
    return (
      (this.monitorMesh && this.isDescendantOf(obj, this.monitorMesh)) ||
      (this.screenMesh && this.isDescendantOf(obj, this.screenMesh)) ||
      (this.paperMesh && this.isDescendantOf(obj, this.paperMesh)) ||
  (this.lampMesh && this.isDescendantOf(obj, this.lampMesh)) ||
  (this.phoneMesh && this.isDescendantOf(obj, this.phoneMesh)) ||
      (this.plantMesh && this.isDescendantOf(obj, this.plantMesh)) ||
      (this.cameraMesh && this.isDescendantOf(obj, this.cameraMesh)) ||
      (this.shoesMesh && this.isDescendantOf(obj, this.shoesMesh))
    );
  }  private isDescendantOf(obj: any, ancestor: any) {
    let p: any = obj;
    while (p) {
      if (p === ancestor) return true;
      p = p.parent;
    }
    return false;
  }

  private raycastSpecific(targets: any[]) {
    if (!targets.length) return null;
    this.raycaster.setFromCamera(this.mouse as any, this.camera);
    const intersects = this.raycaster.intersectObjects(targets, true);
    return intersects[0]?.object || null;
  }

  private setEmissive(obj: any, intensity: number) {
    // Only apply emissive to the specific target node, not its ancestors
    if (obj?.traverse) {
      obj.traverse((o: any) => {
        if ((o as any).isMesh) {
          const m = o as any;
          const mat = m.material as any;
          if (mat && mat.emissive) {
            mat.emissiveIntensity = intensity;
            mat.emissive = new THREE.Color(0x55aaff);
            mat.needsUpdate = true;
          }
        }
      });
    }
  }

  private applyCameraConstraints() {
    if (!this.planeMesh || !this.sceneFit) return;

    const pos = this.camera.position;
    const center = this.sceneFit.center;

    // Get the bounding box of the plane to determine room boundaries
    const planeBox = new THREE.Box3().setFromObject(this.planeMesh);
    
    // Define room boundaries with padding to stay away from walls
    const wallPadding = 0.4; // Distance from walls
    const floorPadding = 0.4; // Distance above floor
    const ceilingPadding = 0.3; // Distance below ceiling
    
    // Calculate safe boundaries
    const minX = planeBox.min.x + wallPadding;
    const maxX = planeBox.max.x - wallPadding;
    const minZ = planeBox.min.z + wallPadding;
    const maxZ = planeBox.max.z - wallPadding;
    const minY = planeBox.min.y + floorPadding;
    const maxY = planeBox.max.y - ceilingPadding;
    
    // Only apply constraints if we have valid boundaries
    if (minX < maxX && minZ < maxZ && minY < maxY) {
      // Constrain position to stay within room
      pos.x = THREE.MathUtils.clamp(pos.x, minX, maxX);
      pos.z = THREE.MathUtils.clamp(pos.z, minZ, maxZ);
      pos.y = THREE.MathUtils.clamp(pos.y, minY, maxY);
      
      // Update the camera position
      this.camera.position.copy(pos);
    }
  }

  private animate = (time: number) => {
    requestAnimationFrame(this.animate);
    
    // Always update controls for smooth damping
    this.controls.update();

    // Apply camera movement constraints when plane is present
    if (this.planeMesh) {
      this.applyCameraConstraints();
    }

    // Smoothly lerp camera to current target when needed (simple ease)
    if (!this.freeCam && this.currentTarget) {
      this.t = THREE.MathUtils.clamp(this.t + 0.02, 0, 1);
      const tgt = this.targets[this.currentTarget];
      this.camera.position.lerp(tgt.pos, 0.08);
      this.controls.target.lerp(tgt.look, 0.08);
    }

    // Update HTML label position
    this.updateContactHTMLLabelPosition();
    this.updateHobbyLabelPosition();

    this.renderer.render(this.scene, this.camera);
    this.css3d.render(this.scene, this.camera);
  };

  // Public API
  focusDefault() {
  this.freeCam = false;
    this.currentTarget = 'default';
    this.t = 0;
    this.miniSite.setVisible(false);
  this.css3dRoot.style.pointerEvents = 'none';
  this.hideContactMarker();
    this.hideHobbyInfo();
  }

  openMonitor(section?: string) {
  this.freeCam = false;
    this.currentTarget = 'monitor';
    this.t = 0;
    this.miniSite.setVisible(true);
  this.css3dRoot.style.pointerEvents = 'auto';
    if (section) this.miniSite.navigate(section);
  }

  openPaper() {
    this.freeCam = false;
    this.currentTarget = 'paper';
    this.t = 0;
    this.miniSite.setVisible(false);
    this.css3dRoot.style.pointerEvents = 'none';
  }

  openResume() {
    this.pdfViewer.open('/AI_Engineer_CV_Oscar_Palomo.pdf');
  }

  closeOverlays() {
    this.miniSite.setVisible(false);
  this.css3dRoot.style.pointerEvents = 'none';
    this.pdfViewer.close();
    this.focusDefault();
  }

  // Keyboard navigation for accessibility
  private kbIndex = -1;
  private onKeyDown = (e: KeyboardEvent) => {
    // Skip when modal or mini-site is focused and visible
    if (this.miniSite.isVisible?.() || document.getElementById('pdf-fullscreen')?.classList.contains('visible')) {
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const items = [this.monitorMesh, this.paperMesh, this.lampMesh, this.phoneMesh, this.plantMesh, this.cameraMesh, this.shoesMesh].filter(Boolean) as any[];
      if (!items.length) return;
      const dir = e.shiftKey ? -1 : 1;
      this.kbIndex = (this.kbIndex + dir + items.length) % items.length;
      const target = items[this.kbIndex];
      // Fake hover highlight
      if (this.hovered && this.hovered !== target) this.setEmissive(this.hovered, 0.0);
      this.hovered = target;
      this.setEmissive(target, 0.6);
      this.root.style.cursor = 'pointer';
    } else if (e.key === 'Enter') {
      if (this.hovered) this.onClick();
    }
  };

  private focusPhone() {
    if (!this.phoneMesh) return;
    this.freeCam = false;
    this.currentTarget = 'phone';
    this.t = 0;
    // Ensure overlays don't block pointer when only showing 3D label
    this.miniSite.setVisible(false);
    this.css3dRoot.style.pointerEvents = 'none';
  }

  private focusHobby(hobbyType: 'plant' | 'camera' | 'shoes') {
    this.freeCam = false;
    this.currentTarget = hobbyType;
    this.t = 0;
    // Ensure overlays don't block pointer when showing hobby info
    this.miniSite.setVisible(false);
    this.css3dRoot.style.pointerEvents = 'none';
  }

  // Contact marker creation and toggling
  private toggleContactMarker() {
    if (this.contactVisible) {
      this.hideContactMarker();
    } else {
      this.showContactMarker();
    }
  }

  private showContactMarker() {
    if (!this.phoneMesh) return;
    this.hideContactMarker();

    // Compute world positions from phone bounds
    const box = new THREE.Box3().setFromObject(this.phoneMesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    const start = new THREE.Vector3((box.min.x + box.max.x) * 0.5, box.max.y, (box.min.z + box.max.z) * 0.5);
    const lift = Math.max(0.15, size.length() * 0.15);
    const end = start.clone().add(new THREE.Vector3(0.0, lift, 0.0));

  const group = new (THREE as any).Group();

    // Needle (line)
  const geo = new (THREE as any).BufferGeometry().setFromPoints([start, end]);
  const mat = new (THREE as any).LineBasicMaterial({ color: 0x55aaff, linewidth: 2 });
  const line = new (THREE as any).Line(geo, mat);
    line.renderOrder = 999;
    (line.material as any).depthTest = false;
    group.add(line);

    // Bulb (glowing sphere)
    const bulb = new (THREE as any).Mesh(
      new (THREE as any).SphereGeometry(Math.max(0.01, lift * 0.12), 16, 16),
      new (THREE as any).MeshStandardMaterial({ color: 0x55aaff, emissive: 0x55aaff, emissiveIntensity: 1.0, metalness: 0.2, roughness: 0.4 })
    );
    bulb.position.copy(end);
    bulb.castShadow = false;
    bulb.receiveShadow = false;
    bulb.renderOrder = 999;
    (bulb.material as any).depthTest = false;
    group.add(bulb);

    // Store end position for HTML label positioning
    (group as any).userData.labelWorldPos = end.clone().add(new THREE.Vector3(0.0, lift * 0.35, 0.0));

    this.scene.add(group);
    this.contactMarker = group;
    this.contactVisible = true;
    
    // Create HTML overlay label
    this.createContactHTMLLabel();
  }

  private hideContactMarker() {
    if (this.contactMarker) {
      this.scene.remove(this.contactMarker);
      this.contactMarker.traverse((o: any) => {
        if (o.geometry) o.geometry.dispose?.();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m: any) => m.map?.dispose?.());
          (o.material as any).map?.dispose?.();
          (o.material as any).dispose?.();
        }
      });
      this.contactMarker = null;
    }
    this.contactVisible = false;
    
    // Remove HTML label
    if (this.contactLabel) {
      this.contactLabel.remove();
      this.contactLabel = null;
    }
  }

  private createContactHTMLLabel() {
    if (this.contactLabel) {
      this.contactLabel.remove();
    }

    const label = document.createElement('div');
    label.style.cssText = `
      position: absolute;
      background: rgba(26, 26, 26, 0.92);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      font-weight: normal;
      line-height: 1.4;
      padding: 12px 16px;
      border-radius: 4px;
      border: 2px solid #555;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
      pointer-events: auto;
      z-index: 1000;
      white-space: normal;
      word-break: break-word;
      transform-origin: center;
      transition: opacity 0.2s ease;
      min-width: 320px;
      max-width: 440px;
    `;
    
    label.innerHTML = `
      <div style="color: #ffff66; margin-bottom: 8px; font-weight: bold;">Contact Information</div>
      <div>📧 <span style="color: #66ff66;">Email:</span> ${this.contactInfo.email}</div>
      <div style="margin-top: 4px;">📱 <span style="color: #66ff66;">Phone:</span> ${this.contactInfo.phone}</div>
      <div style="margin-top: 4px;">🐙 <span style="color: #66ff66;">GitHub:</span> <a href="${this.contactInfo.github}" target="_blank" style="color: #66ccff; text-decoration: none; cursor: pointer;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${this.contactInfo.github}</a></div>
  <div style="margin-top: 4px;">💼 <span style="color: #66ff66;">LinkedIn:</span> <a href="${this.contactInfo.linkedin}" target="_blank" style="color: #66ccff; text-decoration: none; cursor: pointer;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${this.contactInfo.linkedin}</a></div>
    `;
    
    document.body.appendChild(label);
    this.contactLabel = label;
  }

  // Hobby info display methods
  private showHobbyInfo(hobbyType: keyof typeof this.hobbies) {
    this.hideHobbyInfo();
    this.hideContactMarker(); // Hide contact info when showing hobby info
    
    const mesh = hobbyType === 'plant' ? this.plantMesh : 
                 hobbyType === 'camera' ? this.cameraMesh : this.shoesMesh;
    if (!mesh) return;

    // Create hobby marker similar to contact marker
    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    const start = new THREE.Vector3((box.min.x + box.max.x) * 0.5, box.max.y, (box.min.z + box.max.z) * 0.5);
    const lift = Math.max(0.15, size.length() * 0.15);
    const end = start.clone().add(new THREE.Vector3(0.0, lift, 0.0));

    const group = new (THREE as any).Group();

    // Needle (line)
    const geo = new (THREE as any).BufferGeometry().setFromPoints([start, end]);
    const mat = new (THREE as any).LineBasicMaterial({ color: 0xffaa55, linewidth: 2 });
    const line = new (THREE as any).Line(geo, mat);
    line.renderOrder = 999;
    (line.material as any).depthTest = false;
    group.add(line);

    // Bulb (glowing sphere) - different color for hobbies
    const bulb = new (THREE as any).Mesh(
      new (THREE as any).SphereGeometry(Math.max(0.01, lift * 0.12), 16, 16),
      new (THREE as any).MeshStandardMaterial({ color: 0xffaa55, emissive: 0xffaa55, emissiveIntensity: 1.0, metalness: 0.2, roughness: 0.4 })
    );
    bulb.position.copy(end);
    bulb.castShadow = false;
    bulb.receiveShadow = false;
    bulb.renderOrder = 999;
    (bulb.material as any).depthTest = false;
    group.add(bulb);

    // Store end position for HTML label positioning
    (group as any).userData.labelWorldPos = end.clone().add(new THREE.Vector3(0.0, lift * 0.35, 0.0));

    this.scene.add(group);
    this.hobbyMarker = group;
    this.hobbyVisible = true;
    this.currentHobby = hobbyType;
    
    // Create HTML overlay label
    this.createHobbyHTMLLabel(hobbyType);
  }

  private hideHobbyInfo() {
    if (this.hobbyMarker) {
      this.scene.remove(this.hobbyMarker);
      this.hobbyMarker.traverse((o: any) => {
        if (o.geometry) o.geometry.dispose?.();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m: any) => m.map?.dispose?.());
          (o.material as any).map?.dispose?.();
          (o.material as any).dispose?.();
        }
      });
      this.hobbyMarker = null;
    }
    this.hobbyVisible = false;
    this.currentHobby = null;
    
    // Remove HTML label
    if (this.hobbyLabel) {
      this.hobbyLabel.remove();
      this.hobbyLabel = null;
    }
  }

  private createHobbyHTMLLabel(hobbyType: keyof typeof this.hobbies) {
    if (this.hobbyLabel) {
      this.hobbyLabel.remove();
    }

    const hobby = this.hobbies[hobbyType];
    const label = document.createElement('div');
    label.style.cssText = `
      position: absolute;
      background: rgba(26, 26, 26, 0.92);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      font-weight: normal;
      line-height: 1.4;
      padding: 16px 20px;
      border-radius: 4px;
      border: 2px solid #ffaa55;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
      pointer-events: auto;
      z-index: 1000;
      white-space: normal;
      word-break: break-word;
      transform-origin: center;
      transition: opacity 0.2s ease;
      min-width: 350px;
      max-width: 400px;
    `;
    
    const detailsList = hobby.details.map(detail => `<div style="margin-left: 16px; color: #66ccff;">• ${detail}</div>`).join('');
    
    label.innerHTML = `
      <div style="color: #ffaa55; margin-bottom: 8px; font-weight: bold;">${hobby.title}</div>
      <div style="margin-bottom: 10px; white-space: normal;">${hobby.description}</div>
      <div style="color: #66ff66; margin-bottom: 6px; font-weight: bold;">Interests:</div>
      ${detailsList}
      <div style="margin-top: 12px; font-size: 12px; color: #888; text-align: center;">Click elsewhere to close</div>
    `;
    
    document.body.appendChild(label);
    this.hobbyLabel = label;
  }

  private updateHobbyLabelPosition() {
    if (!this.hobbyVisible || !this.hobbyLabel || !this.hobbyMarker) return;
    
    const worldPos = (this.hobbyMarker as any).userData?.labelWorldPos;
    if (!worldPos) return;
    
    // Project 3D world position to 2D and clamp inside viewport, keeping label above the needle
    this.positionOverlayAboveWorldPoint(this.hobbyLabel, worldPos);
  }

  private updateContactHTMLLabelPosition() {
    if (!this.contactVisible || !this.contactLabel || !this.contactMarker) return;
    
    const worldPos = (this.contactMarker as any).userData?.labelWorldPos;
    if (!worldPos) return;
    
    // Project 3D world position to 2D and clamp inside viewport, keeping label above the needle
    this.positionOverlayAboveWorldPoint(this.contactLabel, worldPos);
  }

  // Helper to project a world point and place the HTML overlay fully inside the viewport, above the anchor point
  private positionOverlayAboveWorldPoint(label: HTMLDivElement, worldPos: any) {
    if (!label) return;
    // Project to Normalized Device Coordinates (-1..1)
    const screenPos = worldPos.clone().project(this.camera);
    // If behind camera or far, fade out
    if (screenPos.z > 1) {
      label.style.opacity = '0';
      return;
    }
    const rootRect = this.root.getBoundingClientRect();
    const pxX = (screenPos.x * 0.5 + 0.5) * rootRect.width;
    const pxY = (screenPos.y * -0.5 + 0.5) * rootRect.height;
    const margin = 12; // viewport padding
    const gap = 12; // distance above the needle

    // Measure label
    const w = Math.max(1, label.offsetWidth);
    const h = Math.max(1, label.offsetHeight);

    // Desired top-left (final after transform) to keep label above the anchor
    let desiredLeft = rootRect.left + pxX - w / 2;
    let desiredTop = rootRect.top + pxY - h - gap;

    // Clamp within viewport bounds of the root element
    const minLeft = rootRect.left + margin;
    const maxLeft = rootRect.right - margin - w;
    const minTop = rootRect.top + margin;
    const maxTop = rootRect.bottom - margin - h; // not strictly needed for "above", but keeps inside if very tall

    if (desiredLeft < minLeft) desiredLeft = minLeft;
    if (desiredLeft > maxLeft) desiredLeft = maxLeft;
    if (desiredTop < minTop) desiredTop = minTop;
    if (desiredTop > maxTop) desiredTop = maxTop;

    // Because we use translate(-50%,-100%), set anchor (left/top) to the desired top-left + half/height
    const anchorLeft = desiredLeft + w / 2;
    const anchorTop = desiredTop + h;

    label.style.left = `${anchorLeft}px`;
    label.style.top = `${anchorTop}px`;
    label.style.transform = 'translate(-50%, -100%)';
    label.style.opacity = '1';
  }

  private toggleLamp() {
    // First check if we have a lamp light from the model
    if (this.lampLight) {
      const isOn = this.lampLight.intensity > 0;
      
      // Store original intensity for restoration (before modifying it)
      if (!this.lampLight.userData.originalIntensity) {
        this.lampLight.userData.originalIntensity = this.lampLight.intensity;
      }
      
      this.lampLight.intensity = isOn ? 0 : this.lampLight.userData.originalIntensity || 1.0;
    }
    
    // Toggle the Spot node visibility and emissive if it exists
    if (this.spotMesh) {
      const isOn = this.spotMesh.visible;
      this.spotMesh.visible = !isOn;
      // Also toggle emissive on the Spot node for glow effect
      this.setEmissive(this.spotMesh, isOn ? 0.0 : 1.2);
    }
    
    // If neither exists, log a warning
    if (!this.lampLight && !this.spotMesh) {
      console.warn('No lamp light or spot mesh found to toggle');
    }
  }

  private async tryLoadHDR(url: string) {
    try {
      // Preflight check to avoid loader throwing on 404/HTML
      const head = await fetch(url, { method: 'HEAD' });
      if (!head.ok) return; // silently skip if not present
      
      const contentType = head.headers.get('Content-Type');
      if (contentType && contentType.includes('text/html')) {
        // Skip if it's an HTML error page
        return;
      }
      
      const rgbe = new RGBELoader();
      const tex: any = await rgbe.loadAsync(url);
      
      // More robust validation
      if (!tex || typeof tex !== 'object') {
        console.warn('Invalid HDR texture data');
        return;
      }
      
      if (!tex.image || !tex.image.data) {
        console.warn('HDR texture missing image data');
        return;
      }
      
      try {
        const envMap = this.pmrem.fromEquirectangular(tex).texture;
        this.scene.environment = envMap;
        console.log('HDR environment loaded successfully');
      } catch (error) {
        console.warn('Failed to process HDR environment:', error);
      }
      tex.dispose?.();
    } catch (error) {
      console.warn('HDR loading failed:', error);
    }
  }

  private createFallbackEnvironment() {
    // Simple environment without HDR - just ensure we have basic scene setup
    // The existing lights should be sufficient for fallback rendering
    console.log('Using basic lighting as fallback environment');
  }

  // Camera mode API
  toggleCameraMode() {
    this.freeCam = !this.freeCam;
    
    if (!this.freeCam) {
      this.focusDefault();
    }
    const btn = document.querySelector('[data-action="cam-toggle"]') as HTMLButtonElement | null;
    if (btn) btn.textContent = this.freeCam ? '🎮 Free Cam (On)' : '🎮 Free Cam';
  }
}
