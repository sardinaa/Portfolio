import * as THREE from 'three';
import { SceneObjects, RaycastResult } from '../types';
import { ANIMATION_CONFIG } from '../constants';

export class InteractionManager {
  private raycaster: any; // THREE.Raycaster
  private mouse: any; // THREE.Vector2
  private objects: SceneObjects;
  private hovered: any | null = null; // THREE.Object3D
  private camera: any; // THREE.Camera
  private domElement: HTMLElement;

  constructor(camera: any, domElement: HTMLElement, objects: SceneObjects) {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.camera = camera;
    this.domElement = domElement;
    this.objects = objects;
  }

  updateObjects(objects: SceneObjects): void {
    this.objects = objects;
    console.log('🔄 InteractionManager objects updated:', {
      monitor: !!objects.monitorMesh,
      paper: !!objects.paperMesh,
      screen: !!objects.screenMesh,
      lamp: !!objects.lampMesh,
      phone: !!objects.phoneMesh,
      plant: !!objects.plantMesh,
      camera: !!objects.cameraMesh,
      shoes: !!objects.shoesMesh
    });
  }

  raycastInteractive(pointer: { x: number; y: number }): any | null {
    if (!this.hasInteractiveObjects()) return null;
    
    this.raycaster.setFromCamera(pointer as any, this.camera);
    const targets = this.getInteractiveTargets();
    const intersects = this.raycaster.intersectObjects(targets, true);
    const hit = intersects[0]?.object;
    
    if (!hit) return null;
    
    // Return the specific named node that was targeted, not a child mesh
    return this.getSpecificTargetNode(hit);
  }

  private hasInteractiveObjects(): boolean {
    return !!(this.objects.monitorMesh || this.objects.paperMesh || this.objects.screenMesh || 
              this.objects.lampMesh || this.objects.phoneMesh || this.objects.plantMesh || 
              this.objects.cameraMesh || this.objects.shoesMesh);
  }

  private getInteractiveTargets(): any[] {
    const targets: any[] = [];
    
    if (this.objects.monitorMesh) targets.push(this.objects.monitorMesh);
    if (this.objects.paperMesh) targets.push(this.objects.paperMesh);
    if (this.objects.screenMesh) targets.push(this.objects.screenMesh);
    if (this.objects.lampMesh) targets.push(this.objects.lampMesh);
    if (this.objects.phoneMesh) targets.push(this.objects.phoneMesh);
    if (this.objects.plantMesh) targets.push(this.objects.plantMesh);
    if (this.objects.cameraMesh) targets.push(this.objects.cameraMesh);
    if (this.objects.shoesMesh) targets.push(this.objects.shoesMesh);
    
    return targets;
  }

  private getSpecificTargetNode(hit: any): any | null {
    if (this.objects.paperMesh && this.isDescendantOf(hit, this.objects.paperMesh)) return this.objects.paperMesh;
    if (this.objects.monitorMesh && this.isDescendantOf(hit, this.objects.monitorMesh)) return this.objects.monitorMesh;
    if (this.objects.screenMesh && this.isDescendantOf(hit, this.objects.screenMesh)) return this.objects.screenMesh;
    if (this.objects.lampMesh && this.isDescendantOf(hit, this.objects.lampMesh)) return this.objects.lampMesh;
    if (this.objects.phoneMesh && this.isDescendantOf(hit, this.objects.phoneMesh)) return this.objects.phoneMesh;
    if (this.objects.plantMesh && this.isDescendantOf(hit, this.objects.plantMesh)) return this.objects.plantMesh;
    if (this.objects.cameraMesh && this.isDescendantOf(hit, this.objects.cameraMesh)) return this.objects.cameraMesh;
    if (this.objects.shoesMesh && this.isDescendantOf(hit, this.objects.shoesMesh)) return this.objects.shoesMesh;
    
    return hit;
  }

  raycastSpecific(targets: any[]): any | null {
    if (!targets.length) return null;
    
    this.raycaster.setFromCamera(this.mouse as any, this.camera);
    const intersects = this.raycaster.intersectObjects(targets, true);
    return intersects[0]?.object || null;
  }

  isInteractive(obj: any): boolean {
    return (
      (this.objects.monitorMesh && this.isDescendantOf(obj, this.objects.monitorMesh)) ||
      (this.objects.screenMesh && this.isDescendantOf(obj, this.objects.screenMesh)) ||
      (this.objects.paperMesh && this.isDescendantOf(obj, this.objects.paperMesh)) ||
      (this.objects.lampMesh && this.isDescendantOf(obj, this.objects.lampMesh)) ||
      (this.objects.phoneMesh && this.isDescendantOf(obj, this.objects.phoneMesh)) ||
      (this.objects.plantMesh && this.isDescendantOf(obj, this.objects.plantMesh)) ||
      (this.objects.cameraMesh && this.isDescendantOf(obj, this.objects.cameraMesh)) ||
      (this.objects.shoesMesh && this.isDescendantOf(obj, this.objects.shoesMesh))
    );
  }

