import React, { useState } from 'react'

const FIELD_STYLE = {
  display: 'flex', flexDirection: 'column', gap: 6,
}

const LABEL_STYLE = {
  fontSize: 11, fontWeight: 500, color: 'var(--text2)',
  fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em',
}

const CARD = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: 24,
}

export default function GeneratePanel({ onGenerate, loading, result }) {
  const [params, setParams] = useState({
    num_rows: 500,
    generator_type: 'ctgan',
    privacy_mechanism: 'differential_privacy',
    epsilon: 1.0,
    delta: 1e-5,
    k_anonymity_k: 5,
    epochs: 300,
    batch_size: 500,
  })

  const set = (k, v) => setParams(p => ({ ...p, [k]: v }))

  const handleSubmit = () => {
    onGenerate(params)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
      {/* Config Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={CARD}>
          <h2 style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--accent)' }}>
            Model Configuration
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={FIELD_STYLE}>
              <label style={LABEL_STYLE}>Generator Model</label>
              <select value={params.generator_type} onChange={e => set('generator_type', e.target.value)}>
                <option value="ctgan">CTGAN (Conditional Tabular GAN)</option>
                <option value="gaussian_copula">Gaussian Copula</option>
                <option value="tvae">TVAE (Tabular VAE)</option>
              </select>
            </div>

            <div style={FIELD_STYLE}>
              <label style={LABEL_STYLE}>Rows to Generate: {params.num_rows}</label>
              <input type="range" min="50" max="5000" step="50"
                value={params.num_rows}
                onChange={e => set('num_rows', parseInt(e.target.value))}
                style={{ padding: 0, border: 'none', background: 'transparent', accentColor: 'var(--accent)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text3)', fontSize: 11 }}>
                <span>50</span><span>5000</span>
              </div>
            </div>

            <div style={FIELD_STYLE}>
              <label style={LABEL_STYLE}>Training Epochs: {params.epochs}</label>
              <input type="range" min="50" max="1000" step="50"
                value={params.epochs}
                onChange={e => set('epochs', parseInt(e.target.value))}
                style={{ padding: 0, border: 'none', background: 'transparent', accentColor: 'var(--accent)' }}
              />
            </div>
          </div>
        </div>

        <div style={CARD}>
          <h2 style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--green)' }}>
            Privacy Settings
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={FIELD_STYLE}>
              <label style={LABEL_STYLE}>Privacy Mechanism</label>
              <select value={params.privacy_mechanism} onChange={e => set('privacy_mechanism', e.target.value)}>
                <option value="differential_privacy">Differential Privacy (Laplace)</option>
                <option value="k_anonymity">k-Anonymity</option>
                <option value="none">None (baseline)</option>
              </select>
            </div>

            {params.privacy_mechanism === 'differential_privacy' && (
              <>
                <div style={FIELD_STYLE}>
                  <label style={LABEL_STYLE}>
                    ε (Epsilon): {params.epsilon}
                    <span style={{ color: 'var(--text3)', fontWeight: 400 }}> — lower = more private</span>
                  </label>
                  <input type="range" min="0.1" max="10" step="0.1"
                    value={params.epsilon}
                    onChange={e => set('epsilon', parseFloat(e.target.value))}
                    style={{ padding: 0, border: 'none', background: 'transparent', accentColor: 'var(--green)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text3)', fontSize: 11 }}>
                    <span>0.1 (max privacy)</span><span>10 (min privacy)</span>
                  </div>
                </div>
              </>
            )}

            {params.privacy_mechanism === 'k_anonymity' && (
              <div style={FIELD_STYLE}>
                <label style={LABEL_STYLE}>k value: {params.k_anonymity_k}</label>
                <input type="range" min="2" max="50" step="1"
                  value={params.k_anonymity_k}
                  onChange={e => set('k_anonymity_k', parseInt(e.target.value))}
                  style={{ padding: 0, border: 'none', background: 'transparent', accentColor: 'var(--green)' }}
                />
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            padding: '14px 24px',
            background: loading ? 'var(--bg3)' : 'linear-gradient(135deg, #2b6cb0, #4299e1)',
            color: loading ? 'var(--text3)' : 'white',
            borderRadius: 'var(--radius)',
            fontSize: 14, fontWeight: 600,
            transition: 'all 0.2s',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '⏳ Training & Generating...' : '🚀 Generate Synthetic Data'}
        </button>
      </div>

      {/* Info panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={CARD}>
          <h2 style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            How It Works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { icon: '🧠', title: 'Generative Model', desc: 'CTGAN learns the statistical patterns of the real data using adversarial training. TVAE uses variational autoencoders. Gaussian Copula models joint distributions.' },
              { icon: '🔒', title: 'Differential Privacy', desc: 'Laplace noise calibrated to ε is added to numeric columns. Lower ε = more noise = more privacy but less utility. Delta controls the probabilistic guarantee.' },
              { icon: '👥', title: 'k-Anonymity', desc: 'Records are generalized (age → decade) and suppressed until every group of quasi-identifiers has at least k members, preventing re-identification.' },
              { icon: '📊', title: 'Evaluation', desc: 'KS-test & TVD measure fidelity. TSTR (Train on Synthetic, Test on Real) measures ML utility. Nearest-neighbor distances measure privacy leakage.' },
            ].map(item => (
              <div key={item.title} style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: 16,
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--accent)' }}>{item.title}</h3>
                <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {result && (
          <div style={{
            ...CARD,
            borderColor: 'rgba(104,211,145,0.3)',
            background: 'rgba(104,211,145,0.05)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--green)', fontWeight: 600 }}>
                ✓ Generation complete
              </span>
              <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12 }}>
                {result.rows_generated} rows · {result.generation_time_seconds}s
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}