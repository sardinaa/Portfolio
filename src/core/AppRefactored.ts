import * as THREE from 'three';
import { SceneManager } from './scene/SceneManager';
import { CameraManager } from './managers/CameraManager';
import { RendererManager } from './managers/RendererManager';
import { UIManager } from './managers/UIManager';
import { InteractionManager } from '../interactions/InteractionManager';
import { AssetLoader } from '../systems/AssetLoader';
import { MarkerSystem } from '../systems/MarkerSystem';
import { SoundManager } from '../systems/SoundManager';
import { BootLoader } from '../components/BootLoader';
import { AppConfig, SceneObjects } from '../types';
import { RENDERER_CONFIG } from '../constants';
import { portfolioConfig } from '../config';

export class App {
  private config: AppConfig;
  
  // Core systems
  private sceneManager: SceneManager;
  private cameraManager: CameraManager;
  private rendererManager: RendererManager;
  private uiManager: UIManager;
  private interactionManager: InteractionManager;
  private assetLoader: AssetLoader;
  private markerSystem: MarkerSystem;
  private soundManager: SoundManager;
  private bootLoader!: BootLoader;
  
  // Core Three.js objects
  private scene: any; // THREE.Scene
  private camera: any; // THREE.PerspectiveCamera
  
  // Event handlers
  private boundHandlers: { [key: string]: (e: any) => void } = {};
  
  // Touch tracking for proper tap detection
  private touchStartPos: { x: number, y: number } | null = null;
  private touchStartTime: number = 0;
  private touchMoved: boolean = false;
  private lastTouchClickTime: number = 0;
  
  // Audio state tracking
  private ambientMusicStarted = false;

  constructor(root: HTMLDivElement, css3dRoot: HTMLDivElement | null = null) {
    // Initialize core Three.js objects first
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      RENDERER_CONFIG.CAMERA_FOV, 
      1, 
      RENDERER_CONFIG.CAMERA_NEAR, 
      RENDERER_CONFIG.CAMERA_FAR
    );
    
    // Initialize sound manager early so we can pass it to UI
    this.soundManager = new SoundManager(this.camera);
    
    // Initialize UIManager with SoundManager to get css3dRoot from it if needed
    this.uiManager = new UIManager(root, this.soundManager);
    
    // Get css3dRoot from UIManager if not provided
    const actualCss3dRoot = css3dRoot || this.uiManager.getCSS3DRoot() as HTMLDivElement;
    
    this.config = { root, css3dRoot: actualCss3dRoot };
    
    // Initialize other systems
    this.rendererManager = new RendererManager(root, actualCss3dRoot);
    this.sceneManager = new SceneManager(this.scene);
    this.cameraManager = new CameraManager(this.camera, this.rendererManager.getRenderer());
    this.assetLoader = new AssetLoader(this.rendererManager.getRenderer());
    this.markerSystem = new MarkerSystem(this.scene, this.camera);
    
    // Hide the 3D scene initially until user interaction
    this.hide3DScene();
    
    // Initialize interaction manager with empty objects (will be updated when model loads)
    this.interactionManager = new InteractionManager(
      this.camera, 
      this.rendererManager.getDomElement(), 
      {}
    );
    
    // Initialize boot loader
    this.bootLoader = new BootLoader();
    
    // Initialize UI manager
    // Set up UI manager callbacks (UIManager already initialized in constructor)
    this.uiManager.onUIClose = () => {
      this.cameraManager.focusDefault();
      this.uiManager.showTopLeftInfo(); // Show top-left-info when UI closes
    };
    
    // Set up new component event handlers
    this.uiManager.onAudioToggle = (muted: boolean) => {
      // Use SoundManager for global mute control
      this.soundManager.setMuted(muted);
      
      // Also mute/unmute any HTML audio/video elements on the page
      document.querySelectorAll('audio, video').forEach((el: any) => {
        el.muted = muted;
      });
    };
    
    this.uiManager.onCameraToggle = (freeCam: boolean) => {
      // Call toggleCameraMode if available
      if (typeof this.toggleCameraMode === 'function') {
        this.toggleCameraMode();
      }
    };

    this.uiManager.onBlinkTrigger = () => {
      this.soundManager.playSound('keyboard'); // Play keyboard sound for blink
      console.log('💡 Blink triggered from UI');
      this.interactionManager.blinkInteractiveObjects();
    };
    
