// settings.jsx - Phiên bản đã sửa
import React, { useState, useEffect } from 'react';
import {
  FaPalette,
  FaFillDrip,
  FaFont,
  FaBorderAll,
  FaSave,
  FaUndo,
  FaEye,
  FaCheckCircle,
  FaMoon,
  FaSun,
  FaDesktop,
  FaMobile,
  FaTablet,
  FaShieldAlt,
  FaLock,
  FaUserSecret
} from 'react-icons/fa';
import { useTheme } from './ThemeContext';
import './settings.css';

const Settings = () => {
  const { settings: globalSettings, updateSettings, resetSettings: globalReset } = useTheme();
  const [localSettings, setLocalSettings] = useState(globalSettings);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('colors');

  // Đồng bộ localSettings khi globalSettings thay đổi
  useEffect(() => {
    setLocalSettings(globalSettings);
  }, [globalSettings]);

  // Màu sắc gợi ý
  const colorSuggestions = [
    { name: 'Xanh tím', value: '#4f46e5' },
    { name: 'Xanh lá', value: '#10b981' },
    { name: 'Cam', value: '#f59e0b' },
    { name: 'Đỏ', value: '#ef4444' },
    { name: 'Hồng', value: '#ec4899' },
    { name: 'Tím', value: '#8b5cf6' },
    { name: 'Xanh dương', value: '#3b82f6' },
    { name: 'Xanh ngọc', value: '#06b6d4' },
  ];

  const layoutStyles = [
    { id: 'modern', name: 'Hiện đại', icon: <FaDesktop /> },
    { id: 'classic', name: 'Cổ điển', icon: <FaBorderAll /> },
    { id: 'compact', name: 'Gọn nhẹ', icon: <FaMobile /> },
  ];

  const borderRadiusOptions = [
    { value: '4px', name: 'Vuông' },
    { value: '8px', name: 'Tròn nhẹ' },
    { value: '12px', name: 'Tròn vừa' },
    { value: '16px', name: 'Tròn nhiều' },
  ];

  const fontSizeOptions = [
    { value: '12px', name: 'Nhỏ' },
    { value: '14px', name: 'Trung bình' },
    { value: '16px', name: 'Lớn' },
    { value: '18px', name: 'Rất lớn' },
  ];

  const shadowOptions = [
    { value: 'none', name: 'Không' },
    { value: 'light', name: 'Nhẹ' },
    { value: 'medium', name: 'Trung bình' },
    { value: 'heavy', name: 'Đậm' },
  ];

  // Lưu cài đặt
  const saveSettings = () => {
    updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Reset về mặc định
  const resetToDefault = () => {
    globalReset();
    setLocalSettings(globalSettings);
  };

  // Xử lý thay đổi
  const handleChange = (key, value) => {
    setLocalSettings({ ...localSettings, [key]: value });
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>
          <FaPalette className="settings-icon" />
          Cài đặt giao diện
        </h1>
        <p>Tùy chỉnh giao diện theo phong cách của bạn</p>
      </div>

      <div className="settings-content">
        {/* Sidebar Tabs */}
        <div className="settings-sidebar">
          <button 
            className={`settings-tab ${activeTab === 'colors' ? 'active' : ''}`}
            onClick={() => setActiveTab('colors')}
          >
            <FaFillDrip /> Màu sắc
          </button>
          <button 
            className={`settings-tab ${activeTab === 'layout' ? 'active' : ''}`}
            onClick={() => setActiveTab('layout')}
          >
            <FaBorderAll /> Bố cục
          </button>
          <button 
            className={`settings-tab ${activeTab === 'typography' ? 'active' : ''}`}
            onClick={() => setActiveTab('typography')}
          >
            <FaFont /> Chữ viết
          </button>
          <button 
            className={`settings-tab ${activeTab === 'effects' ? 'active' : ''}`}
            onClick={() => setActiveTab('effects')}
          >
            <FaEye /> Hiệu ứng
          </button>
          <button 
            className={`settings-tab ${activeTab === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            <FaShieldAlt /> Nâng cao
          </button>
        </div>

        {/* Main Settings Panel */}
        <div className="settings-panel">
          {/* Màu sắc Tab */}
          {activeTab === 'colors' && (
            <div className="settings-section">
              <h2>Màu sắc chủ đạo</h2>
              
              <div className="color-settings-grid">
                <div className="color-setting-item">
                  <label>Màu chính</label>
                  <div className="color-picker-wrapper">
                    <input
                      type="color"
                      value={localSettings.primaryColor}
                      onChange={(e) => handleChange('primaryColor', e.target.value)}
                      className="color-picker"
                    />
                    <span className="color-value">{localSettings.primaryColor}</span>
                  </div>
                  <div className="color-suggestions">
                    {colorSuggestions.map(color => (
                      <button
                        key={color.value}
                        className="color-suggestion"
                        style={{ backgroundColor: color.value }}
                        onClick={() => handleChange('primaryColor', color.value)}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="color-setting-item">
                  <label>Màu phụ</label>
                  <input
                    type="color"
                    value={localSettings.secondaryColor}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    className="color-picker"
                  />
                </div>

                <div className="color-setting-item">
                  <label>Màu nhấn</label>
                  <input
                    type="color"
                    value={localSettings.accentColor}
                    onChange={(e) => handleChange('accentColor', e.target.value)}
                    className="color-picker"
                  />
                </div>

                <div className="color-setting-item">
                  <label>Màu nền</label>
                  <input
                    type="color"
                    value={localSettings.backgroundColor}
                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                    className="color-picker"
                  />
                </div>

                <div className="color-setting-item">
                  <label>Màu thanh bên</label>
                  <input
                    type="color"
                    value={localSettings.sidebarColor}
                    onChange={(e) => handleChange('sidebarColor', e.target.value)}
                    className="color-picker"
                  />
                </div>

                <div className="color-setting-item">
                  <label>Màu header</label>
                  <input
                    type="color"
                    value={localSettings.headerColor}
                    onChange={(e) => handleChange('headerColor', e.target.value)}
                    className="color-picker"
                  />
                </div>

                <div className="color-setting-item">
                  <label>Màu card</label>
                  <input
                    type="color"
                    value={localSettings.cardColor}
                    onChange={(e) => handleChange('cardColor', e.target.value)}
                    className="color-picker"
                  />
                </div>
              </div>

              <div className="setting-item checkbox-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={localSettings.darkMode}
                    onChange={(e) => handleChange('darkMode', e.target.checked)}
                  />
                  <span className="checkbox-custom"></span>
                  <FaMoon /> Chế độ tối
                </label>
              </div>
            </div>
          )}

          {/* Bố cục Tab */}
          {activeTab === 'layout' && (
            <div className="settings-section">
              <h2>Bố cục giao diện</h2>
              
              <div className="layout-options">
                {layoutStyles.map(style => (
                  <button
                    key={style.id}
                    className={`layout-option ${localSettings.layoutStyle === style.id ? 'active' : ''}`}
                    onClick={() => handleChange('layoutStyle', style.id)}
                  >
                    {style.icon}
                    <span>{style.name}</span>
                  </button>
                ))}
              </div>

              <div className="setting-item">
                <label>Kiểu hiển thị nội dung</label>
                <select
                  value={localSettings.contentWidth}
                  onChange={(e) => handleChange('contentWidth', e.target.value)}
                  className="setting-select"
                >
                  <option value="full">Toàn màn hình</option>
                  <option value="boxed">Đóng khung</option>
                </select>
              </div>

              <div className="setting-item checkbox-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={localSettings.sidebarCollapsed}
                    onChange={(e) => handleChange('sidebarCollapsed', e.target.checked)}
                  />
                  <span className="checkbox-custom"></span>
                  Thu gọn thanh bên mặc định
                </label>
              </div>
            </div>
          )}

          {/* Chữ viết Tab */}
          {activeTab === 'typography' && (
            <div className="settings-section">
              <h2>Chữ viết</h2>
              
              <div className="setting-item">
                <label>Font chữ</label>
                <select
                  value={localSettings.fontFamily}
                  onChange={(e) => handleChange('fontFamily', e.target.value)}
                  className="setting-select"
                >
                  <option value="Inter, system-ui, sans-serif">Inter (Mặc định)</option>
                  <option value="Roboto, system-ui, sans-serif">Roboto</option>
                  <option value="'Segoe UI', system-ui, sans-serif">Segoe UI</option>
                  <option value="'Poppins', system-ui, sans-serif">Poppins</option>
                  <option value="Arial, system-ui, sans-serif">Arial</option>
                </select>
              </div>

              <div className="setting-item">
                <label>Cỡ chữ</label>
                <div className="font-size-buttons">
                  {fontSizeOptions.map(option => (
                    <button
                      key={option.value}
                      className={`font-size-btn ${localSettings.fontSize === option.value ? 'active' : ''}`}
                      onClick={() => handleChange('fontSize', option.value)}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Hiệu ứng Tab */}
          {activeTab === 'effects' && (
            <div className="settings-section">
              <h2>Hiệu ứng giao diện</h2>
              
              <div className="setting-item">
                <label>Độ bo góc</label>
                <div className="border-radius-buttons">
                  {borderRadiusOptions.map(option => (
                    <button
                      key={option.value}
                      className={`radius-btn ${localSettings.borderRadius === option.value ? 'active' : ''}`}
                      onClick={() => handleChange('borderRadius', option.value)}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-item">
                <label>Đổ bóng</label>
                <div className="shadow-buttons">
                  {shadowOptions.map(option => (
                    <button
                      key={option.value}
                      className={`shadow-btn ${localSettings.boxShadow === option.value ? 'active' : ''}`}
                      onClick={() => handleChange('boxShadow', option.value)}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-item checkbox-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={localSettings.animationEnabled}
                    onChange={(e) => handleChange('animationEnabled', e.target.checked)}
                  />
                  <span className="checkbox-custom"></span>
                  Bật hiệu ứng chuyển động
                </label>
              </div>

              <div className="setting-item checkbox-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={localSettings.glassmorphism}
                    onChange={(e) => handleChange('glassmorphism', e.target.checked)}
                  />
                  <span className="checkbox-custom"></span>
                  Hiệu ứng kính mờ (Glassmorphism)
                </label>
              </div>
            </div>
          )}

          {/* Nâng cao Tab */}
          {activeTab === 'advanced' && (
            <div className="settings-section">
              <h2>Cài đặt nâng cao</h2>
              
              <div className="setting-item">
                <label>Responsive Breakpoint</label>
                <div className="responsive-options">
                  <button
                    className={`responsive-btn ${localSettings.responsiveBreakpoint === 'mobile' ? 'active' : ''}`}
                    onClick={() => handleChange('responsiveBreakpoint', 'mobile')}
                  >
                    <FaMobile /> Mobile
                  </button>
                  <button
                    className={`responsive-btn ${localSettings.responsiveBreakpoint === 'tablet' ? 'active' : ''}`}
                    onClick={() => handleChange('responsiveBreakpoint', 'tablet')}
                  >
                    <FaTablet /> Tablet
                  </button>
                  <button
                    className={`responsive-btn ${localSettings.responsiveBreakpoint === 'desktop' ? 'active' : ''}`}
                    onClick={() => handleChange('responsiveBreakpoint', 'desktop')}
                  >
                    <FaDesktop /> Desktop
                  </button>
                </div>
              </div>

              <div className="advanced-options">
                <div className="setting-item">
                  <label>
                    <FaLock /> Bảo mật giao diện
                  </label>
                  <p className="setting-description">
                    Lưu cài đặt giao diện vào tài khoản của bạn
                  </p>
                  <button className="secondary-btn">
                    <FaUserSecret /> Đồng bộ với tài khoản
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="settings-actions">
            <button className="reset-btn" onClick={resetToDefault}>
              <FaUndo /> Khôi phục mặc định
            </button>
            <button className="save-btn" onClick={saveSettings}>
              <FaSave /> Lưu cài đặt
            </button>
          </div>

          {saved && (
            <div className="save-notification">
              <FaCheckCircle />
              Đã lưu cài đặt thành công!
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="settings-preview">
          <h3>
            <FaEye /> Xem trước
          </h3>
          <div className="preview-card" style={{
            backgroundColor: localSettings.cardColor,
            borderRadius: localSettings.borderRadius,
            boxShadow: localSettings.boxShadow !== 'none' ? `0 4px 12px rgba(0,0,0,0.1)` : 'none'
          }}>
            <div className="preview-header" style={{ backgroundColor: localSettings.primaryColor }}>
              <span>Header mẫu</span>
            </div>
            <div className="preview-content">
              <h4 style={{ color: localSettings.darkMode ? '#fff' : '#333' }}>Tiêu đề mẫu</h4>
              <p style={{ color: localSettings.darkMode ? '#ccc' : '#666' }}>
                Đây là nội dung xem trước để bạn kiểm tra giao diện
              </p>
              <button className="preview-btn" style={{ backgroundColor: localSettings.secondaryColor }}>
                Button mẫu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;