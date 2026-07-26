'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isAdmin, signOut } from '@/lib/auth'
import { supabase, Person, Marriage } from '@/lib/supabase'
import { fetchFamilyData } from '@/lib/tree-utils'
import styles from './admin.module.css'

export default function AdminDashboard() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [persons, setPersons] = useState<Person[]>([])
  const [marriages, setMarriages] = useState<Marriage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    isAdmin().then(admin => {
      if (!admin) router.replace('/admin/login')
      else {
        setChecking(false)
        loadData()
      }
    })
  }, [router])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchFamilyData()
      setPersons(data.persons)
      setMarriages(data.marriages)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace('/admin/login')
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    const { error } = await supabase.from('persons').delete().eq('id', id)
    if (!error) {
      setPersons(prev => prev.filter(p => p.id !== id))
      setDeleteId(null)
    }
    setDeleting(false)
  }

  const filtered = persons.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.nickname && p.nickname.toLowerCase().includes(search.toLowerCase()))
  )

  const stats = {
    total: persons.length,
    alive: persons.filter(p => p.is_alive).length,
    male: persons.filter(p => p.gender === 'male').length,
    female: persons.filter(p => p.gender === 'female').length,
    generations: persons.length > 0 ? Math.max(...persons.map(p => p.generation)) : 0,
    marriages: marriages.length,
  }

  if (checking) return <div className="loading-screen"><div className="loading-spinner" /></div>

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c4 0 4-2 8-2s4 2 8 2v-2c-4 0-4-2-8-2-1.17 0-1.91.17-2.53.33C14.28 12.22 16 10.35 17 8zM12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8m0-2a6 6 0 1 0 0 12A6 6 0 0 0 12 2z"/>
            </svg>
          </div>
          <div>
            <p className={styles.sidebarTitle}>Silsilah Keluarga</p>
            <p className={styles.sidebarSub}>Admin Panel</p>
          </div>
        </div>

        <nav className={styles.nav}>
          <Link href="/admin" className={`${styles.navItem} ${styles.navActive}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Dashboard
          </Link>
          <Link href="/admin/members/add" className={styles.navItem}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            Tambah Anggota
          </Link>
          <Link href="/" target="_blank" className={styles.navItem}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Lihat Pohon
          </Link>
        </nav>

        <button onClick={handleSignOut} className={styles.signOutBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Keluar
        </button>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        {/* Stats cards */}
        <section className={styles.statsGrid} aria-label="Statistik">
          {[
            { label: 'Total Anggota', value: stats.total, icon: '👥', color: '#E8F5E9', iconColor: '#2E7D32' },
            { label: 'Masih Hidup', value: stats.alive, icon: '💚', color: '#F1F8E9', iconColor: '#558B2F' },
            { label: 'Laki-laki', value: stats.male, icon: '♂', color: '#E3F2FD', iconColor: '#1565C0' },
            { label: 'Perempuan', value: stats.female, icon: '♀', color: '#FCE4EC', iconColor: '#AD1457' },
            { label: 'Generasi', value: stats.generations, icon: '🌳', color: '#FFF8E1', iconColor: '#F57F17' },
            { label: 'Pernikahan', value: stats.marriages, icon: '💍', color: '#F3E5F5', iconColor: '#6A1B9A' },
          ].map(stat => (
            <div key={stat.label} className={styles.statCard} style={{ background: stat.color }}>
              <span className={styles.statIcon} style={{ color: stat.iconColor }}>{stat.icon}</span>
              <p className={styles.statValue}>{stat.value}</p>
              <p className={styles.statLabel}>{stat.label}</p>
            </div>
          ))}
        </section>

        {/* Members table */}
        <section className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>Daftar Anggota Keluarga</h2>
            <div className={styles.tableActions}>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="search"
                  placeholder="Cari nama…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 32, maxWidth: 220, height: 38, fontSize: 13 }}
                />
              </div>
              <Link href="/admin/members/add" className="btn btn-primary btn-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Tambah
              </Link>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div className="loading-spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyTable}>
              <p>{search ? `Tidak ada hasil untuk "${search}"` : 'Belum ada anggota keluarga'}</p>
              {!search && (
                <Link href="/admin/members/add" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                  Tambah Pertama
                </Link>
              )}
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Jenis Kelamin</th>
                    <th>Lahir</th>
                    <th>Status</th>
                    <th>Generasi</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(person => (
                    <tr key={person.id} className={styles.tableRow}>
                      <td>
                        <div className={styles.personCell}>
                          <div className={`${styles.tableAvatar} ${person.gender === 'female' ? styles.avatarFemale : styles.avatarMale}`}>
                            {person.photo_url
                              ? <img src={person.photo_url} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                              : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                            }
                          </div>
                          <div>
                            <p className={styles.personName}>{person.name}</p>
                            {person.nickname && <p className={styles.personNick}>{person.nickname}</p>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${person.gender === 'male' ? 'badge-male' : 'badge-female'}`}>
                          {person.gender === 'male' ? '♂ L' : '♀ P'}
                        </span>
                      </td>
                      <td className={styles.dateCell}>
                        {person.birth_date
                          ? new Date(person.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td>
                        <span className={`badge ${person.is_alive ? 'badge-alive' : 'badge-deceased'}`}>
                          {person.is_alive ? '● Hidup' : '● Almarhum'}
                        </span>
                      </td>
                      <td className={styles.centerCell}>
                        <span className={styles.genBadge}>Gen {person.generation}</span>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <Link
                            href={`/admin/members/${person.id}/edit`}
                            className="btn btn-icon"
                            title="Edit"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </Link>
                          <button
                            className="btn btn-icon"
                            style={{ color: '#C62828', borderColor: '#FFCDD2' }}
                            onClick={() => setDeleteId(person.id)}
                            title="Hapus"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => e.target === e.currentTarget && setDeleteId(null)}
        >
          <div className={styles.modal}>
            <div className={styles.modalIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h3 className={styles.modalTitle}>Hapus Anggota?</h3>
            <p className={styles.modalText}>
              Data anggota ini akan dihapus permanen dan tidak bisa dipulihkan.
              Anak-anak yang terhubung tidak akan ikut terhapus.
            </p>
            <div className={styles.modalActions}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)} disabled={deleting}>
                Batal
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
              >
                {deleting ? <><div className="loading-spinner" style={{ width: 14, height: 14 }} /> Menghapus…</> : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