  isDescendantOf(obj: any, ancestor: any): boolean {
    let p: any = obj;
    while (p) {
      if (p === ancestor) return true;
      p = p.parent;
    }
    return false;
  }

  setEmissive(obj: any, intensity: number): void {
    if (obj?.traverse) {
      // Check if this is the paper object to apply special hover effect
      const isPaperObject = obj?.name === 'Paper' || 
                           (obj?.name && obj.name.includes('Paper')) ||
                           (this.objects.paperMesh && this.isDescendantOf(obj, this.objects.paperMesh));
      
      obj.traverse((o: any) => {
        if (o.isMesh) {
          const mesh = o as any;
          const material = mesh.material as any;
          if (material) {
            if (isPaperObject) {
              // For paper object: use bright contrasting color with much higher intensity
              if (material.emissive) {
                material.emissiveIntensity = intensity * 12.0; // Much higher intensity
                material.emissive = new THREE.Color(0x003366); // Bright orange-red for maximum visibility
              }
              // Also darken the base color for better visibility
              if (intensity > 0 && material.color) {
                // Store original color if not already stored
                if (!material.userData.originalColor) {
                  material.userData.originalColor = material.color.clone();
                }
                // Apply dark tint to base color
                material.color = new THREE.Color(0x4466cc); // Medium blue tint
              } else if (intensity === 0 && material.userData.originalColor) {
                // Restore original color when hover ends
                material.color = material.userData.originalColor.clone();
              }
            } else {
              // For other objects: use default light blue
              if (material.emissive) {
                material.emissiveIntensity = intensity;
                material.emissive = new THREE.Color(ANIMATION_CONFIG.EMISSIVE_COLOR);
              }
            }
            material.needsUpdate = true;
          }
        }
      });
    }
  }

