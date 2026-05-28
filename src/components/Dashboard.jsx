import React from 'react';
import { 
  Building2, 
  Scale, 
  Calendar, 
  CheckSquare, 
  AlertCircle, 
  Clock, 
  ArrowRight 
} from 'lucide-react';
import { translations } from '../db/translations';

export default function Dashboard({ lang, dbData, setActiveTab, setSelectedCaseId }) {
  const { organizations, cases, hearings, tasks } = dbData;
  const t = translations[lang];

  const activeCasesCount = cases.filter(c => c.status === 'Active').length;
  const pendingTasksCount = tasks.filter(t => t.status === 'Pending').length;
  
  // Sort hearings chronologically
  const upcomingHearings = hearings
    .filter(h => new Date(h.hearingDate) >= new Date().setHours(0,0,0,0))
    .sort((a, b) => new Date(a.hearingDate) - new Date(b.hearingDate));

  // Find related case helper
  const getCaseTitle = (caseId) => {
    const c = cases.find(c => c.id === caseId);
    return c ? c.title : 'Unknown Case';
  };

  const getClientName = (caseId) => {
    const c = cases.find(c => c.id === caseId);
    if (!c) return 'Unknown Client';
    const org = organizations.find(o => o.id === c.orgId);
    return org ? org.name : 'Unknown Client';
  };

  // High priority cases
  const highPriorityCases = cases.filter(c => c.priority === 'High' && c.status === 'Active');

  const handleCaseClick = (caseId) => {
    setSelectedCaseId(caseId);
    setActiveTab('cases');
  };

  // Translate priorities
  const getPriorityLabel = (priority) => {
    if (lang === 'ur') {
      if (priority === 'High') return 'زیادہ';
      if (priority === 'Medium') return 'درمیانی';
      return 'کم';
    }
    return priority;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Stats Summary Grid */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => setActiveTab('clients')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Building2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">{t.kpiTotalClients}</span>
            <span className="stat-value">{organizations.length}</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => setActiveTab('cases')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
            <Scale size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">{t.kpiActiveCases}</span>
            <span className="stat-value">{activeCasesCount}</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => setActiveTab('hearings')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">{t.kpiPendingHearings}</span>
            <span className="stat-value">{upcomingHearings.length}</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => setActiveTab('tasks')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
            <CheckSquare size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">{t.kpiPendingTasks}</span>
            <span className="stat-value">{pendingTasksCount}</span>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        
        {/* Left Column: High Priority Cases & Active Cases List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="dashboard-panel">
            <div className="panel-header">
              <h3 className="panel-title">
                <AlertCircle size={18} style={{ color: 'var(--danger)' }} />
                {t.highPriorityMatters}
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('cases')}>
                {lang === 'ur' ? 'سب دیکھیں' : 'View All'} <ArrowRight size={14} style={{ transform: lang === 'ur' ? 'rotate(180deg)' : 'none' }} />
              </button>
            </div>
            
            <div className="custom-table-wrapper">
              {highPriorityCases.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>{t.noHighCases}</p>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>{t.caseTitleCol}</th>
                      <th>{t.clientCol}</th>
                      <th>{t.stageCol}</th>
                      <th>{t.actionsCol}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highPriorityCases.map((c) => {
                      const org = organizations.find(o => o.id === c.orgId);
                      return (
                        <tr key={c.id}>
                          <td>
                            <div className="case-cell-title" style={{ fontWeight: '600' }}>{c.title}</div>
                            <div className="case-cell-number">{c.caseNumber}</div>
                          </td>
                          <td>{org ? org.name : 'Unknown'}</td>
                          <td>
                            <span className="badge badge-medium">{lang === 'ur' && c.stage === 'Pleading' ? 'درخواست گزار' : lang === 'ur' && c.stage === 'Discovery' ? 'انکشاف' : lang === 'ur' && c.stage === 'Trial' ? 'سماعت' : c.stage}</span>
                          </td>
                          <td>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleCaseClick(c.id)}>
                              {lang === 'ur' ? 'انتظام کریں' : 'Manage'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="panel-header">
              <h3 className="panel-title">
                <Scale size={18} />
                {lang === 'ur' ? 'حالیہ قانونی چارہ جوئی کی فہرست' : 'Recent Litigation Index'}
              </h3>
            </div>
            <div className="custom-table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>{t.caseTitleCol}</th>
                    <th>{t.courtCol}</th>
                    <th>{t.priorityCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.slice(0, 4).map((c) => (
                    <tr key={c.id} onClick={() => handleCaseClick(c.id)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className="case-cell-title" style={{ fontWeight: '500' }}>{c.title}</div>
                        <div className="case-cell-number">{c.caseNumber}</div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.court}</td>
                      <td>
                        <span className={`badge badge-${c.priority.toLowerCase()}`}>{getPriorityLabel(c.priority)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Calendar Agenda & Deadlines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="dashboard-panel">
            <div className="panel-header">
              <h3 className="panel-title">
                <Clock size={18} style={{ color: 'var(--warning)' }} />
                {t.upcomingAgenda}
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('hearings')}>
                {lang === 'ur' ? 'مکمل کیلنڈر' : 'Full Calendar'}
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              {upcomingHearings.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>{t.noAgenda}</p>
              ) : (
                upcomingHearings.slice(0, 4).map((h) => {
                  const daysLeft = Math.ceil((new Date(h.hearingDate) - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
                  return (
                    <div 
                      key={h.id} 
                      onClick={() => handleCaseClick(h.caseId)}
                      style={{ 
                        display: 'flex', 
                        gap: '0.75rem', 
                        padding: '0.75rem', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        textAlign: lang === 'ur' ? 'right' : 'left'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        backgroundColor: daysLeft === 1 ? 'var(--danger-light)' : 'var(--bg-primary)', 
                        color: daysLeft === 1 ? 'var(--danger)' : 'var(--text-primary)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        minWidth: '60px',
                        border: '1px solid var(--border-color)'
                      }}>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
                          {new Date(h.hearingDate).toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-US', { month: 'short' })}
                        </span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                          {new Date(h.hearingDate).getDate()}
                        </span>
                      </div>
                      <div style={{ overflow: 'hidden', flexGrow: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {h.purpose}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {getCaseTitle(h.caseId)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <span>{h.time}</span>
                          <span>•</span>
                          <span>{h.courtroom}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="panel-header">
              <h3 className="panel-title">
                <CheckSquare size={18} />
                {lang === 'ur' ? 'کاموں کے لیے آخری تاریخیں' : 'Action Items Deadlines'}
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('tasks')}>
                {lang === 'ur' ? 'تمام ٹاسک' : 'All Tasks'}
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tasks.filter(t => t.status === 'Pending').slice(0, 4).map((t) => (
                <div 
                  key={t.id} 
                  style={{ 
                    padding: '0.75rem', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: '500', fontSize: '0.85rem' }}>{t.title}</span>
                    <span className={`badge badge-${t.priority.toLowerCase()}`}>{getPriorityLabel(t.priority)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    <span>{lang === 'ur' ? 'آخری تاریخ' : 'Due'}: {t.dueDate}</span>
                    <span style={{ fontStyle: 'italic' }}>{getClientName(t.caseId)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
