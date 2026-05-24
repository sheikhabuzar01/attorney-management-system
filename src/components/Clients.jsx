import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  User, 
  Plus, 
  FileText, 
  Scale, 
  Trash2, 
  Edit3,
  X
} from 'lucide-react';
import { db } from '../db/mockDb';
import { translations } from '../db/translations';

export default function Clients({ lang, dbData, refreshDb }) {
  const { organizations, branches, cases } = dbData;
  const t = translations[lang];

  const [selectedOrgId, setSelectedOrgId] = useState(organizations[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail'
  
  // Modals state
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);

  // Form states
  const [newOrg, setNewOrg] = useState({ name: '', industry: '', taxId: '', primaryContact: '', email: '', phone: '' });
  const [newBranch, setNewBranch] = useState({ name: '', city: '', address: '', contactPerson: '', email: '' });

  // Filter organizations
  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOrg = organizations.find(o => o.id === selectedOrgId) || organizations[0];
  const orgBranches = selectedOrg ? branches.filter(b => b.orgId === selectedOrg.id) : [];
  const orgCases = selectedOrg ? cases.filter(c => c.orgId === selectedOrg.id) : [];

  const handleAddOrg = (e) => {
    e.preventDefault();
    if (!newOrg.name) return;
    const added = db.addOrganization(newOrg);
    setNewOrg({ name: '', industry: '', taxId: '', primaryContact: '', email: '', phone: '' });
    setShowOrgModal(false);
    setSelectedOrgId(added.id);
    refreshDb();
  };

  const handleAddBranch = (e) => {
    e.preventDefault();
    if (!newBranch.name || !selectedOrgId) return;
    db.addBranch({ orgId: selectedOrgId, ...newBranch });
    setNewBranch({ name: '', city: '', address: '', contactPerson: '', email: '' });
    setShowBranchModal(false);
    refreshDb();
  };

  const handleDeleteOrg = (id) => {
    if (window.confirm(lang === 'ur' ? "کیا آپ اس کلائنٹ کمپنی کو حذف کرنا چاہتے ہیں؟ اس سے تمام شاخیں اور مقدمات بھی حذف ہو جائیں گے۔" : "Are you sure you want to delete this company? This will also delete all associated branches, cases, documents, hearings, and tasks.")) {
      db.deleteOrganization(id);
      const remaining = organizations.filter(o => o.id !== id);
      setSelectedOrgId(remaining[0]?.id || null);
      refreshDb();
    }
  };

  const handleDeleteBranch = (branchId) => {
    if (window.confirm(lang === 'ur' ? "کیا آپ اس برانچ کو حذف کرنا چاہتے ہیں؟" : "Are you sure you want to delete this branch? All cases under this branch will also be deleted.")) {
      db.deleteBranch(branchId);
      refreshDb();
    }
  };

  const getPriorityLabel = (priority) => {
    if (lang === 'ur') {
      if (priority === 'High') return 'زیادہ';
      if (priority === 'Medium') return 'درمیانی';
      return 'کم';
    }
    return priority;
  };

  return (
    <div className="split-pane">
      {/* Left Pane: Organization Search and List */}
      <div className={`pane-list ${mobileView === 'detail' ? 'hide-on-mobile' : ''}`}>
        <div className="pane-search-bar">
          <input 
            type="text" 
            placeholder={lang === 'ur' ? 'کلائنٹس تلاش کریں...' : 'Search clients...'} 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => setShowOrgModal(true)} title={t.addClientBtn}>
            <Plus size={16} />
          </button>
        </div>

        <div className="pane-scrollable-items">
          {filteredOrgs.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>{t.noClients}</p>
          ) : (
            filteredOrgs.map((org) => {
              const activeCases = cases.filter(c => c.orgId === org.id && c.status === 'Active').length;
              return (
                <div 
                  key={org.id} 
                  className={`list-item-card ${selectedOrgId === org.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedOrgId(org.id);
                    setMobileView('detail');
                  }}
                  style={{ textAlign: lang === 'ur' ? 'right' : 'left' }}
                >
                  <div className="list-item-title">{org.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                    <span className="list-item-subtitle">{org.industry}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary)' }}>
                      {activeCases} {lang === 'ur' ? 'فعال مقدمات' : 'Active Cases'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane: Details, Branches, and Litigations */}
      <div className={`pane-detail ${mobileView === 'list' ? 'hide-on-mobile' : ''}`} style={{ textAlign: lang === 'ur' ? 'right' : 'left' }}>
        {selectedOrg ? (
          <>
            {/* Mobile Back Button */}
            <button 
              className="btn btn-secondary btn-sm show-on-mobile mobile-back-btn" 
              onClick={() => setMobileView('list')}
              style={{ display: 'none', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem', width: 'fit-content' }}
            >
              &larr; {lang === 'ur' ? 'پیچھے' : 'Back'}
            </button>

            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem' }}>
                  {selectedOrg.name}
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{selectedOrg.industry}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className="badge badge-active" style={{ height: 'fit-content' }}>
                  {lang === 'ur' && selectedOrg.status === 'Active' ? 'فعال' : selectedOrg.status}
                </span>
                <button 
                  className="btn btn-danger btn-sm" 
                  onClick={() => handleDeleteOrg(selectedOrg.id)}
                  title="Delete Client"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Profile Info */}
            <div className="detail-section">
              <h3 className="detail-section-title">
                <Building2 size={18} />
                {lang === 'ur' ? 'کارپوریٹ رجسٹریشن کی تفصیلات' : 'Corporate Registry Details'}
              </h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">{t.taxIdLabel}</span>
                  <span className="info-value">{selectedOrg.taxId || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t.primaryContact}</span>
                  <span className="info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <User size={14} style={{ color: 'var(--text-muted)' }} />
                    {selectedOrg.primaryContact}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t.contactEmail}</span>
                  <span className="info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                    {selectedOrg.email}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t.contactPhone}</span>
                  <span className="info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                    {selectedOrg.phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Branches list */}
            <div className="detail-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="detail-section-title" style={{ margin: 0 }}>
                  <MapPin size={18} />
                  {t.branchesHeader}
                </h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowBranchModal(true)}>
                  <Plus size={14} /> {t.addBranchBtn}
                </button>
              </div>

              {orgBranches.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                  {t.noBranches}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {orgBranches.map((branch) => {
                    const branchCases = orgCases.filter(c => c.branchId === branch.id);
                    return (
                      <div 
                        key={branch.id} 
                        style={{ 
                          border: '1px solid var(--border-color)', 
                          borderRadius: 'var(--radius-md)', 
                          padding: '1.25rem',
                          backgroundColor: 'var(--bg-primary)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ fontWeight: '600', fontSize: '1rem' }}>{branch.name}</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                              <MapPin size={12} /> {branch.address}, {branch.city}
                            </p>
                          </div>
                          <button 
                            className="btn btn-secondary btn-sm text-danger" 
                            style={{ padding: '0.25rem 0.5rem' }} 
                            onClick={() => handleDeleteBranch(branch.id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                          <div>{lang === 'ur' ? 'نمائندہ رابطہ' : 'Contact'}: <strong style={{ color: 'var(--text-primary)' }}>{branch.contactPerson}</strong></div>
                          <div>{lang === 'ur' ? 'ای میل' : 'Email'}: <strong style={{ color: 'var(--text-primary)' }}>{branch.email}</strong></div>
                        </div>

                        {/* Cases under branch */}
                        {branchCases.length > 0 && (
                          <div style={{ marginTop: '0.75rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                              {lang === 'ur' ? 'شاخ کے مقدمات' : 'Branch Litigations'} ({branchCases.length})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {branchCases.map(bc => (
                                <div key={bc.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.35rem 0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                  <span style={{ fontWeight: '500' }}>{bc.title}</span>
                                  <span className={`badge badge-${bc.priority.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>{getPriorityLabel(bc.priority)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cases directory */}
            <div className="detail-section">
              <h3 className="detail-section-title">
                <Scale size={18} />
                {lang === 'ur' ? 'کلائنٹ کے مقدمات کی فہرست' : 'Global Litigation Directory'}
              </h3>
              {orgCases.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                  {lang === 'ur' ? 'اس کلائنٹ کے لیے کوئی فعال مقدمہ درج نہیں ہے۔' : 'No disputes or active lawsuits recorded for this client.'}
                </p>
              ) : (
                <div className="custom-table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>{t.caseTitleCol}</th>
                        <th>{t.branchCol}</th>
                        <th>{t.priorityCol}</th>
                        <th>{t.statusLabel}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orgCases.map((c) => {
                        const br = branches.find(b => b.id === c.branchId);
                        return (
                          <tr key={c.id}>
                            <td>
                              <div style={{ fontWeight: '600' }}>{c.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.caseNumber}</div>
                            </td>
                            <td>{br ? br.name.split(' (')[0] : 'N/A'}</td>
                            <td>
                              <span className={`badge badge-${c.priority.toLowerCase()}`}>{getPriorityLabel(c.priority)}</span>
                            </td>
                            <td>
                              <span className={`badge badge-${c.status.toLowerCase()}`}>{lang === 'ur' && c.status === 'Active' ? 'فعال' : c.status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            <Building2 size={48} style={{ strokeWidth: 1.5, marginBottom: '1rem', color: 'var(--text-muted)' }} />
            <p>{lang === 'ur' ? 'بائیں جانب سے کمپنی منتخب کریں یا نیا کلائنٹ شامل کریں۔' : 'Please select an organization from the list or add a new one.'}</p>
          </div>
        )}
      </div>

      {/* Organization Modal */}
      {showOrgModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">{t.addClientModalTitle}</h3>
              <button className="modal-close" onClick={() => setShowOrgModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddOrg}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t.clientNameLabel}</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control"
                    value={newOrg.name} 
                    onChange={e => setNewOrg({...newOrg, name: e.target.value})}
                    placeholder="e.g. Acme Corporation"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.industryLabel}</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={newOrg.industry} 
                    onChange={e => setNewOrg({...newOrg, industry: e.target.value})}
                    placeholder={lang === 'ur' ? 'مثلاً آئی ٹی یا ٹیکسٹائل' : 'e.g. IT or Textiles'}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t.taxIdLabel}</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={newOrg.taxId} 
                      onChange={e => setNewOrg({...newOrg, taxId: e.target.value})}
                      placeholder="e.g. NTN-1234567-8"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.primaryContact}</label>
                    <input 
                      type="text" 
                      required 
                      className="form-control"
                      value={newOrg.primaryContact} 
                      onChange={e => setNewOrg({...newOrg, primaryContact: e.target.value})}
                      placeholder={lang === 'ur' ? 'مثلاً محمد اسلم' : 'e.g. Asif Peer'}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t.contactEmail}</label>
                    <input 
                      type="email" 
                      required 
                      className="form-control"
                      value={newOrg.email} 
                      onChange={e => setNewOrg({...newOrg, email: e.target.value})}
                      placeholder="e.g. contact@acme.com"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.contactPhone}</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={newOrg.phone} 
                      onChange={e => setNewOrg({...newOrg, phone: e.target.value})}
                      placeholder="e.g. +92 (42) 111-797-853"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOrgModal(false)}>{t.cancel}</button>
                <button type="submit" className="btn btn-primary">{t.saveClient}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branch Modal */}
      {showBranchModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">{t.addBranchModalTitle}</h3>
              <button className="modal-close" onClick={() => setShowBranchModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddBranch}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t.branchNameLabel}</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control"
                    value={newBranch.name} 
                    onChange={e => setNewBranch({...newBranch, name: e.target.value})}
                    placeholder={lang === 'ur' ? 'مثلاً گلبرگ برانچ' : 'e.g. Gulberg Branch'}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t.cityLabel}</label>
                    <input 
                      type="text" 
                      required 
                      className="form-control"
                      value={newBranch.city} 
                      onChange={e => setNewBranch({...newBranch, city: e.target.value})}
                      placeholder={lang === 'ur' ? 'مثلاً لاہور' : 'e.g. Lahore'}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.primaryContact}</label>
                    <input 
                      type="text" 
                      required 
                      className="form-control"
                      value={newBranch.contactPerson} 
                      onChange={e => setNewBranch({...newBranch, contactPerson: e.target.value})}
                      placeholder={lang === 'ur' ? 'مثلاً برانچ مینیجر' : 'e.g. Branch Manager'}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t.contactEmail}</label>
                  <input 
                    type="email" 
                    required 
                    className="form-control"
                    value={newBranch.email} 
                    onChange={e => setNewBranch({...newBranch, email: e.target.value})}
                    placeholder="e.g. chicago-branch@client.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.addressLabel}</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control"
                    value={newBranch.address} 
                    onChange={e => setNewBranch({...newBranch, address: e.target.value})}
                    placeholder={lang === 'ur' ? 'مثلاً مین بلیوارڈ، گلبرگ، لاہور' : 'e.g. Main Boulevard, Gulberg, Lahore'}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBranchModal(false)}>{t.cancel}</button>
                <button type="submit" className="btn btn-primary">{t.saveBranch}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
