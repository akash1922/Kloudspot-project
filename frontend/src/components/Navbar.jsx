import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Users, Building2, BookOpen, LogOut, Archive, Shield, ChevronDown, Sun, Moon } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname.startsWith('/employees');
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
        <Link to="/" className="brand" title="Kohort EMS">
          <div className="brand-icon">
            {/*
              CUSTOM LOGO IMAGE INSTRUCTIONS:
              To replace this icon with your own company image/logo:
              1. Place your image (e.g. logo.png or logo.svg) in the "frontend/public/" folder.
              2. Uncomment the <img> tag below and comment out or remove <Users size={20} />:
                 <img src="/logo.png" alt="Kohort EMS Logo" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
            */}
            <Users size={20} />
          </div>
          <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>Kohort EMS</span>
        </Link>

        {isAuthenticated && (
          <nav className="nav-links">
            <Link to="/" className={`nav-link ${isActive('/') && !location.pathname.startsWith('/archive') ? 'active' : ''}`}>
              <Users size={16} />
              <span>Employees</span>
            </Link>
            <Link to="/departments" className={`nav-link ${isActive('/departments') ? 'active' : ''}`}>
              <Building2 size={16} />
              <span>Departments</span>
            </Link>
            <a
              href="http://localhost:8080/swagger-ui.html"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
              title="Open OpenAPI / Swagger interactive documentation"
            >
              <BookOpen size={16} />
              <span>Swagger API</span>
            </a>
          </nav>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {/* Dark / Baby Pink Light Mode Toggle Button */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'Baby Pink light' : 'dark'} mode`}
          title={`Currently ${theme === 'dark' ? 'Dark Mode' : 'Baby Pink Light Mode'}. Click to toggle.`}
        >
          {theme === 'dark' ? (
            <Sun size={16} className="theme-toggle-icon sun-icon" />
          ) : (
            <Moon size={16} className="theme-toggle-icon moon-icon" />
          )}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {isAuthenticated && user && (
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            {/* Unified Circular Avatar Button */}
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="avatar-btn"
              aria-label="User profile & settings"
              title={`${user.username} (${user.role || 'Admin'})`}
            >
              {user.username.charAt(0).toUpperCase()}
            </button>

            {/* User Popover Dropdown */}
            {dropdownOpen && (
              <div className="user-dropdown-menu">
                <div
                  style={{
                    padding: '8px 12px 10px',
                    borderBottom: '1px solid var(--border-subtle)',
                    marginBottom: '4px',
                  }}
                >
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {user.username}
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.725rem',
                      color: 'var(--primary-text)',
                      backgroundColor: 'var(--primary-subtle)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 700,
                      marginTop: '4px',
                    }}
                  >
                    <Shield size={11} />
                    <span>{user.role || 'ADMINISTRATOR'}</span>
                  </div>
                </div>

                <button
                  className="user-dropdown-item danger"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
