import { App } from './core/AppRefactored.ts';

const appRoot = document.getElementById('app') as HTMLDivElement;

// Initialize the app with the modular UI
const app = new App(appRoot, null);
app.start();

// Accessibility shortcuts
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    app.closeOverlays();
  }
});

// Mobile-specific optimizations
function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Prevent default touch behaviors that might interfere with the 3D experience
if (isTouchDevice()) {
  // Prevent pull-to-refresh
  document.body.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });
  
  document.body.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - (window as any).lastTouchEnd <= 300) {
      e.preventDefault();
    }
    (window as any).lastTouchEnd = now;
  }, false);
  
  // Prevent zoom on double tap
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
  
  // Handle orientation changes
  window.addEventListener('orientationchange', () => {
    // Small delay to ensure the viewport has updated
    setTimeout(() => {
      // Trigger resize event to update the renderer
      window.dispatchEvent(new Event('resize'));
      // Additional delay for camera adjustment after resize
      setTimeout(() => {
        // Trigger custom event for camera recalculation
        window.dispatchEvent(new CustomEvent('orientation-camera-adjust'));
      }, 200);
    }, 100);
  });
  
  // Improve touch scrolling performance
  document.addEventListener('touchmove', (e) => {
    const target = e.target as Element;
    // Allow scrolling within mini-site but prevent on canvas
    if (target?.closest('canvas') && !target?.closest('.mini-site')) {
      e.preventDefault();
    }
  }, { passive: false });
}

// Add viewport height handling for mobile browsers
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

setViewportHeight();
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', () => {
  setTimeout(setViewportHeight, 100);
});
