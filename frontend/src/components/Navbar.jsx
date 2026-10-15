import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Building2, BookOpen, LogOut, Shield, Menu, X } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname.startsWith('/employees');
    return location.pathname.startsWith(path);
  };

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
        <Link to="/" className="brand">
          <div className="brand-icon">
            <Users size={20} />
          </div>
          <span>Nexus<span style={{ color: 'var(--primary)' }}>EMS</span></span>
        </Link>

        {isAuthenticated && (
          <nav className="nav-links" style={{ display: 'flex' }}>
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
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

      {isAuthenticated && user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: '6px 12px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {user.username}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--primary-text)',
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
              }}
            >
              ADMIN
            </span>
          </div>

          <button
            onClick={logout}
            className="btn btn-secondary btn-sm"
            title="Log out of system"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
