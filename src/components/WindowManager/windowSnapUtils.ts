import { SnapZone } from '../../types';

export interface SnapDetectionResult {
  zone: SnapZone | null;
  distance: number;
}

export interface WindowConstraints {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
}

/**
 * Detects if a window position is within snap zones
 */
export const detectSnapZone = (
  position: { x: number; y: number },
  size: { width: number; height: number },
  threshold: number = 50
): SnapDetectionResult => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Check for corner snaps first (more specific)
  const cornerThreshold = threshold * 0.8; // Slightly smaller threshold for corners
  
  // Top-left corner
  if (position.x <= cornerThreshold && position.y <= cornerThreshold) {
    return { zone: 'top-left-quarter', distance: Math.sqrt(position.x ** 2 + position.y ** 2) };
  }
  
  // Top-right corner
  if (position.x >= viewportWidth - size.width - cornerThreshold && position.y <= cornerThreshold) {
    return { zone: 'top-right-quarter', distance: Math.sqrt((viewportWidth - position.x - size.width) ** 2 + position.y ** 2) };
  }
  
  // Bottom-left corner
  if (position.x <= cornerThreshold && position.y >= viewportHeight - size.height - cornerThreshold) {
    return { zone: 'bottom-left-quarter', distance: Math.sqrt(position.x ** 2 + (viewportHeight - position.y - size.height) ** 2) };
  }
  
  // Bottom-right corner
  if (position.x >= viewportWidth - size.width - cornerThreshold && position.y >= viewportHeight - size.height - cornerThreshold) {
    return { zone: 'bottom-right-quarter', distance: Math.sqrt((viewportWidth - position.x - size.width) ** 2 + (viewportHeight - position.y - size.height) ** 2) };
  }
  
  // Check for edge snaps
  // Left edge
  if (position.x <= threshold) {
    return { zone: 'left-half', distance: position.x };
  }
  
  // Right edge
  if (position.x >= viewportWidth - size.width - threshold) {
    return { zone: 'right-half', distance: viewportWidth - position.x - size.width };
  }
  
  // Top edge
  if (position.y <= threshold) {
    return { zone: 'top-half', distance: position.y };
  }
  
  // Bottom edge
  if (position.y >= viewportHeight - size.height - threshold) {
    return { zone: 'bottom-half', distance: viewportHeight - position.y - size.height };
  }
  
  return { zone: null, distance: Infinity };
};

/**
 * Applies window constraints to prevent windows from extending beyond viewport
 */
export const applyWindowConstraints = (
  position: { x: number; y: number },
  size: { width: number; height: number },
  constraints: WindowConstraints
): { position: { x: number; y: number }; size: { width: number; height: number } } => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let newPosition = { ...position };
  let newSize = { ...size };
  
  // Apply size constraints
  newSize.width = Math.max(constraints.minWidth, Math.min(constraints.maxWidth, newSize.width));
  newSize.height = Math.max(constraints.minHeight, Math.min(constraints.maxHeight, newSize.height));
  
  // Ensure window doesn't extend beyond viewport
  newPosition.x = Math.max(0, Math.min(viewportWidth - newSize.width, newPosition.x));
  newPosition.y = Math.max(0, Math.min(viewportHeight - newSize.height, newPosition.y));
  
  // If window is too large for viewport, adjust size
  if (newSize.width > viewportWidth) {
    newSize.width = viewportWidth;
    newPosition.x = 0;
  }
  
  if (newSize.height > viewportHeight) {
    newSize.height = viewportHeight;
    newPosition.y = 0;
  }
  
  return { position: newPosition, size: newSize };
};

/**
 * Calculates snap preview dimensions and position for a given zone
 */
export const calculateSnapPreview = (zone: SnapZone): {
  position: { x: number; y: number };
  size: { width: number; height: number };
} => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  switch (zone) {
    case 'left-half':
      return {
        position: { x: 0, y: 0 },
        size: { width: viewportWidth / 2, height: viewportHeight }
      };
    case 'right-half':
      return {
        position: { x: viewportWidth / 2, y: 0 },
        size: { width: viewportWidth / 2, height: viewportHeight }
      };
    case 'top-half':
      return {
        position: { x: 0, y: 0 },
        size: { width: viewportWidth, height: viewportHeight / 2 }
      };
    case 'bottom-half':
      return {
        position: { x: 0, y: viewportHeight / 2 },
        size: { width: viewportWidth, height: viewportHeight / 2 }
      };
    case 'top-left-quarter':
      return {
        position: { x: 0, y: 0 },
        size: { width: viewportWidth / 2, height: viewportHeight / 2 }
      };
    case 'top-right-quarter':
      return {
        position: { x: viewportWidth / 2, y: 0 },
        size: { width: viewportWidth / 2, height: viewportHeight / 2 }
      };
    case 'bottom-left-quarter':
      return {
        position: { x: 0, y: viewportHeight / 2 },
        size: { width: viewportWidth / 2, height: viewportHeight / 2 }
      };
    case 'bottom-right-quarter':
      return {
        position: { x: viewportWidth / 2, y: viewportHeight / 2 },
        size: { width: viewportWidth / 2, height: viewportHeight / 2 }
      };
    case 'full-screen':
      return {
        position: { x: 0, y: 0 },
        size: { width: viewportWidth, height: viewportHeight }
      };
    default:
      return {
        position: { x: 0, y: 0 },
        size: { width: viewportWidth, height: viewportHeight }
      };
  }
};

/**
 * Default window constraints
 */
export const DEFAULT_WINDOW_CONSTRAINTS: WindowConstraints = {
  minWidth: 300,
  minHeight: 200,
  maxWidth: window.innerWidth,
  maxHeight: window.innerHeight,
};
