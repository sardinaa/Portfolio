import { portfolioConfig } from '../config';

// Default camera targets configuration (will be dynamically calculated based on scene objects)
export const DEFAULT_CAMERA_TARGETS = {
  default: { pos: { x: -2.6, y: 1.8, z: 3.4 }, look: { x: 0.0, y: 1.0, z: 0.0 } },
  monitor: { pos: { x: 1.2, y: 1.4, z: 1.5 }, look: { x: 0.0, y: 1.1, z: 0.0 } },
  paper: { pos: { x: 0.3, y: 2.0, z: 0.2 }, look: { x: 0.3, y: 0.9, z: 0.2 } },
  phone: { pos: { x: 0, y: 0, z: 0 }, look: { x: 0, y: 0, z: 0 } },
  plant: { pos: { x: 0, y: 0, z: 0 }, look: { x: 0, y: 0, z: 0 } },
  camera: { pos: { x: 0, y: 0, z: 0 }, look: { x: 0, y: 0, z: 0 } },
  shoes: { pos: { x: 0, y: 0, z: 0 }, look: { x: 0, y: 0, z: 0 } },
} as const;

// Contact information - loaded from JSON config
export const CONTACT_INFO = portfolioConfig.getContact();

// Hobby information - loaded from JSON config
export const HOBBIES = portfolioConfig.getHobbies();

// Scene object names
export const SCENE_OBJECTS = {
  MONITOR: 'Monitor',
  PAPER: 'Paper',
  LAMP: 'Lamp',
  SCREEN: 'Screen',
  SPOT: 'Spot',
  PLANE: 'Plane',
  PHONE: 'Phone',
  PLANT: 'Plant',
  CAMERA: 'Camera',
  SHOES: 'Shoes'
} as const;

// Renderer configuration
export const RENDERER_CONFIG = {
  PIXEL_RATIO_MAX: 2,
  SHADOW_MAP_SIZE: 2048,
  CAMERA_FOV: 60,
  CAMERA_NEAR: 0.1,
  CAMERA_FAR: 100,
  CAMERA_CONSTRAINTS: {
    MIN_DISTANCE: 1.0,
    MAX_DISTANCE: 8.0,
  }
};

// Animation configuration
export const ANIMATION_CONFIG = {
  CAMERA_LERP_SPEED: 0.08,
  DAMPING_FACTOR: 0.05,
  TARGET_LERP_SPEED: 0.02,
  EMISSIVE_COLOR: 0x55aaff,
  BLINK_DURATION: 4000, // Duration for all 5 blinks in milliseconds (8 seconds total)
  BLINK_COUNT: 3,
  BLINK_INTENSITY: 1.0, // Glow intensity for the blinking
};
