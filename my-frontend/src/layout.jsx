import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';
import TopHeader from './header';
import './layout.css';

const MainLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="main-layout">
      {/* Sidebar cho Desktop */}
      <div className={`desktop-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Sidebar 
          collapsed={sidebarCollapsed} // Truyền prop collapsed
          onToggle={toggleSidebar}    // Truyền hàm toggle
          onClose={() => setMobileMenuOpen(false)} // Thêm prop onClose
        />
      </div>

      {/* Overlay cho Mobile */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar cho Mobile */}
      <div className={`mobile-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <Sidebar 
          collapsed={false}
          onClose={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Header */}
        <TopHeader 
          onMenuToggle={toggleMobileMenu}
          onSidebarToggle={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />
        
        {/* Page Content */}
        <div className="content-wrapper">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;