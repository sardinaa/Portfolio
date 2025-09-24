import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CameraTarget, SceneFit, SceneObjects } from '../../types';
import { DEFAULT_CAMERA_TARGETS, RENDERER_CONFIG, ANIMATION_CONFIG } from '../../constants';

export class CameraManager {
  private camera: any; // THREE.PerspectiveCamera
  private controls: OrbitControls;
  private targets: Record<string, CameraTarget> = {};
  private currentTarget: string = 'default';
  private t: number = 0;
  private freeCam: boolean = false;

  constructor(camera: any, renderer: any) { // THREE.PerspectiveCamera, THREE.WebGLRenderer
    this.camera = camera;
    this.controls = new OrbitControls(camera, renderer.domElement);
    this.setupCamera();
    this.initializeTargets();
  }

  private setupCamera(): void {
    this.camera.position.copy(this.vectorFromConfig(DEFAULT_CAMERA_TARGETS.default.pos));
    this.camera.lookAt(this.vectorFromConfig(DEFAULT_CAMERA_TARGETS.default.look));

    this.controls.enableDamping = true;
    this.controls.dampingFactor = ANIMATION_CONFIG.DAMPING_FACTOR;
    this.controls.minDistance = RENDERER_CONFIG.CAMERA_CONSTRAINTS.MIN_DISTANCE;
    this.controls.maxDistance = RENDERER_CONFIG.CAMERA_CONSTRAINTS.MAX_DISTANCE;
    this.controls.target.copy(this.vectorFromConfig(DEFAULT_CAMERA_TARGETS.default.look));
    
    // Touch-specific optimizations
    this.setupTouchControls();
  }

  private setupTouchControls(): void {
    // Cast to any to access OrbitControls properties not in TypeScript definitions
    const controls = this.controls as any;
    
    // Enable touch controls for mobile devices
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;
    
    // Touch-specific settings for better mobile experience
    // Using numeric constants instead of THREE.TOUCH constants
    controls.touches = {
      ONE: 0, // ROTATE
      TWO: 2  // DOLLY_PAN
    };
    
    // Mouse/pointer settings  
    controls.mouseButtons = {
      LEFT: 0,   // ROTATE
      MIDDLE: 1, // DOLLY
      RIGHT: 2   // PAN
    };
    
    // Adjust sensitivity for touch devices
    controls.rotateSpeed = this.isTouchDevice() ? 0.8 : 1.0;
    controls.zoomSpeed = this.isTouchDevice() ? 1.2 : 1.0;
    controls.panSpeed = this.isTouchDevice() ? 1.0 : 1.0;
    
    // Smoother experience on touch devices
    if (this.isTouchDevice()) {
      this.controls.dampingFactor = 0.12; // Slightly more damping for touch
      // Note: OrbitControls doesn't have minZoom/maxZoom, using minDistance/maxDistance instead
    }
  }

  private isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  private initializeTargets(): void {
    Object.entries(DEFAULT_CAMERA_TARGETS).forEach(([key, config]) => {
      this.targets[key] = {
        pos: this.vectorFromConfig(config.pos),
        look: this.vectorFromConfig(config.look)
      };
    });
  }

  private vectorFromConfig(config: { x: number; y: number; z: number }): any {
    return new THREE.Vector3(config.x, config.y, config.z);
  }

  updateCameraFrustum(sceneFit: SceneFit): void {
    const { radius } = sceneFit;
    this.camera.near = Math.max(0.01, radius / 200);
    this.camera.far = radius * 50;
    this.camera.updateProjectionMatrix();
  }

  positionCameraForScene(sceneFit: SceneFit, objects: SceneObjects): void {
    const { center, radius } = sceneFit;

    // Calculate responsive zoom based on screen size
    const screenZoomFactor = this.calculateResponsiveZoomFactor();
    
    let pos: any;
    if (objects.planeMesh) {
      // For rooms with planes, position camera inside looking at the desk area
      // Use a more conservative multiplier to stay inside the room
      pos = center.clone().add(new THREE.Vector3(-1, 0.5, 1).normalize().multiplyScalar(radius * 4 * screenZoomFactor));
      
      // Ensure camera is at a reasonable height inside the room
      const minHeight = center.y + 0.5; // Stay above the desk surface
      const maxHeight = center.y + 2.0; // Don't go too high
      pos.y = Math.max(minHeight, Math.min(maxHeight, pos.y));
    } else {
      // Original positioning for non-room scenes with responsive zoom
      pos = center.clone().add(new THREE.Vector3(-1, 0.5, 1).normalize().multiplyScalar(radius * 2.2 * screenZoomFactor));
    }

    this.camera.position.copy(pos);
    this.controls.target.copy(center);
    this.controls.minDistance = Math.max(radius * 0.2, 0.2);
    this.controls.maxDistance = objects.planeMesh ? radius * 5 * screenZoomFactor : radius * 10 * screenZoomFactor;
    
    // Additional constraints for rooms with planes
    if (objects.planeMesh) {
      // Limit vertical angle to prevent looking through floor/ceiling
      (this.controls as any).maxPolarAngle = Math.PI * 0.85; // Don't look too far down
      (this.controls as any).minPolarAngle = Math.PI * 0.15; // Don't look too far up
      
      // Enable dampening for smoother movement in confined spaces
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.1; // Smoother movement
    }
    
    // CRITICAL: Update default target positions based on calculated camera position
    this.targets.default.pos.copy(pos);
    this.targets.default.look.copy(center);
  }

