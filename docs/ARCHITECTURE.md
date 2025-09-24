# 🎯 Portfolio 3D - Modular Architecture

## 📁 Project Structure

```
src/
├── 🎮 core/                    # Core application logic
│   ├── AppRefactored.ts        # Main application class
│   ├── managers/               # System managers
│   │   ├── CameraManager.ts    # Camera and controls management
│   │   ├── RendererManager.ts  # WebGL and CSS3D rendering
│   │   └── UIManager.ts        # UI components coordination
│   └── scene/                  # Scene-related functionality
│       └── SceneManager.ts     # Scene setup and object management
├── 🖱️ interactions/             # User interaction systems
│   └── InteractionManager.ts   # Mouse/pointer interaction handling
├── 🔧 systems/                 # Utility systems
│   ├── AssetLoader.ts          # 3D model and texture loading
│   └── MarkerSystem.ts         # Contact/hobby info markers
├── 🎨 ui/                      # UI components
│   ├── miniSite.ts             # Terminal-style portfolio interface
│   └── pdfViewer.ts            # PDF viewer component
├── 📐 types/                   # TypeScript interfaces
│   └── index.ts                # Shared type definitions
├── 📊 constants/               # Configuration constants
│   └── index.ts                # App-wide constants
└── 🎪 main.ts                  # Application entry point
```

## 🏗️ Architecture Overview

### 🎯 Design Principles

1. **Single Responsibility** - Each class has one clear purpose
2. **Separation of Concerns** - UI, rendering, interactions are separate
3. **Dependency Injection** - Systems receive their dependencies
4. **Event-Driven** - Loose coupling through callbacks and events
5. **Modular** - Easy to test, extend, and maintain

### 🧩 Core Systems

#### 📱 **AppRefactored** (Main Orchestrator)
- Coordinates all subsystems
- Handles the main application lifecycle
- Manages system interactions and data flow

#### 📷 **CameraManager**
- Camera positioning and animation
- Orbit controls management
- Target-based camera movements
- View transitions and constraints

#### 🖼️ **RendererManager**
- WebGL renderer setup and configuration
- CSS3D renderer for UI overlays
- Shadow mapping and tone mapping
- Render loop coordination

#### 🏗️ **SceneManager**
- Scene setup and environment
- 3D model integration
- Object extraction and naming
- Lighting and shadow configuration

#### 🖱️ **InteractionManager**
- Raycasting for object selection
- Mouse/pointer event handling
- Object hover effects
- Interaction state management

#### 🎨 **UIManager**
- MiniSite (terminal interface) coordination
- PDF viewer management
- CSS3D object positioning
- UI state synchronization

#### 📦 **AssetLoader**
- GLTF model loading
- HDR environment loading
- Texture and material management
- Loading progress and error handling

#### 🎯 **MarkerSystem**
- Contact information pins
- Hobby information displays
- 3D marker positioning
- HTML label management

## 🚀 Benefits of the New Architecture

### ✅ **Maintainability**
- Clear separation of concerns
- Each system can be modified independently
- Easy to locate and fix bugs
- Consistent code organization

### ✅ **Testability**
- Systems can be unit tested in isolation
- Mock dependencies for testing
- Clear interfaces and contracts
- Reduced coupling between components

### ✅ **Extensibility**
- Add new features without touching existing code
- Plugin-style architecture for new systems
- Easy to swap implementations
- Future-proof design patterns

### ✅ **Performance**
- Optimized render loops
- Efficient event handling
- Proper resource management
- Minimal memory leaks

### ✅ **Developer Experience**
- IntelliSense support with proper types
- Clear API boundaries
- Self-documenting code structure
- Easier onboarding for new developers

## 🔄 Migration from Monolith

### Before (1,200+ lines in one file)
```typescript
class App {
  // Everything mixed together:
  // - Rendering logic
  // - Camera management
  // - UI handling
  // - Interactions
  // - Asset loading
  // - Scene setup
  // - Event handling
}
```

### After (Modular architecture)
```typescript
class App {
  constructor() {
    this.cameraManager = new CameraManager();
    this.rendererManager = new RendererManager();
    this.sceneManager = new SceneManager();
    // ... other managers
  }
}
```

## 🛠️ Usage Examples

### Adding a New Interactive Object
```typescript
// 1. Add object to SceneManager
// 2. Update InteractionManager with new object
// 3. Add interaction handler in App
// 4. No changes needed to other systems!
```

### Adding a New UI Component
```typescript
// 1. Create new UI component
// 2. Register with UIManager
// 3. Add CSS3D positioning logic
// 4. Camera and rendering systems remain unchanged!
```

### Adding New Animation
```typescript
// 1. Extend CameraManager with new target
// 2. Update constants for new camera position
// 3. All other systems work automatically!
```

## 🎯 Key Features Maintained

- ✅ Interactive 3D scene navigation
- ✅ Terminal-style portfolio interface
- ✅ PDF CV viewer
- ✅ Contact information markers
- ✅ Hobby information displays
- ✅ Keyboard shortcuts
- ✅ Responsive design
- ✅ Smooth camera transitions
- ✅ HDR environment support

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The refactored architecture provides a solid foundation for future enhancements while maintaining all existing functionality with improved code organization and maintainability.
