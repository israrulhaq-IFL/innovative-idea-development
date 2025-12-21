import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Settings from '../pages/Settings';

// Mock the SharePoint context
const mockUpdateSettings = vi.fn();
const mockSettings = {
  autoRefresh: true,
  refreshInterval: 300,
  notifications: true
};

vi.mock('../context/SharePointContext', () => ({
  useSharePoint: () => ({
    user: { Title: 'Test User' },
    permissions: { userCategory: 'normal' },
    settings: mockSettings,
    updateSettings: mockUpdateSettings
  })
}));

// Mock the Theme context
vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn(),
    setThemeMode: vi.fn()
  })
}));

describe('Settings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render settings page', () => {
    render(<Settings />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Configure your dashboard preferences and system settings.')).toBeInTheDocument();
  });

  it('should show auto-refresh toggle', () => {
    render(<Settings />);

    const autoRefreshLabel = screen.getByText('Auto Refresh');
    expect(autoRefreshLabel).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', { name: /auto refresh/i });
    expect(checkbox).toBeChecked();
  });

  it('should show refresh interval input', () => {
    render(<Settings />);

    const intervalLabel = screen.getByText('Refresh Interval (seconds)');
    expect(intervalLabel).toBeInTheDocument();

    const input = screen.getByRole('spinbutton', { name: /refresh interval/i });
    expect(input).toHaveValue(300);
  });

  it('should show confirmation when disabling auto-refresh', () => {
    // Mock window.confirm to return false (user cancels)
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<Settings />);

    const checkbox = screen.getByRole('checkbox', { name: /auto refresh/i });
    expect(checkbox).toBeChecked();

    // Try to uncheck the auto-refresh
    fireEvent.click(checkbox);

    // Checkbox should still be checked because user cancelled
    expect(checkbox).toBeChecked();

    // Confirm should have been called with warning message
    expect(confirmMock).toHaveBeenCalledWith(
      expect.stringContaining('WARNING: Disabling auto-refresh')
    );

    confirmMock.mockRestore();
  });

  it('should disable auto-refresh when user confirms', () => {
    // Mock window.confirm to return true (user confirms)
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<Settings />);

    const checkbox = screen.getByRole('checkbox', { name: /auto refresh/i });
    expect(checkbox).toBeChecked();

    // Uncheck the auto-refresh
    fireEvent.click(checkbox);

    // updateSettings should have been called with autoRefresh: false
    expect(mockUpdateSettings).toHaveBeenCalledWith({ autoRefresh: false });

    confirmMock.mockRestore();
  });

  it('should validate refresh interval range', () => {
    // Mock window.alert
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<Settings />);

    const input = screen.getByRole('spinbutton', { name: /refresh interval/i });

    // Try to set value below minimum
    fireEvent.change(input, { target: { value: '30' } });

    // Alert should have been called
    expect(alertMock).toHaveBeenCalledWith(
      'Refresh interval must be between 60 and 3600 seconds (1-60 minutes)'
    );

    // updateSettings should not have been called
    expect(mockUpdateSettings).not.toHaveBeenCalled();

    alertMock.mockRestore();
  });

  it('should accept valid refresh interval', () => {
    render(<Settings />);

    const input = screen.getByRole('spinbutton', { name: /refresh interval/i });

    // Set valid value
    fireEvent.change(input, { target: { value: '600' } });

    // updateSettings should have been called with the new value
    expect(mockUpdateSettings).toHaveBeenCalledWith({ refreshInterval: 600 });
  });

  it('should show reset button', () => {
    render(<Settings />);

    const resetButton = screen.getByText('Reset to Defaults');
    expect(resetButton).toBeInTheDocument();
  });

  it('should reset settings to defaults', () => {
    // Mock window.alert
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<Settings />);

    const resetButton = screen.getByText('Reset to Defaults');
    fireEvent.click(resetButton);

    // updateSettings should have been called with default values
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      autoRefresh: true,
      refreshInterval: 300,
      notifications: true
    });

    // Alert should have been shown
    expect(alertMock).toHaveBeenCalledWith('Settings reset to defaults!');

    alertMock.mockRestore();
  });
});