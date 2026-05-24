import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  UploadCloud, 
  Trash2, 
  Folder, 
  Building2, 
  Plus, 
  X, 
  ArrowRight,
  Download
} from 'lucide-react';
import { db } from '../db/mockDb';
import { translations } from '../db/translations';

export default function Documents({ lang, dbData, refreshDb }) {
  const { organizations, cases, documents } = dbData;
  const t = translations[lang];

  const [selectedOrgId, setSelectedOrgId] = useState(organizations[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail'

  // Form State for Simulated Upload
  const [uploadForm, setUploadForm] = useState({
    caseId: '',
    name: '',
    category: 'Pleading',
    size: '1.2 MB'
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const selectedOrg = organizations.find(o => o.id === selectedOrgId);
  const orgCases = selectedOrg ? cases.filter(c => c.orgId === selectedOrg.id) : [];

  // Filtered documents for the selected organization
  const orgCaseIds = orgCases.map(c => c.id);
  const filteredDocs = documents.filter((doc) => {
    const isUnderOrg = doc.orgId === selectedOrgId || orgCaseIds.includes(doc.caseId);
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.category.toLowerCase().includes(searchQuery.toLowerCase());
    return isUnderOrg && matchesSearch;
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(file.size / 1024).toFixed(0)} KB`;
      setUploadForm(prev => ({
        ...prev,
        name: file.name,
        size: sizeStr
      }));
    }
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!uploadForm.name || !selectedOrgId) return;

    // Determine target case's organization
    let targetOrgId = selectedOrgId;
    if (uploadForm.caseId) {
      const relatedCase = cases.find(c => c.id === uploadForm.caseId);
      if (relatedCase) targetOrgId = relatedCase.orgId;
    }

    await db.addDocument({
      orgId: targetOrgId,
      caseId: uploadForm.caseId || null,
      name: uploadForm.name,
      type: uploadForm.name.split('.').pop() || 'pdf',
      size: uploadForm.size,
      category: uploadForm.category
    }, selectedFile);

    setUploadForm({ caseId: '', name: '', category: 'Pleading', size: '1.2 MB' });
    setSelectedFile(null);
    setShowUploadModal(false);
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

  const handleDeleteDoc = (id) => {
    if (window.confirm(lang === 'ur' ? "کیا آپ اس دستاویز کو والٹ سے مستقل طور پر حذف کرنا چاہتے ہیں؟" : "Are you sure you want to permanently delete this document from the vault?")) {
      db.deleteDocument(id);
      refreshDb();
    }
  };

  const getCaseName = (caseId) => {
    if (!caseId) return lang === 'ur' ? 'عام کمپنی فائلیں' : 'General Company Files';
    const c = cases.find(c => c.id === caseId);
    return c ? c.title : 'Unknown Case';
  };

  const getLocalizedCategory = (cat) => {
    if (lang === 'ur') {
      if (cat === 'Pleading') return 'درخواست گزار فائل';
      if (cat === 'Motion') return 'متفرق درخواست';
      if (cat === 'Evidence') return 'ثبوت / شہادت';
      if (cat === 'Contract') return 'معاہدہ';
      if (cat === 'Correspondence') return 'خط و کتابت';
      return 'دیگر';
    }
    return cat;
  };

  return (
    <div className="split-pane">
      
      {/* Left Pane: Organization Directory folders */}
      <div className={`pane-list ${mobileView === 'detail' ? 'hide-on-mobile' : ''}`}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Folder size={16} style={{ color: 'var(--primary)' }} />
          {t.clientFolders}
        </div>
        
        <div className="pane-scrollable-items">
          {organizations.map((org) => (
            <div 
              key={org.id} 
              className={`list-item-card ${selectedOrgId === org.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedOrgId(org.id);
                setMobileView('detail');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              <Folder size={16} style={{ color: selectedOrgId === org.id ? 'var(--primary)' : 'var(--text-secondary)', flexShrink: 0 }} />
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span className="list-item-title">{org.name}</span>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  {documents.filter(d => d.orgId === org.id || cases.filter(c => c.orgId === org.id).map(c => c.id).includes(d.caseId)).length} {lang === 'ur' ? 'فائلیں' : 'Files'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane: Document Explorer */}
      <div className={`pane-detail ${mobileView === 'list' ? 'hide-on-mobile' : ''}`}>
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Building2 size={12} /> {t.documentsTitle}
                </span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem', marginTop: '0.25rem' }}>
                  {selectedOrg.name} {lang === 'ur' ? 'کی فائلیں' : 'Files'}
                </h2>
              </div>
              <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
                <UploadCloud size={16} /> {t.uploadDocBtn}
              </button>
            </div>

            {/* Document search bar */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: lang === 'en' ? '0.75rem' : 'auto', right: lang === 'ur' ? '0.75rem' : 'auto', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder={lang === 'ur' ? 'فائل کا نام یا زمرہ تلاش کریں...' : 'Search file name, classification...'} 
                className="search-input"
                style={{ paddingLeft: lang === 'en' ? '2.25rem' : '1rem', paddingRight: lang === 'ur' ? '2.25rem' : '1rem' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Files List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {filteredDocs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
                  <FileText size={48} style={{ strokeWidth: 1, color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
                  <p>{t.noDocs}</p>
                </div>
              ) : (
                <div className="custom-table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>{t.fileNameCol}</th>
                        <th>{t.caseFolderCol}</th>
                        <th>{t.classificationCol}</th>
                        <th>{t.fileSizeCol}</th>
                        <th>{t.uploadDateCol}</th>
                        <th>{t.actionsCol}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocs.map((doc) => (
                        <tr key={doc.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <FileText size={18} style={{ color: 'var(--primary)' }} />
                              <div>
                                <div style={{ fontWeight: '600' }}>{doc.name}</div>
                                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{doc.type}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {getCaseName(doc.caseId)}
                          </td>
                          <td>
                            <span className="badge badge-low">{getLocalizedCategory(doc.category)}</span>
                          </td>
                          <td>{doc.size}</td>
                          <td>{doc.uploadDate}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <a 
                                href="#"
                                className="btn btn-secondary btn-sm" 
                                title={t.downloadFile}
                                onClick={(e) => handleDownloadFile(doc, e)}
                              >
                                <Download size={12} />
                              </a>
                              <button 
                                className="btn btn-secondary btn-sm text-danger" 
                                onClick={() => handleDeleteDoc(doc.id)}
                                title={t.deleteDoc}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            <Folder size={48} style={{ strokeWidth: 1.5, marginBottom: '1rem', color: 'var(--text-muted)' }} />
            <p>{lang === 'ur' ? 'دستاویزات کا جائزہ لینے کے لیے بائیں جانب سے کلائنٹ فولڈر منتخب کریں۔' : 'Please select a Client Folder on the left to review uploaded documents.'}</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">{t.depositDocTitle}</h3>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUploadFile}>
              <div className="modal-body">
                
                <div className="form-group">
                  <label className="form-label">{t.fileContextLabel}</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    style={{ opacity: 0.8 }}
                    disabled 
                    value={selectedOrg?.name || ''} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t.associatedCaseLabel}</label>
                  <select 
                    className="form-control"
                    value={uploadForm.caseId}
                    onChange={e => setUploadForm({...uploadForm, caseId: e.target.value})}
                  >
                    <option value="">{t.generalFolder}</option>
                    {orgCases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t.chooseFile}</label>
                  <input 
                    type="file" 
                    required 
                    className="form-control"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t.fileDisplayLabel}</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control"
                    placeholder="e.g. Defendant_Response_Motion.pdf"
                    value={uploadForm.name}
                    onChange={e => setUploadForm({...uploadForm, name: e.target.value})}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t.fileCategoryLabel}</label>
                    <select 
                      className="form-control"
                      value={uploadForm.category}
                      onChange={e => setUploadForm({...uploadForm, category: e.target.value})}
                    >
                      <option value="Pleading">{t.pleading}</option>
                      <option value="Motion">{t.motion}</option>
                      <option value="Evidence">{t.evidence}</option>
                      <option value="Contract">{t.contract}</option>
                      <option value="Correspondence">{t.correspondence}</option>
                      <option value="Other">{t.other}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.fileSizeMockLabel}</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g. 2.5 MB"
                      value={uploadForm.size}
                      onChange={e => setUploadForm({...uploadForm, size: e.target.value})}
                    />
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>{t.cancel}</button>
                <button type="submit" className="btn btn-primary">{t.fileInVaultBtn}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
