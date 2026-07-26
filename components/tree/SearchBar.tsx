'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Person } from '@/lib/supabase'
import styles from './SearchBar.module.css'

interface SearchBarProps {
  persons: Person[]
  onSelect: (person: Person) => void
}

export default function SearchBar({ persons, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Person[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    if (value.trim().length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }
    const filtered = persons.filter(p =>
      p.name.toLowerCase().includes(value.toLowerCase()) ||
      (p.nickname && p.nickname.toLowerCase().includes(value.toLowerCase()))
    ).slice(0, 8)
    setResults(filtered)
    setIsOpen(filtered.length > 0)
    setActiveIndex(-1)
  }, [persons])

  const handleSelect = useCallback((person: Person) => {
    setQuery(person.name)
    setIsOpen(false)
    setResults([])
    onSelect(person)
  }, [onSelect])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(results[activeIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }, [isOpen, results, activeIndex, handleSelect])

  const handleClear = useCallback(() => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const getYearRange = (p: Person) => {
    const birth = p.birth_date ? new Date(p.birth_date).getFullYear() : null
    const death = p.death_date ? new Date(p.death_date).getFullYear() : null
    if (birth && !p.is_alive && death) return `${birth}–${death}`
    if (birth) return `b. ${birth}`
    return ''
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.inputWrapper}>
        {/* Search icon */}
        <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
          placeholder="Cari anggota keluarga…"
          className={styles.input}
          id="tree-search"
          autoComplete="off"
          aria-label="Cari anggota keluarga"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={isOpen}
        />

        {query && (
          <button
            className={styles.clearBtn}
            onClick={handleClear}
            aria-label="Hapus pencarian"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && (
        <div
          ref={dropdownRef}
          id="search-results"
          className={styles.dropdown}
          role="listbox"
          aria-label="Hasil pencarian"
        >
          {results.map((person, idx) => (
            <button
              key={person.id}
              className={`${styles.result} ${idx === activeIndex ? styles.active : ''}`}
              onClick={() => handleSelect(person)}
              role="option"
              aria-selected={idx === activeIndex}
            >
              {/* Mini avatar */}
              <div className={`${styles.miniAvatar} ${person.gender === 'female' ? styles.avatarFemale : styles.avatarMale}`}>
                {person.photo_url ? (
                  <img src={person.photo_url} alt={person.name} className={styles.miniImg} />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                  </svg>
                )}
              </div>
              <div className={styles.resultInfo}>
                <span className={styles.resultName}>{person.name}</span>
                <span className={styles.resultMeta}>
                  {getYearRange(person)}
                  {!person.is_alive && <span className={styles.deceasedBadge}>Alm.</span>}
                </span>
              </div>
              {/* Focus arrow */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.resultArrow}>
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