  private calculateResponsiveZoomFactor(): number {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;
    
    // Base zoom factors for different screen sizes
    let zoomFactor = 1.0;
    
    // Mobile portrait (very narrow screens) - zoom out more
    if (width <= 480) {
      zoomFactor = aspect < 0.6 ? 1.8 : 1.6; // Extra zoom out for very narrow screens
    }
    // Mobile landscape and small tablets
    else if (width <= 768) {
      zoomFactor = aspect < 1.0 ? 1.5 : 1.3;
    }
    // Medium tablets
    else if (width <= 1024) {
      zoomFactor = aspect < 1.0 ? 1.3 : 1.1;
    }
    // Desktop and large screens
    else {
      zoomFactor = 1.0;
    }
    
    // Additional adjustment for very small heights (landscape mobile)
    if (height <= 500) {
      zoomFactor *= 1.2;
    }
    
    // Touch devices generally benefit from being zoomed out a bit more
    if (this.isTouchDevice()) {
      zoomFactor *= 1.1;
    }
    
    console.log(`📱 Responsive zoom factor: ${zoomFactor.toFixed(2)} (${width}x${height}, aspect: ${aspect.toFixed(2)})`);
    return zoomFactor;
  }

  setupTargetsForObjects(objects: SceneObjects): void {
    // Setup monitor target with responsive zoom out for better content visibility
    if (objects.monitorMesh || objects.screenMesh) {
      const targetMesh = objects.screenMesh ?? objects.monitorMesh;
      const mb = new THREE.Box3().setFromObject(targetMesh);
      const mCenter = new THREE.Vector3();
      mb.getCenter(mCenter);
      const mSize = new THREE.Vector3();
      mb.getSize(mSize);
      const q = new THREE.Quaternion();
      targetMesh.getWorldQuaternion(q);
      const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(q).normalize();
      
      // Increased base distance for better content visibility
      let baseMultiplier = 0.8; // Increased from 0.8 for more zoom out
      
      // Extra zoom out for small screens when viewing monitor/screen content
      const width = window.innerWidth;
      if (width <= 480) {
        baseMultiplier = 1.0; // Even more zoom out on mobile
      } else if (width <= 768) {
        baseMultiplier = 1.0; // More zoom out on tablets
      }
      
      const screenZoomFactor = this.calculateResponsiveZoomFactor();
      const mDist = Math.max(mSize.x, mSize.y, mSize.z) * baseMultiplier * screenZoomFactor;
      const mPos = mCenter.clone().add(normal.multiplyScalar(mDist));
      
      this.targets.monitor.pos.copy(mPos);
      this.targets.monitor.look.copy(mCenter);
    }

    // Setup paper target with responsive zoom for better document visibility
    if (objects.paperMesh) {
      const pb = new THREE.Box3().setFromObject(objects.paperMesh);
      const pCenter = new THREE.Vector3();
      pb.getCenter(pCenter);
      const pSize = new THREE.Vector3();
      pb.getSize(pSize);
      const up = new THREE.Vector3(0, 1, 0);
      
      // Increased distance for better paper content visibility
      const baseMultiplier = 1.2; // Increased from 0.9
      const screenZoomFactor = this.calculateResponsiveZoomFactor();
      const pDist = Math.max(pSize.x, pSize.y, pSize.z) * baseMultiplier * screenZoomFactor;
      // Position camera directly above the paper for top-down view
      const pPos = pCenter.clone().add(up.multiplyScalar(pDist));
      
      this.targets.paper.pos.copy(pPos);
      this.targets.paper.look.copy(pCenter);
    }

    // Setup phone target - exactly like original
    if (objects.phoneMesh) {
      const phb = new THREE.Box3().setFromObject(objects.phoneMesh);
      const phCenter = new THREE.Vector3();
      phb.getCenter(phCenter);
      const phSize = new THREE.Vector3();
      phb.getSize(phSize);
      const maxDim = Math.max(phSize.x, phSize.y, phSize.z);
      const q = new THREE.Quaternion();
      objects.phoneMesh.getWorldQuaternion(q);
      // Try using local +Z as facing normal; if pointing too vertical, use diagonal view
      let normal = new THREE.Vector3(0, 0, 1).applyQuaternion(q).normalize();
      if (Math.abs(normal.y) > 0.75) {
        normal = new THREE.Vector3(1, 0.3, 1).normalize();
      }
      // Increased distance for better phone visibility
      const baseDistance = Math.max(0.4, maxDim * 2.4); // Increased from 2.0
      const screenZoomFactor = this.calculateResponsiveZoomFactor();
      const distance = baseDistance * screenZoomFactor;
      const offset = normal.clone().multiplyScalar(distance).add(new THREE.Vector3(0, Math.max(0.15, maxDim * 0.5), 0));
      const phPos = phCenter.clone().add(offset);
      
      this.targets.phone.pos.copy(phPos);
      this.targets.phone.look.copy(phCenter);
    }

    // Setup hobby targets using the original computation function
    this.computeHobbyTarget(objects.plantMesh, 'plant');
    this.computeHobbyTarget(objects.cameraMesh, 'camera');
    this.computeHobbyTarget(objects.shoesMesh, 'shoes');
  }

