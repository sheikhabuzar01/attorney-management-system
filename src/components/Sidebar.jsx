import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Scale, 
  Calendar, 
  FileText, 
  CheckSquare,
  LogOut,
  X
} from 'lucide-react';
import { translations } from '../db/translations';

export default function Sidebar({ lang, activeTab, setActiveTab, onLogout, isSidebarOpen, setIsSidebarOpen }) {
  const t = translations[lang];

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'clients', label: t.clients, icon: Building2 },
    { id: 'cases', label: t.cases, icon: Scale },
    { id: 'hearings', label: t.hearings, icon: Calendar },
    { id: 'documents', label: t.documents, icon: FileText },
    { id: 'tasks', label: t.tasks, icon: CheckSquare },
  ];

  return (
    <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Scale className="sidebar-logo text-primary" size={24} />
          <span className="sidebar-title">{t.brandName}</span>
        </div>
        <button 
          className="mobile-close-btn" 
          onClick={() => setIsSidebarOpen(false)}
        >
          <X size={20} />
        </button>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile" style={{ marginBottom: '0.5rem' }}>
          <div className="avatar">A</div>
          <div className="user-info">
            <span className="user-name">{lang === 'ur' ? 'ابوذر وکیل' : 'Abuzar Counsel'}</span>
            <span className="user-role">{lang === 'ur' ? 'منیجنگ پارٹنر' : 'Managing Partner'}</span>
          </div>
        </div>
        <button 
          onClick={() => {
            onLogout();
            setIsSidebarOpen(false);
          }}
          className="sidebar-item" 
          style={{ 
            width: '100%', 
            border: 'none', 
            background: 'rgba(239, 68, 68, 0.05)', 
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.6rem 1rem',
            marginTop: '0.5rem'
          }}
        >
          <LogOut size={16} />
          <span>{t.signOut}</span>
        </button>
      </div>
    </aside>
  );
}
