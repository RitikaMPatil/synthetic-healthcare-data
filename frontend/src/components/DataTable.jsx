import React, { useState } from 'react'

export default function DataTable({ result }) {
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10

  if (!result) return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 16, padding: 60, textAlign: 'center', color: 'var(--text3)',
    }}>
      Generate data first to preview the synthetic records.
    </div>
  )

  const { preview, columns } = result
  const rows = preview.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <h3 style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700 }}>
            Synthetic Data Preview
          </h3>
          <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12 }}>
            {result.rows_generated} total rows · showing first {preview.length}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg3)' }}>
                {columns.map(col => (
                  <th key={col} style={{
                    padding: '10px 14px', textAlign: 'left', whiteSpace: 'nowrap',
                    color: 'var(--text2)', fontFamily: 'var(--mono)', fontSize: 11,
                    fontWeight: 500, borderBottom: '1px solid var(--border)',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>{col.replace(/_/g, ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {columns.map(col => (
                    <td key={col} style={{ padding: '9px 14px', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                      {row[col] === 'True' ? (
                        <span style={{ color: 'var(--green)' }}>✓</span>
                      ) : row[col] === 'False' ? (
                        <span style={{ color: 'var(--text3)' }}>—</span>
                      ) : row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}