  private computeHobbyTarget(mesh: any, targetName: string): void {
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
    
    // Increased distance for better hobby object visibility
    const baseDistance = Math.max(0.4, maxDim * 2.4); // Increased from 2.0
    const screenZoomFactor = this.calculateResponsiveZoomFactor();
    const distance = baseDistance * screenZoomFactor;
    const offset = normal.clone().multiplyScalar(distance).add(new THREE.Vector3(0, Math.max(0.15, maxDim * 0.5), 0));
    const hPos = hCenter.clone().add(offset);
    
    this.targets[targetName].pos.copy(hPos);
    this.targets[targetName].look.copy(hCenter);
  }

  focusTarget(targetName: string): void {
    if (this.targets[targetName]) {
      this.currentTarget = targetName;
      this.t = 0;
      this.freeCam = false;
    }
  }

  focusDefault(): void {
    this.focusTarget('default');
  }

  setFreeCam(enabled: boolean): void {
    this.freeCam = enabled;
    if (enabled) {
      this.t = 1; // Stop camera interpolation
    }
  }

  update(): void {
    this.controls.update();
    
    // Smoothly lerp camera to current target when needed
    if (!this.freeCam && this.currentTarget && this.targets[this.currentTarget]) {
      this.t = THREE.MathUtils.clamp(this.t + ANIMATION_CONFIG.TARGET_LERP_SPEED, 0, 1);
      const target = this.targets[this.currentTarget];
      
      // Use slower lerp on touch devices for smoother experience
      const lerpSpeed = this.isTouchDevice() ? 
        ANIMATION_CONFIG.CAMERA_LERP_SPEED * 0.8 : 
        ANIMATION_CONFIG.CAMERA_LERP_SPEED;
      
      this.camera.position.lerp(target.pos, lerpSpeed);
      this.controls.target.lerp(target.look, lerpSpeed);
    }
  }

  applyCameraConstraints(planeMesh: any): void {
    if (!planeMesh) return;

    const pos = this.camera.position;
    
    // Get the bounding box of the plane to determine room boundaries
    const planeBox = new THREE.Box3().setFromObject(planeMesh);
    
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

  onResize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // Adjust camera position for responsive zoom when resizing
    this.adjustCameraForScreenSize();
  }

  private adjustCameraForScreenSize(): void {
    // Only adjust if we're in default view (not focused on a specific target)
    if (this.currentTarget === 'default' && this.targets.default) {
      const zoomFactor = this.calculateResponsiveZoomFactor();
      const basePosition = this.targets.default.pos.clone();
      const center = this.targets.default.look.clone();
      
      // Calculate the direction from center to camera
      const direction = basePosition.clone().sub(center).normalize();
      const baseDistance = basePosition.distanceTo(center);
      
      // Apply zoom factor to distance
      const newDistance = baseDistance * zoomFactor;
      const newPosition = center.clone().add(direction.multiplyScalar(newDistance));
      
      // Smoothly transition to new position if not in free cam mode
      if (!this.freeCam) {
        this.camera.position.lerp(newPosition, 0.3);
        // Also update max distance for controls
        const controls = this.controls as any;
        if (controls.maxDistance) {
          controls.maxDistance *= zoomFactor;
        }
      }
    }
  }

  getCamera(): any { // THREE.PerspectiveCamera
    return this.camera;
  }

  getControls(): OrbitControls {
    return this.controls;
  }

  getCurrentTarget(): string {
    return this.currentTarget;
  }

  isFreeCam(): boolean {
    return this.freeCam;
  }

  // Method to recalculate camera position for screen size (useful for orientation changes)
  recalculateForScreenSize(): void {
    this.adjustCameraForScreenSize();
  }
}
