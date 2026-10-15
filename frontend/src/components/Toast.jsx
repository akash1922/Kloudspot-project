import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useAuth();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        return (
          <div
            key={toast.id}
            className={`toast ${isSuccess ? 'toast-success' : 'toast-error'}`}
            role="alert"
          >
            {isSuccess ? (
              <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink: 0 }} />
            ) : (
              <AlertCircle size={18} color="var(--danger)" style={{ flexShrink: 0 }} />
            )}
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
              }}
              aria-label="Dismiss toast"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
