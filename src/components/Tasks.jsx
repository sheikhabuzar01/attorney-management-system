import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Search, 
  Calendar, 
  User, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { db } from '../db/mockDb';
import { translations } from '../db/translations';

export default function Tasks({ lang, dbData, refreshDb, setSelectedCaseId, setActiveTab }) {
  const { tasks, cases } = dbData;
  const t = translations[lang];

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCase, setFilterCase] = useState('all');
  const [dragOverColumn, setDragOverColumn] = useState(null); // 'Pending' | 'Completed' | null
  const [dragOverTaskId, setDragOverTaskId] = useState(null);

  const [newTask, setNewTask] = useState({
    caseId: '',
    title: '',
    dueDate: '',
    assignedTo: '',
    priority: 'Medium',
    status: 'Pending'
  });

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e, col) => {
    e.preventDefault();
    if (dragOverColumn !== col) {
      setDragOverColumn(col);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      db.updateTask(taskId, { status: newStatus });
      db.moveTaskToEnd(taskId);
      refreshDb();
    }
    setDragOverColumn(null);
  };

  const handleCardDrop = (e, targetTaskId) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetTaskId) return;

    const targetTask = tasks.find(t => t.id === targetTaskId);
    const draggedTask = tasks.find(t => t.id === draggedId);
    if (!targetTask || !draggedTask) return;

    if (draggedTask.status !== targetTask.status) {
      db.updateTask(draggedId, { status: targetTask.status });
    }

    db.reorderTasks(draggedId, targetTaskId);
    refreshDb();
    setDragOverTaskId(null);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.caseId || !newTask.title || !newTask.dueDate) return;
    db.addTask(newTask);
    setNewTask({ caseId: '', title: '', dueDate: '', assignedTo: '', priority: 'Medium', status: 'Pending' });
    setShowAddModal(false);
    refreshDb();
  };

  const handleToggleTask = (id, currentStatus) => {
    db.updateTask(id, { status: currentStatus === 'Completed' ? 'Pending' : 'Completed' });
    refreshDb();
  };

  const handleDeleteTask = (id) => {
    if (window.confirm(lang === 'ur' ? "کیا آپ اس کام کو حذف کرنا چاہتے ہیں؟" : "Are you sure you want to delete this task?")) {
      db.deleteTask(id);
      refreshDb();
    }
  };

  const handleCaseClick = (caseId) => {
    setSelectedCaseId(caseId);
    setActiveTab('cases');
  };

  const getCaseName = (caseId) => {
    const c = cases.find(c => c.id === caseId);
    return c ? c.title : (lang === 'ur' ? 'عام کمپنی فائل' : 'General File');
  };

  const getPriorityLabel = (priority) => {
    if (lang === 'ur') {
      if (priority === 'High') return 'زیادہ';
      if (priority === 'Medium') return 'درمیانی';
      return 'کم';
    }
    return priority;
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.assignedTo && t.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCase = filterCase === 'all' || t.caseId === filterCase;
    return matchesSearch && matchesCase;
  });

  const pendingTasks = filteredTasks.filter(t => t.status === 'Pending');
  const completedTasks = filteredTasks.filter(t => t.status === 'Completed');

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
        <div style={{ display: 'flex', flexGrow: 1, gap: '0.75rem', flexWrap: 'wrap', minWidth: 0 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: '180px' }}>
            <Search size={16} style={{ position: 'absolute', left: lang === 'en' ? '0.75rem' : 'auto', right: lang === 'ur' ? '0.75rem' : 'auto', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder={lang === 'ur' ? 'ٹاسک، تفویض کردہ وکیل تلاش کریں...' : 'Search action items, assignees...'} 
              className="search-input"
              style={{ paddingLeft: lang === 'en' ? '2.25rem' : '1rem', paddingRight: lang === 'ur' ? '2.25rem' : '1rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select 
            className="form-control" 
            style={{ width: 'auto', padding: '0.35rem 1.5rem 0.35rem 0.75rem' }} 
            value={filterCase} 
            onChange={e => setFilterCase(e.target.value)}
          >
            <option value="all">{lang === 'ur' ? 'تمام مقدمات' : 'All Litigations'}</option>
            {cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> {t.addTaskBtn}
        </button>
      </div>

      {/* Kanban Board Layout */}
      <div className="kanban-board" style={{ direction: lang === 'ur' ? 'rtl' : 'ltr' }}>
        
        {/* Pending tasks column */}
        <div 
          className="kanban-column" 
          onDragOver={(e) => handleDragOver(e, 'Pending')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'Pending')}
          style={{ 
            textAlign: lang === 'ur' ? 'right' : 'left',
            border: dragOverColumn === 'Pending' ? '2px dashed var(--primary)' : '1px solid var(--border-color)',
            backgroundColor: dragOverColumn === 'Pending' ? 'var(--primary-light)' : 'var(--bg-primary)',
            transition: 'all var(--transition-fast)'
          }}
        >
          <div className="kanban-column-header" style={{ borderBottom: '2px solid var(--warning)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
              <AlertCircle size={18} style={{ color: 'var(--warning)' }} />
              {t.pending} ({pendingTasks.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '300px' }}>
            {pendingTasks.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0', fontSize: '0.9rem', fontStyle: 'italic' }}>
                {lang === 'ur' ? 'کوئی زیر التواء ٹاسک نہیں ہے۔' : 'No active tasks pending.'}
              </p>
            ) : (
              pendingTasks.map((t) => (
                <div 
                  key={t.id} 
                  className="task-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, t.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragOverTaskId !== t.id) setDragOverTaskId(t.id);
                  }}
                  onDragLeave={() => setDragOverTaskId(null)}
                  onDrop={(e) => handleCardDrop(e, t.id)}
                  style={{
                    border: dragOverTaskId === t.id ? '2px dashed var(--primary)' : '1px solid var(--border-color)',
                    transform: dragOverTaskId === t.id ? 'scale(1.02)' : 'none',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div className="task-card-header" style={{ flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                      <input 
                        type="checkbox" 
                        checked={false} 
                        onChange={() => handleToggleTask(t.id, t.status)} 
                        style={{ marginTop: '0.2rem', cursor: 'pointer' }}
                      />
                      <span className="task-card-title">{t.title}</span>
                    </div>
                    <span className={`badge badge-${t.priority.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{getPriorityLabel(t.priority)}</span>
                  </div>

                  <div 
                    style={{ fontSize: '0.75rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: '500', textAlign: lang === 'ur' ? 'right' : 'left' }}
                    onClick={() => handleCaseClick(t.caseId)}
                  >
                    {getCaseName(t.caseId)}
                  </div>

                  <div className="task-card-footer" style={{ flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                      <Calendar size={12} /> {lang === 'ur' ? 'آخری تاریخ' : 'Due'}: {t.dueDate}
                    </span>
                    {t.assignedTo && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                        <User size={12} /> {t.assignedTo}
                      </span>
                    )}
                    <button 
                      className="btn btn-secondary btn-sm text-danger" 
                      style={{ padding: '0.15rem 0.35rem', border: 'none' }}
                      onClick={() => handleDeleteTask(t.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed tasks column */}
        <div 
          className="kanban-column" 
          onDragOver={(e) => handleDragOver(e, 'Completed')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'Completed')}
          style={{ 
            textAlign: lang === 'ur' ? 'right' : 'left',
            border: dragOverColumn === 'Completed' ? '2px dashed var(--primary)' : '1px solid var(--border-color)',
            backgroundColor: dragOverColumn === 'Completed' ? 'var(--primary-light)' : 'var(--bg-primary)',
            transition: 'all var(--transition-fast)'
          }}
        >
          <div className="kanban-column-header" style={{ borderBottom: '2px solid var(--success)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
              {t.completed} ({completedTasks.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '300px' }}>
            {completedTasks.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0', fontSize: '0.9rem', fontStyle: 'italic' }}>
                {lang === 'ur' ? 'مکمل شدہ کام یہاں نظر آئیں گے۔' : 'Completed items will list here.'}
              </p>
            ) : (
              completedTasks.map((t) => (
                <div 
                  key={t.id} 
                  className="task-card" 
                  style={{ 
                    opacity: 0.75, 
                    backgroundColor: 'var(--bg-primary)',
                    border: dragOverTaskId === t.id ? '2px dashed var(--primary)' : '1px solid var(--border-color)',
                    transform: dragOverTaskId === t.id ? 'scale(1.02)' : 'none',
                    transition: 'all var(--transition-fast)'
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, t.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragOverTaskId !== t.id) setDragOverTaskId(t.id);
                  }}
                  onDragLeave={() => setDragOverTaskId(null)}
                  onDrop={(e) => handleCardDrop(e, t.id)}
                >
                  <div className="task-card-header" style={{ flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                      <input 
                        type="checkbox" 
                        checked={true} 
                        onChange={() => handleToggleTask(t.id, t.status)} 
                        style={{ marginTop: '0.2rem', cursor: 'pointer' }}
                      />
                      <span className="task-card-title" style={{ textDecoration: 'line-through' }}>{t.title}</span>
                    </div>
                  </div>

                  <div 
                    style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', textAlign: lang === 'ur' ? 'right' : 'left' }}
                    onClick={() => handleCaseClick(t.caseId)}
                  >
                    {getCaseName(t.caseId)}
                  </div>

                  <div className="task-card-footer" style={{ flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                    <span>{lang === 'ur' ? 'آخری تاریخ' : 'Due'}: {t.dueDate}</span>
                    <button 
                      className="btn btn-secondary btn-sm text-danger" 
                      style={{ padding: '0.15rem 0.35rem', border: 'none' }}
                      onClick={() => handleDeleteTask(t.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ textAlign: lang === 'ur' ? 'right' : 'left' }}>
            <div className="modal-header" style={{ flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
              <h3 className="modal-title">{lang === 'ur' ? 'نیا کام شامل کریں' : 'Create Action Item'}</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{lang === 'ur' ? 'مقدمہ منتخب کریں' : 'Link to Case File'}</label>
                  <select 
                    required 
                    className="form-control"
                    value={newTask.caseId}
                    onChange={e => setNewTask({...newTask, caseId: e.target.value})}
                  >
                    <option value="">{t.associatedCaseLabel}</option>
                    {cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t.actionItemLabel}</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control"
                    placeholder="e.g. Schedule deposition, File reply brief"
                    value={newTask.title}
                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                  />
                </div>

                <div className="form-row" style={{ flexDirection: lang === 'ur' ? 'row-reverse' : 'row' }}>
                  <div className="form-group">
                    <label className="form-label">{t.dueDateCol}</label>
                    <input 
                      type="date" 
                      required 
                      className="form-control"
                      value={newTask.dueDate}
                      onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.priorityLabel}</label>
                    <select 
                      className="form-control"
                      value={newTask.priority}
                      onChange={e => setNewTask({...newTask, priority: e.target.value})}
                    >
                      <option value="High">{lang === 'ur' ? 'زیادہ' : 'High'}</option>
                      <option value="Medium">{lang === 'ur' ? 'درمیانی' : 'Medium'}</option>
                      <option value="Low">{lang === 'ur' ? 'کم' : 'Low'}</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t.assignedToLabel}</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g. Associate counsel, Lead partner"
                    value={newTask.assignedTo}
                    onChange={e => setNewTask({...newTask, assignedTo: e.target.value})}
                  />
                </div>

              </div>
              <div className="modal-footer" style={{ justifyContent: lang === 'ur' ? 'flex-start' : 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>{t.cancel}</button>
                <button type="submit" className="btn btn-primary">{t.saveTask}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
