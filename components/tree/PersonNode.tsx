'use client'

import { memo, useState, useCallback } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Person } from '@/lib/supabase'
import { formatDateRange } from '@/lib/tree-utils'
import styles from './PersonNode.module.css'

interface PersonNodeData {
  person: Person
  spouses?: Person[]
  isCollapsed?: boolean
  hasChildren?: boolean
  generation: number
  onToggleCollapse?: (id: string) => void
  onSelectPerson?: (person: Person) => void
  isHighlighted?: boolean
  isDimmed?: boolean
}

const PersonNode = memo(({ data }: NodeProps) => {
  const {
    person,
    isCollapsed = false,
    hasChildren = false,
    onToggleCollapse,
    onSelectPerson,
    isHighlighted = false,
    isDimmed = false
  } = data as unknown as PersonNodeData

  const dateRange = formatDateRange(person.birth_date, person.death_date, person.is_alive)

  const handleCardClick = useCallback(() => {
    onSelectPerson?.(person)
  }, [onSelectPerson, person])

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleCollapse?.(person.id)
  }, [onToggleCollapse, person.id])

  return (
    <div
      className={`
        ${styles.node}
        ${isHighlighted ? styles.highlighted : ''}
        ${isDimmed ? styles.dimmed : ''}
        ${!person.is_alive ? styles.deceased : ''}
        ${person.gender === 'female' ? styles.female : styles.male}
      `}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={`${person.name}, ${person.is_alive ? 'masih hidup' : 'almarhum'}`}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
    >
      {/* Top handle (for incoming parent edge) */}
      <Handle
        type="target"
        position={Position.Top}
        className={styles.handle}
        id="top"
      />

      {/* Avatar */}
      <div className={styles.avatarWrapper}>
        {person.photo_url ? (
          <img
            src={person.photo_url}
            alt={person.name}
            className={styles.avatar}
            loading="lazy"
          />
        ) : (
          <div className={`${styles.avatarDefault} ${person.gender === 'female' ? styles.avatarFemale : styles.avatarMale}`}>
            {person.gender === 'male' ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            )}
          </div>
        )}

        {/* Alive indicator dot */}
        {person.is_alive && <span className={styles.aliveDot} aria-hidden="true" />}
      </div>

      {/* Info */}
      <div className={styles.info}>
        <p className={styles.name}>{person.nickname || person.name.split(' ')[0]}</p>
        {dateRange && <p className={styles.dates}>{dateRange}</p>}
      </div>

      {/* Collapse/expand button */}
      {hasChildren && (
        <button
          className={`${styles.toggleBtn} ${isCollapsed ? styles.collapsed : ''}`}
          onClick={handleToggle}
          aria-label={isCollapsed ? 'Tampilkan anak' : 'Sembunyikan anak'}
          title={isCollapsed ? `Tampilkan keturunan` : `Sembunyikan keturunan`}
        >
          {isCollapsed ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14"/>
            </svg>
          )}
        </button>
      )}

      {/* Bottom handle (for outgoing child edges) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={styles.handle}
        id="bottom"
      />
    </div>
  )
})

PersonNode.displayName = 'PersonNode'

export default PersonNode
