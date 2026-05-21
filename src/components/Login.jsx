import React, { useState } from 'react';
import { Scale, Lock, Mail, AlertCircle, Eye, EyeOff, Languages } from 'lucide-react';
import { translations } from '../db/translations';

export default function Login({ lang, onLogin, toggleLanguage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const t = translations[lang];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (email === 'admin@lexsuite.com' && password === 'password123') {
      onLogin({ email, name: 'Abuzar Counsel', role: lang === 'ur' ? 'منیجنگ پارٹنر' : 'Managing Partner' });
    } else {
      setError(t.invalidCreds);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: 'var(--bg-primary)',
      padding: '1.5rem',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '420px',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        position: 'relative'
      }}>
        
        {/* Language Switch Button on Top Right/Left */}
        <button 
          onClick={toggleLanguage}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: lang === 'en' ? '1.25rem' : 'auto',
            left: lang === 'ur' ? '1.25rem' : 'auto',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            padding: '0.25rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)'
          }}
        >
          <Languages size={13} />
          {lang === 'en' ? 'اردو' : 'English'}
        </button>
        
        {/* Brand Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textAlign: 'center', marginTop: '0.75rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Scale size={28} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.02em', marginTop: '0.5rem' }}>
            {t.welcome}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {t.tagline}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.emailLabel}</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={16} style={{ 
                position: 'absolute', 
                left: lang === 'en' ? '0.75rem' : 'auto', 
                right: lang === 'ur' ? '0.75rem' : 'auto',
                color: 'var(--text-muted)' 
              }} />
              <input 
                type="email" 
                required 
                placeholder="admin@lexsuite.com"
                className="form-control"
                style={{ 
                  paddingLeft: lang === 'en' ? '2.25rem' : '0.75rem',
                  paddingRight: lang === 'ur' ? '2.25rem' : '0.75rem'
                }}
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.passwordLabel}</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={16} style={{ 
                position: 'absolute', 
                left: lang === 'en' ? '0.75rem' : 'auto', 
                right: lang === 'ur' ? '0.75rem' : 'auto',
                color: 'var(--text-muted)' 
              }} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                required 
                placeholder="••••••••"
                className="form-control"
                style={{ 
                  paddingLeft: lang === 'en' ? '2.25rem' : '0.75rem',
                  paddingRight: lang === 'ur' ? '2.25rem' : '0.75rem'
                }}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: lang === 'en' ? '0.75rem' : 'auto',
                  left: lang === 'ur' ? '0.75rem' : 'auto',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {t.authBtn}
          </button>
        </form>

        {/* Demo Helper Box */}
        <div style={{
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.25rem' }}>{t.demoCreds}:</div>
          <div>{t.emailLabel}: <strong style={{ color: 'var(--text-primary)' }}>admin@lexsuite.com</strong></div>
          <div>{t.passwordLabel}: <strong style={{ color: 'var(--text-primary)' }}>password123</strong></div>
        </div>

      </div>
    </div>
  );
}
