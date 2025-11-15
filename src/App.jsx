import { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function App() {
  const [address, setAddress] = useState('')
  const [txs, setTxs] = useState([])
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState(0)

  const DEMO_ADDRESS = 'zs1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'

  // 100% shielded demo data
  const demoTxs = [
    { txid: 'demo-1', valueOut: 1.234, vout: [{ scriptPubKey: { addresses: ['zs1demo-shielded'] }, value: 123400000 }] },
    { txid: 'demo-2', valueOut: 0.567, vout: [{ scriptPubKey: { addresses: ['zs1demo-private'] }, value: 56700000 }] },
    { txid: 'demo-3', valueOut: 2.345, vout: [{ scriptPubKey: { addresses: ['zs1demo-secure'] }, value: 234500000 }] },
    { txid: 'demo-4', valueOut: 0.891, vout: [{ scriptPubKey: { addresses: ['zs1demo-hidden'] }, value: 89100000 }] },
    { txid: 'demo-5', valueOut: 1.678, vout: [{ scriptPubKey: { addresses: ['zs1demo-anonymous'] }, value: 167800000 }] },
    { txid: 'demo-6', valueOut: 3.210, vout: [{ scriptPubKey: { addresses: ['zs1demo-encrypted'] }, value: 321000000 }] },
    { txid: 'demo-7', valueOut: 0.432, vout: [{ scriptPubKey: { addresses: ['zs1demo-private'] }, value: 43200000 }] },
    { txid: 'demo-8', valueOut: 1.987, vout: [{ scriptPubKey: { addresses: ['zs1demo-shielded'] }, value: 198700000 }] },
    { txid: 'demo-9', valueOut: 0.765, vout: [{ scriptPubKey: { addresses: ['zs1demo-secure'] }, value: 76500000 }] },
    { txid: 'demo-10', valueOut: 2.109, vout: [{ scriptPubKey: { addresses: ['zs1demo-hidden'] }, value: 210900000 }] },
  ]

  const loadDemo = () => {
    setAddress(DEMO_ADDRESS)
    setTxs(demoTxs)
    setScore(100)
  }

  useEffect(() => {
    loadDemo()
  }, [])

  const fetchData = async (addr = address) => {
    if (!addr) return alert('Enter a Zcash address!')
    setLoading(true)
    setTxs([])
    setScore(0)

    try {
      const res = await fetch(`https://api.blockchair.com/zcash/dashboards/address/${addr}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (!data.data[addr]?.transactions?.length) throw new Error()

      const txIds = data.data[addr].transactions.slice(0, 10)
      const txDetails = await Promise.all(
        txIds.map(async (txid) => {
          const r = await fetch(`https://api.blockchair.com/zcash/raw/transaction/${txid}`)
          return r.ok ? await r.json() : null
        })
      )

      const validTxs = txDetails.filter(Boolean).map(t => t.data)
      setTxs(validTxs)
      setAddress(addr)

      const shielded = validTxs.flatMap(tx => (tx.vout || []).filter(v => v.scriptpubkey_address?.startsWith('zs'))).length
      const total = validTxs.flatMap(tx => tx.vout || []).length
      setScore(total > 0 ? Math.round((shielded / total) * 100) : 0)

    } catch {
      alert('Live data unavailable — showing 100% shielded DEMO!')
      loadDemo()
    }
    setLoading(false)
  }

  const chartData = {
    labels: txs.map((_, i) => `Tx ${i + 1}`),
    datasets: [{
      label: 'Privacy Score %',
      data: txs.map(() => score),
      borderColor: score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444',
      backgroundColor: score >= 80 
        ? 'rgba(16, 185, 129, 0.1)' 
        : score >= 50 
        ? 'rgba(245, 158, 11, 0.1)' 
        : 'rgba(239, 68, 68, 0.1)',
      tension: 0.3,
    }],
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#1f2937', textAlign: 'center', marginBottom: '0.5rem' }}>
        Z-Viewer <span style={{ fontSize: '0.6em', color: '#10b981' }}>by @PressRealz</span>
      </h1>
      <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '1.5rem' }}>
        See how private your Zcash really is — in one click.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          placeholder="t1... or zs1..."
          value={address}
          onChange={e => setAddress(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && fetchData()}
          style={{ flex: 1, minWidth: '200px', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
        />
        <button
          onClick={() => { setAddress(DEMO_ADDRESS); loadDemo(); }}
          style={{ padding: '0.75rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}
        >
          Load Demo
        </button>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{ padding: '0.75rem 1rem', background: loading ? '#9ca3af' : '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}
        >
          {loading ? 'Loading...' : 'View Privacy'}
        </button>
      </div>

      {txs.length > 0 && (
        <>
          <div style={{
            background: score >= 80 ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${score >= 80 ? '#86efac' : '#fca5a5'}`,
            padding: '1.5rem',
            borderRadius: '12px',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <h2 style={{ margin: '0', color: score >= 80 ? '#166534' : '#991b1b', fontSize: '2rem' }}>
              Privacy Score: <strong>{score}% Shielded</strong>
            </h2>
            <p style={{ margin: '0.5rem 0 0', color: '#6b7280' }}>
              {score >= 80 ? 'Excellent privacy!' : 'Use shielded addresses (zs1...) for max privacy'}
            </p>
          </div>

          <div style={{ height: '300px', marginBottom: '2rem' }}>
            <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }} />
          </div>

          <button
            onClick={() => {
              const text = `My Zcash Privacy Score: ${score}% shielded! Check yours at ${window.location.href} #ZViewer @Zcash @Gemini`
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`)
            }}
            style={{
              display: 'block',
              margin: '0 auto 2rem',
              padding: '0.75rem 2rem',
              background: '#1da1f2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              cursor: 'pointer'
            }}
          >
            Share on X
          </button>

          <h3 style={{ color: '#1f2937', marginBottom: '1rem' }}>Recent Transactions</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            {txs.map((tx, i) => (
              <div key={i} style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', fontSize: '0.95rem' }}>
                <div><strong>Hash:</strong> {tx.txid ? tx.txid.slice(0,16) + '...' : `demo-tx-${i+1}`}</div>
                <div><strong>Value:</strong> {((tx.valueOut || tx.vout?.[0]?.value || 123400000) / 1e8).toFixed(4)} ZEC</div>
                <div style={{ marginTop: '0.5rem' }}>
                  <strong>Outputs:</strong>{' '}
                  {(tx.vout || []).slice(0,3).map((v, j) => (
                    <span
                      key={j}
                      style={{
                        background: v.scriptPubKey?.addresses?.[0]?.startsWith('zs') ? '#dcfce7' : '#fee2e2',
                        color: v.scriptPubKey?.addresses?.[0]?.startsWith('zs') ? '#166534' : '#991b1b',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '6px',
                        marginRight: '0.4rem',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {v.scriptPubKey?.addresses?.[0]?.slice(0,8)}...
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}