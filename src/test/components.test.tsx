import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useAppStore } from '../store/useAppStore';
import Sidebar from '../components/Sidebar/Sidebar';

// Mock the store
vi.mock('../store/useAppStore', () => ({
  useAppStore: vi.fn(),
}));

describe('Sidebar Component', () => {
  const mockOpenWindow = vi.fn();
  const mockSetSidebarOpen = vi.fn();
  const mockToggleTheme = vi.fn();

  beforeEach(() => {
    vi.mocked(useAppStore).mockReturnValue({
      sidebarOpen: true,
      setSidebarOpen: mockSetSidebarOpen,
      openWindow: mockOpenWindow,
      theme: 'light',
      toggleTheme: mockToggleTheme,
    } as any);
  });

  it('renders sidebar with menu items', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('Storyboard')).toBeInTheDocument();
    expect(screen.getByText('Document Editor')).toBeInTheDocument();
    expect(screen.getByText('Storyboard View')).toBeInTheDocument();
    expect(screen.getByText('Database View')).toBeInTheDocument();
  });

  it('opens window when menu item is clicked', () => {
    render(<Sidebar />);
    
    const documentButton = screen.getByText('Document Editor');
    fireEvent.click(documentButton);
    
    expect(mockOpenWindow).toHaveBeenCalledWith('document');
  });

  it('toggles theme when theme button is clicked', () => {
    render(<Sidebar />);
    
    const themeButton = screen.getByText('Dark Mode');
    fireEvent.click(themeButton);
    
    expect(mockToggleTheme).toHaveBeenCalled();
  });
});
