import React, { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard.jsx'
import GeneratePanel from './components/GeneratePanel.jsx'
import EvaluationPanel from './components/EvaluationPanel.jsx'
import DataTable from './components/DataTable.jsx'
import axios from 'axios'

const API = 'http://localhost:8000'

const NAV = ['Generate', 'Evaluation', 'Data Preview', 'Real Data Info']

export default function App() {
  const [activeTab, setActiveTab] = useState('Generate')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [realDataInfo, setRealDataInfo] = useState(null)

  useEffect(() => {
    axios.get(`${API}/api/evaluate/real-data-info`)
      .then(r => setRealDataInfo(r.data))
      .catch(() => {})
  }, [])

  const handleGenerate = async (params) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await axios.post(`${API}/api/generate/`, params)
      setResult(data)
      setActiveTab('Evaluation')
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    window.open(`${API}/api/generate/download`, '_blank')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0d1b2e 0%, #0a0e1a 100%)',
        borderBottom: '1px solid rgba(99,179,237,0.2)',
        padding: '0 32px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 20, paddingBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'linear-gradient(135deg, #4299e1, #63b3ed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>🏥</div>
            <div>
              <h1 style={{
                fontFamily: 'var(--display)',
                fontSize: 22, fontWeight: 800,
                color: '#e2e8f0', letterSpacing: '-0.5px',
              }}>
                SynthMed <span style={{ color: 'var(--accent)', fontWeight: 400 }}>Privacy Lab</span>
              </h1>
              <p style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                Privacy-Preserving Synthetic Hospital Data Generator
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {NAV.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '8px 18px',
                background: activeTab === tab ? 'rgba(99,179,237,0.15)' : 'transparent',
                color: activeTab === tab ? 'var(--accent)' : 'var(--text2)',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                borderRadius: '6px 6px 0 0',
                fontSize: 13, fontWeight: 500,
                transition: 'all 0.15s',
              }}>
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, padding: '32px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        {error && (
          <div style={{
            background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.3)',
            borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 24, color: 'var(--red)',
            fontFamily: 'var(--mono)', fontSize: 13,
          }}>
            ⚠ {error}
          </div>
        )}

        {activeTab === 'Generate' && (
          <GeneratePanel onGenerate={handleGenerate} loading={loading} result={result} />
        )}
        {activeTab === 'Evaluation' && (
          <EvaluationPanel result={result} onDownload={handleDownload} />
        )}
        {activeTab === 'Data Preview' && (
          <DataTable result={result} />
        )}
        {activeTab === 'Real Data Info' && (
          <Dashboard realDataInfo={realDataInfo} />
        )}
      </main>

      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '16px 32px',
        display: 'flex', justifyContent: 'center',
        color: 'var(--text3)', fontSize: 12, fontFamily: 'var(--mono)',
      }}>
        SynthMed Privacy Lab · CTGAN + Differential Privacy + k-Anonymity
      </footer>
    </div>
  )
}