    this.bindEventHandlers();
  }

  private bindEventHandlers(): void {
    this.boundHandlers.onResize = this.onResize.bind(this);
    this.boundHandlers.onPointerMove = this.onPointerMove.bind(this);
    this.boundHandlers.onClick = this.onMouseClick.bind(this);
    this.boundHandlers.onCss3dClick = this.onCss3dClick.bind(this);
    this.boundHandlers.onKeyDown = this.onKeyDown.bind(this);
    this.boundHandlers.onTouchStart = this.onTouchStart.bind(this);
    this.boundHandlers.onTouchMove = this.onTouchMove.bind(this);
    this.boundHandlers.onTouchEnd = this.onTouchEnd.bind(this);
    this.boundHandlers.onOrientationAdjust = this.onOrientationAdjust.bind(this);
  }

  async start(): Promise<void> {
    // Show boot loader
    this.bootLoader.show();
    
    // Setup initial camera and renderer
    this.onResize();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Try to load HDR environment
    const baseUrl = import.meta.env.BASE_URL || '/';
    try {
      await this.assetLoader.loadHDR(`${baseUrl}env.hdr`, this.scene);
      this.bootLoader.updateProgress('HDR Environment', 'success');
    } catch (error) {
      console.log('HDR environment not found, using fallback lighting');
      this.bootLoader.updateProgress('HDR Environment', 'error');
    }
    
    // Load sound effects
    await this.loadSounds(baseUrl);
    
    // Load the main GLB model
    const glbUrl = `${baseUrl}desk.glb` + (import.meta.env?.DEV ? `?v=${Date.now()}` : '');
    await this.loadModel(glbUrl);
    
    // Start the render loop
    this.animate(0);
    
    // Hide boot loader after everything is ready
    setTimeout(() => {
      this.bootLoader.hide();
      
      // Wait for boot loader to completely fade out, then show welcome
      setTimeout(() => {
        this.showAudioPromptAndStart();
      }, 300); // Small delay after boot loader disappears to ensure smooth transition
      
      // Start the blinking animation after boot loader is hidden
      setTimeout(() => {
        this.interactionManager.blinkInteractiveObjects();
        console.log('✨ Interactive objects blinking started');
      }, 500); // Small delay after boot loader disappears
    }, 2000); // Allow time to see the completion
    
    console.log('🚀 Portfolio 3D App initialized successfully');
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.boundHandlers.onResize);
    this.rendererManager.getDomElement().addEventListener('pointermove', this.boundHandlers.onPointerMove);
    this.rendererManager.getDomElement().addEventListener('click', this.boundHandlers.onClick);
    this.config.css3dRoot.addEventListener('click', this.boundHandlers.onCss3dClick);
    window.addEventListener('keydown', this.boundHandlers.onKeyDown);
    
    // Add touch-specific event listeners
    this.rendererManager.getDomElement().addEventListener('touchstart', this.boundHandlers.onTouchStart, { passive: true });
    this.rendererManager.getDomElement().addEventListener('touchmove', this.boundHandlers.onTouchMove, { passive: false });
    this.rendererManager.getDomElement().addEventListener('touchend', this.boundHandlers.onTouchEnd, { passive: true });
    
    // Add orientation change camera adjustment listener
    window.addEventListener('orientation-camera-adjust', this.boundHandlers.onOrientationAdjust);
  }

  private async loadSounds(baseUrl: string): Promise<void> {
    try {
      // Loading sound effects - no explicit loading state needed
      
      // Load all sound effects
      const soundPromises = [
        this.soundManager.loadSound('ambient', {
          path: `${baseUrl}sounds/ambient_music.mp3`,
          volume: 0.3,  // Lower volume for ambient music
          loop: true,
          autoplay: false  // Don't autoplay, we'll start it after model loads
        }),
        this.soundManager.loadSound('swoosh-in', {
          path: `${baseUrl}sounds/swoosh.mp3`,
          volume: 0.7
        }),
        this.soundManager.loadSound('swoosh-out', {
          path: `${baseUrl}sounds/swoosh_inverted.mp3`,
          volume: 0.7
        }),
        this.soundManager.loadSound('keyboard', {
          path: `${baseUrl}sounds/keyboard.mp3`,
          volume: 0.8
        }),
        this.soundManager.loadSound('typing', {
          path: `${baseUrl}sounds/digital-text-typing.wav`,
          volume: 0.4,  // Lower volume for typing sound
          loop: true
        }),
        this.soundManager.loadSound('switch', {
          path: `${baseUrl}sounds/switch.mp3`,
          volume: 0.6  // Moderate volume for switch sound
        })
      ];
      
      await Promise.all(soundPromises);
      this.bootLoader.updateProgress('Loading Sound Effects', 'success');
      console.log('🎵 Sound effects loaded successfully');
    } catch (error) {
      console.warn('⚠️ Failed to load some sound effects:', error);
      this.bootLoader.updateProgress('Loading Sound Effects', 'error');
    }
  }

  private async loadModel(url: string): Promise<void> {
    try {
      const model = await this.assetLoader.loadGLTF(url, (progress) => {
        this.bootLoader.addProgressBar('Downloading 3D Model Assets', progress);
        if (progress === 100) {
          this.bootLoader.updateProgress('Downloading 3D Model Assets', 'success');
        }
      });
      
      this.bootLoader.updateProgress('Processing GLTF Data', 'success');
      this.sceneManager.addModel(model);
      
      this.bootLoader.updateProgress('Setting up Scene Objects', 'success');
      const objects = this.sceneManager.getObjects();
      const sceneFit = this.sceneManager.getSceneFit();
      
      if (sceneFit) {
        // Update camera based on scene
        this.cameraManager.updateCameraFrustum(sceneFit);
        this.cameraManager.positionCameraForScene(sceneFit, objects);
        this.cameraManager.setupTargetsForObjects(objects);
      }
      
      // Update interaction manager with loaded objects
      this.interactionManager.updateObjects(objects);
      
      // Attach UI elements to scene objects
      this.uiManager.attachMiniSiteToScreen(
        objects, 
        this.rendererManager.getCSS3D(), 
        this.camera
      );
      
      console.log('✅ 3D model loaded and configured');
    } catch (error) {
      console.error('❌ Failed to load 3D model:', error);
      // Update boot loader to show error
      this.bootLoader.updateProgress('3D Model Assets', 'error');
      this.bootLoader.updateProgress('Processing GLTF Data', 'error');
    }
  }

  private tryStartAmbientMusic(): void {
    if (this.ambientMusicStarted) {
      return; // Already started
    }

    // Force start ambient music
    this.soundManager.playSound('ambient');
    this.ambientMusicStarted = true;
    console.log('🎵 Ambient music started after loading');
  }

  private async forceStartAmbientMusic(): Promise<void> {
    if (this.ambientMusicStarted) {
      return; // Already started
    }

    try {
      // Force unlock audio and start ambient music
      await this.soundManager.forceStartAmbient();
      this.ambientMusicStarted = true;
      console.log('🎵 Ambient music force started after loading screen');
    } catch (error) {
      console.log('🎵 Setting up ambient music start on next user interaction');
      // Add one-time event listeners to start ambient music on ANY user interaction
      this.setupAmbientMusicTriggers();
    }
  }

  private setupAmbientMusicTriggers(): void {
    const startAmbientOnce = async () => {
      if (this.ambientMusicStarted) return;
      
      try {
        await this.soundManager.forceStartAmbient();
        this.ambientMusicStarted = true;
        console.log('🎵 Ambient music started on user interaction');
        
        // Remove all the event listeners since we only need this once
        document.removeEventListener('click', startAmbientOnce, true);
        document.removeEventListener('keydown', startAmbientOnce, true);
        document.removeEventListener('touchstart', startAmbientOnce, true);
        document.removeEventListener('mousemove', startAmbientOnce, true);
      } catch (error) {
        console.warn('🎵 Still unable to start ambient music:', error);
      }
    };

    // Add multiple triggers to ensure ambient music starts on ANY user interaction
    document.addEventListener('click', startAmbientOnce, { capture: true, once: false });
    document.addEventListener('keydown', startAmbientOnce, { capture: true, once: false });
    document.addEventListener('touchstart', startAmbientOnce, { capture: true, once: false });
    document.addEventListener('mousemove', startAmbientOnce, { capture: true, once: false });
    
    console.log('🎵 Ambient music triggers set up - will start on next user interaction');
  }

  private hide3DScene(): void {
    // Hide the main 3D canvas visually but keep interactions
    const canvas = this.rendererManager.getDomElement();
    canvas.style.opacity = '0';
    // Keep pointerEvents enabled for interactions to work
    
    // Hide CSS3D root as well
    this.config.css3dRoot.style.opacity = '0';
    // Keep pointerEvents enabled for CSS3D interactions
    
    console.log('🎭 3D scene hidden until user interaction');
  }

  private show3DScene(): void {
    // Show the main 3D canvas with smooth transition
    const canvas = this.rendererManager.getDomElement();
    canvas.style.transition = 'opacity 1s ease-in-out';
    canvas.style.opacity = '1';
    // pointerEvents should already be enabled
    
    // Show CSS3D root as well
    this.config.css3dRoot.style.transition = 'opacity 1s ease-in-out';
    this.config.css3dRoot.style.opacity = '1';
    // pointerEvents should already be enabled
    
    console.log('🎭 3D scene revealed after user interaction');
  }

  private async showAudioPromptAndStart(): Promise<void> {
    // Immediately show the audio enable overlay - no attempts, just force user interaction
    this.showAudioEnableOverlay();
  }

  private showAudioEnableOverlay(): void {
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #000000;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
      color: #00ff00;
      cursor: pointer;
      overflow: hidden;
      opacity: 0;
      transition: opacity 0.5s ease-in;
    `;

    // Add smooth fade-in effect
    setTimeout(() => {
      overlay.style.opacity = '1';
    }, 100);

    const terminal = document.createElement('div');
    terminal.style.cssText = `
      width: 90%;
      max-width: 600px;
      height: auto;
      background: #000000;
      border: 2px solid #00ff00;
      border-radius: 4px;
      padding: 30px;
      position: relative;
      box-shadow: 
        0 0 20px rgba(0, 255, 0, 0.3),
        inset 0 0 20px rgba(0, 255, 0, 0.1);
      text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
    `;

    terminal.innerHTML = `
      <div style="text-align: center; margin-bottom: 25px;">
        <pre style="font-size: 10px; line-height: 1.1; color: #00ff00; margin: 0; white-space: pre;">
 ██████╗  ██████╗ ██████╗ ████████╗███████╗ ██████╗ ██╗     ██╗ ██████╗ 
 ██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝██╔═══██╗██║     ██║██╔═══██╗
 ██████╔╝██║   ██║██████╔╝   ██║   █████╗  ██║   ██║██║     ██║██║   ██║
 ██╔═══╝ ██║   ██║██╔══██╗   ██║   ██╔══╝  ██║   ██║██║     ██║██║   ██║
 ██║     ╚██████╔╝██║  ██║   ██║   ██║     ╚██████╔╝███████╗██║╚██████╔╝
 ╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝ 
        </pre>
      </div>
      
      <div style="margin-bottom: 20px;">
        <div style="font-size: 14px; color: #00aa00; margin-bottom: 10px;">
          >> PORTFOLIO SYSTEM v3.0.1 - INTERACTIVE ENVIRONMENT
        </div>
        <div style="font-size: 12px; color: #007700; margin-bottom: 15px;">
          Copyright (c) 2025 Oscar Palomo. All rights reserved.
        </div>
      </div>

      <div style="margin-bottom: 20px; font-size: 12px; line-height: 1.4;">
        <div style="color: #00ff00; margin-bottom: 8px;">[SYSTEM] Initializing 3D workspace...</div>
        <div style="color: #00aa00; margin-bottom: 8px;">[AUDIO]  Loading immersive sound environment...</div>
        <div style="color: #ffaa00; margin-bottom: 8px;">[INPUT]  Waiting for user interaction...</div>
      </div>

      <div style="text-align: center; margin: 25px 0;">
        <div style="font-size: 13px; color: #00ffff; margin-bottom: 10px;">
          ═══ WELCOME TO THE INTERACTIVE PORTFOLIO ═══
        </div>
        <div style="font-size: 11px; color: #00aa00; margin-bottom: 15px;">
          Click anywhere to enter the immersive experience
        </div>
        <div style="font-size: 10px; color: #ffaa00; animation: blink 1.5s infinite;">
          >> PRESS ANY KEY OR CLICK TO CONTINUE <<
        </div>
      </div>
    `;

    // Add retro terminal animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0.3; }
      }
      @keyframes scanline {
        0% { transform: translateY(-100vh); }
        100% { transform: translateY(100vh); }
      }
    `;
    document.head.appendChild(style);

    overlay.appendChild(terminal);
    document.body.appendChild(overlay);

    // Add multiple event handlers to capture ANY user interaction
    const enableAudio = async (event: Event) => {
      console.log('🎵 USER INTERACTION DETECTED:', event.type);
      
      // Prevent event propagation
      event.preventDefault();
      event.stopPropagation();
      
      try {
        // FORCE START WITH MAXIMUM AGGRESSION
        console.log('🎵 FORCING AMBIENT MUSIC START...');
        await this.soundManager.forceStartAmbient();
        this.ambientMusicStarted = true;
        console.log('🎵 ✅ AMBIENT MUSIC STARTED AFTER USER INTERACTION');
        
        // Show the 3D scene now that user has interacted
        this.show3DScene();
        
        // Remove overlay immediately
        overlay.style.transition = 'opacity 0.3s ease-out';
        overlay.style.opacity = '0';
        setTimeout(() => {
          if (overlay.parentNode) {
            document.body.removeChild(overlay);
          }
        }, 300);
        
      } catch (error) {
        console.error('🎵 ❌ CRITICAL: Failed to start ambient music even after user interaction:', error);
        
        // Try one more time with direct sound access
        try {
          const ambientSound = this.soundManager.getSoundNames().includes('ambient') ? 
                              this.soundManager : null;
          if (ambientSound) {
            console.log('🎵 ATTEMPTING EMERGENCY SOUND START');
            await this.soundManager.playSound('ambient');
            this.ambientMusicStarted = true;
            console.log('🎵 ✅ EMERGENCY START SUCCESSFUL');
          }
        } catch (emergencyError) {
          console.error('🎵 ❌ EMERGENCY START ALSO FAILED:', emergencyError);
        }
        
        // Show the 3D scene even if audio failed
        this.show3DScene();
        
        // Remove overlay anyway
        if (overlay.parentNode) {
          document.body.removeChild(overlay);
        }
      }
    };

    // Add MULTIPLE event listeners to capture ANY interaction
    overlay.addEventListener('click', enableAudio, { once: true });
    overlay.addEventListener('touchstart', enableAudio, { once: true });
    overlay.addEventListener('keydown', enableAudio, { once: true });
    overlay.addEventListener('mousedown', enableAudio, { once: true });
    overlay.addEventListener('pointerdown', enableAudio, { once: true });
    
    // Focus the overlay to capture keyboard events
    overlay.setAttribute('tabindex', '0');
    overlay.focus();
    
    // Auto-hide after 15 seconds if user doesn't interact
    setTimeout(() => {
      if (overlay.parentNode && !this.ambientMusicStarted) {
        // Show 3D scene even if user didn't interact
        this.show3DScene();
        
        overlay.style.transition = 'opacity 1s ease-out';
        overlay.style.opacity = '0';
        setTimeout(() => {
          if (overlay.parentNode) {
            document.body.removeChild(overlay);
          }
          // Set up fallback triggers
          this.setupAmbientMusicTriggers();
        }, 1000);
      }
    }, 15000);
  }

  private onResize(): void {
    const width = this.config.root.clientWidth;
    const height = this.config.root.clientHeight;
    
    this.cameraManager.onResize(width, height);
    this.rendererManager.onResize();
  }

  private onPointerMove(e: PointerEvent): void {
    this.interactionManager.handlePointerMove(e, this.cameraManager.isFreeCam());
  }

  private async onMouseClick(): Promise<void> {
    // Ignore mouse clicks that happen shortly after touch taps (within 500ms)
    // This prevents duplicate events on touch devices
    const timeSinceTouch = Date.now() - this.lastTouchClickTime;
    if (timeSinceTouch < 500) {
      console.log('🚫 Ignoring mouse click - recent touch tap detected');
      return;
    }
    
    await this.onClick(false);
  }

  private async onClick(fromTouch: boolean = false): Promise<void> {
    const mousePos = this.interactionManager.getMousePosition();
    const objects = this.sceneManager.getObjects();
    
    if (fromTouch) {
      console.log('🎯 Processing click from touch tap');
    }
    
    // Check for interactions with scene objects
    const hit = this.interactionManager.raycastInteractive(mousePos) || 
                this.interactionManager.raycastSpecific([objects.lampMesh].filter(Boolean) as any[]);
    
    if (!hit) {
      if (!this.cameraManager.isFreeCam()) {
        // Only play sound if we're actually changing from a focused state
        if (this.cameraManager.getCurrentTarget() !== 'default') {
          this.soundManager.playSound('swoosh-out'); // Play sound when returning to default view
        }
        this.cameraManager.focusDefault();
        this.hideAllMarkers();
        this.uiManager.showTopLeftInfo(); // Show top-left-info when returning to default view
      }
      return;
    }
    
    if (this.cameraManager.isFreeCam()) return;
    
    await this.handleObjectInteraction(hit, objects);
  }

  private async handleObjectInteraction(hit: any, objects: SceneObjects): Promise<void> {
    // Monitor/Screen interaction
    if ((objects.monitorMesh && this.interactionManager.isDescendantOf(hit, objects.monitorMesh)) || 
        (objects.screenMesh && this.interactionManager.isDescendantOf(hit, objects.screenMesh))) {
      this.soundManager.playSound('swoosh-in'); // Play sound when focusing on object
      this.uiManager.hideTopLeftInfo(); // Hide top-left-info when selecting an object
      this.openMonitor();
    }
    // Paper interaction
    else if (objects.paperMesh && this.interactionManager.isDescendantOf(hit, objects.paperMesh)) {
      this.soundManager.playSound('swoosh-in'); // Play sound when focusing on object
      this.uiManager.hideTopLeftInfo(); // Hide top-left-info when selecting an object
      if (this.cameraManager.getCurrentTarget() === 'paper') {
        await this.uiManager.openPDF(portfolioConfig.getCVPath());
      } else {
        this.cameraManager.focusTarget('paper');
      }
    }
    // Lamp interaction
    else if (objects.lampMesh && this.interactionManager.isDescendantOf(hit, objects.lampMesh)) {
      // Don't hide top-left-info for lamp toggle as it's not a focus change
      this.toggleLamp();
    }
    // Contact interaction (Phone)
    else if (objects.phoneMesh && this.interactionManager.isDescendantOf(hit, objects.phoneMesh)) {
      this.soundManager.playSound('swoosh-in'); // Play sound when focusing on object
      this.uiManager.hideTopLeftInfo(); // Hide top-left-info when selecting an object
      this.handleContactInteraction(objects.phoneMesh);
    }
    // Hobby interactions
    else if (objects.plantMesh && this.interactionManager.isDescendantOf(hit, objects.plantMesh)) {
      this.soundManager.playSound('swoosh-in'); // Play sound when focusing on object
      this.uiManager.hideTopLeftInfo(); // Hide top-left-info when selecting an object
      this.handleHobbyInteraction('plant', objects.plantMesh);
    }
    else if (objects.cameraMesh && this.interactionManager.isDescendantOf(hit, objects.cameraMesh)) {
      this.soundManager.playSound('swoosh-in'); // Play sound when focusing on object
      this.uiManager.hideTopLeftInfo(); // Hide top-left-info when selecting an object
      this.handleHobbyInteraction('camera', objects.cameraMesh);
    }
    else if (objects.shoesMesh && this.interactionManager.isDescendantOf(hit, objects.shoesMesh)) {
      this.soundManager.playSound('swoosh-in'); // Play sound when focusing on object
      this.uiManager.hideTopLeftInfo(); // Hide top-left-info when selecting an object
      this.handleHobbyInteraction('shoes', objects.shoesMesh);
    }
    // Keyboard interaction
    else if (objects.keyboardMesh && this.interactionManager.isDescendantOf(hit, objects.keyboardMesh)) {
      this.soundManager.playSound('keyboard'); // Play keyboard sound
      // Keyboard doesn't change camera - just plays sound and blinks
      // No need to hide top-left-info since camera stays in default position
    }
  }

  private handleContactInteraction(phoneMesh: any): void {
    if (this.markerSystem.isContactVisible()) {
      this.soundManager.playSound('swoosh-out'); // Play sound when returning to default view
      this.markerSystem.hideContactMarker();
      this.cameraManager.focusDefault();
      this.uiManager.showTopLeftInfo(); // Show top-left-info when returning to default view
    } else {
      this.hideAllMarkers();
      this.markerSystem.showContactMarker(phoneMesh);
      this.cameraManager.focusTarget('phone');
    }
  }

  private handleHobbyInteraction(hobbyType: 'plant' | 'camera' | 'shoes', targetMesh: any): void {
    if (this.markerSystem.isHobbyVisible() && this.markerSystem.getCurrentHobby() === hobbyType) {
      this.soundManager.playSound('swoosh-out'); // Play sound when returning to default view
      this.markerSystem.hideHobbyInfo();
      this.cameraManager.focusDefault();
      this.uiManager.showTopLeftInfo(); // Show top-left-info when returning to default view
    } else {
      this.hideAllMarkers();
      this.markerSystem.showHobbyInfo(hobbyType, targetMesh);
      this.cameraManager.focusTarget(hobbyType);
    }
  }

  private onCss3dClick(e: MouseEvent): void {
    // Handle clicks on CSS3D elements when mini-site is active
    e.stopPropagation();
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    switch (e.key) {
      case 'Escape':
        this.closeOverlays();
        break;
      case 'f':
      case 'F':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.toggleFreeCam();
        }
        break;
      case '1':
        if (this.cameraManager.getCurrentTarget() !== 'default') {
          this.soundManager.playSound('swoosh-out'); // Play sound when returning to default view
        }
        this.cameraManager.focusDefault();
        this.hideAllMarkers();
        break;
      case '2':
        this.soundManager.playSound('swoosh-in'); // Play sound when focusing on object
        this.openMonitor();
        break;
      case '3':
        this.soundManager.playSound('swoosh-in'); // Play sound when focusing on object
        this.cameraManager.focusTarget('paper');
        break;
      case 'b':
      case 'B':
        // Test key to trigger blinking animation
        this.soundManager.playSound('keyboard'); // Play keyboard sound for blink
        console.log('🔵 Manual blink test triggered');
        this.interactionManager.blinkInteractiveObjects();
        break;
    }
  };

  private onTouchStart = (e: TouchEvent): void => {
    // Handle touch start for potential gestures
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      
      // Store touch start data for tap detection
      this.touchStartPos = { x: touch.clientX, y: touch.clientY };
      this.touchStartTime = Date.now();
      this.touchMoved = false;
      
      // Update mouse position for raycasting
      this.interactionManager.updateMouse(touch.clientX, touch.clientY);
    } else {
      // Multi-touch - reset tap detection
      this.touchStartPos = null;
    }
  };

  private onTouchMove = (e: TouchEvent): void => {
    if (this.touchStartPos && e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - this.touchStartPos.x);
      const deltaY = Math.abs(touch.clientY - this.touchStartPos.y);
      
      // If moved more than 10 pixels, it's not a tap
      if (deltaX > 10 || deltaY > 10) {
        this.touchMoved = true;
      }
    }
    
    // Allow normal touch move behavior for OrbitControls
    // Don't prevent default here as it would break scrolling/zooming
  };

  private onTouchEnd = async (e: TouchEvent): Promise<void> => {
    // Handle touch end - detect proper single taps
    if (e.changedTouches.length === 1 && e.touches.length === 0 && this.touchStartPos) {
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - this.touchStartTime;
      
      // Valid tap: short duration (< 500ms) and minimal movement
      if (!this.touchMoved && touchDuration < 500) {
        // Update final mouse position from the touch that just ended
        const touch = e.changedTouches[0];
        this.interactionManager.updateMouse(touch.clientX, touch.clientY);
        
        // Prevent the delayed click event that browsers send after touchend
        e.preventDefault();
        
        // Trigger click immediately and mark the time to prevent duplicate mouse clicks
        this.lastTouchClickTime = Date.now();
        console.log('🎯 Touch tap detected, triggering click');
        await this.onClick(true);
      }
      
      // Reset touch tracking
      this.touchStartPos = null;
      this.touchMoved = false;
    }
  };

  private onOrientationAdjust = (): void => {
    // Recalculate camera position for new screen orientation
    console.log('🔄 Adjusting camera for orientation change');
    this.cameraManager.recalculateForScreenSize();
  };

  private openMonitor(): void {
    console.log(`🖥️ Opening monitor/screen interaction`);
    this.hideAllMarkers();
    this.cameraManager.focusTarget('monitor');
    this.uiManager.openMiniSite();
  }

  private toggleLamp(): void {
    const objects = this.sceneManager.getObjects();
    
    // Play switch sound
    this.soundManager.playSound('switch');
    
    // First check if we have a lamp light from the model (matching original logic)
    if (objects.lampLight) {
      const isOn = objects.lampLight.intensity > 0;
      
      // Store original intensity for restoration (before modifying it)
      if (!objects.lampLight.userData.originalIntensity) {
        objects.lampLight.userData.originalIntensity = objects.lampLight.intensity;
      }
      
      objects.lampLight.intensity = isOn ? 0 : objects.lampLight.userData.originalIntensity || 1.0;
    }
    
    // Toggle the Spot node visibility and emissive if it exists (matching original logic)
    if (objects.spotMesh) {
      const isOn = objects.spotMesh.visible;
      objects.spotMesh.visible = !isOn;
      // Also toggle emissive on the Spot node for glow effect
      this.interactionManager.setEmissive(objects.spotMesh, isOn ? 0.0 : 1.2);
    }
    
    // If neither exists, log a warning
    if (!objects.lampLight && !objects.spotMesh) {
      console.warn('No lamp light or spot mesh found to toggle');
    }
  }

  private toggleFreeCam(): void {
    const isFreeCam = !this.cameraManager.isFreeCam();
    this.cameraManager.setFreeCam(isFreeCam);
    console.log(`Free camera: ${isFreeCam ? 'enabled' : 'disabled'}`);
  }

  private hideAllMarkers(): void {
    this.markerSystem.hideContactMarker();
    this.markerSystem.hideHobbyInfo();
  }

  private animate = (time: number): void => {
    requestAnimationFrame(this.animate);
    
    // Update camera and controls
    this.cameraManager.update();
    
    // Apply camera constraints if needed
    const objects = this.sceneManager.getObjects();
    if (objects.planeMesh) {
      this.cameraManager.applyCameraConstraints(objects.planeMesh);
    }
    
    // Update marker label positions
    this.markerSystem.updateAllLabelPositions();
    
    // Render the scene
    this.rendererManager.render(this.scene, this.camera);
  };

  // Public API methods
  closeOverlays(): void {
    this.uiManager.closeAllOverlays();
    this.hideAllMarkers();
    this.cameraManager.focusDefault();
    this.uiManager.showTopLeftInfo(); // Show top-left-info when closing overlays
  }

  focusDefault(): void {
    this.cameraManager.focusDefault();
    this.hideAllMarkers();
    this.uiManager.showTopLeftInfo(); // Show top-left-info when focusing default view
  }

  async navigateToSection(section: string): Promise<void> {
    await this.uiManager.navigateToSection(section);
  }

  toggleCameraMode(): void {
    this.toggleFreeCam();
  }

  // Cleanup method
  dispose(): void {
    // Remove event listeners
    window.removeEventListener('resize', this.boundHandlers.onResize);
    this.rendererManager.getDomElement().removeEventListener('pointermove', this.boundHandlers.onPointerMove);
    this.rendererManager.getDomElement().removeEventListener('click', this.boundHandlers.onClick);
    this.config.css3dRoot.removeEventListener('click', this.boundHandlers.onCss3dClick);
    window.removeEventListener('keydown', this.boundHandlers.onKeyDown);
    
    // Remove touch event listeners
    this.rendererManager.getDomElement().removeEventListener('touchstart', this.boundHandlers.onTouchStart);
    this.rendererManager.getDomElement().removeEventListener('touchmove', this.boundHandlers.onTouchMove);
    this.rendererManager.getDomElement().removeEventListener('touchend', this.boundHandlers.onTouchEnd);
    
    // Remove orientation change listener
    window.removeEventListener('orientation-camera-adjust', this.boundHandlers.onOrientationAdjust);
    
    // Dispose of systems
    this.assetLoader.dispose();
    this.soundManager.dispose();
    this.bootLoader.destroy();
    this.hideAllMarkers();
    
    console.log('🧹 App disposed');
  }
}
