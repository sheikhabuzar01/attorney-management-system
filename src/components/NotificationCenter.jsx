import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Bell,
  BellRing,
  AlertCircle,
  Calendar,
  CheckSquare,
  Check
} from 'lucide-react';
import { translations } from '../db/translations';

const READ_KEY = 'lexsuite_notifications_read';
const LAST_DESKTOP_NOTIF_KEY = 'lexsuite_notifications_last_desktop';

const HEARING_LOOKAHEAD_DAYS = 3;
const TASK_LOOKAHEAD_HOURS = 24;

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function diffDays(target, base = new Date()) {
  return Math.round((startOfDay(target) - startOfDay(base)) / (1000 * 60 * 60 * 24));
}

function diffHours(target, base = new Date()) {
  return Math.round((new Date(target) - base) / (1000 * 60 * 60));
}

function readReadIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function writeReadIds(set) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore quota */
  }
}

export default function NotificationCenter({ lang, dbData, setActiveTab, setSelectedCaseId }) {
  const t = translations[lang];
  const { hearings = [], tasks = [], cases = [] } = dbData;

  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState(() => readReadIds());
  const [permission, setPermission] = useState(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const wrapperRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Compute alerts (categorized by urgency)
  const alerts = useMemo(() => {
    const now = new Date();
    const caseFor = (caseId) => cases.find(c => c.id === caseId);

    const overdue = [];
    const today = [];
    const upcoming = [];

    // Hearings within HEARING_LOOKAHEAD_DAYS (including today)
    hearings.forEach(h => {
      const outcome = h.outcome || 'Scheduled';
      // Skip hearings that have already been concluded
      if (outcome !== 'Scheduled') return;
      const d = diffDays(h.hearingDate);
      if (d < 0) return; // past, skip
      const id = `hearing-${h.id}`;
      const c = caseFor(h.caseId);
      const item = {
        id,
        type: 'hearing',
        caseId: h.caseId,
        title: h.purpose,
        subtitle: c ? c.title : '—',
        date: h.hearingDate,
        daysAway: d
      };
      if (d === 0) today.push(item);
      else if (d <= HEARING_LOOKAHEAD_DAYS) upcoming.push(item);
    });

    // Tasks: overdue (Pending, past dueDate) or due in next 24h
    tasks.forEach(tk => {
      if (tk.status === 'Completed') return;
      if (!tk.dueDate) return;
      const due = new Date(tk.dueDate);
      const d = diffDays(due);
      const id = `task-${tk.id}`;
      const c = caseFor(tk.caseId);
      const item = {
        id,
        type: 'task',
        caseId: tk.caseId,
        title: tk.title,
        subtitle: c ? c.title : '—',
        date: tk.dueDate,
        daysAway: d
      };
      if (d < 0) {
        item.overdueBy = Math.abs(d);
        overdue.push(item);
      } else if (d === 0) {
        today.push(item);
      } else if (diffHours(due) <= TASK_LOOKAHEAD_HOURS) {
        upcoming.push(item);
      }
    });

    overdue.sort((a, b) => (b.overdueBy || 0) - (a.overdueBy || 0));
    upcoming.sort((a, b) => a.daysAway - b.daysAway);

    return { overdue, today, upcoming };
  }, [hearings, tasks, cases]);

  const allItems = useMemo(
    () => [...alerts.overdue, ...alerts.today, ...alerts.upcoming],
    [alerts]
  );

  const unreadCount = useMemo(
    () => allItems.filter(it => !readIds.has(it.id)).length,
    [allItems, readIds]
  );

  // Fire desktop notifications once per session for newly-unread items
  useEffect(() => {
    if (permission !== 'granted') return;
    if (typeof Notification === 'undefined') return;
    const lastFired = parseInt(localStorage.getItem(LAST_DESKTOP_NOTIF_KEY) || '0', 10);
    const now = Date.now();
    // Throttle: don't fire more than once every 2 hours
    if (now - lastFired < 1000 * 60 * 60 * 2) return;
    if (unreadCount === 0) return;
    try {
      const body = (t.desktopNotifBody || '{{count}} alerts').replace('{{count}}', String(unreadCount));
      new Notification(t.desktopNotifGreeting || 'LexSuite', { body });
      localStorage.setItem(LAST_DESKTOP_NOTIF_KEY, String(now));
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission, unreadCount]);

  const markAllRead = () => {
    const next = new Set(readIds);
    allItems.forEach(it => next.add(it.id));
    setReadIds(next);
    writeReadIds(next);
  };

  const markRead = (id) => {
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    writeReadIds(next);
  };

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch {
      /* ignore */
    }
  };

  const navigateTo = (item) => {
    markRead(item.id);
    if (item.caseId) {
      setSelectedCaseId(item.caseId);
      setActiveTab('cases');
    } else if (item.type === 'hearing') {
      setActiveTab('hearings');
    } else if (item.type === 'task') {
      setActiveTab('tasks');
    }
    setIsOpen(false);
  };

  const isRTL = lang === 'ur';

  const renderItem = (item, urgency) => {
    const isUnread = !readIds.has(item.id);
    const Icon = item.type === 'hearing' ? Calendar : CheckSquare;
    let timing = '';
    if (urgency === 'overdue') {
      timing = `${t.overdueBy} ${item.overdueBy}${t.daysAbbr}`;
    } else if (urgency === 'today') {
      timing = t.dueToday;
    } else {
      timing = `${t.dueIn} ${item.daysAway}${t.daysAbbr}`;
    }
    return (
      <button
        key={item.id}
        type="button"
        className={`notif-item ${isUnread ? 'is-unread' : ''}`}
        onClick={() => navigateTo(item)}
        style={{ textAlign: isRTL ? 'right' : 'left' }}
      >
        <div className="notif-item-row" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <Icon size={14} className="notif-item-icon" />
          <div className="notif-item-body">
            <div className="notif-item-title">{item.title}</div>
            <div className="notif-item-subtitle">{item.subtitle}</div>
            <div className={`notif-item-timing notif-urgency-${urgency}`}>{timing} · {item.date}</div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="notif-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="theme-btn notif-bell"
        onClick={() => setIsOpen(o => !o)}
        title={t.notifications}
        aria-label={t.notificationsAriaLabel}
      >
        {unreadCount > 0 ? <BellRing size={17} /> : <Bell size={17} />}
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notif-dropdown" style={{ textAlign: isRTL ? 'right' : 'left' }}>
          <div className="notif-dropdown-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}>
              <Bell size={14} /> {t.notifications}
              {unreadCount > 0 && <span className="badge badge-high" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>{unreadCount}</span>}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={markAllRead}
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <Check size={11} /> {t.markAllRead}
              </button>
            )}
          </div>

          <div className="notif-dropdown-body">
            {allItems.length === 0 ? (
              <div className="notif-empty">{t.noNotifications}</div>
            ) : (
              <>
                {alerts.overdue.length > 0 && (
                  <div className="notif-group">
                    <div className="notif-group-header" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <AlertCircle size={11} style={{ color: 'var(--danger)' }} />
                      <span>{t.notifGroupOverdue} ({alerts.overdue.length})</span>
                    </div>
                    {alerts.overdue.map(item => renderItem(item, 'overdue'))}
                  </div>
                )}
                {alerts.today.length > 0 && (
                  <div className="notif-group">
                    <div className="notif-group-header" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <AlertCircle size={11} style={{ color: 'var(--warning)' }} />
                      <span>{t.notifGroupToday} ({alerts.today.length})</span>
                    </div>
                    {alerts.today.map(item => renderItem(item, 'today'))}
                  </div>
                )}
                {alerts.upcoming.length > 0 && (
                  <div className="notif-group">
                    <div className="notif-group-header" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <Calendar size={11} style={{ color: 'var(--primary)' }} />
                      <span>{t.notifGroupUpcoming} ({alerts.upcoming.length})</span>
                    </div>
                    {alerts.upcoming.map(item => renderItem(item, 'upcoming'))}
                  </div>
                )}
              </>
            )}
          </div>

          {permission !== 'unsupported' && (
            <div className="notif-dropdown-footer">
              {permission === 'granted' && (
                <span className="notif-perm-on">
                  <Check size={11} /> {t.browserAlertsEnabled}
                </span>
              )}
              {permission === 'denied' && (
                <span className="notif-perm-blocked">{t.browserAlertsBlocked}</span>
              )}
              {permission === 'default' && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={requestPermission}
                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.72rem' }}
                >
                  {t.enableBrowserAlerts}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
