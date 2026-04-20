import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';
import TopHeader from './header';
import './layout.css';

const MainLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState('Trang chủ'); // Thêm state này

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
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          onClose={() => setMobileMenuOpen(false)}
          onPageChange={setPageTitle} // Thêm prop này
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
          onPageChange={setPageTitle} // Thêm prop này
        />
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Header */}
        <TopHeader 
          onMenuToggle={toggleMobileMenu}
          onSidebarToggle={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
          pageTitle={pageTitle} // Truyền title xuống header
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