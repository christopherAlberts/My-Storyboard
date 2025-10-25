import React from 'react';
import { SnapPreview } from '../../types';

interface SnapGhostProps {
  preview: SnapPreview;
}

const SnapGhost: React.FC<SnapGhostProps> = ({ preview }) => {
  if (!preview.visible) return null;

  const getZoneLabel = (zone: string) => {
    switch (zone) {
      case 'left-half':
        return 'Left Half';
      case 'right-half':
        return 'Right Half';
      case 'top-half':
        return 'Top Half';
      case 'bottom-half':
        return 'Bottom Half';
      case 'top-left-quarter':
        return 'Top Left Quarter';
      case 'top-right-quarter':
        return 'Top Right Quarter';
      case 'bottom-left-quarter':
        return 'Bottom Left Quarter';
      case 'bottom-right-quarter':
        return 'Bottom Right Quarter';
      case 'full-screen':
        return 'Full Screen';
      default:
        return '';
    }
  };

  return (
    <div
      className="fixed pointer-events-none z-50 transition-all duration-200 ease-out"
      style={{
        left: preview.position.x,
        top: preview.position.y,
        width: preview.size.width,
        height: preview.size.height,
        backgroundColor: 'rgba(59, 130, 246, 0.2)', // Blue with 20% opacity
        border: '2px dashed rgba(59, 130, 246, 0.8)', // Blue dashed border
        borderRadius: '8px',
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
      }}
    >
      {/* Zone label */}
      <div
        className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium"
        style={{
          backgroundColor: 'rgba(59, 130, 246, 0.9)',
        }}
      >
        {getZoneLabel(preview.zone)}
      </div>
      
      {/* Corner indicators for quarter zones */}
      {(preview.zone.includes('quarter') || preview.zone === 'full-screen') && (
        <>
          {/* Top-left corner indicator */}
          <div
            className="absolute top-0 left-0 w-3 h-3"
            style={{
              borderTop: '3px solid rgba(59, 130, 246, 0.8)',
              borderLeft: '3px solid rgba(59, 130, 246, 0.8)',
            }}
          />
          {/* Top-right corner indicator */}
          <div
            className="absolute top-0 right-0 w-3 h-3"
            style={{
              borderTop: '3px solid rgba(59, 130, 246, 0.8)',
              borderRight: '3px solid rgba(59, 130, 246, 0.8)',
            }}
          />
          {/* Bottom-left corner indicator */}
          <div
            className="absolute bottom-0 left-0 w-3 h-3"
            style={{
              borderBottom: '3px solid rgba(59, 130, 246, 0.8)',
              borderLeft: '3px solid rgba(59, 130, 246, 0.8)',
            }}
          />
          {/* Bottom-right corner indicator */}
          <div
            className="absolute bottom-0 right-0 w-3 h-3"
            style={{
              borderBottom: '3px solid rgba(59, 130, 246, 0.8)',
              borderRight: '3px solid rgba(59, 130, 246, 0.8)',
            }}
          />
        </>
      )}
      
      {/* Edge indicators for half zones */}
      {(preview.zone.includes('half') && !preview.zone.includes('quarter')) && (
        <>
          {/* Left edge indicator */}
          <div
            className="absolute top-1/2 left-0 w-1 h-8 -translate-y-1/2"
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
            }}
          />
          {/* Right edge indicator */}
          <div
            className="absolute top-1/2 right-0 w-1 h-8 -translate-y-1/2"
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
            }}
          />
          {/* Top edge indicator */}
          <div
            className="absolute top-0 left-1/2 w-8 h-1 -translate-x-1/2"
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
            }}
          />
          {/* Bottom edge indicator */}
          <div
            className="absolute bottom-0 left-1/2 w-8 h-1 -translate-x-1/2"
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
            }}
          />
        </>
      )}
    </div>
  );
};

export default SnapGhost;