  updateMouse(clientX: number, clientY: number): void {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  handlePointerMove(e: PointerEvent, freeCam: boolean): void {
    // Skip hover effects for touch devices to avoid performance issues
    if (this.isTouchDevice() && e.pointerType === 'touch') {
      this.updateMouse(e.clientX, e.clientY);
      return;
    }

    this.updateMouse(e.clientX, e.clientY);

    const hit = this.raycastInteractive(this.mouse);
    const isHover = hit && this.isInteractive(hit);

    if (isHover && !freeCam) {
      this.domElement.style.cursor = 'pointer';
      this.setEmissive(hit, 0.6);
      if (this.hovered && this.hovered !== hit) {
        this.setEmissive(this.hovered, 0.0);
      }
      this.hovered = hit;
    } else {
      this.domElement.style.cursor = 'default';
      if (this.hovered) {
        this.setEmissive(this.hovered, 0.0);
      }
      this.hovered = null;
    }
  }

  private isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  getMousePosition(): any {
    return this.mouse;
  }

  getHoveredObject(): any {
    return this.hovered;
  }

  /**
   * Makes all interactive objects blink softly 5 times to indicate clickable areas
   */
  blinkInteractiveObjects(): void {
    const interactiveObjects = this.getInteractiveTargets();
    if (interactiveObjects.length === 0) {
      return;
    }

  // Store original emissive and base color values
  const originalEmissives = new Map();
    
    interactiveObjects.forEach(obj => {
      if (obj) {
        obj.traverse((child: any) => {
          if (child.isMesh && child.material) {
            
            if (Array.isArray(child.material)) {
              child.material.forEach((mat: any, index: number) => {
                // Force emissive property if it doesn't exist
                if (!mat.emissive) {
                  mat.emissive = new THREE.Color(0x000000);
                  mat.emissiveIntensity = 0;
                }
                originalEmissives.set(`${child.uuid}_${index}`, {
                  color: mat.emissive.clone(),
                  intensity: mat.emissiveIntensity || 0,
                  baseColor: mat.color ? mat.color.clone() : undefined
                });
              });
            } else {
              // Force emissive property if it doesn't exist
              if (!child.material.emissive) {
                child.material.emissive = new THREE.Color(0x000000);
                child.material.emissiveIntensity = 0;
              }
              originalEmissives.set(child.uuid, {
                color: child.material.emissive.clone(),
                intensity: child.material.emissiveIntensity || 0,
                baseColor: child.material.color ? child.material.color.clone() : undefined
              });
            }
          }
        });
      }
    });

    const startTime = Date.now();
    const blinkDuration = ANIMATION_CONFIG.BLINK_DURATION;
    const blinkCount = ANIMATION_CONFIG.BLINK_COUNT;
    const blinkIntensity = ANIMATION_CONFIG.BLINK_INTENSITY;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / blinkDuration, 1);
      
      // Create a discrete blinking pattern with clear pauses
      const cycleDuration = 1.0 / blinkCount; // Each blink takes 1/5 of total time
      const currentCycle = Math.floor(progress / cycleDuration);
      const cycleProgress = (progress % cycleDuration) / cycleDuration;
      
      let intensity = 0;
      
      // Only show blinks for the first 5 cycles
      if (currentCycle < blinkCount) {
        // Each cycle: 60% on (longer blink), 40% off (shorter pause)
        if (cycleProgress < 0.6) {
          // During the "on" phase, create a symmetrical fade in/out
          const pulseProgress = cycleProgress / 0.6; // 0 to 1 during the on phase
          
          // Create symmetrical triangle wave: fade in for first half, fade out for second half
          let fadeIntensity;
          if (pulseProgress <= 0.5) {
            // Fade in: 0 to 1 over first half
            fadeIntensity = pulseProgress * 2;
          } else {
            // Fade out: 1 to 0 over second half
            fadeIntensity = (1 - pulseProgress) * 2;
          }
          
          intensity = fadeIntensity * blinkIntensity;
          
        }
      }
      
      // Apply the blinking effect
      interactiveObjects.forEach(obj => {
        if (obj) {
          obj.traverse((child: any) => {
            if (child.isMesh && child.material) {
              const isPaper = (obj?.name && obj.name.includes('Paper')) || (child?.name && child.name.includes('Paper')) ||
                              (this.objects.paperMesh && (obj === this.objects.paperMesh || this.isDescendantOf(obj, this.objects.paperMesh)));

              if (Array.isArray(child.material)) {
                child.material.forEach((mat: any, index: number) => {
                  if (mat.emissive) {
                    const key = `${child.uuid}_${index}`;
                    const original = originalEmissives.get(key);
                    if (original) {
                      if (intensity > 0) {
                        if (isPaper) {
                          // Paper: use dark blue emissive with higher intensity
                          mat.emissive.setHex(0x003366);
                          mat.emissiveIntensity = original.intensity + intensity * 8.0;
                          if (mat.color) {
                            if (!original.baseColor) original.baseColor = mat.color.clone();
                            mat.color.setHex(0x4466cc);
                          }
                        } else {
                          // Others: use configured emissive color and normal intensity
                          mat.emissive = new THREE.Color(ANIMATION_CONFIG.EMISSIVE_COLOR);
                          mat.emissiveIntensity = original.intensity + intensity;
                        }
                      } else {
                        // During pause: restore original color and intensity
                        mat.emissive.copy(original.color);
                        mat.emissiveIntensity = original.intensity;
                        if (original.baseColor && mat.color) {
                          mat.color.copy(original.baseColor);
                        }
                      }
                    }
                  }
                });
              } else if (child.material.emissive) {
                const original = originalEmissives.get(child.uuid);
                if (original) {
                  if (intensity > 0) {
                    if (isPaper) {
                      // Paper: use dark blue emissive with higher intensity
                      child.material.emissive.setHex(0x003366);
                      child.material.emissiveIntensity = original.intensity + intensity * 8.0;
                      if (child.material.color) {
                        if (!original.baseColor) original.baseColor = child.material.color.clone();
                        child.material.color.setHex(0x4466cc);
                      }
                    } else {
                      // Others: default emissive color and normal intensity
                      child.material.emissive = new THREE.Color(ANIMATION_CONFIG.EMISSIVE_COLOR);
                      child.material.emissiveIntensity = original.intensity + intensity;
                    }
                  } else {
                    // During pause: restore original color and intensity
                    child.material.emissive.copy(original.color);
                    child.material.emissiveIntensity = original.intensity;
                    if (original.baseColor && child.material.color) {
                      child.material.color.copy(original.baseColor);
                    }
                  }
                }
              }
            }
          });
        }
      });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Restore original emissive and base color values
        interactiveObjects.forEach(obj => {
          if (obj) {
            obj.traverse((child: any) => {
              if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach((mat: any, index: number) => {
                    if (mat.emissive) {
                      const key = `${child.uuid}_${index}`;
                      const original = originalEmissives.get(key);
                      if (original) {
                        mat.emissive.copy(original.color);
                        mat.emissiveIntensity = original.intensity;
                        if (original.baseColor && mat.color) {
                          mat.color.copy(original.baseColor);
                        }
                      }
                    }
                  });
                } else if (child.material.emissive) {
                  const original = originalEmissives.get(child.uuid);
                  if (original) {
                    child.material.emissive.copy(original.color);
                    child.material.emissiveIntensity = original.intensity;
                    if (original.baseColor && child.material.color) {
                      child.material.color.copy(original.baseColor);
                    }
                  }
                }
              }
            });
          }
        });

      }
    };
    
    animate();
  }
}
