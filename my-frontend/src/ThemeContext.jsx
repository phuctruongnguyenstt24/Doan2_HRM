// contexts/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    primaryColor: '#4f46e5',
    secondaryColor: '#10b981',
    accentColor: '#f59e0b',
    backgroundColor: '#f3f4f6',
    sidebarColor: '#1f2937',
    headerColor: '#ffffff',
    cardColor: '#ffffff',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px',
    darkMode: false,
    sidebarCollapsed: false,
    borderRadius: '8px',
    animationEnabled: true,
    layoutStyle: 'modern',
    contentWidth: 'full',
    glassmorphism: false,
    boxShadow: 'medium',
    responsiveBreakpoint: 'tablet',
  });

  // Load settings từ localStorage khi khởi động
  useEffect(() => {
    const savedSettings = localStorage.getItem('webSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      applySettingsToDOM(parsedSettings);
    }
  }, []);

  // Lắng nghe sự kiện thay đổi cài đặt
  useEffect(() => {
    const handleSettingsChange = (event) => {
      setSettings(event.detail);
      applySettingsToDOM(event.detail);
    };

    window.addEventListener('settingsChanged', handleSettingsChange);
    
    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChange);
    };
  }, []);

  // Áp dụng cài đặt lên DOM
  const applySettingsToDOM = (currentSettings) => {
    const root = document.documentElement;
    
    // Set CSS variables
    root.style.setProperty('--primary-color', currentSettings.primaryColor);
    root.style.setProperty('--secondary-color', currentSettings.secondaryColor);
    root.style.setProperty('--accent-color', currentSettings.accentColor);
    root.style.setProperty('--bg-color', currentSettings.backgroundColor);
    root.style.setProperty('--sidebar-color', currentSettings.sidebarColor);
    root.style.setProperty('--header-color', currentSettings.headerColor);
    root.style.setProperty('--card-color', currentSettings.cardColor);
    root.style.setProperty('--font-family', currentSettings.fontFamily);
    root.style.setProperty('--font-size', currentSettings.fontSize);
    root.style.setProperty('--border-radius', currentSettings.borderRadius);
    
    // Shadow
    if (currentSettings.boxShadow === 'light') {
      root.style.setProperty('--box-shadow', '0 1px 3px rgba(0,0,0,0.1)');
    } else if (currentSettings.boxShadow === 'medium') {
      root.style.setProperty('--box-shadow', '0 4px 6px -1px rgba(0,0,0,0.1)');
    } else if (currentSettings.boxShadow === 'heavy') {
      root.style.setProperty('--box-shadow', '0 10px 15px -3px rgba(0,0,0,0.1)');
    } else {
      root.style.setProperty('--box-shadow', 'none');
    }
    
    // Dark mode
    if (currentSettings.darkMode) {
      document.body.classList.add('dark-mode');
      root.style.setProperty('--text-color', '#f3f4f6');
      root.style.setProperty('--text-secondary', '#9ca3af');
    } else {
      document.body.classList.remove('dark-mode');
      root.style.setProperty('--text-color', '#1f2937');
      root.style.setProperty('--text-secondary', '#6b7280');
    }
    
    // Glassmorphism
    if (currentSettings.glassmorphism) {
      document.body.classList.add('glass-effect');
    } else {
      document.body.classList.remove('glass-effect');
    }
    
    // Animation
    if (currentSettings.animationEnabled) {
      document.body.classList.add('animations-enabled');
    } else {
      document.body.classList.remove('animations-enabled');
    }
  };

  // Hàm cập nhật cài đặt
  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    applySettingsToDOM(newSettings);
    localStorage.setItem('webSettings', JSON.stringify(newSettings));
    
    // Dispatch event để thông báo cho các component khác
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: newSettings }));
  };

  // Hàm reset về mặc định
  const resetSettings = () => {
    const defaultSettings = {
      primaryColor: '#4f46e5',
      secondaryColor: '#10b981',
      accentColor: '#f59e0b',
      backgroundColor: '#f3f4f6',
      sidebarColor: '#1f2937',
      headerColor: '#ffffff',
      cardColor: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px',
      darkMode: false,
      sidebarCollapsed: false,
      borderRadius: '8px',
      animationEnabled: true,
      layoutStyle: 'modern',
      contentWidth: 'full',
      glassmorphism: false,
      boxShadow: 'medium',
      responsiveBreakpoint: 'tablet',
    };
    updateSettings(defaultSettings);
  };

  return (
    <ThemeContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </ThemeContext.Provider>
  );
};