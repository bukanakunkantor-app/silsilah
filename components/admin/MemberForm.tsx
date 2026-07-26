'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isAdmin } from '@/lib/auth'
import { supabase, Person } from '@/lib/supabase'
import styles from './form.module.css'

interface MemberFormProps {
  editPerson?: Person
}

export default function MemberForm({ editPerson }: MemberFormProps) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [persons, setPersons] = useState<Person[]>([])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(editPerson?.photo_url || null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: editPerson?.name || '',
    nickname: editPerson?.nickname || '',
    gender: editPerson?.gender || 'male',
    birth_date: editPerson?.birth_date || '',
    death_date: editPerson?.death_date || '',
    is_alive: editPerson?.is_alive ?? true,
    bio: editPerson?.bio || '',
    birthplace: editPerson?.birthplace || '',
    generation: editPerson?.generation || 1,
    parent_id: editPerson?.parent_id || '',
    spouse_id: '',
    marriage_date: '',
  })

  useEffect(() => {
    isAdmin().then(admin => {
      if (!admin) router.replace('/admin/login')
      else {
        setChecking(false)
        loadPersons()
      }
    })
  }, [router])

  const loadPersons = async () => {
    const { data } = await supabase.from('persons').select('*').order('name')
    if (data) setPersons(data.filter(p => p.id !== editPerson?.id))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran foto maksimal 5MB')
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setError('')
  }

  const uploadPhoto = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('family-photos')
      .upload(filename, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('family-photos').getPublicUrl(filename)
    return data.publicUrl
  }

  const set = (key: string, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Nama wajib diisi')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Upload photo if selected
      let photoUrl = editPerson?.photo_url || null
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile)
      }

      const payload = {
        name: form.name.trim(),
        nickname: form.nickname.trim() || null,
        gender: form.gender as 'male' | 'female',
        birth_date: form.birth_date || null,
        death_date: form.is_alive ? null : (form.death_date || null),
        is_alive: form.is_alive,
        bio: form.bio.trim() || null,
        birthplace: form.birthplace.trim() || null,
        generation: Number(form.generation),
        parent_id: form.parent_id || null,
        photo_url: photoUrl,
      }

      if (editPerson) {
        // Update
        const { error: updateError } = await supabase
          .from('persons')
          .update(payload)
          .eq('id', editPerson.id)
        if (updateError) throw updateError
        setSuccess('Data berhasil diperbarui!')
      } else {
        // Insert
        const { data: newPerson, error: insertError } = await supabase
          .from('persons')
          .insert(payload)
          .select()
          .single()
        if (insertError) throw insertError

        // Add marriage if spouse selected
        if (form.spouse_id && newPerson) {
          const spousePerson = persons.find(p => p.id === form.spouse_id)
          const marriagePayload = newPerson.gender === 'male'
            ? { husband_id: newPerson.id, wife_id: form.spouse_id }
            : { husband_id: form.spouse_id, wife_id: newPerson.id }

          await supabase.from('marriages').insert({
            ...marriagePayload,
            marriage_date: form.marriage_date || null,
            is_active: true,
          })
        }

        setSuccess('Anggota berhasil ditambahkan!')
        setTimeout(() => router.push('/admin'), 1500)
        return
      }

      setTimeout(() => router.push('/admin'), 1200)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  if (checking) return <div className="loading-screen"><div className="loading-spinner" /></div>

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/admin" className={styles.backBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Kembali
        </Link>
        <h1 className={styles.title}>
          {editPerson ? 'Edit Anggota Keluarga' : 'Tambah Anggota Keluarga'}
        </h1>
        <div style={{ width: 80 }} />
      </header>

      <div className={styles.content}>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>

          {/* Alerts */}
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Photo upload */}
          <div className={styles.photoSection}>
            <div
              className={styles.photoWrapper}
              onClick={() => photoInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload foto"
              onKeyDown={e => e.key === 'Enter' && photoInputRef.current?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className={styles.photoPreview} />
              ) : (
                <div className={styles.photoPlaceholder}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span>Upload Foto</span>
                </div>
              )}
              <div className={styles.photoBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/><circle cx="12" cy="13" r="3"/>
                </svg>
              </div>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className={styles.photoInput}
              id="photo-upload"
              aria-label="Upload foto"
            />
            <p className={styles.photoHint}>JPG, PNG, WebP · Maks 5MB</p>
          </div>

          <div className={styles.grid}>
            {/* Name */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="name">
                Nama Lengkap <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Nama lengkap"
                className="form-input"
                required
              />
            </div>

            {/* Nickname */}
            <div className="form-group">
              <label className="form-label" htmlFor="nickname">
                Panggilan <span>(opsional)</span>
              </label>
              <input
                id="nickname"
                type="text"
                value={form.nickname}
                onChange={e => set('nickname', e.target.value)}
                placeholder="Nama panggilan"
                className="form-input"
              />
            </div>

            {/* Gender */}
            <div className="form-group">
              <label className="form-label">Jenis Kelamin</label>
              <div className="form-radio-group">
                <label className="form-radio-label">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={form.gender === 'male'}
                    onChange={() => set('gender', 'male')}
                  />
                  ♂ Laki-laki
                </label>
                <label className="form-radio-label">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={form.gender === 'female'}
                    onChange={() => set('gender', 'female')}
                  />
                  ♀ Perempuan
                </label>
              </div>
            </div>

            {/* Birth date */}
            <div className="form-group">
              <label className="form-label" htmlFor="birth_date">Tanggal Lahir</label>
              <input
                id="birth_date"
                type="date"
                value={form.birth_date}
                onChange={e => set('birth_date', e.target.value)}
                className="form-input"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Birthplace */}
            <div className="form-group">
              <label className="form-label" htmlFor="birthplace">Tempat Lahir</label>
              <input
                id="birthplace"
                type="text"
                value={form.birthplace}
                onChange={e => set('birthplace', e.target.value)}
                placeholder="Kota/Kabupaten"
                className="form-input"
              />
            </div>

            {/* Alive status */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Status</label>
              <div className="form-radio-group">
                <label className="form-radio-label">
                  <input
                    type="radio"
                    name="is_alive"
                    checked={form.is_alive}
                    onChange={() => set('is_alive', true)}
                  />
                  ● Masih Hidup
                </label>
                <label className="form-radio-label">
                  <input
                    type="radio"
                    name="is_alive"
                    checked={!form.is_alive}
                    onChange={() => set('is_alive', false)}
                  />
                  ● Almarhum/ah
                </label>
              </div>
            </div>

            {/* Death date (conditional) */}
            {!form.is_alive && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" htmlFor="death_date">Tanggal Wafat</label>
                <input
                  id="death_date"
                  type="date"
                  value={form.death_date}
                  onChange={e => set('death_date', e.target.value)}
                  className="form-input"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}

            {/* Generation */}
            <div className="form-group">
              <label className="form-label" htmlFor="generation">Generasi ke-</label>
              <input
                id="generation"
                type="number"
                value={form.generation}
                onChange={e => set('generation', Math.max(1, parseInt(e.target.value) || 1))}
                className="form-input"
                min={1}
                max={20}
              />
            </div>

            {/* Parent */}
            <div className="form-group">
              <label className="form-label" htmlFor="parent_id">
                Orang Tua / Ayah <span>(opsional)</span>
              </label>
              <select
                id="parent_id"
                value={form.parent_id}
                onChange={e => set('parent_id', e.target.value)}
                className="form-select"
              >
                <option value="">— Tidak ada / Akar silsilah —</option>
                {persons
                  .filter(p => p.generation < form.generation)
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Gen {p.generation}, {p.gender === 'male' ? 'L' : 'P'})
                    </option>
                  ))}
              </select>
            </div>

            {/* Spouse (only for new persons) */}
            {!editPerson && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="spouse_id">
                    Pasangan <span>(opsional)</span>
                  </label>
                  <select
                    id="spouse_id"
                    value={form.spouse_id}
                    onChange={e => set('spouse_id', e.target.value)}
                    className="form-select"
                  >
                    <option value="">— Belum menikah —</option>
                    {persons
                      .filter(p => p.gender !== form.gender)
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Gen {p.generation})
                        </option>
                      ))}
                  </select>
                </div>

                {form.spouse_id && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="marriage_date">
                      Tanggal Nikah <span>(opsional)</span>
                    </label>
                    <input
                      id="marriage_date"
                      type="date"
                      value={form.marriage_date}
                      onChange={e => set('marriage_date', e.target.value)}
                      className="form-input"
                    />
                  </div>
                )}
              </>
            )}

            {/* Bio */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="bio">
                Biografi / Cerita <span>(opsional)</span>
              </label>
              <textarea
                id="bio"
                value={form.bio}
                onChange={e => set('bio', e.target.value)}
                placeholder="Cerita singkat tentang orang ini…"
                className="form-textarea"
                rows={4}
              />
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <Link href="/admin" className="btn btn-secondary">
              Batal
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <><div className="loading-spinner" style={{ width: 16, height: 16 }} /> Menyimpan…</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                {editPerson ? 'Simpan Perubahan' : 'Tambah Anggota'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
