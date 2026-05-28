import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './mockDb.js';

// Seed data from initialData that we rely on:
//   org-1  → case-1, case-2
//   org-2  → case-3
//   org-3  → case-4

// Helper: add a time entry and return it
function addEntry(caseId, hours, rate, description = 'Legal research', date = '2026-01-15') {
  return db.addTimeEntry({ caseId, hours, rate, description, date });
}

// Helper: create a minimal invoice for org-1 with the given entry ids
function createInv(entryIds, overrides = {}) {
  return db.createInvoice(
    {
      orgId: 'org-1',
      invoiceNumber: 'INV-2026-0001',
      issueDate: '2026-05-01',
      dueDate: '2026-05-31',
      taxPercent: 0,
      currency: 'PKR',
      notes: '',
      ...overrides,
    },
    entryIds
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// createInvoice
// ─────────────────────────────────────────────────────────────────────────────
describe('createInvoice', () => {
  beforeEach(() => localStorage.clear());

  it('(1) returns an invoice with all required fields', () => {
    const te = addEntry('case-1', 3, 1000);
    const inv = createInv([te.id]);

    expect(inv.id).toMatch(/^invoice-/);
    expect(inv.orgId).toBe('org-1');
    expect(inv.invoiceNumber).toBe('INV-2026-0001');
    expect(inv.issueDate).toBe('2026-05-01');
    expect(inv.status).toBe('Draft');
    expect(Array.isArray(inv.lineItems)).toBe(true);
    expect(typeof inv.subtotal).toBe('number');
    expect(typeof inv.tax).toBe('number');
    expect(typeof inv.total).toBe('number');
  });

  it('(2) calculates subtotal correctly from multiple line items', () => {
    const te1 = addEntry('case-1', 3, 1000); // 3000
    const te2 = addEntry('case-2', 2, 500);  // 1000
    const inv = createInv([te1.id, te2.id]);

    expect(inv.subtotal).toBe(4000);
    expect(inv.lineItems).toHaveLength(2);
  });

  it('(3) calculates tax correctly', () => {
    const te = addEntry('case-1', 4, 1000); // subtotal = 4000
    const inv = createInv([te.id], { taxPercent: 10 });

    expect(inv.tax).toBe(400);
  });

  it('(4) calculates total = subtotal + tax', () => {
    const te = addEntry('case-1', 4, 1000); // subtotal = 4000
    const inv = createInv([te.id], { taxPercent: 10 });

    expect(inv.total).toBe(4400);
  });

  it('(5) sets initial status to Draft', () => {
    const te = addEntry('case-1', 1, 500);
    const inv = createInv([te.id]);

    expect(inv.status).toBe('Draft');
  });

  it('(6) links time entries by setting their invoiceId', () => {
    const te1 = addEntry('case-1', 2, 1000);
    const te2 = addEntry('case-2', 1, 500);
    const inv = createInv([te1.id, te2.id]);

    const allEntries = db.getData().timeEntries;
    const linked = allEntries.filter(te => te.invoiceId === inv.id);
    expect(linked).toHaveLength(2);
    expect(linked.map(te => te.id)).toContain(te1.id);
    expect(linked.map(te => te.id)).toContain(te2.id);
  });

  it('(7) skips time entries that are already billed', () => {
    const te1 = addEntry('case-1', 2, 1000);
    const te2 = addEntry('case-1', 3, 1000);

    // Bill te1 in a first invoice
    createInv([te1.id], { invoiceNumber: 'INV-FIRST' });

    // Try to include te1 again in a second invoice
    const inv2 = createInv([te1.id, te2.id], { invoiceNumber: 'INV-SECOND' });

    // Only te2 should be in the second invoice's line items
    expect(inv2.lineItems).toHaveLength(1);
    expect(inv2.lineItems[0].timeEntryId).toBe(te2.id);
  });

  it('(8) creates invoice with empty lineItems when no valid entry ids are given', () => {
    const inv = createInv([]);

    expect(inv.lineItems).toHaveLength(0);
    expect(inv.subtotal).toBe(0);
    expect(inv.tax).toBe(0);
    expect(inv.total).toBe(0);
  });

  it('(9) defaults currency to PKR when not provided', () => {
    const te = addEntry('case-1', 1, 1000);
    const inv = db.createInvoice(
      { orgId: 'org-1', invoiceNumber: 'INV-001', issueDate: '2026-05-01' },
      [te.id]
    );

    expect(inv.currency).toBe('PKR');
  });

  it('(10) defaults tax to 0 when taxPercent is omitted', () => {
    const te = addEntry('case-1', 2, 1000);
    const inv = db.createInvoice(
      { orgId: 'org-1', invoiceNumber: 'INV-001', issueDate: '2026-05-01' },
      [te.id]
    );

    expect(inv.taxPercent).toBe(0);
    expect(inv.tax).toBe(0);
  });

  it('(11) preserves the provided invoiceNumber', () => {
    const te = addEntry('case-1', 1, 500);
    const inv = createInv([te.id], { invoiceNumber: 'CUSTOM-9999' });

    expect(inv.invoiceNumber).toBe('CUSTOM-9999');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updateInvoiceStatus
// ─────────────────────────────────────────────────────────────────────────────
describe('updateInvoiceStatus', () => {
  beforeEach(() => localStorage.clear());

  it('(12) transitions status from Draft to Sent', () => {
    const te = addEntry('case-1', 1, 1000);
    const inv = createInv([te.id]);

    const updated = db.updateInvoiceStatus(inv.id, 'Sent');

    expect(updated.status).toBe('Sent');
  });

  it('(13) transitions status from Sent to Paid', () => {
    const te = addEntry('case-1', 1, 1000);
    const inv = createInv([te.id]);
    db.updateInvoiceStatus(inv.id, 'Sent');

    const updated = db.updateInvoiceStatus(inv.id, 'Paid');

    expect(updated.status).toBe('Paid');
  });

  it('(14) reverts status from Paid back to Draft', () => {
    const te = addEntry('case-1', 1, 1000);
    const inv = createInv([te.id]);
    db.updateInvoiceStatus(inv.id, 'Sent');
    db.updateInvoiceStatus(inv.id, 'Paid');

    const reverted = db.updateInvoiceStatus(inv.id, 'Draft');

    expect(reverted.status).toBe('Draft');
  });

  it('(15) returns the updated invoice object immediately', () => {
    const te = addEntry('case-1', 1, 1000);
    const inv = createInv([te.id]);

    const returned = db.updateInvoiceStatus(inv.id, 'Sent');

    expect(returned).not.toBeNull();
    expect(returned.id).toBe(inv.id);
    expect(returned.status).toBe('Sent');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// deleteInvoice
// ─────────────────────────────────────────────────────────────────────────────
describe('deleteInvoice', () => {
  beforeEach(() => localStorage.clear());

  it('(16) removes the invoice from the DB', () => {
    const te = addEntry('case-1', 1, 1000);
    const inv = createInv([te.id]);

    db.deleteInvoice(inv.id);

    const remaining = db.getInvoicesForOrg('org-1');
    expect(remaining.find(i => i.id === inv.id)).toBeUndefined();
  });

  it('(17) unlinks associated time entries (invoiceId → null)', () => {
    const te1 = addEntry('case-1', 2, 1000);
    const te2 = addEntry('case-2', 1, 500);
    const inv = createInv([te1.id, te2.id]);

    db.deleteInvoice(inv.id);

    const entries = db.getData().timeEntries;
    expect(entries.find(te => te.id === te1.id).invoiceId).toBeNull();
    expect(entries.find(te => te.id === te2.id).invoiceId).toBeNull();
  });

  it('(18) does not affect other invoices for the same org', async () => {
    const te1 = addEntry('case-1', 1, 1000);
    const te2 = addEntry('case-2', 2, 500);

    createInv([te1.id], { invoiceNumber: 'INV-A' });
    // Wait 2ms so Date.now() produces a different id for the second invoice
    await new Promise(r => setTimeout(r, 2));
    createInv([te2.id], { invoiceNumber: 'INV-B' });

    const before = db.getInvoicesForOrg('org-1');
    const inv1 = before.find(i => i.invoiceNumber === 'INV-A');
    db.deleteInvoice(inv1.id);

    const remaining = db.getInvoicesForOrg('org-1');
    expect(remaining.find(i => i.invoiceNumber === 'INV-B')).toBeDefined();
    expect(remaining.find(i => i.invoiceNumber === 'INV-A')).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getInvoicesForOrg
// ─────────────────────────────────────────────────────────────────────────────
describe('getInvoicesForOrg', () => {
  beforeEach(() => localStorage.clear());

  it('(19) returns only invoices belonging to the specified org', () => {
    const te1 = addEntry('case-1', 1, 1000);
    createInv([te1.id], { orgId: 'org-1', invoiceNumber: 'INV-ORG1' });

    const te2 = addEntry('case-3', 1, 800);
    db.createInvoice(
      { orgId: 'org-2', invoiceNumber: 'INV-ORG2', issueDate: '2026-05-01' },
      [te2.id]
    );

    const org1Invoices = db.getInvoicesForOrg('org-1');
    expect(org1Invoices).toHaveLength(1);
    expect(org1Invoices[0].orgId).toBe('org-1');
  });

  it('(20) excludes invoices belonging to a different org', () => {
    const te = addEntry('case-3', 2, 800);
    db.createInvoice(
      { orgId: 'org-2', invoiceNumber: 'INV-ORG2', issueDate: '2026-05-01' },
      [te.id]
    );

    const org1Invoices = db.getInvoicesForOrg('org-1');
    expect(org1Invoices).toHaveLength(0);
  });

  it('(21) returns invoices sorted by issueDate descending (newest first)', () => {
    const te1 = addEntry('case-1', 1, 1000);
    const te2 = addEntry('case-2', 1, 500);
    const te3 = addEntry('case-1', 1, 750);

    createInv([te1.id], { invoiceNumber: 'INV-OLD', issueDate: '2026-03-01' });
    createInv([te2.id], { invoiceNumber: 'INV-NEW', issueDate: '2026-05-15' });
    createInv([te3.id], { invoiceNumber: 'INV-MID', issueDate: '2026-04-10' });

    const invoices = db.getInvoicesForOrg('org-1');

    expect(invoices[0].invoiceNumber).toBe('INV-NEW');
    expect(invoices[1].invoiceNumber).toBe('INV-MID');
    expect(invoices[2].invoiceNumber).toBe('INV-OLD');
  });

  it('(22) returns an empty array for an org with no invoices', () => {
    const result = db.getInvoicesForOrg('org-3');
    expect(result).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Full lifecycle integration tests
// ─────────────────────────────────────────────────────────────────────────────
describe('Invoice full lifecycle', () => {
  beforeEach(() => localStorage.clear());

  it('(23) create → mark Sent → mark Paid progresses through all statuses', () => {
    const te = addEntry('case-1', 5, 2000);
    const inv = createInv([te.id]);
    expect(inv.status).toBe('Draft');

    const sent = db.updateInvoiceStatus(inv.id, 'Sent');
    expect(sent.status).toBe('Sent');

    const paid = db.updateInvoiceStatus(inv.id, 'Paid');
    expect(paid.status).toBe('Paid');
  });

  it('(24) create → delete → time entries become unbilled and can be invoiced again', () => {
    const te1 = addEntry('case-1', 3, 1000);
    const te2 = addEntry('case-2', 2, 500);
    const inv = createInv([te1.id, te2.id]);

    // Confirm entries are linked
    expect(db.getData().timeEntries.find(te => te.id === te1.id).invoiceId).toBe(inv.id);

    // Delete the invoice
    db.deleteInvoice(inv.id);

    // Entries should be unlinked
    expect(db.getData().timeEntries.find(te => te.id === te1.id).invoiceId).toBeNull();
    expect(db.getData().timeEntries.find(te => te.id === te2.id).invoiceId).toBeNull();

    // Should be possible to create a new invoice with the same entries
    const inv2 = createInv([te1.id, te2.id], { invoiceNumber: 'INV-REBILL' });
    expect(inv2.lineItems).toHaveLength(2);
    expect(inv2.subtotal).toBe(4000);
  });
});
