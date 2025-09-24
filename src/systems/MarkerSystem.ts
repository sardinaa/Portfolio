import * as THREE from 'three';
import { ContactInfo, HobbyInfo } from '../types';
import { CONTACT_INFO, HOBBIES } from '../constants';

export class MarkerSystem {
  private scene: any; // THREE.Scene
  private camera: any; // THREE.Camera
  
  // Contact marker
  private contactMarker: any | null = null;
  private contactVisible = false;
  private contactLabel: HTMLDivElement | null = null;
  
  // Hobby marker
  private hobbyMarker: any | null = null;
  private hobbyVisible = false;
  private hobbyLabel: HTMLDivElement | null = null;
  private currentHobby: string | null = null;

  constructor(scene: any, camera: any) {
    this.scene = scene;
    this.camera = camera;
  }

  showContactMarker(targetMesh: any): void {
    if (!targetMesh) return;

    this.hideContactMarker();

    const bbox = new THREE.Box3().setFromObject(targetMesh);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    const lift = Math.max(size.y, 0.2);

    // Create pin marker
    const start = center.clone();
    const end = start.clone().add(new THREE.Vector3(0, lift, 0));
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
      new (THREE as any).MeshStandardMaterial({ 
        color: 0x55aaff, 
        emissive: 0x55aaff, 
        emissiveIntensity: 1.0, 
        metalness: 0.2, 
        roughness: 0.4 
      })
    );
    bulb.position.copy(end);
    bulb.castShadow = false;
    bulb.receiveShadow = false;
    bulb.renderOrder = 999;
    (bulb.material as any).depthTest = false;
    group.add(bulb);

    // Store label world position for accurate HTML positioning
    (group as any).userData = { labelWorldPos: end.clone().add(new THREE.Vector3(0.0, lift * 0.35, 0.0)) };

    this.contactMarker = group;
    this.scene.add(this.contactMarker);
    this.contactVisible = true;

