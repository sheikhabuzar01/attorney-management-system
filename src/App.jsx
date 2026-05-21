import React, { useState, useEffect } from 'react';
import { db } from './db/mockDb';
import { translations } from './db/translations';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Cases from './components/Cases';
import Hearings from './components/Hearings';
import Documents from './components/Documents';
import Tasks from './components/Tasks';
import Contacts from './components/Contacts';
import TimeBilling from './components/TimeBilling';
import GlobalSearch from './components/GlobalSearch';
import NotificationCenter from './components/NotificationCenter';
import Login from './components/Login';
import { Sun, Moon, LogOut, Languages, Menu } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('lexsuite_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [dbData, setDbData] = useState(db.getData());
  const [theme, setTheme] = useState(() => localStorage.getItem('lexsuite_theme') || 'dark');
  const [lang, setLang] = useState(() => localStorage.getItem('lexsuite_lang') || 'en');
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sync with DB custom events
  useEffect(() => {
    const handleDbUpdate = (e) => {
      setDbData(e.detail);
    };
    window.addEventListener('db-update', handleDbUpdate);
    return () => window.removeEventListener('db-update', handleDbUpdate);
  }, []);

  // Update DOM theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lexsuite_theme', theme);
  }, [theme]);

  // Update DOM language & text direction direction (RTL for Urdu)
  useEffect(() => {
    const dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('lexsuite_lang', lang);
  }, [lang]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'ur' : 'en');
  };

  const handleLogin = (userData) => {
    localStorage.setItem('lexsuite_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('lexsuite_user');
    setUser(null);
    setActiveTab('dashboard'); // Reset
  };

  const refreshDb = () => {
    setDbData(db.getData());
  };

  const t = translations[lang];

  // Tab translations
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return t.dashboardTitle;
      case 'clients': return t.clientsTitle;
      case 'cases': return t.casesTitle;
      case 'hearings': return t.hearingsTitle;
      case 'documents': return t.documentsTitle;
      case 'tasks': return t.tasksTitle;
      case 'contacts': return t.contactsTitle;
      case 'billing': return t.timeBillingTitle;
      default: return t.brandName;
    }
  };

  // Render correct sub-view
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            lang={lang}
            dbData={dbData} 
            setActiveTab={setActiveTab} 
            setSelectedCaseId={setSelectedCaseId} 
          />
        );
      case 'clients':
        return (
          <Clients 
            lang={lang}
            dbData={dbData} 
            refreshDb={refreshDb} 
          />
        );
      case 'cases':
        return (
          <Cases 
            lang={lang}
            dbData={dbData} 
            refreshDb={refreshDb} 
            selectedCaseId={selectedCaseId}
            setSelectedCaseId={setSelectedCaseId}
          />
        );
      case 'hearings':
        return (
          <Hearings 
            lang={lang}
            dbData={dbData} 
            refreshDb={refreshDb} 
            setSelectedCaseId={setSelectedCaseId}
            setActiveTab={setActiveTab}
          />
        );
      case 'documents':
        return (
          <Documents 
            lang={lang}
            dbData={dbData} 
            refreshDb={refreshDb} 
          />
        );
      case 'tasks':
        return (
          <Tasks
            lang={lang}
            dbData={dbData}
            refreshDb={refreshDb}
            setSelectedCaseId={setSelectedCaseId}
            setActiveTab={setActiveTab}
          />
        );
      case 'contacts':
        return (
          <Contacts
            lang={lang}
            dbData={dbData}
          />
        );
      case 'billing':
        return (
          <TimeBilling
            lang={lang}
            dbData={dbData}
            refreshDb={refreshDb}
            setActiveTab={setActiveTab}
            setSelectedCaseId={setSelectedCaseId}
          />
        );
      default:
        return <div>View not found</div>;
    }
  };

  // If not authenticated, render Login view
  if (!user) {
    return <Login lang={lang} onLogin={handleLogin} toggleLanguage={toggleLanguage} />;
  }

  return (
    <div className="app-container">
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 999
          }}
        />
      )}

      <Sidebar 
        lang={lang}
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      
      <main className="main-content">
        <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row', minWidth: 0, flex: 1 }}>
            <button
              className="mobile-toggle"
              onClick={() => setIsSidebarOpen(true)}
              title="Open Navigation"
            >
              <Menu size={20} />
            </button>
            <div style={{ textAlign: lang === 'ur' ? 'right' : 'left', minWidth: 0, flex: 1 }}>
              <h1 className="page-title">{getTabTitle()}</h1>
              <p className="header-subtitle">
                {t.counselWorkspace}: <strong>{user.name}</strong> ({user.role}) • {t.docketSyncStatus}: <span style={{ color: 'var(--success)' }}>{t.online}</span>
              </p>
            </div>
          </div>

          <GlobalSearch
            lang={lang}
            dbData={dbData}
            setActiveTab={setActiveTab}
            setSelectedCaseId={setSelectedCaseId}
          />

          <div className="header-actions" style={{ gap: '0.5rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
            {/* Notifications */}
            <NotificationCenter
              lang={lang}
              dbData={dbData}
              setActiveTab={setActiveTab}
              setSelectedCaseId={setSelectedCaseId}
            />

            {/* Language Switcher */}
            <button 
              className="theme-btn" 
              onClick={toggleLanguage} 
              title="Change Language / زبان تبدیل کریں"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: '600' }}
            >
              <Languages size={15} />
              <span>{lang === 'en' ? 'اردو' : 'English'}</span>
            </button>

            {/* Theme Toggle */}
            <button className="theme-btn" onClick={toggleTheme} title="Toggle Theme mode">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            
            {/* Logout */}
            <button 
              className="theme-btn text-danger" 
              onClick={handleLogout} 
              title="Logout session"
              style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', fontSize: '0.8rem', fontWeight: '500' }}
            >
              <LogOut size={16} />
              <span>{t.signOut}</span>
            </button>
          </div>
        </header>

        <div className="page-body">
          {renderView()}
        </div>
      </main>
    </div>
  );
}
