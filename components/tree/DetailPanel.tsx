'use client'

import { useEffect, useCallback } from 'react'
import { Person } from '@/lib/supabase'
import { formatDateRange } from '@/lib/tree-utils'
import styles from './DetailPanel.module.css'

interface DetailPanelProps {
  person: Person | null
  relatedPersons?: Person[]
  onClose: () => void
}

export default function DetailPanel({ person, relatedPersons = [], onClose }: DetailPanelProps) {
  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll when open on mobile
  useEffect(() => {
    if (person) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [person])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  if (!person) return null

  const dateRange = formatDateRange(person.birth_date, person.death_date, person.is_alive)
  const birthYear = person.birth_date ? new Date(person.birth_date).getFullYear() : null
  const deathYear = person.death_date ? new Date(person.death_date).getFullYear() : null

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Detail ${person.name}`}
    >
      <div className={styles.panel}>
        {/* Drag indicator (mobile) */}
        <div className={styles.dragHandle} aria-hidden="true" />

        {/* Close button */}
        <button className={styles.closeBtn} onClick={onClose} aria-label="Tutup panel">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* Hero section */}
        <div className={styles.hero}>
          <div className={styles.avatarWrapper}>
            {person.photo_url ? (
              <img
                src={person.photo_url}
                alt={person.name}
                className={styles.avatar}
              />
            ) : (
              <div className={`${styles.avatarDefault} ${person.gender === 'female' ? styles.avatarFemale : styles.avatarMale}`}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
              </div>
            )}

            <div className={`${styles.statusBadge} ${person.is_alive ? styles.alive : styles.deceased}`}>
              {person.is_alive ? '● Masih Hidup' : '● Almarhum/ah'}
            </div>
          </div>

          <div className={styles.heroInfo}>
            <h2 className={styles.name}>{person.name}</h2>
            {person.nickname && person.nickname !== person.name.split(' ')[0] && (
              <p className={styles.nickname}>"{person.nickname}"</p>
            )}
            <div className={`${styles.genderBadge} ${person.gender === 'female' ? styles.genderFemale : styles.genderMale}`}>
              {person.gender === 'male' ? '♂ Laki-laki' : '♀ Perempuan'}
            </div>
          </div>
        </div>

        {/* Info rows */}
        <div className={styles.infoGrid}>
          {birthYear && (
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </span>
              <div>
                <p className={styles.infoLabel}>Lahir</p>
                <p className={styles.infoValue}>
                  {person.birth_date
                    ? new Date(person.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                    : birthYear}
                  {person.birthplace && ` di ${person.birthplace}`}
                </p>
              </div>
            </div>
          )}

          {!person.is_alive && deathYear && (
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </span>
              <div>
                <p className={styles.infoLabel}>Wafat</p>
                <p className={styles.infoValue}>
                  {person.death_date
                    ? new Date(person.death_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                    : deathYear}
                  {birthYear && deathYear && (
                    <span className={styles.ageNote}> ({deathYear - birthYear} tahun)</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {dateRange && (
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </span>
              <div>
                <p className={styles.infoLabel}>Generasi</p>
                <p className={styles.infoValue}>Generasi ke-{person.generation}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bio */}
        {person.bio && (
          <div className={styles.bioSection}>
            <h3 className={styles.sectionTitle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              Tentang
            </h3>
            <p className={styles.bio}>{person.bio}</p>
          </div>
        )}

        {/* Related persons */}
        {relatedPersons.length > 0 && (
          <div className={styles.relatedSection}>
            <h3 className={styles.sectionTitle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Keluarga Terkait
            </h3>
            <div className={styles.relatedList}>
              {relatedPersons.map(rel => (
                <div key={rel.id} className={styles.relatedItem}>
                  <div className={`${styles.relatedAvatar} ${rel.gender === 'female' ? styles.relatedFemale : styles.relatedMale}`}>
                    {rel.photo_url ? (
                      <img src={rel.photo_url} alt={rel.name} />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                      </svg>
                    )}
                  </div>
                  <span className={styles.relatedName}>{rel.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
