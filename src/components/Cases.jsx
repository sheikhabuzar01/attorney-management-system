import React, { useState, useEffect } from 'react';
import {
  Scale,
  Plus,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Calendar,
  FileText,
  CheckSquare,
  User,
  Bookmark,
  Info,
  X,
  MapPin,
  Clock,
  Download,
  Edit3,
  Check,
  Printer,
  StickyNote,
  Timer
} from 'lucide-react';
import { db } from '../db/mockDb';
import { translations } from '../db/translations';
import { getOutcomeLabel } from './Hearings';

const OUTCOME_KEYS = [
  'Scheduled',
  'Adjourned',
  'Disposed',
  'Order Reserved',
  'Order Granted',
  'Order Denied',
  'No Show'
];

const OUTCOME_BADGE_CLASS = {
  'Scheduled': 'badge-active',
  'Adjourned': 'badge-pending',
  'Disposed': 'badge-closed',
  'Order Reserved': 'badge-medium',
  'Order Granted': 'badge-low',
  'Order Denied': 'badge-high',
  'No Show': 'badge-high'
};

export default function Cases({ lang, dbData, refreshDb, selectedCaseId, setSelectedCaseId }) {
  const { organizations, branches, cases, hearings, documents, tasks } = dbData;
  const t = translations[lang];

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOrg, setFilterOrg] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState('overview');

  // Add Case Form State
  const [newCase, setNewCase] = useState({
    orgId: '',
    branchId: '',
    caseNumber: '',
    title: '',
    description: '',
    court: '',
    judge: '',
    type: 'Litigation',
    stage: 'Pleading',
    priority: 'Medium',
    status: 'Active'
  });

  // Modal hearing/document/task fast-add inputs
  const [quickHearing, setQuickHearing] = useState({ hearingDate: '', time: '', purpose: '', courtroom: '' });
  const [quickTask, setQuickTask] = useState({ title: '', dueDate: '', priority: 'Medium', assignedTo: '' });
  const [quickDoc, setQuickDoc] = useState({ name: '', category: 'Pleading', size: '1.5 MB' });
  const [selectedQuickFile, setSelectedQuickFile] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editCaseForm, setEditCaseForm] = useState({
    title: '',
    description: '',
    caseNumber: '',
    court: '',
    judge: '',
    priority: '',
    orgId: '',
    branchId: ''
  });

  // Outcome editor (per hearing inside case detail)
  const [outcomeEditId, setOutcomeEditId] = useState(null);
  const [outcomeDraft, setOutcomeDraft] = useState({ outcome: 'Scheduled', notes: '' });

  // Notes draft (for Notes tab)
  const [noteDraft, setNoteDraft] = useState({ body: '', author: '' });

  // Time entry draft (for Time Log tab)
  const todayIso = new Date().toISOString().split('T')[0];
  const defaultRate = parseFloat(localStorage.getItem('lexsuite_default_rate') || '0') || 0;
  const [timeDraft, setTimeDraft] = useState({
    date: todayIso,
    hours: '',
    rate: defaultRate,
    description: '',
    attorneyName: ''
  });

  // Dynamically filter branches based on organization selection in the form
  const [formBranches, setFormBranches] = useState([]);
  
  useEffect(() => {
    if (newCase.orgId) {
      const filtered = branches.filter(b => b.orgId === newCase.orgId);
      setFormBranches(filtered);
      setNewCase(prev => ({ ...prev, branchId: filtered[0]?.id || '' }));
    } else {
      setFormBranches([]);
    }
  }, [newCase.orgId, branches]);

  // Selected Case Object
  const selectedCase = cases.find(c => c.id === selectedCaseId);

  // Selected Case Relational Data
  const caseOrg = selectedCase ? organizations.find(o => o.id === selectedCase.orgId) : null;
  const caseBranch = selectedCase ? branches.find(b => b.id === selectedCase.branchId) : null;
  const caseHearings = selectedCase ? hearings.filter(h => h.caseId === selectedCase.id) : [];
  const caseDocs = selectedCase ? documents.filter(d => d.caseId === selectedCase.id) : [];
  const caseTasks = selectedCase ? tasks.filter(t => t.caseId === selectedCase.id) : [];
  const caseNotes = selectedCase && Array.isArray(dbData.caseNotes)
    ? [...dbData.caseNotes].filter(n => n.caseId === selectedCase.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : [];
  const caseTimeEntries = selectedCase && Array.isArray(dbData.timeEntries)
    ? [...dbData.timeEntries].filter(te => te.caseId === selectedCase.id).sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];
  const caseTimeTotal = caseTimeEntries.reduce(
    (acc, te) => ({
      hours: acc.hours + (Number(te.hours) || 0),
      amount: acc.amount + (Number(te.hours) || 0) * (Number(te.rate) || 0)
    }),
    { hours: 0, amount: 0 }
  );

  // Filter logic
  const filteredCases = cases.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.court.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOrg = filterOrg === 'all' || c.orgId === filterOrg;
    const matchesStage = filterStage === 'all' || c.stage === filterStage;
    const matchesPriority = filterPriority === 'all' || c.priority === filterPriority;
    return matchesSearch && matchesOrg && matchesStage && matchesPriority;
  });

  const handleAddCase = (e) => {
    e.preventDefault();
    if (!newCase.orgId || !newCase.branchId || !newCase.title) return;
    const added = db.addCase(newCase);
    setShowAddModal(false);
    setNewCase({
      orgId: '',
      branchId: '',
      caseNumber: '',
      title: '',
      description: '',
      court: '',
      judge: '',
      type: 'Litigation',
      stage: 'Pleading',
      priority: 'Medium',
      status: 'Active'
    });
    setSelectedCaseId(added.id);
    refreshDb();
  };

  const handleDeleteCase = (id, e) => {
    e.stopPropagation();
    if (window.confirm(lang === 'ur' ? "کیا آپ اس کیس فائل کو حذف کرنا چاہتے ہیں؟" : "Are you sure you want to delete this case? All related hearings, tasks, and files will also be removed.")) {
      db.deleteCase(id);
      if (selectedCaseId === id) setSelectedCaseId(null);
      refreshDb();
    }
  };

  // Quick addition helpers inside the detail modal
  const handleAddQuickHearing = (e) => {
    e.preventDefault();
    if (!quickHearing.hearingDate || !quickHearing.purpose) return;
    db.addHearing({ caseId: selectedCaseId, ...quickHearing });
    setQuickHearing({ hearingDate: '', time: '', purpose: '', courtroom: '' });
    refreshDb();
  };

  const handleAddQuickTask = (e) => {
    e.preventDefault();
    if (!quickTask.title || !quickTask.dueDate) return;
    db.addTask({ caseId: selectedCaseId, ...quickTask });
    setQuickTask({ title: '', dueDate: '', priority: 'Medium', assignedTo: '' });
    refreshDb();
  };

  const handleQuickFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedQuickFile(file);
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(file.size / 1024).toFixed(0)} KB`;
      setQuickDoc(prev => ({
        ...prev,
        name: file.name,
        size: sizeStr
      }));
    }
  };

  const handleAddQuickDoc = async (e) => {
    e.preventDefault();
    if (!quickDoc.name) return;
    await db.addDocument({
      orgId: selectedCase.orgId,
      caseId: selectedCaseId,
      name: quickDoc.name,
      type: quickDoc.name.split('.').pop() || 'pdf',
      size: quickDoc.size,
      category: quickDoc.category
    }, selectedQuickFile);
    setQuickDoc({ name: '', category: 'Pleading', size: '1.5 MB' });
    setSelectedQuickFile(null);
    refreshDb();
  };

  const handleDownloadFile = async (doc, e) => {
    e.preventDefault();
    try {
      const blob = await db.getFileContent(doc.id);
      if (!blob) {
        alert(lang === 'ur' ? 'فائل کا مواد نہیں ملا۔' : 'File content not found.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error downloading file');
    }
  };

  const handleToggleTask = (taskId, currentStatus) => {
    db.updateTask(taskId, { status: currentStatus === 'Completed' ? 'Pending' : 'Completed' });
    refreshDb();
  };

  const openOutcomeEditor = (h) => {
    setOutcomeEditId(h.id);
    setOutcomeDraft({ outcome: h.outcome || 'Scheduled', notes: h.notes || '' });
  };

  const cancelOutcomeEditor = () => {
    setOutcomeEditId(null);
    setOutcomeDraft({ outcome: 'Scheduled', notes: '' });
  };

  const saveOutcome = (e, hearingId) => {
    e.preventDefault();
    db.updateHearing(hearingId, { outcome: outcomeDraft.outcome, notes: outcomeDraft.notes });
    cancelOutcomeEditor();
    refreshDb();
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteDraft.body.trim() || !selectedCaseId) return;
    db.addNote({ caseId: selectedCaseId, body: noteDraft.body.trim(), author: noteDraft.author.trim() });
    setNoteDraft({ body: '', author: '' });
    refreshDb();
  };

  const handleDeleteNote = (id) => {
    if (window.confirm(t.deleteNoteConfirm)) {
      db.deleteNote(id);
      refreshDb();
    }
  };

  const handleAddTimeEntry = (e) => {
    e.preventDefault();
    if (!selectedCaseId || !timeDraft.hours || Number(timeDraft.hours) <= 0) return;
    db.addTimeEntry({
      caseId: selectedCaseId,
      date: timeDraft.date,
      hours: Number(timeDraft.hours),
      rate: Number(timeDraft.rate),
      description: timeDraft.description.trim(),
      attorneyName: timeDraft.attorneyName.trim()
    });
    if (timeDraft.rate && Number(timeDraft.rate) > 0) {
      localStorage.setItem('lexsuite_default_rate', String(Number(timeDraft.rate)));
    }
    setTimeDraft({
      date: todayIso,
      hours: '',
      rate: Number(timeDraft.rate) || defaultRate,
      description: '',
      attorneyName: timeDraft.attorneyName
    });
    refreshDb();
  };

  const handleDeleteTimeEntry = (id) => {
    if (window.confirm(t.deleteTimeEntryConfirm)) {
      db.deleteTimeEntry(id);
      refreshDb();
    }
  };

  const handlePrintCase = () => {
    document.body.classList.add('printing-case');
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove('printing-case'), 500);
    }, 50);
  };

  const handleStageChange = (caseId, newStage) => {
    db.updateCase(caseId, { stage: newStage });
    refreshDb();
  };

  const handleStatusChange = (caseId, newStatus) => {
    db.updateCase(caseId, { status: newStatus });
    refreshDb();
  };

  const handleStartEdit = (c) => {
    setEditCaseForm({
      title: c.title,
      description: c.description || '',
      caseNumber: c.caseNumber,
      court: c.court || '',
      judge: c.judge || '',
      priority: c.priority,
      orgId: c.orgId,
      branchId: c.branchId
    });
    setSelectedCaseId(c.id);
    setIsEditing(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    db.updateCase(selectedCaseId, editCaseForm);
    setIsEditing(false);
    refreshDb();
  };

  const getPriorityLabel = (priority) => {
    if (lang === 'ur') {
      if (priority === 'High') return 'زیادہ';
      if (priority === 'Medium') return 'درمیانی';
      return 'کم';
    }
    return priority;
  };

  const getLocalizedCategory = (cat) => {
    if (lang === 'ur') {
      if (cat === 'Pleading') return 'درخواست گزار';
      if (cat === 'Motion') return 'متفرق درخواست';
      if (cat === 'Evidence') return 'ثبوت';
      if (cat === 'Contract') return 'معاہدہ';
      if (cat === 'Correspondence') return 'خط و کتابت';
      return 'دیگر';
    }
    return cat;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Search and Filters panel */}
      <div
        className="filter-bar"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flexGrow: 1, minWidth: 0 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: '180px' }}>
            <Search size={16} style={{ position: 'absolute', left: lang === 'en' ? '0.75rem' : 'auto', right: lang === 'ur' ? '0.75rem' : 'auto', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder={t.searchCases} 
              className="search-input"
              style={{ paddingLeft: lang === 'en' ? '2.25rem' : '1rem', paddingRight: lang === 'ur' ? '2.25rem' : '1rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Filter size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            
            <select className="form-control" style={{ width: 'auto', padding: '0.35rem 1.5rem 0.35rem 0.75rem' }} value={filterOrg} onChange={e => setFilterOrg(e.target.value)}>
              <option value="all">{t.allClients}</option>
              {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>

            <select className="form-control" style={{ width: 'auto', padding: '0.35rem 1.5rem 0.35rem 0.75rem' }} value={filterStage} onChange={e => setFilterStage(e.target.value)}>
              <option value="all">{t.allStages}</option>
              <option value="Pleading">{lang === 'ur' ? 'درخواست گزار' : 'Pleading'}</option>
              <option value="Discovery">{lang === 'ur' ? 'انکشاف' : 'Discovery'}</option>
              <option value="Trial">{lang === 'ur' ? 'سماعت' : 'Trial'}</option>
              <option value="Appeal">{lang === 'ur' ? 'اپیل' : 'Appeal'}</option>
              <option value="Closed">{lang === 'ur' ? 'بند' : 'Closed'}</option>
            </select>

            <select className="form-control" style={{ width: 'auto', padding: '0.35rem 1.5rem 0.35rem 0.75rem' }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="all">{t.allPriorities}</option>
              <option value="High">{lang === 'ur' ? 'زیادہ' : 'High'}</option>
              <option value="Medium">{lang === 'ur' ? 'درمیانی' : 'Medium'}</option>
              <option value="Low">{lang === 'ur' ? 'کم' : 'Low'}</option>
            </select>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> {t.openCaseBtn}
        </button>
      </div>

      {/* Litigations Table Grid */}
      <div className="dashboard-panel">
        <div className="custom-table-wrapper">
          {filteredCases.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
              {t.noCasesFound}
            </p>
          ) : (
            <table className="custom-table" style={{ direction: lang === 'ur' ? 'rtl' : 'ltr' }}>
              <thead>
                <tr style={{ textAlign: lang === 'ur' ? 'right' : 'left' }}>
                  <th>{t.caseTitleCol}</th>
                  <th>{t.clientCol}</th>
                  <th>{t.branchCol}</th>
                  <th>{t.courtCol}</th>
                  <th>{t.stageCol}</th>
                  <th>{t.priorityCol}</th>
                  <th>{t.actionsCol}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => {
                  const org = organizations.find(o => o.id === c.orgId);
                  const branch = branches.find(b => b.id === c.branchId);
                  return (
                    <tr 
                      key={c.id} 
                      onClick={() => setSelectedCaseId(c.id)}
                      style={{ cursor: 'pointer', transition: 'background-color 0.15s' }}
                    >
                      <td>
                        <div className="case-cell-title">{c.title}</div>
                        <div className="case-cell-number">{c.caseNumber}</div>
                      </td>
                      <td>{org ? org.name : 'Unknown'}</td>
                      <td>{branch ? branch.name.split(' (')[0] : 'HQ'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.court}</td>
                      <td>
                        <span className="badge badge-medium">{lang === 'ur' && c.stage === 'Pleading' ? 'درخواست گزار' : lang === 'ur' && c.stage === 'Discovery' ? 'انکشاف' : lang === 'ur' && c.stage === 'Trial' ? 'سماعت' : c.stage}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${c.priority.toLowerCase()}`}>{getPriorityLabel(c.priority)}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem' }} onClick={e => e.stopPropagation()}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCaseId(c.id)} title={t.viewDetails}>
                            <ExternalLink size={12} />
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleStartEdit(c)} title={lang === 'ur' ? 'ترمیم کریں' : 'Edit Case'}>
                            <Edit3 size={12} />
                          </button>
                          <button className="btn btn-secondary btn-sm text-danger" onClick={(e) => handleDeleteCase(c.id, e)} title={t.deleteCase}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Case Details Modal */}
      {selectedCase && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', textAlign: lang === 'ur' ? 'right' : 'left' }}>
            <div className="modal-header" style={{ flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
              <div>
                <span className="badge badge-low" style={{ marginBottom: '0.25rem' }}>{selectedCase.caseNumber}</span>
                <h3 className="modal-title" style={{ fontSize: '1.25rem' }}>{selectedCase.title}</h3>
              </div>
              <button className="modal-close" onClick={() => { setSelectedCaseId(null); setIsEditing(false); }}>
                <X size={18} />
              </button>
            </div>
            
            {/* Modal Detail Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
              {[
                { id: 'overview', label: t.caseSummaryTab, icon: Info },
                { id: 'hearings', label: `${t.hearingsTab} (${caseHearings.length})`, icon: Calendar },
                { id: 'documents', label: `${t.documentsTab} (${caseDocs.length})`, icon: FileText },
                { id: 'tasks', label: `${t.tasksTab} (${caseTasks.length})`, icon: CheckSquare },
                { id: 'notes', label: `${t.notesTab} (${caseNotes.length})`, icon: StickyNote },
                { id: 'time', label: `${t.timeLogTab} (${caseTimeEntries.length})`, icon: Timer }
              ].map(tab => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDetailTab(tab.id)}
                    style={{
                      flex: '1 0 auto',
                      whiteSpace: 'nowrap',
                      padding: '0.75rem 1rem',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: activeDetailTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                      color: activeDetailTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                      fontWeight: activeDetailTab === tab.id ? '600' : '500',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    <TabIcon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="modal-body" style={{ minHeight: '350px' }}>
              
              {/* Tab 1: Overview */}
              {activeDetailTab === 'overview' && (
                isEditing ? (
                  <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* Case Title */}
                    <div className="form-group">
                      <label className="form-label">{lang === 'ur' ? 'مقدمہ کا عنوان' : 'Litigation Title'}</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required 
                        value={editCaseForm.title} 
                        onChange={e => setEditCaseForm({ ...editCaseForm, title: e.target.value })}
                      />
                    </div>

                    {/* Client & Branch */}
                    <div className="form-row" style={{ flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                      <div className="form-group">
                        <label className="form-label">{t.clientCol}</label>
                        <select 
                          className="form-control" 
                          required 
                          value={editCaseForm.orgId} 
                          onChange={e => {
                            const orgId = e.target.value;
                            const filtered = branches.filter(b => b.orgId === orgId);
                            setEditCaseForm({ ...editCaseForm, orgId, branchId: filtered[0]?.id || '' });
                          }}
                        >
                          {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">{t.branchCol}</label>
                        <select 
                          className="form-control" 
                          required 
                          value={editCaseForm.branchId} 
                          onChange={e => setEditCaseForm({ ...editCaseForm, branchId: e.target.value })}
                        >
                          {branches.filter(b => b.orgId === editCaseForm.orgId).map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Case Number & Court */}
                    <div className="form-row" style={{ flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                      <div className="form-group">
                        <label className="form-label">{lang === 'ur' ? 'فائل / مقدمہ نمبر' : 'Case / File Number'}</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          required 
                          value={editCaseForm.caseNumber} 
                          onChange={e => setEditCaseForm({ ...editCaseForm, caseNumber: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{lang === 'ur' ? 'عدالت کا نام' : 'Court Jurisdiction'}</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          required 
                          value={editCaseForm.court} 
                          onChange={e => setEditCaseForm({ ...editCaseForm, court: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Judge & Priority */}
                    <div className="form-row" style={{ flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                      <div className="form-group">
                        <label className="form-label">{lang === 'ur' ? 'جج کا نام' : 'Presiding Judge'}</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editCaseForm.judge} 
                          onChange={e => setEditCaseForm({ ...editCaseForm, judge: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{lang === 'ur' ? 'اہمیت / ترجیح' : 'Priority Level'}</label>
                        <select 
                          className="form-control" 
                          value={editCaseForm.priority} 
                          onChange={e => setEditCaseForm({ ...editCaseForm, priority: e.target.value })}
                        >
                          <option value="High">{lang === 'ur' ? 'زیادہ (High)' : 'High'}</option>
                          <option value="Medium">{lang === 'ur' ? 'درمیانی (Medium)' : 'Medium'}</option>
                          <option value="Low">{lang === 'ur' ? 'کم (Low)' : 'Low'}</option>
                        </select>
                      </div>
                    </div>

                    {/* Brief Description */}
                    <div className="form-group">
                      <label className="form-label">{lang === 'ur' ? 'مقدمہ کی تفصیل' : 'Brief Description'}</label>
                      <textarea 
                        className="form-control" 
                        rows={3} 
                        value={editCaseForm.description} 
                        onChange={e => setEditCaseForm({ ...editCaseForm, description: e.target.value })}
                      />
                    </div>

                    {/* Save / Cancel buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                        {lang === 'ur' ? 'منسوخ کریں' : 'Cancel'}
                      </button>
                      <button type="submit" className="btn btn-primary">
                        {lang === 'ur' ? 'تبدیلیاں محفوظ کریں' : 'Save Changes'}
                      </button>
                    </div>

                  </form>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>{t.briefDesc}</h4>
                      <p style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>{selectedCase.description || 'No description.'}</p>
                    </div>

                    <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                      <div className="info-item">
                        <span className="info-label">{t.clientCol}</span>
                        <span className="info-value">{caseOrg ? caseOrg.name : 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">{t.branchCol}</span>
                        <span className="info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: lang === 'ur' ? 'flex-end' : 'initial', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                          <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                          {caseBranch ? caseBranch.name : 'HQ'}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">{t.courtLabel}</span>
                        <span className="info-value">{selectedCase.court || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">{t.judgeLabel}</span>
                        <span className="info-value">{selectedCase.judge || 'Unassigned'}</span>
                      </div>
                    </div>

                    <div className="form-row" style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t.litPhaseLabel}</label>
                        <select 
                          className="form-control" 
                          value={selectedCase.stage} 
                          onChange={e => handleStageChange(selectedCase.id, e.target.value)}
                        >
                          <option value="Pleading">{lang === 'ur' ? 'درخواست گزار' : 'Pleading'}</option>
                          <option value="Discovery">{lang === 'ur' ? 'انکشاف' : 'Discovery'}</option>
                          <option value="Trial">{lang === 'ur' ? 'سماعت' : 'Trial'}</option>
                          <option value="Appeal">{lang === 'ur' ? 'اپیل' : 'Appeal'}</option>
                          <option value="Closed">{lang === 'ur' ? 'بند' : 'Closed'}</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t.statusLabel}</label>
                        <select 
                          className="form-control" 
                          value={selectedCase.status} 
                          onChange={e => handleStatusChange(selectedCase.id, e.target.value)}
                        >
                          <option value="Active">{lang === 'ur' ? 'فعال' : 'Active'}</option>
                          <option value="Pending">{lang === 'ur' ? 'زیر التواء' : 'Pending'}</option>
                          <option value="Closed">{lang === 'ur' ? 'بند' : 'Closed'}</option>
                        </select>
                      </div>
                    </div>

                    {/* Edit Details Trigger Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => {
                          setEditCaseForm({
                            title: selectedCase.title,
                            description: selectedCase.description || '',
                            caseNumber: selectedCase.caseNumber,
                            court: selectedCase.court || '',
                            judge: selectedCase.judge || '',
                            priority: selectedCase.priority,
                            orgId: selectedCase.orgId,
                            branchId: selectedCase.branchId
                          });
                          setIsEditing(true);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}
                      >
                        <Edit3 size={14} />
                        {lang === 'ur' ? 'مقدمہ میں ترمیم کریں' : 'Edit Case Details'}
                      </button>
                    </div>

                  </div>
                )
              )}

              {/* Tab 2: Hearings */}
              {activeDetailTab === 'hearings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Quick Add Hearing */}
                  <form onSubmit={handleAddQuickHearing} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <input 
                        type="text" 
                        placeholder={lang === 'ur' ? 'سماعت کا مقصد (مثلاً ٹرائل)' : 'Hearing purpose (e.g. Trial)'} 
                        className="form-control" 
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                        required
                        value={quickHearing.purpose}
                        onChange={e => setQuickHearing({...quickHearing, purpose: e.target.value})}
                      />
                    </div>
                    <div style={{ flex: '1 1 130px', minWidth: 0 }}>
                      <input
                        type="date"
                        className="form-control"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                        required
                        value={quickHearing.hearingDate}
                        onChange={e => setQuickHearing({...quickHearing, hearingDate: e.target.value})}
                      />
                    </div>
                    <div style={{ flex: '1 1 110px', minWidth: 0 }}>
                      <input
                        type="text"
                        placeholder="10:00 AM"
                        className="form-control"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                        value={quickHearing.time}
                        onChange={e => setQuickHearing({...quickHearing, time: e.target.value})}
                      />
                    </div>
                    <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                      <input
                        type="text"
                        placeholder={lang === 'ur' ? 'کمرہ نمبر' : 'Rm 301'}
                        className="form-control"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                        value={quickHearing.courtroom}
                        onChange={e => setQuickHearing({...quickHearing, courtroom: e.target.value})}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm">
                      {t.saveHearing}
                    </button>
                  </form>

                  {/* Hearings List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {caseHearings.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>{lang === 'ur' ? 'کوئی سماعت طے نہیں ہے۔' : 'No hearings scheduled.'}</p>
                    ) : (
                      caseHearings.map(h => {
                        const isEditingOutcome = outcomeEditId === h.id;
                        const outcome = h.outcome || 'Scheduled';
                        const badgeCls = OUTCOME_BADGE_CLASS[outcome] || 'badge-active';
                        return (
                          <div key={h.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                              <div style={{ minWidth: 0, flex: 1, textAlign: lang === 'ur' ? 'right' : 'left' }}>
                                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{h.purpose}</span>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', marginTop: '0.15rem', flexWrap: 'wrap', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}><Clock size={12} /> {h.hearingDate} at {h.time || 'TBD'}</span>
                                  <span>•</span>
                                  <span>{h.courtroom || 'No courtroom assigned'}</span>
                                </div>
                              </div>
                              <span className={`badge ${badgeCls}`} style={{ fontSize: '0.7rem', flexShrink: 0 }}>{getOutcomeLabel(outcome, t)}</span>
                            </div>

                            {h.notes && !isEditingOutcome && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-primary)', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)', borderInlineStart: '2px solid var(--primary)', textAlign: lang === 'ur' ? 'right' : 'left' }}>
                                {h.notes}
                              </div>
                            )}

                            {!isEditingOutcome ? (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}
                                  onClick={() => openOutcomeEditor(h)}
                                >
                                  <Edit3 size={11} /> {t.updateOutcome}
                                </button>
                              </div>
                            ) : (
                              <form onSubmit={(e) => saveOutcome(e, h.id)} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.5rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                                <select
                                  className="form-control"
                                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.82rem' }}
                                  value={outcomeDraft.outcome}
                                  onChange={e => setOutcomeDraft({ ...outcomeDraft, outcome: e.target.value })}
                                >
                                  {OUTCOME_KEYS.map(k => <option key={k} value={k}>{getOutcomeLabel(k, t)}</option>)}
                                </select>
                                <textarea
                                  className="form-control"
                                  rows={2}
                                  placeholder={t.outcomeNotesPlaceholder}
                                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.82rem', minHeight: '52px' }}
                                  value={outcomeDraft.notes}
                                  onChange={e => setOutcomeDraft({ ...outcomeDraft, notes: e.target.value })}
                                />
                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                                  <button type="button" className="btn btn-secondary btn-sm" onClick={cancelOutcomeEditor} style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}>
                                    {t.cancel}
                                  </button>
                                  <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                                    <Check size={11} /> {t.saveOutcome}
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Documents */}
              {activeDetailTab === 'documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Quick Add Doc */}
                  <form onSubmit={handleAddQuickDoc} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)', flexDirection: lang === 'ur' ? 'row-reverse' : 'row', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <input 
                        type="file" 
                        required 
                        className="form-control"
                        onChange={handleQuickFileChange}
                        style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <input 
                        type="text" 
                        placeholder={lang === 'ur' ? 'فائل کا نام...' : 'File name...'}
                        className="form-control" 
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                        required
                        value={quickDoc.name}
                        onChange={e => setQuickDoc({...quickDoc, name: e.target.value})}
                      />
                    </div>
                    <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                      <select
                        className="form-control"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                        value={quickDoc.category}
                        onChange={e => setQuickDoc({...quickDoc, category: e.target.value})}
                      >
                        <option value="Pleading">{t.pleading}</option>
                        <option value="Motion">{t.motion}</option>
                        <option value="Evidence">{t.evidence}</option>
                        <option value="Contract">{t.contract}</option>
                        <option value="Correspondence">{t.correspondence}</option>
                        <option value="Other">{t.other}</option>
                      </select>
                    </div>
                    <div style={{ flex: '0 1 100px', minWidth: 0 }}>
                      <input
                        type="text"
                        placeholder="Size"
                        className="form-control"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                        value={quickDoc.size}
                        onChange={e => setQuickDoc({...quickDoc, size: e.target.value})}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm">
                      {lang === 'ur' ? 'اپ لوڈ' : 'Upload'}
                    </button>
                  </form>

                  {/* Documents List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {caseDocs.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>{lang === 'ur' ? 'کیس فائل میں کوئی دستاویزات نہیں ہیں۔' : 'No documents stored.'}</p>
                    ) : (
                      caseDocs.map(d => (
                        <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                            <FileText size={16} style={{ color: 'var(--primary)' }} />
                            <div>
                              <div style={{ fontWeight: '500' }}>{d.name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{d.uploadDate} • {d.size}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                            <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>{getLocalizedCategory(d.category)}</span>
                            <button 
                              className="btn btn-secondary btn-sm" 
                              style={{ padding: '0.15rem 0.35rem', border: 'none' }}
                              onClick={(e) => handleDownloadFile(d, e)}
                              title={t.downloadFile}
                            >
                              <Download size={12} />
                            </button>
                            <button 
                              className="btn btn-secondary btn-sm text-danger" 
                              style={{ padding: '0.15rem 0.35rem', border: 'none' }}
                              onClick={() => {
                                if (window.confirm(lang === 'ur' ? "حذف کریں؟" : "Are you sure you want to delete this document?")) {
                                  db.deleteDocument(d.id);
                                  refreshDb();
                                }
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Tasks */}
              {activeDetailTab === 'tasks' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Quick Add Task */}
                  <form onSubmit={handleAddQuickTask} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <input 
                        type="text" 
                        placeholder={lang === 'ur' ? 'کام کی تفصیل (مثلاً فائل بریف)' : 'Action Item (e.g. File brief)'} 
                        className="form-control" 
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                        required
                        value={quickTask.title}
                        onChange={e => setQuickTask({...quickTask, title: e.target.value})}
                      />
                    </div>
                    <div style={{ flex: '1 1 130px', minWidth: 0 }}>
                      <input
                        type="date"
                        className="form-control"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                        required
                        value={quickTask.dueDate}
                        onChange={e => setQuickTask({...quickTask, dueDate: e.target.value})}
                      />
                    </div>
                    <div style={{ flex: '1 1 130px', minWidth: 0 }}>
                      <input
                        type="text"
                        placeholder={lang === 'ur' ? 'تفویض کردہ' : 'Assign To'}
                        className="form-control"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                        value={quickTask.assignedTo}
                        onChange={e => setQuickTask({...quickTask, assignedTo: e.target.value})}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm">
                      {t.saveTask}
                    </button>
                  </form>

                  {/* Task list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {caseTasks.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>{lang === 'ur' ? 'کوئی کام درج نہیں ہے۔' : 'No tasks registered.'}</p>
                    ) : (
                      caseTasks.map(t => (
                        <div 
                          key={t.id} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            padding: '0.75rem', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: t.status === 'Completed' ? 'rgba(0,0,0,0.01)' : 'var(--bg-secondary)',
                            opacity: t.status === 'Completed' ? 0.6 : 1,
                            flexDirection: lang === 'ur' ? 'row-reverse' : 'row'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                            <input 
                              type="checkbox" 
                              checked={t.status === 'Completed'} 
                              onChange={() => handleToggleTask(t.id, t.status)}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <div style={{ textAlign: lang === 'ur' ? 'right' : 'left' }}>
                              <span style={{ 
                                fontSize: '0.875rem', 
                                fontWeight: '500',
                                textDecoration: t.status === 'Completed' ? 'line-through' : 'none' 
                              }}>
                                {t.title}
                              </span>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', marginTop: '0.15rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                                <span>Due: {t.dueDate}</span>
                                {t.assignedTo && <span>• Assignee: {t.assignedTo}</span>}
                              </div>
                            </div>
                          </div>
                          <span className={`badge badge-${t.priority.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{getPriorityLabel(t.priority)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 5: Notes */}
              {activeDetailTab === 'notes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                  {/* Add Note form */}
                  <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.85rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)' }}>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder={t.noteBodyPlaceholder}
                      style={{ padding: '0.5rem 0.65rem', fontSize: '0.85rem', minHeight: '70px' }}
                      required
                      value={noteDraft.body}
                      onChange={e => setNoteDraft({ ...noteDraft, body: e.target.value })}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={t.noteAuthorPlaceholder}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', flex: '1 1 160px', minWidth: 0 }}
                        value={noteDraft.author}
                        onChange={e => setNoteDraft({ ...noteDraft, author: e.target.value })}
                      />
                      <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                        <Plus size={13} /> {t.addNoteBtn}
                      </button>
                    </div>
                  </form>

                  {/* Notes list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {caseNotes.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0', fontSize: '0.9rem', fontStyle: 'italic' }}>{t.noNotes}</p>
                    ) : (
                      caseNotes.map(n => (
                        <div
                          key={n.id}
                          style={{
                            padding: '0.75rem 0.85rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--bg-secondary)',
                            textAlign: lang === 'ur' ? 'right' : 'left'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                              <span>{new Date(n.createdAt).toLocaleString(lang === 'ur' ? 'ur-PK' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                              {n.author && <span>• {n.author}</span>}
                            </div>
                            <button
                              className="btn btn-secondary btn-sm text-danger"
                              style={{ padding: '0.15rem 0.35rem', border: 'none' }}
                              onClick={() => handleDeleteNote(n.id)}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                          <div style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.45 }}>
                            {n.body}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 6: Time Log */}
              {activeDetailTab === 'time' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                  {/* Quick add time entry */}
                  <form onSubmit={handleAddTimeEntry} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.85rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)' }}>
                    <div style={{ flex: '1 1 130px', minWidth: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{t.timeEntryDate}</label>
                      <input
                        type="date"
                        className="form-control"
                        style={{ padding: '0.4rem 0.55rem', fontSize: '0.82rem' }}
                        required
                        value={timeDraft.date}
                        onChange={e => setTimeDraft({ ...timeDraft, date: e.target.value })}
                      />
                    </div>
                    <div style={{ flex: '0 1 90px', minWidth: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{t.timeEntryHours}</label>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        className="form-control"
                        style={{ padding: '0.4rem 0.55rem', fontSize: '0.82rem' }}
                        required
                        placeholder="1.5"
                        value={timeDraft.hours}
                        onChange={e => setTimeDraft({ ...timeDraft, hours: e.target.value })}
                      />
                    </div>
                    <div style={{ flex: '0 1 110px', minWidth: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{t.timeEntryRate}</label>
                      <input
                        type="number"
                        step="100"
                        min="0"
                        className="form-control"
                        style={{ padding: '0.4rem 0.55rem', fontSize: '0.82rem' }}
                        placeholder="5000"
                        value={timeDraft.rate}
                        onChange={e => setTimeDraft({ ...timeDraft, rate: e.target.value })}
                      />
                    </div>
                    <div style={{ flex: '2 1 180px', minWidth: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{t.timeEntryDescription}</label>
                      <input
                        type="text"
                        className="form-control"
                        style={{ padding: '0.4rem 0.55rem', fontSize: '0.82rem' }}
                        placeholder={t.timeEntryDescriptionPlaceholder}
                        value={timeDraft.description}
                        onChange={e => setTimeDraft({ ...timeDraft, description: e.target.value })}
                      />
                    </div>
                    <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{t.timeEntryAttorney}</label>
                      <input
                        type="text"
                        className="form-control"
                        style={{ padding: '0.4rem 0.55rem', fontSize: '0.82rem' }}
                        placeholder={t.timeEntryAttorneyPlaceholder}
                        value={timeDraft.attorneyName}
                        onChange={e => setTimeDraft({ ...timeDraft, attorneyName: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                        <Plus size={13} /> {t.saveTimeEntry}
                      </button>
                    </div>
                  </form>

                  {/* Totals strip */}
                  {caseTimeEntries.length > 0 && (
                    <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0.85rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>
                      <span><strong>{t.totalHours}:</strong> {caseTimeTotal.hours.toFixed(2)}</span>
                      <span><strong>{t.totalAmount}:</strong> {caseTimeTotal.amount.toLocaleString(lang === 'ur' ? 'ur-PK' : 'en-US')}</span>
                    </div>
                  )}

                  {/* Entries list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {caseTimeEntries.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0', fontSize: '0.9rem', fontStyle: 'italic' }}>{t.noTimeEntries}</p>
                    ) : (
                      caseTimeEntries.map(te => {
                        const amount = (Number(te.hours) || 0) * (Number(te.rate) || 0);
                        return (
                          <div
                            key={te.id}
                            style={{
                              padding: '0.65rem 0.85rem',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: te.invoiceId ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                              opacity: te.invoiceId ? 0.75 : 1,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.3rem',
                              textAlign: lang === 'ur' ? 'right' : 'left'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{te.description || '—'}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                  {te.date}{te.attorneyName && ` · ${te.attorneyName}`}
                                  {te.invoiceId && ` · ${t.invoiceStatusSent}`}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600, textAlign: lang === 'ur' ? 'left' : 'right' }}>
                                  {te.hours}h × {Number(te.rate).toLocaleString(lang === 'ur' ? 'ur-PK' : 'en-US')}
                                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{amount.toLocaleString(lang === 'ur' ? 'ur-PK' : 'en-US')} {te.currency || 'PKR'}</div>
                                </div>
                                {!te.invoiceId && (
                                  <button
                                    className="btn btn-secondary btn-sm text-danger"
                                    style={{ padding: '0.15rem 0.35rem', border: 'none' }}
                                    onClick={() => handleDeleteTimeEntry(te.id)}
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between', flexDirection: lang === 'ur' ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                onClick={handlePrintCase}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}
              >
                <Printer size={15} /> {t.printCaseBtn}
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedCaseId(null)}>{t.closeCaseFile}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Case Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '650px', textAlign: lang === 'ur' ? 'right' : 'left' }}>
            <div className="modal-header" style={{ flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
              <h3 className="modal-title">{t.openNewCaseTitle}</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddCase}>
              <div className="modal-body">
                
                <div className="form-row" style={{ flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                  <div className="form-group">
                    <label className="form-label">{t.clientCol}</label>
                    <select 
                      required 
                      className="form-control"
                      value={newCase.orgId}
                      onChange={e => setNewCase({...newCase, orgId: e.target.value})}
                    >
                      <option value="">-- Select Client --</option>
                      {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">{t.branchCol}</label>
                    <select 
                      required 
                      className="form-control"
                      disabled={!newCase.orgId}
                      value={newCase.branchId}
                      onChange={e => setNewCase({...newCase, branchId: e.target.value})}
                    >
                      <option value="">-- Select Branch --</option>
                      {formBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row" style={{ flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                  <div className="form-group">
                    <label className="form-label">{t.caseNumberLabel}</label>
                    <input 
                      type="text" 
                      required 
                      className="form-control"
                      value={newCase.caseNumber}
                      onChange={e => setNewCase({...newCase, caseNumber: e.target.value})}
                      placeholder="e.g. LHC-WP-2026-901"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.priorityLabel}</label>
                    <select 
                      className="form-control"
                      value={newCase.priority}
                      onChange={e => setNewCase({...newCase, priority: e.target.value})}
                    >
                      <option value="High">{lang === 'ur' ? 'زیادہ' : 'High'}</option>
                      <option value="Medium">{lang === 'ur' ? 'درمیانی' : 'Medium'}</option>
                      <option value="Low">{lang === 'ur' ? 'کم' : 'Low'}</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t.caseTitleLabel}</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control"
                    value={newCase.title}
                    onChange={e => setNewCase({...newCase, title: e.target.value})}
                    placeholder={lang === 'ur' ? 'مثلاً سسٹمز لمیٹڈ بنام پنجاب آئی ٹی بورڈ' : 'e.g. Systems Limited v. PITB (Tender Dispute)'}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t.caseDescLabel}</label>
                  <textarea 
                    className="form-control"
                    value={newCase.description}
                    onChange={e => setNewCase({...newCase, description: e.target.value})}
                    placeholder="Provide case description..."
                  />
                </div>

                <div className="form-row" style={{ flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                  <div className="form-group">
                    <label className="form-label">{t.courtJurisdictLabel}</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={newCase.court}
                      onChange={e => setNewCase({...newCase, court: e.target.value})}
                      placeholder={lang === 'ur' ? 'مثلاً لاہور ہائی کورٹ' : 'e.g. Lahore High Court'}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.presidingJudgeLabel}</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={newCase.judge}
                      onChange={e => setNewCase({...newCase, judge: e.target.value})}
                      placeholder={lang === 'ur' ? 'مثلاً مسٹر جسٹس شاہد کریم' : 'e.g. Mr. Justice Shahid Karim'}
                    />
                  </div>
                </div>

              </div>
              <div className="modal-footer" style={{ justifyContent: lang === 'ur' ? 'flex-start' : 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>{t.cancel}</button>
                <button type="submit" className="btn btn-primary">{t.initializeCaseBtn}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print-only report (hidden on screen, full report when printing) */}
      {selectedCase && (
        <div className="case-print-report" aria-hidden="true" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
          <div className="print-header">
            <h1>{t.caseReportTitle}</h1>
            <div className="print-meta">
              <span>{t.generatedOn}: {new Date().toLocaleString(lang === 'ur' ? 'ur-PK' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
          </div>

          <section className="print-section">
            <h2>{selectedCase.title}</h2>
            <div className="print-kv-grid">
              <div><strong>{lang === 'ur' ? 'فائل / مقدمہ نمبر' : 'Case / File Number'}:</strong> {selectedCase.caseNumber}</div>
              <div><strong>{t.clientCol}:</strong> {caseOrg ? caseOrg.name : '—'}</div>
              <div><strong>{t.branchCol}:</strong> {caseBranch ? caseBranch.name : '—'}</div>
              <div><strong>{t.courtLabel}:</strong> {selectedCase.court || '—'}</div>
              <div><strong>{t.judgeLabel}:</strong> {selectedCase.judge || '—'}</div>
              <div><strong>{t.litPhaseLabel}:</strong> {selectedCase.stage}</div>
              <div><strong>{t.statusLabel}:</strong> {selectedCase.status}</div>
              <div><strong>{t.priorityLabel}:</strong> {getPriorityLabel(selectedCase.priority)}</div>
            </div>
            {selectedCase.description && (
              <p style={{ marginTop: '0.6rem' }}><strong>{t.briefDesc}:</strong> {selectedCase.description}</p>
            )}
          </section>

          <section className="print-section">
            <h3>{t.hearingsTab} ({caseHearings.length})</h3>
            {caseHearings.length === 0 ? <p className="print-empty">—</p> : (
              <table className="print-table">
                <thead>
                  <tr>
                    <th>{lang === 'ur' ? 'تاریخ' : 'Date'}</th>
                    <th>{t.time}</th>
                    <th>{t.purpose}</th>
                    <th>{t.courtroom}</th>
                    <th>{t.outcomeLabel}</th>
                    <th>{t.hearingNotes}</th>
                  </tr>
                </thead>
                <tbody>
                  {caseHearings.map(h => (
                    <tr key={h.id}>
                      <td>{h.hearingDate}</td>
                      <td>{h.time || '—'}</td>
                      <td>{h.purpose}</td>
                      <td>{h.courtroom || '—'}</td>
                      <td>{getOutcomeLabel(h.outcome || 'Scheduled', t)}</td>
                      <td>{h.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="print-section">
            <h3>{t.tasksTab} ({caseTasks.length})</h3>
            {caseTasks.length === 0 ? <p className="print-empty">—</p> : (
              <table className="print-table">
                <thead>
                  <tr>
                    <th>{lang === 'ur' ? 'کام' : 'Task'}</th>
                    <th>{t.dueDateCol}</th>
                    <th>{t.priorityLabel}</th>
                    <th>{t.statusLabel}</th>
                    <th>{t.assignedToLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {caseTasks.map(tk => (
                    <tr key={tk.id}>
                      <td>{tk.title}</td>
                      <td>{tk.dueDate}</td>
                      <td>{getPriorityLabel(tk.priority)}</td>
                      <td>{tk.status}</td>
                      <td>{tk.assignedTo || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="print-section">
            <h3>{t.documentsTab} ({caseDocs.length})</h3>
            {caseDocs.length === 0 ? <p className="print-empty">—</p> : (
              <table className="print-table">
                <thead>
                  <tr>
                    <th>{t.fileNameCol}</th>
                    <th>{t.classificationCol}</th>
                    <th>{t.fileSizeCol}</th>
                    <th>{t.uploadDateCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {caseDocs.map(d => (
                    <tr key={d.id}>
                      <td>{d.name}</td>
                      <td>{getLocalizedCategory(d.category)}</td>
                      <td>{d.size}</td>
                      <td>{d.uploadDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="print-section">
            <h3>{t.notesTab} ({caseNotes.length})</h3>
            {caseNotes.length === 0 ? <p className="print-empty">{t.noNotes}</p> : (
              <div className="print-notes-list">
                {caseNotes.map(n => (
                  <div key={n.id} className="print-note">
                    <div className="print-note-meta">
                      <span>{new Date(n.createdAt).toLocaleString(lang === 'ur' ? 'ur-PK' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      {n.author && <span> · {n.author}</span>}
                    </div>
                    <div className="print-note-body">{n.body}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