    // Create HTML label
    this.createContactLabel();
  }

  private createContactLabel(): void {
    this.contactLabel = document.createElement('div');
    this.contactLabel.style.cssText = `
      position: fixed;
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

    const info = CONTACT_INFO;
    this.contactLabel.innerHTML = `
      <div style="color: #ffff66; margin-bottom: 8px; font-weight: bold;">Contact Information</div>
      <div>📧 <span style="color: #66ff66;">Email:</span> ${info.email}</div>
      <div style="margin-top: 4px;">� <span style="color: #66ff66;">Phone:</span> ${info.phone}</div>
      <div style="margin-top: 4px;">🐙 <span style="color: #66ff66;">GitHub:</span> <a href="${info.github}" target="_blank" style="color: #66ccff; text-decoration: none; cursor: pointer;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${info.github}</a></div>
      <div style="margin-top: 4px;">💼 <span style="color: #66ff66;">LinkedIn:</span> <a href="${info.linkedin}" target="_blank" style="color: #66ccff; text-decoration: none; cursor: pointer;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${info.linkedin}</a></div>
    `;

    document.body.appendChild(this.contactLabel);
  }

  hideContactMarker(): void {
    if (this.contactMarker) {
      this.scene.remove(this.contactMarker);
      this.contactMarker = null;
      this.contactVisible = false;
    }

    if (this.contactLabel) {
      document.body.removeChild(this.contactLabel);
      this.contactLabel = null;
    }
  }

  showHobbyInfo(hobbyType: keyof typeof HOBBIES, targetMesh: any): void {
    if (!targetMesh || !HOBBIES[hobbyType]) return;

    this.hideHobbyInfo();

    const bbox = new THREE.Box3().setFromObject(targetMesh);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    const lift = Math.max(size.y, 0.2);

    // Create pin marker with different color for hobbies
    const start = center.clone();
    const end = start.clone().add(new THREE.Vector3(0, lift, 0));
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
      new (THREE as any).MeshStandardMaterial({ 
        color: 0xffaa55, 
        emissive: 0xffaa55, 
        emissiveIntensity: 1.0, 
        metalness: 0.2, 
        roughness: 0.4 
      })
    );
    bulb.position.copy(end);
    bulb.castShadow = false;
    bulb.receiveShadow = false;
    bulb.renderOrder = 999;
    (bulb.material as any).depthTest = false;
    group.add(bulb);

    // Store label world position for accurate HTML positioning
    (group as any).userData = { labelWorldPos: end.clone().add(new THREE.Vector3(0.0, lift * 0.35, 0.0)) };

    this.hobbyMarker = group;
    this.scene.add(this.hobbyMarker);
    this.hobbyVisible = true;
    this.currentHobby = String(hobbyType);

    // Create HTML label for hobby
    this.createHobbyLabel(hobbyType);
  }

  private createHobbyLabel(hobbyType: keyof typeof HOBBIES): void {
    this.hobbyLabel = document.createElement('div');
    this.hobbyLabel.style.cssText = `
      position: fixed;
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

    const hobby = HOBBIES[hobbyType];
    const detailsList = hobby.details.map(detail => `<div style="margin-left: 16px; color: #66ccff;">• ${detail}</div>`).join('');
    
    this.hobbyLabel.innerHTML = `
      <div style="color: #ffaa55; margin-bottom: 8px; font-weight: bold;">${hobby.title}</div>
      <div style="margin-bottom: 10px; white-space: normal;">${hobby.description}</div>
      <div style="color: #66ff66; margin-bottom: 6px; font-weight: bold;">Interests:</div>
      ${detailsList}
      <div style="margin-top: 12px; font-size: 12px; color: #888; text-align: center;">Click elsewhere to close</div>
    `;

    document.body.appendChild(this.hobbyLabel);
  }

  hideHobbyInfo(): void {
    if (this.hobbyMarker) {
      this.scene.remove(this.hobbyMarker);
      this.hobbyMarker = null;
      this.hobbyVisible = false;
      this.currentHobby = null;
    }

    if (this.hobbyLabel) {
      document.body.removeChild(this.hobbyLabel);
      this.hobbyLabel = null;
    }
  }

  updateContactLabelPosition(): void {
    if (!this.contactVisible || !this.contactLabel || !this.contactMarker) return;
    
    const worldPos = (this.contactMarker as any).userData?.labelWorldPos;
    if (!worldPos) return;
    
    // Project 3D world position to 2D and clamp inside viewport, keeping label above the needle
    this.positionOverlayAboveWorldPoint(this.contactLabel, worldPos);
  }

  updateHobbyLabelPosition(): void {
    if (!this.hobbyVisible || !this.hobbyLabel || !this.hobbyMarker) return;
    
    const worldPos = (this.hobbyMarker as any).userData?.labelWorldPos;
    if (!worldPos) return;
    
    // Project 3D world position to 2D and position label above the needle
    this.positionOverlayAboveWorldPoint(this.hobbyLabel, worldPos);
  }

  // Helper to project a world point and place the HTML overlay fully inside the viewport, above the anchor point
  private positionOverlayAboveWorldPoint(label: HTMLDivElement, worldPos: any): void {
    if (!label) return;
    
    // Project to Normalized Device Coordinates (-1..1)
    const screenPos = worldPos.clone().project(this.camera);
    
    // If behind camera or far, fade out
    if (screenPos.z > 1) {
      label.style.opacity = '0';
      return;
    }
    
    // Get root element bounds (canvas container)
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const rootRect = canvas.getBoundingClientRect();
    
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
    const maxLeft = rootRect.right - w - margin;
    const minTop = rootRect.top + margin;
    const maxTop = rootRect.bottom - h - margin;

    desiredLeft = Math.max(minLeft, Math.min(maxLeft, desiredLeft));
    desiredTop = Math.max(minTop, Math.min(maxTop, desiredTop));

    label.style.left = `${desiredLeft}px`;
    label.style.top = `${desiredTop}px`;
    label.style.opacity = '1';
  }

  updateAllLabelPositions(): void {
    this.updateContactLabelPosition();
    this.updateHobbyLabelPosition();
  }

  isContactVisible(): boolean {
    return this.contactVisible;
  }

  isHobbyVisible(): boolean {
    return this.hobbyVisible;
  }

  getCurrentHobby(): string | null {
    return this.currentHobby;
  }
}
