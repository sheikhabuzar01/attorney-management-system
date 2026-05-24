import React, { useState, useMemo } from 'react';
import {
  Building2,
  Phone,
  Mail,
  User,
  MapPin,
  Search,
  PhoneCall,
  Users
} from 'lucide-react';
import { translations } from '../db/translations';

export default function Contacts({ lang, dbData }) {
  const { organizations, branches } = dbData;
  const t = translations[lang];

  const [searchQuery, setSearchQuery] = useState('');

  const grouped = useMemo(() => {
    return organizations.map(org => {
      const orgBranches = branches.filter(b => b.orgId === org.id);
      return { org, orgBranches };
    });
  }, [organizations, branches]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return grouped;
    return grouped.filter(({ org, orgBranches }) => {
      if (org.name.toLowerCase().includes(q)) return true;
      if (org.primaryContact && org.primaryContact.toLowerCase().includes(q)) return true;
      if (org.phone && org.phone.toLowerCase().includes(q)) return true;
      if (org.email && org.email.toLowerCase().includes(q)) return true;
      return orgBranches.some(b =>
        (b.contactPerson && b.contactPerson.toLowerCase().includes(q)) ||
        (b.email && b.email.toLowerCase().includes(q)) ||
        (b.city && b.city.toLowerCase().includes(q)) ||
        (b.name && b.name.toLowerCase().includes(q))
      );
    });
  }, [grouped, searchQuery]);

  const totalContacts = grouped.reduce(
    (sum, { org, orgBranches }) => sum + (org.primaryContact ? 1 : 0) + orgBranches.length,
    0
  );

  const isRTL = lang === 'ur';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', direction: isRTL ? 'rtl' : 'ltr' }}>

      {/* Toolbar: search + totals */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 240px', minWidth: 0 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: isRTL ? 'auto' : '0.75rem',
              right: isRTL ? '0.75rem' : 'auto',
              color: 'var(--text-secondary)'
            }}
          />
          <input
            type="text"
            placeholder={t.searchContacts}
            className="search-input"
            style={{
              width: '100%',
              paddingLeft: isRTL ? '1rem' : '2.25rem',
              paddingRight: isRTL ? '2.25rem' : '1rem'
            }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.85rem',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <Users size={16} />
          <span>{t.totalContacts}: {totalContacts}</span>
        </div>
      </div>

      {/* Company-grouped contact cards */}
      {filtered.length === 0 ? (
        <div className="dashboard-panel" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <Phone size={42} style={{ strokeWidth: 1.25, color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>{t.noContactsFound}</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {filtered.map(({ org, orgBranches }) => (
            <div
              key={org.id}
              className="dashboard-panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1.25rem',
                textAlign: isRTL ? 'right' : 'left'
              }}
            >
              {/* Company header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '0.85rem',
                  flexDirection: isRTL ? 'row-reverse' : 'row'
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    flexShrink: 0,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Building2 size={20} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      lineHeight: 1.25,
                      wordBreak: 'break-word'
                    }}
                  >
                    {org.name}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    {org.industry}
                  </p>
                </div>
              </div>

              {/* Primary representative block */}
              <div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: '0.5rem'
                  }}
                >
                  {t.primaryRepresentative}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    padding: '0.85rem',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <User size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {org.primaryContact || '—'}
                    </span>
                  </div>

                  {org.phone ? (
                    <a
                      href={`tel:${org.phone.replace(/\s+/g, '')}`}
                      title={t.callNumber}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--primary)',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        flexDirection: isRTL ? 'row-reverse' : 'row'
                      }}
                    >
                      <PhoneCall size={14} style={{ flexShrink: 0 }} />
                      <span style={{ wordBreak: 'break-all', direction: 'ltr' }}>{org.phone}</span>
                    </a>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <Phone size={14} />
                      <span style={{ fontStyle: 'italic' }}>{t.noPhoneOnFile}</span>
                    </div>
                  )}

                  {org.email && (
                    <a
                      href={`mailto:${org.email}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        flexDirection: isRTL ? 'row-reverse' : 'row'
                      }}
                    >
                      <Mail size={13} style={{ flexShrink: 0 }} />
                      <span style={{ wordBreak: 'break-all' }}>{org.email}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Branch contacts list */}
              {orgBranches.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      flexDirection: isRTL ? 'row-reverse' : 'row'
                    }}
                  >
                    {t.branchContacts} ({orgBranches.length})
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {orgBranches.map(branch => (
                      <div
                        key={branch.id}
                        style={{
                          padding: '0.65rem 0.75rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.8rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                          <MapPin size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {branch.name}
                          </span>
                        </div>

                        {branch.contactPerson && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                            <User size={12} style={{ flexShrink: 0 }} />
                            <span>{branch.contactPerson}</span>
                          </div>
                        )}

                        {branch.email && (
                          <a
                            href={`mailto:${branch.email}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              color: 'var(--text-secondary)',
                              textDecoration: 'none',
                              flexDirection: isRTL ? 'row-reverse' : 'row'
                            }}
                          >
                            <Mail size={12} style={{ flexShrink: 0 }} />
                            <span style={{ wordBreak: 'break-all' }}>{branch.email}</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
