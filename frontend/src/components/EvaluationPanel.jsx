import React from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
         BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

const CARD = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 24,
}

function ScoreBadge({ label, value, color }) {
  const pct = Math.round(value * 100)
  return (
    <div style={{ ...CARD, textAlign: 'center', flex: 1 }}>
      <div style={{
        fontSize: 42, fontWeight: 800, fontFamily: 'var(--display)',
        color,
      }}>{pct}<span style={{ fontSize: 20 }}>%</span></div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{label}</div>
      <div style={{
        height: 4, background: 'var(--bg3)', borderRadius: 2, marginTop: 12, overflow: 'hidden'
      }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 1s ease' }} />
      </div>
    </div>
  )
}

export default function EvaluationPanel({ result, onDownload }) {
  if (!result) return (
    <div style={{ ...CARD, textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
      No results yet. Go to <strong>Generate</strong> tab and generate synthetic data first.
    </div>
  )

  const { evaluation: ev, rows_generated, generation_time_seconds } = result
  if (!ev) return null

  const radarData = [
    { metric: 'Statistical\nFidelity', value: ev.statistical_similarity * 100 },
    { metric: 'ML Utility\n(TSTR)', value: ev.utility_score * 100 },
    { metric: 'Privacy\nScore', value: ev.privacy_score * 100 },
  ]

  // Build column distribution bar data
  const colData = Object.entries(ev.distribution_metrics)
    .filter(([, v]) => v.type === 'numeric')
    .slice(0, 8)
    .map(([col, v]) => ({
      col: col.replace(/_/g, ' '),
      'KS Similarity': Math.round((1 - v.ks_statistic) * 100),
    }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top scores */}
      <div style={{ display: 'flex', gap: 16 }}>
        <ScoreBadge label="Statistical Fidelity" value={ev.statistical_similarity} color="var(--accent)" />
        <ScoreBadge label="ML Utility (TSTR AUC)" value={ev.utility_score} color="var(--green)" />
        <ScoreBadge label="Privacy Score" value={ev.privacy_score} color="var(--amber)" />
        <div style={{ ...CARD, flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 42, fontWeight: 800, fontFamily: 'var(--display)', color: 'var(--text)' }}>
            {rows_generated.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>Rows Generated</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', marginTop: 8 }}>
            in {generation_time_seconds}s
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        {/* Radar */}
        <div style={CARD}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text2)' }}>Overall Quality Radar</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
              <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Column KS similarity */}
        <div style={CARD}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text2)' }}>
            Column-level Statistical Similarity (1 - KS statistic)
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={colData} margin={{ top: 0, right: 16, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="col" tick={{ fill: 'var(--text3)', fontSize: 10 }} angle={-30} textAnchor="end" />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text3)', fontSize: 10 }} unit="%" />
              <Tooltip
                contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--text)' }}
              />
              <Bar dataKey="KS Similarity" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Privacy details */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--amber)' }}>Privacy Metrics</h3>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {Object.entries(ev.privacy_metrics).map(([k, v]) => (
            <div key={k} style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '12px 20px',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 4 }}>
                {k.replace(/_/g, ' ')}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--display)', color: 'var(--amber)' }}>
                {typeof v === 'number' ? v.toFixed(4) : String(v)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Download */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onDownload} style={{
          padding: '12px 28px',
          background: 'linear-gradient(135deg, #276749, #48bb78)',
          color: 'white', borderRadius: 'var(--radius)',
          fontSize: 14, fontWeight: 600,
        }}>
          ⬇ Download Synthetic CSV
        </button>
      </div>
    </div>
  )
}