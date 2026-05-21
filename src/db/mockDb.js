// mockDb.js - Database Service using localStorage

const STORAGE_KEY = 'attorney_case_manager_db';

const initialData = {
  organizations: [
    {
      id: 'org-1',
      name: 'Systems Limited Pakistan',
      industry: 'IT Consulting & Export',
      taxId: 'NTN-4309821-3',
      primaryContact: 'Asif Peer',
      email: 'info@systemsltd.com',
      phone: '+92 (42) 111-797-853',
      status: 'Active',
    },
    {
      id: 'org-2',
      name: 'Nishat Mills Group',
      industry: 'Textiles & Energy',
      taxId: 'NTN-0812903-5',
      primaryContact: 'Mian Mansha',
      email: 'corporate@nishat.com',
      phone: '+92 (42) 35712401',
      status: 'Active',
    },
    {
      id: 'org-3',
      name: 'Packages Limited Lahore',
      industry: 'Packaging & Paperboard',
      taxId: 'NTN-2289410-1',
      primaryContact: 'Khurram Raza',
      email: 'legal@packages.com.pk',
      phone: '+92 (42) 35811541',
      status: 'Active',
    }
  ],
  branches: [
    {
      id: 'branch-1-1',
      orgId: 'org-1',
      name: 'Lahore Headquarters (Gulberg)',
      city: 'Lahore',
      address: 'Commercial Area, Sector-E, Phase V, DHA, Lahore',
      contactPerson: 'Asif Peer',
      email: 'hq-lhr@systemsltd.com'
    },
    {
      id: 'branch-1-2',
      orgId: 'org-1',
      name: 'Software Technology Park Branch',
      city: 'Lahore',
      address: 'A-Block, Ferozepur Road, Lahore',
      contactPerson: 'Zeeshan Alvi',
      email: 'stp-lhr@systemsltd.com'
    },
    {
      id: 'branch-2-1',
      orgId: 'org-2',
      name: 'Nishat House Headquarters',
      city: 'Lahore',
      address: 'Emperor Road, near Session Court, Lahore',
      contactPerson: 'Mian Mansha',
      email: 'hq-lhr@nishat.com'
    },
    {
      id: 'branch-3-1',
      orgId: 'org-3',
      name: 'Ferozepur Road Industrial Estate',
      city: 'Lahore',
      address: 'Packages Factory Gate 4, Ferozepur Road, Lahore',
      contactPerson: 'Khurram Raza',
      email: 'lhr-factory@packages.com.pk'
    }
  ],
  cases: [
    {
      id: 'case-1',
      orgId: 'org-1',
      branchId: 'branch-1-2',
      caseNumber: 'LHC-WP-2026-8921',
      title: 'Systems Limited v. Punjab IT Board (Service Tender Dispute)',
      description: 'Writ Petition in Lahore High Court contesting the unlawful disqualification and cancellation of systems development procurement tender.',
      court: 'Lahore High Court (LHC), Lahore',
      judge: 'Mr. Justice Shahid Karim',
      type: 'Writ Petition',
      stage: 'Discovery',
      status: 'Active',
      priority: 'High',
      filingDate: '2026-01-15'
    },
    {
      id: 'case-2',
      orgId: 'org-1',
      branchId: 'branch-1-1',
      caseNumber: 'LHC-CS-2026-302',
      title: 'Nishat Mills Group v. Lesco Power Distribution (Billing Audit Appeal)',
      description: 'Civil suit filed in Lahore Session Court seeking declaration and temporary injunction against retrospective adjustments of industrial electricity tariffs.',
      court: 'Civil Court Lahore',
      judge: 'Senior Civil Judge Ahmed Nawaz',
      type: 'Civil Lawsuit',
      stage: 'Pleading',
      status: 'Active',
      priority: 'Medium',
      filingDate: '2026-03-10'
    },
    {
      id: 'case-3',
      orgId: 'org-2',
      branchId: 'branch-2-1',
      caseNumber: 'LHC-BC-2025-1092',
      title: 'Habib Bank Ltd v. Nishat Mills (Credit Line Recovery)',
      description: 'Banking Recovery Suit instituted in Lahore High Court Banking Bench regarding credit limits and guarantees during commercial expansion.',
      court: 'Banking Court Lahore (LHC Bench)',
      judge: 'Justice Abid Aziz Sheikh',
      type: 'Banking Recovery',
      stage: 'Trial',
      status: 'Active',
      priority: 'High',
      filingDate: '2025-11-04'
    },
    {
      id: 'case-4',
      orgId: 'org-3',
      branchId: 'branch-3-1',
      caseNumber: 'LHC-L-2026-4012',
      title: 'Labour Union v. Packages Limited Lahore (Collective Bargaining Appeal)',
      description: 'Petition filed by trade union representatives regarding wages and overtime computation models. Representation of Packages Ltd legal department.',
      court: 'Session Court Lahore',
      judge: 'District & Sessions Judge Khalid Mahmood',
      type: 'Labour Court',
      stage: 'Discovery',
      status: 'Active',
      priority: 'Low',
      filingDate: '2026-04-20'
    }
  ],
  hearings: [
    {
      id: 'hearing-1',
      caseId: 'case-1',
      hearingDate: '2026-06-15',
      time: '10:00 AM',
      purpose: 'Admissibility Arguments & Interim Stay Order',
      courtroom: 'Courtroom 3, Lahore High Court',
      status: 'Scheduled'
    },
    {
      id: 'hearing-2',
      caseId: 'case-2',
      hearingDate: '2026-05-28',
      time: '02:00 PM',
      purpose: 'LESCO Tariffs Verification & Interim Stay Order',
      courtroom: 'Session Court Room 14, Lahore',
      status: 'Scheduled'
    },
    {
      id: 'hearing-3',
      caseId: 'case-3',
      hearingDate: '2026-06-02',
      time: '09:30 AM',
      purpose: 'Witness Cross Examination (Bank Manager)',
      courtroom: 'High Court Annex Building Room B',
      status: 'Scheduled'
    },
    {
      id: 'hearing-4',
      caseId: 'case-4',
      hearingDate: '2026-05-22',
      time: '11:00 AM',
      purpose: 'Overtime Audit Presentation',
      courtroom: 'Sessions Court Block C, Room 4',
      status: 'Scheduled'
    }
  ],
  documents: [
    {
      id: 'doc-1',
      caseId: 'case-1',
      orgId: 'org-1',
      name: 'LHC_Writ_Petition_Punjab_ITB_Writ.pdf',
      type: 'pdf',
      size: '2.4 MB',
      uploadDate: '2026-01-15',
      category: 'Pleading'
    },
    {
      id: 'doc-2',
      caseId: 'case-1',
      orgId: 'org-1',
      name: 'PITB_Written_Statement_Filed.pdf',
      type: 'pdf',
      size: '1.8 MB',
      uploadDate: '2026-02-20',
      category: 'Pleading'
    },
    {
      id: 'doc-3',
      caseId: 'case-2',
      orgId: 'org-1',
      name: 'Injunction_Request_LESCO_Billing.docx',
      type: 'docx',
      size: '520 KB',
      uploadDate: '2026-04-12',
      category: 'Motion'
    },
    {
      id: 'doc-4',
      caseId: 'case-3',
      orgId: 'org-2',
      name: 'Nishat_Credit_Line_Agreement_Executed.pdf',
      type: 'pdf',
      size: '14.2 MB',
      uploadDate: '2025-11-10',
      category: 'Evidence'
    },
    {
      id: 'doc-5',
      caseId: 'case-4',
      orgId: 'org-3',
      name: 'Collective_Bargaining_Agreement_Packages.pdf',
      type: 'pdf',
      size: '890 KB',
      uploadDate: '2026-04-22',
      category: 'Contract'
    }
  ],
  tasks: [
    {
      id: 'task-1',
      caseId: 'case-1',
      title: 'Draft rejoinder to PITB written statement',
      dueDate: '2026-06-01',
      assignedTo: 'Lead Counsel / Patent Specialist',
      status: 'Pending',
      priority: 'High'
    },
    {
      id: 'task-2',
      caseId: 'case-1',
      title: 'Compile LESCO bills and calculations for billing court',
      dueDate: '2026-05-30',
      assignedTo: 'Discovery Team',
      status: 'Pending',
      priority: 'High'
    },
    {
      id: 'task-3',
      caseId: 'case-2',
      title: 'Submit witness power of attorney (Wakalatnama)',
      dueDate: '2026-05-24',
      assignedTo: 'Securities Partner',
      status: 'Pending',
      priority: 'Medium'
    },
    {
      id: 'task-4',
      caseId: 'case-3',
      title: 'Finalize audit statements and audit verification',
      dueDate: '2026-05-25',
      assignedTo: 'Litigation Team',
      status: 'Completed',
      priority: 'High'
    },
    {
      id: 'task-5',
      caseId: 'case-4',
      title: 'Draft stay application for packages labor dispute',
      dueDate: '2026-05-21',
      assignedTo: 'Associate',
      status: 'Pending',
      priority: 'High'
    }
  ]
};

