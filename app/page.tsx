'use client'

import { useEffect, useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { fetchFamilyData, FamilyData } from '@/lib/tree-utils'
import FamilyTree from '@/components/tree/FamilyTree'

export default function HomePage() {
  const [data, setData] = useState<FamilyData>({ persons: [], marriages: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFamilyData()
      .then(setData)
      .catch(err => setError(err.message || 'Gagal memuat data keluarga'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Memuat silsilah keluarga…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="loading-screen">
        <div style={{ textAlign: 'center', maxWidth: 300 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#FFEBEE', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px', color: '#C62828'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 18, marginBottom: 8, color: '#1A2E1A' }}>Koneksi Bermasalah</h2>
          <p style={{ fontSize: 14, color: '#8FAD8F', marginBottom: 16 }}>
            {error === 'fetch failed'
              ? 'Pastikan Supabase URL & API key sudah dikonfigurasi di .env.local'
              : error}
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      <FamilyTree
        persons={data.persons}
        marriages={data.marriages}
        familyName="Silsilah Keluarga"
      />
    </ReactFlowProvider>
  )
}
