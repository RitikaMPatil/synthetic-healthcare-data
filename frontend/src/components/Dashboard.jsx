import React from 'react'

const CARD = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 20,
}

export default function Dashboard({ realDataInfo }) {
  if (!realDataInfo) return (
    <div style={{ ...CARD, textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
      Loading real data statistics...
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 16 }}>
        {[
          { label: 'Records', value: realDataInfo.rows.toLocaleString(), color: 'var(--accent)' },
          { label: 'Features', value: realDataInfo.columns, color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} style={{ ...CARD, flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--display)', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Column details */}
      <div style={CARD}>
        <h3 style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Column Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {realDataInfo.column_info.map(col => (
            <div key={col.name} style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: 14,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
                  {col.name}
                </span>
                <span style={{
                  fontSize: 10, color: 'var(--text3)', background: 'var(--bg)',
                  border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px',
                  fontFamily: 'var(--mono)',
                }}>
                  {col.dtype}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span>Unique values: <strong style={{ color: 'var(--text)' }}>{col.unique_count}</strong></span>
                <span>Missing: <strong style={{ color: col.missing_pct > 5 ? 'var(--red)' : 'var(--text)' }}>{col.missing_pct}%</strong></span>
                {col.mean !== undefined && (
                  <span>Mean: <strong style={{ color: 'var(--text)' }}>{col.mean}</strong> ({col.min}–{col.max})</span>
                )}
                {col.top_values && (
                  <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                    {Object.entries(col.top_values).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}