// Database class to read/write state
class AttorneyDb {
  constructor() {
    this.data = this._load();
  }

  _load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    let data = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
        // Automatically migrate/reset from US template seed data to Pakistan seed data
        if (data.organizations && data.organizations.some(org => org.name === 'OmniCorp Industries')) {
          console.warn('US template seed data detected. Resetting to Lahore, Pakistan region seeds...');
          localStorage.removeItem(STORAGE_KEY);
          data = null;
        }
      } catch (e) {
        data = null;
      }
    }
    if (!data) {
      this._save(initialData);
      return JSON.parse(JSON.stringify(initialData));
    }
    return data;
  }

  _save(newData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    this.data = newData;
    // Dispatch custom event to notify components of updates
    window.dispatchEvent(new CustomEvent('db-update', { detail: newData }));
  }

  // Generic getter
  getData() {
    return this.data;
  }

  // --- ORGANIZATIONS ---
  addOrganization(org) {
    const data = this._load();
    const newOrg = { id: `org-${Date.now()}`, ...org, status: org.status || 'Active' };
    data.organizations.push(newOrg);
    this._save(data);
    return newOrg;
  }

  updateOrganization(id, updatedFields) {
    const data = this._load();
    data.organizations = data.organizations.map(o => o.id === id ? { ...o, ...updatedFields } : o);
    this._save(data);
    return data.organizations.find(o => o.id === id);
  }

  deleteOrganization(id) {
    const data = this._load();
    // Also clean up branches, cases, documents, tasks, hearings
    data.organizations = data.organizations.filter(o => o.id !== id);
    data.branches = data.branches.filter(b => b.orgId !== id);
    
    // Find all cases related to this org to clean hearings, docs, tasks
    const caseIds = data.cases.filter(c => c.orgId === id).map(c => c.id);
    data.cases = data.cases.filter(c => c.orgId !== id);
    data.documents = data.documents.filter(d => d.orgId !== id && !caseIds.includes(d.caseId));
    data.tasks = data.tasks.filter(t => !caseIds.includes(t.caseId));
    data.hearings = data.hearings.filter(h => !caseIds.includes(h.caseId));

    this._save(data);
  }

  // --- BRANCHES ---
  addBranch(branch) {
    const data = this._load();
    const newBranch = { id: `branch-${Date.now()}`, ...branch };
    data.branches.push(newBranch);
    this._save(data);
    return newBranch;
  }

  updateBranch(id, updatedFields) {
    const data = this._load();
    data.branches = data.branches.map(b => b.id === id ? { ...b, ...updatedFields } : b);
    this._save(data);
    return data.branches.find(b => b.id === id);
  }

  deleteBranch(id) {
    const data = this._load();
    data.branches = data.branches.filter(b => b.id !== id);
    
    // Find all cases associated with this branch to clean up
    const caseIds = data.cases.filter(c => c.branchId === id).map(c => c.id);
    data.cases = data.cases.filter(c => c.branchId !== id);
    data.documents = data.documents.filter(d => !caseIds.includes(d.caseId));
    data.tasks = data.tasks.filter(t => !caseIds.includes(t.caseId));
    data.hearings = data.hearings.filter(h => !caseIds.includes(h.caseId));

    this._save(data);
  }

  // --- CASES ---
  addCase(c) {
    const data = this._load();
    const newCase = { 
      id: `case-${Date.now()}`, 
      ...c, 
      status: c.status || 'Active', 
      filingDate: c.filingDate || new Date().toISOString().split('T')[0] 
    };
    data.cases.push(newCase);
    this._save(data);
    return newCase;
  }

  updateCase(id, updatedFields) {
    const data = this._load();
    data.cases = data.cases.map(c => c.id === id ? { ...c, ...updatedFields } : c);
    this._save(data);
    return data.cases.find(c => c.id === id);
  }

  deleteCase(id) {
    const data = this._load();
    data.cases = data.cases.filter(c => c.id !== id);
    data.documents = data.documents.filter(d => d.caseId !== id);
    data.tasks = data.tasks.filter(t => t.caseId !== id);
    data.hearings = data.hearings.filter(h => h.caseId !== id);
    this._save(data);
  }

  // --- HEARINGS ---
  addHearing(h) {
    const data = this._load();
    const newHearing = { id: `hearing-${Date.now()}`, ...h, status: h.status || 'Scheduled' };
    data.hearings.push(newHearing);
    this._save(data);
    return newHearing;
  }

  updateHearing(id, updatedFields) {
    const data = this._load();
    data.hearings = data.hearings.map(h => h.id === id ? { ...h, ...updatedFields } : h);
    this._save(data);
    return data.hearings.find(h => h.id === id);
  }

  deleteHearing(id) {
    const data = this._load();
    data.hearings = data.hearings.filter(h => h.id !== id);
    this._save(data);
  }

  // --- DOCUMENTS ---
  async addDocument(doc, fileObj) {
    const data = this._load();
    const newDoc = { 
      id: `doc-${Date.now()}`, 
      ...doc, 
      uploadDate: new Date().toISOString().split('T')[0] 
    };
    data.documents.push(newDoc);
    this._save(data);
    if (fileObj) {
      await saveFileContent(newDoc.id, fileObj);
    }
    return newDoc;
  }

  async deleteDocument(id) {
    const data = this._load();
    data.documents = data.documents.filter(d => d.id !== id);
    this._save(data);
    await deleteFileContent(id);
  }

  async getFileContent(id) {
    return await getFileContent(id);
  }

  // --- TASKS ---
  addTask(t) {
    const data = this._load();
    const newTask = { id: `task-${Date.now()}`, ...t, status: t.status || 'Pending' };
    data.tasks.push(newTask);
    this._save(data);
    return newTask;
  }

  updateTask(id, updatedFields) {
    const data = this._load();
    data.tasks = data.tasks.map(t => t.id === id ? { ...t, ...updatedFields } : t);
    this._save(data);
    return data.tasks.find(t => t.id === id);
  }

  deleteTask(id) {
    const data = this._load();
    data.tasks = data.tasks.filter(t => t.id !== id);
    this._save(data);
  }

  reorderTasks(draggedId, targetTaskId) {
    const data = this._load();
    const draggedIndex = data.tasks.findIndex(t => t.id === draggedId);
    const targetIndex = data.tasks.findIndex(t => t.id === targetTaskId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const [draggedTask] = data.tasks.splice(draggedIndex, 1);
    data.tasks.splice(targetIndex, 0, draggedTask);
    this._save(data);
  }

  moveTaskToEnd(id) {
    const data = this._load();
    const index = data.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      const [task] = data.tasks.splice(index, 1);
      data.tasks.push(task);
      this._save(data);
    }
  }
}

