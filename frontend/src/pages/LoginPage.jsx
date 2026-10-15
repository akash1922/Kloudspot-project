import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Lock, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleQuickFill = () => {
    setUsername('admin');
    setPassword('admin123');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please provide both username and password.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      await login(username.trim(), password);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid username or password. Please try again.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        background: 'radial-gradient(ellipse at top, #eef2ff 0%, #f8fafc 70%)',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '440px',
          width: '100%',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ padding: 'var(--space-8) var(--space-8) var(--space-6)', textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--primary), #6366f1)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-4)',
              boxShadow: '0 8px 16px var(--primary-glow)',
            }}
          >
            <Users size={28} />
          </div>

          <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>Administrator Login</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Sign in to access and manage employee records
          </p>
        </div>

        <div style={{ padding: '0 var(--space-8) var(--space-8)' }}>
          {errorMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--danger-subtle)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger-text)',
                fontSize: '0.85rem',
                marginBottom: 'var(--space-5)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <User size={18} />
                </div>
                <input
                  id="username"
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Enter administrator username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: 'var(--space-2)' }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px' }} />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick-fill helper card */}
          <div
            style={{
              marginTop: 'var(--space-6)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px dashed var(--border-default)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              <Sparkles size={14} color="var(--primary)" />
              <span>Default Credentials</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Username: <code style={{ color: 'var(--primary-text)', fontWeight: 700 }}>admin</code> &nbsp;|&nbsp; Password:{' '}
              <code style={{ color: 'var(--primary-text)', fontWeight: 700 }}>admin123</code>
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.785rem', padding: '4px 10px' }}
              onClick={handleQuickFill}
            >
              Auto-fill Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
