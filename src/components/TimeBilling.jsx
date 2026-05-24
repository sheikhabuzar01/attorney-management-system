import React, { useState, useMemo } from 'react';
import {
  Timer,
  FileText as InvoiceIcon,
  Filter,
  Plus,
  Trash2,
  X,
  Printer,
  CheckCircle2,
  Clock,
  Send,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { db } from '../db/mockDb';
import { translations } from '../db/translations';

const INVOICE_STATUSES = ['Draft', 'Sent', 'Paid'];

function fmt(amount, lang) {
  return Number(amount || 0).toLocaleString(lang === 'ur' ? 'ur-PK' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function getInvoiceStatusLabel(status, t) {
  switch (status) {
    case 'Draft': return t.invoiceStatusDraft;
    case 'Sent': return t.invoiceStatusSent;
    case 'Paid': return t.invoiceStatusPaid;
    case 'Overdue': return t.invoiceStatusOverdue;
    default: return status;
  }
}

function getInvoiceStatusBadge(status) {
  switch (status) {
    case 'Draft': return 'badge-pending';
    case 'Sent': return 'badge-medium';
    case 'Paid': return 'badge-active';
    case 'Overdue': return 'badge-high';
    default: return 'badge-low';
  }
}

export default function TimeBilling({ lang, dbData, refreshDb, setActiveTab, setSelectedCaseId }) {
  const t = translations[lang];
  const { organizations = [], cases = [], timeEntries = [], invoices = [] } = dbData;

  const [activeSubTab, setActiveSubTab] = useState('time');
  const [filterCase, setFilterCase] = useState('all');
  const [filterAttorney, setFilterAttorney] = useState('all');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [showOnlyUnbilled, setShowOnlyUnbilled] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(null);
  const [filterInvoiceStatus, setFilterInvoiceStatus] = useState('all');

  // Default rate
  const [defaultRate, setDefaultRate] = useState(() => {
    const stored = parseFloat(localStorage.getItem('lexsuite_default_rate') || '0');
    return stored > 0 ? stored : 0;
  });

  // Invoice draft (when creating)
  const [invoiceDraft, setInvoiceDraft] = useState({
    invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    taxPercent: 0,
    currency: 'PKR',
    notes: ''
  });

  const attorneyOptions = useMemo(() => {
    const set = new Set();
    timeEntries.forEach(te => te.attorneyName && set.add(te.attorneyName));
    return Array.from(set).sort();
  }, [timeEntries]);

  const filteredEntries = useMemo(() => {
    return timeEntries.filter(te => {
      if (showOnlyUnbilled && te.invoiceId) return false;
      if (filterCase !== 'all' && te.caseId !== filterCase) return false;
      if (filterAttorney !== 'all' && te.attorneyName !== filterAttorney) return false;
      if (filterFrom && te.date < filterFrom) return false;
      if (filterTo && te.date > filterTo) return false;
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [timeEntries, filterCase, filterAttorney, filterFrom, filterTo, showOnlyUnbilled]);

  const totals = useMemo(() => {
    return filteredEntries.reduce(
      (acc, te) => ({
        hours: acc.hours + (Number(te.hours) || 0),
        amount: acc.amount + (Number(te.hours) || 0) * (Number(te.rate) || 0)
      }),
      { hours: 0, amount: 0 }
    );
  }, [filteredEntries]);

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => filterInvoiceStatus === 'all' || inv.status === filterInvoiceStatus)
      .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
  }, [invoices, filterInvoiceStatus]);

  const caseLookup = (id) => cases.find(c => c.id === id);
  const orgLookup = (id) => organizations.find(o => o.id === id);
  const orgForCase = (caseId) => {
    const c = caseLookup(caseId);
    return c ? orgLookup(c.orgId) : null;
  };

  const isRTL = lang === 'ur';

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAllVisible = () => {
    const unbilledIds = filteredEntries.filter(te => !te.invoiceId).map(te => te.id);
    setSelectedIds(unbilledIds);
  };

  const clearSelection = () => setSelectedIds([]);

  const saveDefaultRate = () => {
    if (defaultRate > 0) localStorage.setItem('lexsuite_default_rate', String(defaultRate));
  };

  const openInvoiceCreate = () => {
    if (selectedIds.length === 0) {
      alert(t.pickEntriesFirst);
      return;
    }
    // Validate single org
    const selectedEntries = timeEntries.filter(te => selectedIds.includes(te.id));
    const orgIds = new Set(selectedEntries.map(te => orgForCase(te.caseId)?.id).filter(Boolean));
    if (orgIds.size > 1) {
      alert(t.cannotInvoiceMixedOrgs);
      return;
    }
    const sampleOrgId = Array.from(orgIds)[0];
    const sampleOrg = orgLookup(sampleOrgId);
    setInvoiceDraft(d => ({
      ...d,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`,
      currency: sampleOrg ? d.currency : 'PKR'
    }));
    setShowInvoiceModal(true);
  };

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    const selectedEntries = timeEntries.filter(te => selectedIds.includes(te.id) && !te.invoiceId);
    if (selectedEntries.length === 0) return;
    const orgIdsSet = new Set(selectedEntries.map(te => orgForCase(te.caseId)?.id).filter(Boolean));
    const orgId = Array.from(orgIdsSet)[0];
    if (!orgId) return;
    db.createInvoice(
      {
        orgId,
        invoiceNumber: invoiceDraft.invoiceNumber,
        issueDate: invoiceDraft.issueDate,
        dueDate: invoiceDraft.dueDate,
        taxPercent: Number(invoiceDraft.taxPercent) || 0,
        currency: invoiceDraft.currency || 'PKR',
        notes: invoiceDraft.notes
      },
      selectedIds
    );
    setShowInvoiceModal(false);
    setSelectedIds([]);
    setInvoiceDraft({
      invoiceNumber: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      taxPercent: 0,
      currency: 'PKR',
      notes: ''
    });
    setActiveSubTab('invoices');
    refreshDb();
  };

  const updateInvoiceStatus = (id, status) => {
    db.updateInvoiceStatus(id, status);
    if (showInvoiceDetail && showInvoiceDetail.id === id) {
      setShowInvoiceDetail({ ...showInvoiceDetail, status });
    }
    refreshDb();
  };

  const handleDeleteInvoice = (id) => {
    if (window.confirm(t.deleteInvoiceConfirm)) {
      db.deleteInvoice(id);
      if (showInvoiceDetail && showInvoiceDetail.id === id) setShowInvoiceDetail(null);
      refreshDb();
    }
  };

  const handlePrintInvoice = () => {
    document.body.classList.add('printing-invoice');
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove('printing-invoice'), 500);
    }, 50);
  };

  const handleCaseClick = (caseId) => {
    if (!caseId) return;
    setSelectedCaseId(caseId);
    setActiveTab('cases');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', direction: isRTL ? 'rtl' : 'ltr' }}>

      {/* Sub-tab switcher + default rate */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            className={`btn btn-${activeSubTab === 'time' ? 'primary' : 'secondary'} btn-sm`}
            onClick={() => setActiveSubTab('time')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Timer size={14} /> {t.timeLogTab}
          </button>
          <button
            className={`btn btn-${activeSubTab === 'invoices' ? 'primary' : 'secondary'} btn-sm`}
            onClick={() => setActiveSubTab('invoices')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <InvoiceIcon size={14} /> {t.invoicesTab} ({invoices.length})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t.defaultRateLabel}:</label>
          <input
            type="number"
            min="0"
            step="100"
            className="form-control"
            style={{ width: '120px', padding: '0.35rem 0.55rem', fontSize: '0.82rem' }}
            value={defaultRate}
            onChange={e => setDefaultRate(parseFloat(e.target.value) || 0)}
          />
          <button className="btn btn-secondary btn-sm" onClick={saveDefaultRate} style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}>
            {t.saveDefaultRate}
          </button>
        </div>
      </div>

      {/* TIME LOG SUB-TAB */}
      {activeSubTab === 'time' && (
        <>
          {/* Filters bar */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.65rem',
              alignItems: 'center'
            }}
          >
            <Filter size={14} style={{ color: 'var(--text-secondary)' }} />
            <select className="form-control" style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.82rem' }} value={filterCase} onChange={e => setFilterCase(e.target.value)}>
              <option value="all">{t.allCases}</option>
              {cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <select className="form-control" style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.82rem' }} value={filterAttorney} onChange={e => setFilterAttorney(e.target.value)}>
              <option value="all">{t.allAttorneys}</option>
              {attorneyOptions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t.filterByDateFrom}</label>
            <input type="date" className="form-control" style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.82rem' }} value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t.filterByDateTo}</label>
            <input type="date" className="form-control" style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.82rem' }} value={filterTo} onChange={e => setFilterTo(e.target.value)} />
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={showOnlyUnbilled} onChange={e => setShowOnlyUnbilled(e.target.checked)} />
              {t.unbilledOnly}
            </label>
          </div>

          {/* Action bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <span>{filteredEntries.length} {t.timeLogTab.toLowerCase()}</span>
              <span>·</span>
              <span><strong style={{ color: 'var(--text-primary)' }}>{totals.hours.toFixed(2)}</strong> {t.totalHours.toLowerCase()}</span>
              <span>·</span>
              <span><strong style={{ color: 'var(--text-primary)' }}>{fmt(totals.amount, lang)}</strong> {t.totalAmount.toLowerCase()}</span>
              {selectedIds.length > 0 && (
                <>
                  <span>·</span>
                  <span style={{ color: 'var(--primary)' }}><strong>{selectedIds.length}</strong> {t.selectedCount}</span>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              {selectedIds.length === 0 ? (
                <button className="btn btn-secondary btn-sm" onClick={selectAllVisible}>
                  {t.selectAll}
                </button>
              ) : (
                <button className="btn btn-secondary btn-sm" onClick={clearSelection}>
                  {t.deselectAll}
                </button>
              )}
              <button
                className="btn btn-primary btn-sm"
                onClick={openInvoiceCreate}
                disabled={selectedIds.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexDirection: isRTL ? 'row-reverse' : 'row', opacity: selectedIds.length === 0 ? 0.6 : 1 }}
              >
                <Send size={13} /> {t.generateInvoiceBtn}
              </button>
            </div>
          </div>

          {/* Time entries table */}
          <div className="dashboard-panel" style={{ padding: 0 }}>
            <div className="custom-table-wrapper">
              {filteredEntries.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>{t.noTimeEntries}</p>
              ) : (
                <table className="custom-table" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th>{t.timeEntryDate}</th>
                      <th>{t.caseTitleCol || 'Case'}</th>
                      <th>{t.timeEntryDescription}</th>
                      <th>{t.timeEntryAttorney}</th>
                      <th style={{ textAlign: isRTL ? 'left' : 'right' }}>{t.timeEntryHours}</th>
                      <th style={{ textAlign: isRTL ? 'left' : 'right' }}>{t.timeEntryRate}</th>
                      <th style={{ textAlign: isRTL ? 'left' : 'right' }}>{t.timeEntryAmount}</th>
                      <th>{t.invoiceStatus}</th>
                      <th>{t.actionsCol || 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map(te => {
                      const c = caseLookup(te.caseId);
                      const isInvoiced = !!te.invoiceId;
                      const amount = (Number(te.hours) || 0) * (Number(te.rate) || 0);
                      return (
                        <tr key={te.id} style={{ opacity: isInvoiced ? 0.65 : 1 }}>
                          <td>
                            <input
                              type="checkbox"
                              disabled={isInvoiced}
                              checked={selectedIds.includes(te.id)}
                              onChange={() => toggleSelect(te.id)}
                            />
                          </td>
                          <td>{te.date}</td>
                          <td>
                            <span
                              style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}
                              onClick={() => handleCaseClick(te.caseId)}
                            >
                              {c ? c.title : '—'}
                            </span>
                          </td>
                          <td>{te.description || '—'}</td>
                          <td>{te.attorneyName || '—'}</td>
                          <td style={{ textAlign: isRTL ? 'left' : 'right' }}>{Number(te.hours).toFixed(2)}</td>
                          <td style={{ textAlign: isRTL ? 'left' : 'right' }}>{fmt(te.rate, lang)}</td>
                          <td style={{ textAlign: isRTL ? 'left' : 'right', fontWeight: 600 }}>{fmt(amount, lang)}</td>
                          <td>
                            {isInvoiced ? (
                              <span className="badge badge-active" style={{ fontSize: '0.65rem' }}>{t.invoiceStatusSent}</span>
                            ) : (
                              <span className="badge badge-pending" style={{ fontSize: '0.65rem' }}>{t.invoiceStatusDraft}</span>
                            )}
                          </td>
                          <td>
                            {!isInvoiced && (
                              <button
                                className="btn btn-secondary btn-sm text-danger"
                                style={{ padding: '0.15rem 0.35rem', border: 'none' }}
                                onClick={() => {
                                  if (window.confirm(t.deleteTimeEntryConfirm)) {
                                    db.deleteTimeEntry(te.id);
                                    refreshDb();
                                  }
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* INVOICES SUB-TAB */}
      {activeSubTab === 'invoices' && (
        <>
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              alignItems: 'center',
              flexDirection: isRTL ? 'row-reverse' : 'row'
            }}
          >
            <Filter size={14} style={{ color: 'var(--text-secondary)' }} />
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t.invoiceStatus}:</label>
            <select className="form-control" style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.82rem' }} value={filterInvoiceStatus} onChange={e => setFilterInvoiceStatus(e.target.value)}>
              <option value="all">{lang === 'ur' ? 'تمام' : 'All'}</option>
              {INVOICE_STATUSES.map(s => <option key={s} value={s}>{getInvoiceStatusLabel(s, t)}</option>)}
            </select>
          </div>

          <div className="dashboard-panel" style={{ padding: 0 }}>
            <div className="custom-table-wrapper">
              {filteredInvoices.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>{t.noInvoices}</p>
              ) : (
                <table className="custom-table" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  <thead>
                    <tr>
                      <th>{t.invoiceNumber}</th>
                      <th>{t.invoiceClient}</th>
                      <th>{t.invoiceIssueDate}</th>
                      <th>{t.invoiceDueDate}</th>
                      <th style={{ textAlign: isRTL ? 'left' : 'right' }}>{t.invoiceTotal}</th>
                      <th>{t.invoiceStatus}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map(inv => {
                      const o = orgLookup(inv.orgId);
                      return (
                        <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => setShowInvoiceDetail(inv)}>
                          <td><strong>{inv.invoiceNumber}</strong></td>
                          <td>{o ? o.name : '—'}</td>
                          <td>{inv.issueDate}</td>
                          <td>{inv.dueDate || '—'}</td>
                          <td style={{ textAlign: isRTL ? 'left' : 'right', fontWeight: 600 }}>{fmt(inv.total, lang)} {inv.currency || 'PKR'}</td>
                          <td>
                            <span className={`badge ${getInvoiceStatusBadge(inv.status)}`} style={{ fontSize: '0.7rem' }}>
                              {getInvoiceStatusLabel(inv.status, t)}
                            </span>
                          </td>
                          <td onClick={e => e.stopPropagation()}>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.2rem 0.4rem' }}
                              onClick={() => setShowInvoiceDetail(inv)}
                            >
                              {isRTL ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
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
        </>
      )}

      {/* Create Invoice Modal */}
      {showInvoiceModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '600px', textAlign: isRTL ? 'right' : 'left' }}>
            <div className="modal-header" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <h3 className="modal-title">{t.newInvoiceTitle}</h3>
              <button className="modal-close" onClick={() => setShowInvoiceModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateInvoice}>
              <div className="modal-body">
                <div className="form-row" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div className="form-group">
                    <label className="form-label">{t.invoiceNumber}</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={invoiceDraft.invoiceNumber}
                      onChange={e => setInvoiceDraft({ ...invoiceDraft, invoiceNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.invoiceCurrency}</label>
                    <select
                      className="form-control"
                      value={invoiceDraft.currency}
                      onChange={e => setInvoiceDraft({ ...invoiceDraft, currency: e.target.value })}
                    >
                      <option value="PKR">PKR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="AED">AED</option>
                    </select>
                  </div>
                </div>

                <div className="form-row" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div className="form-group">
                    <label className="form-label">{t.invoiceIssueDate}</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={invoiceDraft.issueDate}
                      onChange={e => setInvoiceDraft({ ...invoiceDraft, issueDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.invoiceDueDate}</label>
                    <input
                      type="date"
                      className="form-control"
                      value={invoiceDraft.dueDate}
                      onChange={e => setInvoiceDraft({ ...invoiceDraft, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t.taxPercentLabel}</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="form-control"
                    style={{ maxWidth: '180px' }}
                    value={invoiceDraft.taxPercent}
                    onChange={e => setInvoiceDraft({ ...invoiceDraft, taxPercent: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t.invoiceNotes}</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder={t.invoiceNotesPlaceholder}
                    value={invoiceDraft.notes}
                    onChange={e => setInvoiceDraft({ ...invoiceDraft, notes: e.target.value })}
                  />
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-primary)', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
                  {selectedIds.length} {t.selectedCount} · {fmt(totals.amount, lang)} {invoiceDraft.currency}
                </div>

              </div>
              <div className="modal-footer" style={{ justifyContent: isRTL ? 'flex-start' : 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowInvoiceModal(false)}>{t.cancel}</button>
                <button type="submit" className="btn btn-primary">{t.saveInvoiceBtn}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {showInvoiceDetail && (() => {
        const inv = invoices.find(i => i.id === showInvoiceDetail.id) || showInvoiceDetail;
        const o = orgLookup(inv.orgId);
        return (
          <div className="modal-overlay">
            <div className="modal-container" style={{ maxWidth: '760px', textAlign: isRTL ? 'right' : 'left' }}>
              <div className="modal-header" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <div>
                  <span className={`badge ${getInvoiceStatusBadge(inv.status)}`} style={{ marginBottom: '0.25rem' }}>{getInvoiceStatusLabel(inv.status, t)}</span>
                  <h3 className="modal-title">{inv.invoiceNumber}</h3>
                </div>
                <button className="modal-close" onClick={() => setShowInvoiceDetail(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem 1.2rem', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{t.invoiceClientLabel}</div>
                    <div style={{ fontWeight: 600 }}>{o ? o.name : '—'}</div>
                    {o && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{o.email || ''}</div>}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{t.billFromLabel}</div>
                    <div style={{ fontWeight: 600 }}>{t.firmName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{t.invoiceIssueDate}</div>
                    <div>{inv.issueDate}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{t.invoiceDueDate}</div>
                    <div>{inv.dueDate || '—'}</div>
                  </div>
                </div>

                <h4 style={{ marginTop: '1.25rem', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{t.invoiceLineItems}</h4>
                <div className="custom-table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>{t.timeEntryDate}</th>
                        <th>{t.timeEntryDescription}</th>
                        <th style={{ textAlign: isRTL ? 'left' : 'right' }}>{t.timeEntryHours}</th>
                        <th style={{ textAlign: isRTL ? 'left' : 'right' }}>{t.timeEntryRate}</th>
                        <th style={{ textAlign: isRTL ? 'left' : 'right' }}>{t.timeEntryAmount}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.lineItems.map((li, idx) => (
                        <tr key={li.timeEntryId || idx}>
                          <td>{li.date}</td>
                          <td>{li.description || '—'}</td>
                          <td style={{ textAlign: isRTL ? 'left' : 'right' }}>{Number(li.hours).toFixed(2)}</td>
                          <td style={{ textAlign: isRTL ? 'left' : 'right' }}>{fmt(li.rate, lang)}</td>
                          <td style={{ textAlign: isRTL ? 'left' : 'right', fontWeight: 600 }}>{fmt(li.amount, lang)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} style={{ textAlign: isRTL ? 'left' : 'right', fontWeight: 600 }}>{t.invoiceSubtotal}</td>
                        <td style={{ textAlign: isRTL ? 'left' : 'right', fontWeight: 600 }}>{fmt(inv.subtotal, lang)}</td>
                      </tr>
                      {inv.taxPercent > 0 && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: isRTL ? 'left' : 'right' }}>{t.invoiceTax} ({inv.taxPercent}%)</td>
                          <td style={{ textAlign: isRTL ? 'left' : 'right' }}>{fmt(inv.tax, lang)}</td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={4} style={{ textAlign: isRTL ? 'left' : 'right', fontWeight: 700, fontSize: '1rem' }}>{t.invoiceTotal}</td>
                        <td style={{ textAlign: isRTL ? 'left' : 'right', fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>{fmt(inv.total, lang)} {inv.currency}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {inv.notes && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{t.invoiceNotes}</div>
                    <div style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', padding: '0.65rem 0.8rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>{inv.notes}</div>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ justifyContent: 'space-between', flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  {inv.status === 'Draft' && (
                    <button className="btn btn-primary btn-sm" onClick={() => updateInvoiceStatus(inv.id, 'Sent')} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <Send size={12} /> {t.markAsSent}
                    </button>
                  )}
                  {inv.status === 'Sent' && (
                    <button className="btn btn-primary btn-sm" onClick={() => updateInvoiceStatus(inv.id, 'Paid')} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <CheckCircle2 size={12} /> {t.markAsPaid}
                    </button>
                  )}
                  {inv.status !== 'Draft' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => updateInvoiceStatus(inv.id, 'Draft')} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <Clock size={12} /> {t.markAsDraft}
                    </button>
                  )}
                  <button className="btn btn-secondary btn-sm text-danger" onClick={() => handleDeleteInvoice(inv.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <Trash2 size={12} /> {t.cancel === 'منسوخ کریں' ? 'حذف' : 'Delete'}
                  </button>
                </div>
                <button className="btn btn-primary" onClick={handlePrintInvoice} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <Printer size={14} /> {t.printInvoiceBtn}
                </button>
              </div>
            </div>

            {/* Print-only invoice template */}
            <div className="invoice-print-report" aria-hidden="true" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="print-header">
                <h1>{t.invoicePreviewTitle} {inv.invoiceNumber}</h1>
                <div className="print-meta">
                  <span>{t.generatedOn}: {new Date().toLocaleString(lang === 'ur' ? 'ur-PK' : 'en-US', { dateStyle: 'medium' })}</span>
                </div>
              </div>

              <div className="print-kv-grid">
                <div><strong>{t.billFromLabel}:</strong> {t.firmName}</div>
                <div><strong>{t.invoiceClientLabel}:</strong> {o ? o.name : '—'}</div>
                <div><strong>{t.invoiceIssueDate}:</strong> {inv.issueDate}</div>
                <div><strong>{t.invoiceDueDate}:</strong> {inv.dueDate || '—'}</div>
                <div><strong>{t.invoiceStatus}:</strong> {getInvoiceStatusLabel(inv.status, t)}</div>
              </div>

              <table className="print-table" style={{ marginTop: '0.75rem' }}>
                <thead>
                  <tr>
                    <th>{t.timeEntryDate}</th>
                    <th>{t.timeEntryDescription}</th>
                    <th style={{ textAlign: 'right' }}>{t.timeEntryHours}</th>
                    <th style={{ textAlign: 'right' }}>{t.timeEntryRate}</th>
                    <th style={{ textAlign: 'right' }}>{t.timeEntryAmount}</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.lineItems.map((li, idx) => (
                    <tr key={li.timeEntryId || idx}>
                      <td>{li.date}</td>
                      <td>{li.description || '—'}</td>
                      <td style={{ textAlign: 'right' }}>{Number(li.hours).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(li.rate, lang)}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(li.amount, lang)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'right' }}><strong>{t.invoiceSubtotal}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{fmt(inv.subtotal, lang)}</strong></td>
                  </tr>
                  {inv.taxPercent > 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'right' }}>{t.invoiceTax} ({inv.taxPercent}%)</td>
                      <td style={{ textAlign: 'right' }}>{fmt(inv.tax, lang)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'right', fontSize: '12pt' }}><strong>{t.invoiceTotal}</strong></td>
                    <td style={{ textAlign: 'right', fontSize: '12pt' }}><strong>{fmt(inv.total, lang)} {inv.currency}</strong></td>
                  </tr>
                </tfoot>
              </table>

              {inv.notes && (
                <div style={{ marginTop: '0.85rem' }}>
                  <strong>{t.invoiceNotes}:</strong>
                  <div>{inv.notes}</div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
