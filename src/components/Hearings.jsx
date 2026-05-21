import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { db } from '../db/mockDb';
import { translations } from '../db/translations';

export default function Hearings({ lang, dbData, refreshDb, setSelectedCaseId, setActiveTab }) {
  const { hearings, cases } = dbData;
  const t = translations[lang];

  const [showAddModal, setShowAddModal] = useState(false);
  const [newHearing, setNewHearing] = useState({ caseId: '', hearingDate: '', time: '', purpose: '', courtroom: '', status: 'Scheduled' });

  // Focus on May 2026 for demonstration (as per client time context 2026-05-21)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(4); // 0-indexed: May is 4

  const monthNames = lang === 'ur' 
    ? ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"]
    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const weekdays = lang === 'ur'
    ? ["اتوار", "پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Helper for generating calendar grid for the chosen month
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth); // Day of week (0-6)

  // Calendar dates array
  const calendarDays = [];
  
  // Padding for previous month
  const prevMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonthIndex);
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      month: prevMonthIndex,
      year: prevYear,
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true
    });
  }

  // Padding for next month to complete the grid (usually 42 cells)
  const remainingCells = 42 - calendarDays.length;
  const nextMonthIndex = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({
      day: i,
      month: nextMonthIndex,
      year: nextYear,
      isCurrentMonth: false
    });
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleAddHearing = (e) => {
    e.preventDefault();
    if (!newHearing.caseId || !newHearing.hearingDate || !newHearing.purpose) return;
    db.addHearing(newHearing);
    setNewHearing({ caseId: '', hearingDate: '', time: '', purpose: '', courtroom: '', status: 'Scheduled' });
    setShowAddModal(false);
    refreshDb();
  };

  const handleDeleteHearing = (id) => {
    if (window.confirm(lang === 'ur' ? "کیا آپ اس سماعت کو مستقل طور پر منسوخ کرنا چاہتے ہیں؟" : "Are you sure you want to delete this docket entry?")) {
      db.deleteHearing(id);
      refreshDb();
    }
  };

  const handleHearingClick = (caseId) => {
    setSelectedCaseId(caseId);
    setActiveTab('cases');
  };

  // Helper to get hearings for a specific calendar cell
  const getHearingsForDate = (day, month, year) => {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;
    return hearings.filter(h => h.hearingDate === dateStr);
  };

  // Sort upcoming docket list
  const sortedHearings = [...hearings].sort((a, b) => new Date(a.hearingDate) - new Date(b.hearingDate));

  return (
    <div className="hearings-grid" style={{ direction: lang === 'ur' ? 'rtl' : 'ltr' }}>
      
      {/* Left Column: Visual Calendar grid */}
      <div className="dashboard-panel" style={{ height: '100%', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
              <Calendar size={18} />
              {lang === 'ur' ? 'عدالتی پیشی اور سماعتوں کا کیلنڈر' : 'Litigation Docket Calendar'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: lang === 'en' ? '1rem' : '0', marginRight: lang === 'ur' ? '1rem' : '0', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', border: 'none' }} onClick={handlePrevMonth}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', padding: '0 0.5rem' }}>
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', border: 'none' }} onClick={handleNextMonth}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            <Plus size={14} /> {t.scheduleHearingBtn}
          </button>
        </div>

        {/* Calendar Grid */}
        <div style={{ flexGrow: 1 }}>
          <div className="calendar-container" style={{ gridTemplateColumns: 'repeat(7, 1fr)', fontWeight: 'bold', direction: lang === 'ur' ? 'rtl' : 'ltr' }}>
            {weekdays.map(day => (
              <div key={day} className="calendar-day-header">{day}</div>
            ))}
          </div>
          
          <div className="calendar-container" style={{ direction: lang === 'ur' ? 'rtl' : 'ltr' }}>
            {calendarDays.map((cell, idx) => {
              const cellHearings = getHearingsForDate(cell.day, cell.month, cell.year);
              const isToday = cell.day === 21 && cell.month === 4 && cell.year === 2026; // Match system date: May 21 2026
              
              return (
                <div 
                  key={idx} 
                  className={`calendar-day ${cell.isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}`}
                  style={{ 
                    opacity: cell.isCurrentMonth ? 1 : 0.4,
                    minHeight: '85px',
                    textAlign: lang === 'ur' ? 'right' : 'left'
                  }}
                >
                  <span className="calendar-day-num" style={{ right: lang === 'en' ? '6px' : 'auto', left: lang === 'ur' ? '6px' : 'auto' }}>{cell.day}</span>
                  <div className="calendar-events" style={{ marginTop: '1.25rem' }}>
                    {cellHearings.map(ch => (
                      <div 
                        key={ch.id} 
                        className="calendar-event-dot" 
                        title={`${ch.purpose} - ${ch.time}`}
                        onClick={() => handleHearingClick(ch.caseId)}
                      >
                        {ch.time} {ch.purpose}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Chronological docket agenda list */}
      <div className="pane-list" style={{ height: '100%', direction: lang === 'ur' ? 'rtl' : 'ltr' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
          <Clock size={16} style={{ color: 'var(--primary)' }} />
          {lang === 'ur' ? 'تفصیلی شیڈول فہرست' : 'Chronological Agenda List'}
        </div>
        
        <div className="pane-scrollable-items" style={{ padding: '0.75rem' }}>
          {sortedHearings.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>{t.noHearingsScheduled}</p>
          ) : (
            sortedHearings.map((h) => {
              const cs = cases.find(c => c.id === h.caseId);
              return (
                <div 
                  key={h.id} 
                  style={{ 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '0.75rem', 
                    marginBottom: '0.75rem', 
                    backgroundColor: 'var(--bg-secondary)',
                    transition: 'border-color 0.15s',
                    textAlign: lang === 'ur' ? 'right' : 'left'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                    <span 
                      style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--primary)', cursor: 'pointer' }}
                      onClick={() => handleHearingClick(h.caseId)}
                    >
                      {h.purpose}
                    </span>
                    <button 
                      className="btn btn-secondary btn-sm text-danger" 
                      style={{ padding: '0.15rem 0.35rem', border: 'none' }}
                      onClick={() => handleDeleteHearing(h.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: '500' }}>
                    {cs ? cs.title : 'Unknown Case'}
                  </div>
 
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                      <Calendar size={12} /> {h.hearingDate} at {h.time}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                      <MapPin size={12} /> {h.courtroom || 'N/A'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Hearing Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ textAlign: lang === 'ur' ? 'right' : 'left' }}>
            <div className="modal-header" style={{ flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
              <h3 className="modal-title">{t.quickScheduleTitle}</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddHearing}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t.associatedCaseLabel}</label>
                  <select 
                    required 
                    className="form-control"
                    value={newHearing.caseId}
                    onChange={e => setNewHearing({...newHearing, caseId: e.target.value})}
                  >
                    <option value="">-- Choose Case File --</option>
                    {cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.purpose}</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control"
                    value={newHearing.purpose}
                    onChange={e => setNewHearing({...newHearing, purpose: e.target.value})}
                    placeholder="e.g. Markman Hearing, Motion to Suppress, Status Conf"
                  />
                </div>

                <div className="form-row" style={{ flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                  <div className="form-group">
                    <label className="form-label">{lang === 'ur' ? 'سماعت کی تاریخ' : 'Hearing Date'}</label>
                    <input 
                      type="date" 
                      required 
                      className="form-control"
                      value={newHearing.hearingDate}
                      onChange={e => setNewHearing({...newHearing, hearingDate: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.time}</label>
                    <input 
                      type="text" 
                      required 
                      className="form-control"
                      value={newHearing.time}
                      onChange={e => setNewHearing({...newHearing, time: e.target.value})}
                      placeholder="e.g. 09:30 AM"
                    />
                  </div>
                </div>

                <div className="form-row" style={{ flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                  <div className="form-group">
                    <label className="form-label">{t.courtroom}</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={newHearing.courtroom}
                      onChange={e => setNewHearing({...newHearing, courtroom: e.target.value})}
                      placeholder="e.g. Courtroom 5C"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.statusLabel}</label>
                    <select 
                      className="form-control"
                      value={newHearing.status}
                      onChange={e => setNewHearing({...newHearing, status: e.target.value})}
                    >
                      <option value="Scheduled">{lang === 'ur' ? 'طے شدہ' : 'Scheduled'}</option>
                      <option value="Completed">{lang === 'ur' ? 'مکمل شدہ' : 'Completed'}</option>
                      <option value="Postponed">{lang === 'ur' ? 'ملتوی' : 'Postponed'}</option>
                    </select>
                  </div>
                </div>

              </div>
              <div className="modal-footer" style={{ justifyContent: lang === 'ur' ? 'flex-start' : 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>{t.cancel}</button>
                <button type="submit" className="btn btn-primary">{t.saveHearing}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