export const db = new AttorneyDb();

// Simple IndexedDB database configuration for storing binary vault files
const DB_NAME = 'LexSuiteFilesDB';
const STORE_NAME = 'files';

function openFileDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function saveFileContent(docId, file) {
  try {
    const db = await openFileDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(file, docId);
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('IndexedDB save error:', err);
  }
}

async function getFileContent(docId) {
  try {
    const db = await openFileDB();
    const blob = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(docId);
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
    if (blob) return blob;
    
    // Seed documents fallback: decode a valid blank 1-page PDF
    const b64 = 'JVBERi0xLjUKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA1OTUgODQyXQovUmVzb3VyY2VzIDw8Pj4KL0NvbnRlbnRzIDQgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggMAo+PgpzdHJlYW0KZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1NiAwMDAwMCBuIAowMDAwMDAwMTExIDAwMDAwIG4gCjAwMDAwMDAyMTIgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA1Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgoyNjMKJSVFT0Y=';
    const binaryStr = atob(b64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'application/pdf' });
  } catch (err) {
    console.error('IndexedDB get error:', err);
    return new Blob(['Simulated document contents.'], { type: 'text/plain' });
  }
}

async function deleteFileContent(docId) {
  try {
    const db = await openFileDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(docId);
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('IndexedDB delete error:', err);
  }
}
