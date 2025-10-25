import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import Window from './Window';
import SnapGhost from './SnapGhost';
import QuoteDisplay from './QuoteDisplay';
import { WindowState } from '../../types';

const WindowManager: React.FC = () => {
  const { windows, activeWindowId, setActiveWindow, bringToFront, snapPreview } = useAppStore();

  const handleWindowClick = (windowId: string) => {
    if (activeWindowId !== windowId) {
      setActiveWindow(windowId);
    }
    bringToFront(windowId);
  };

  const sortedWindows = [...windows].sort((a, b) => a.zIndex - b.zIndex);
  const hasOpenWindows = sortedWindows.some(window => !window.isMinimized);

  return (
    <div className="relative w-full h-full overflow-hidden bg-white dark:bg-gray-900">
      {hasOpenWindows ? (
        <>
          {sortedWindows.map((window) => (
            <Window
              key={window.id}
              window={window}
              isActive={activeWindowId === window.id}
              onClick={() => handleWindowClick(window.id)}
            />
          ))}
          <SnapGhost preview={snapPreview} />
        </>
      ) : (
        <QuoteDisplay />
      )}
    </div>
  );
};

export default WindowManager;
