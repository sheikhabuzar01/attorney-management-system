import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  Scale,
  Building2,
  MapPin,
  Calendar,
  FileText,
  CheckSquare
} from 'lucide-react';
import { translations } from '../db/translations';

const RESULT_LIMIT = 8;

export default function GlobalSearch({ lang, dbData, setActiveTab, setSelectedCaseId }) {
  const t = translations[lang];
  const { organizations = [], branches = [], cases = [], hearings = [], documents = [], tasks = [] } = dbData;

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Ctrl+K / Cmd+K focuses
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // Click outside closes
  useEffect(() => {
    const onClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const match = (s) => typeof s === 'string' && s.toLowerCase().includes(q);
    const orgFor = (orgId) => organizations.find(o => o.id === orgId);
    const caseFor = (caseId) => cases.find(c => c.id === caseId);

    const buckets = [];

    // Cases
    const caseMatches = cases.filter(c =>
      match(c.title) || match(c.caseNumber) || match(c.court) || match(c.description) || match(c.judge)
    ).slice(0, RESULT_LIMIT).map(c => ({
      type: 'case',
      id: c.id,
      title: c.title,
      subtitle: `${c.caseNumber} · ${c.court || '—'}`
    }));
    if (caseMatches.length) buckets.push({ label: t.resultTypeCase, icon: Scale, items: caseMatches });

    // Clients (organizations)
    const orgMatches = organizations.filter(o =>
      match(o.name) || match(o.industry) || match(o.primaryContact) || match(o.email) || match(o.phone) || match(o.taxId)
    ).slice(0, RESULT_LIMIT).map(o => ({
      type: 'client',
      id: o.id,
      title: o.name,
      subtitle: o.industry || '—'
    }));
    if (orgMatches.length) buckets.push({ label: t.resultTypeClient, icon: Building2, items: orgMatches });

    // Branches
    const branchMatches = branches.filter(b =>
      match(b.name) || match(b.city) || match(b.contactPerson) || match(b.email) || match(b.address)
    ).slice(0, RESULT_LIMIT).map(b => {
      const o = orgFor(b.orgId);
      return {
        type: 'branch',
        id: b.id,
        orgId: b.orgId,
        title: b.name,
        subtitle: `${o ? o.name : '—'} · ${b.city || ''}`
      };
    });
    if (branchMatches.length) buckets.push({ label: t.resultTypeBranch, icon: MapPin, items: branchMatches });

    // Hearings
    const hearingMatches = hearings.filter(h =>
      match(h.purpose) || match(h.courtroom) || match(h.outcome) || match(h.notes) || match(h.hearingDate)
    ).slice(0, RESULT_LIMIT).map(h => {
      const c = caseFor(h.caseId);
      return {
        type: 'hearing',
        id: h.id,
        caseId: h.caseId,
        title: h.purpose,
        subtitle: `${h.hearingDate} · ${c ? c.title : '—'}`
      };
    });
    if (hearingMatches.length) buckets.push({ label: t.resultTypeHearing, icon: Calendar, items: hearingMatches });

    // Documents
    const docMatches = documents.filter(d =>
      match(d.name) || match(d.category) || match(d.type)
    ).slice(0, RESULT_LIMIT).map(d => {
      const c = caseFor(d.caseId);
      return {
        type: 'document',
        id: d.id,
        caseId: d.caseId,
        orgId: d.orgId,
        title: d.name,
        subtitle: `${d.category} · ${c ? c.title : (orgFor(d.orgId)?.name || '—')}`
      };
    });
    if (docMatches.length) buckets.push({ label: t.resultTypeDocument, icon: FileText, items: docMatches });

    // Tasks
    const taskMatches = tasks.filter(tk =>
      match(tk.title) || match(tk.assignedTo) || match(tk.priority) || match(tk.status)
    ).slice(0, RESULT_LIMIT).map(tk => {
      const c = caseFor(tk.caseId);
      return {
        type: 'task',
        id: tk.id,
        caseId: tk.caseId,
        title: tk.title,
        subtitle: `${tk.status} · ${c ? c.title : '—'}`
      };
    });
    if (taskMatches.length) buckets.push({ label: t.resultTypeTask, icon: CheckSquare, items: taskMatches });

    return buckets;
  }, [query, cases, organizations, branches, hearings, documents, tasks, t]);

  // Flat list of items for keyboard navigation
  const flatItems = useMemo(() => results.flatMap(b => b.items), [results]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const navigateTo = (item) => {
    switch (item.type) {
      case 'case':
        setSelectedCaseId(item.id);
        setActiveTab('cases');
        break;
      case 'client':
      case 'branch':
        setActiveTab('clients');
        break;
      case 'hearing':
        if (item.caseId) {
          setSelectedCaseId(item.caseId);
          setActiveTab('cases');
        } else {
          setActiveTab('hearings');
        }
        break;
      case 'document':
        if (item.caseId) {
          setSelectedCaseId(item.caseId);
          setActiveTab('cases');
        } else {
          setActiveTab('documents');
        }
        break;
      case 'task':
        if (item.caseId) {
          setSelectedCaseId(item.caseId);
          setActiveTab('cases');
        } else {
          setActiveTab('tasks');
        }
        break;
      default:
        break;
    }
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (!isOpen || flatItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = flatItems[activeIndex];
      if (item) navigateTo(item);
    }
  };

  const isRTL = lang === 'ur';
  let flatIndex = -1;

  return (
    <div className="global-search-wrapper" ref={wrapperRef}>
      <div className="global-search-input-row" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <Search size={15} className="global-search-icon" style={{ left: isRTL ? 'auto' : '0.6rem', right: isRTL ? '0.6rem' : 'auto' }} />
        <input
          ref={inputRef}
          type="text"
          className="global-search-input"
          placeholder={t.searchEverything}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          style={{
            paddingLeft: isRTL ? '0.85rem' : '2rem',
            paddingRight: isRTL ? '2rem' : '0.85rem',
            textAlign: isRTL ? 'right' : 'left'
          }}
        />
        {query && (
          <button
            type="button"
            className="global-search-clear"
            title={t.closeSearch}
            onClick={() => { setQuery(''); setIsOpen(false); inputRef.current?.focus(); }}
            style={{ right: isRTL ? 'auto' : '0.4rem', left: isRTL ? '0.4rem' : 'auto' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="global-search-dropdown" style={{ textAlign: isRTL ? 'right' : 'left' }}>
          {flatItems.length === 0 ? (
            <div className="global-search-empty">{t.noResults}</div>
          ) : (
            results.map((bucket) => {
              const Icon = bucket.icon;
              return (
                <div key={bucket.label} className="global-search-group">
                  <div className="global-search-group-header" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <Icon size={12} />
                    <span>{bucket.label}</span>
                  </div>
                  {bucket.items.map((item) => {
                    flatIndex += 1;
                    const isActive = flatIndex === activeIndex;
                    return (
                      <button
                        key={`${item.type}-${item.id}`}
                        type="button"
                        className={`global-search-item ${isActive ? 'is-active' : ''}`}
                        onMouseEnter={() => setActiveIndex(flatIndex)}
                        onClick={() => navigateTo(item)}
                        style={{ textAlign: isRTL ? 'right' : 'left' }}
                      >
                        <div className="global-search-item-title">{item.title}</div>
                        <div className="global-search-item-subtitle">{item.subtitle}</div>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
