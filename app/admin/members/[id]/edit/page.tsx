'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, Person } from '@/lib/supabase'
import MemberForm from '@/components/admin/MemberForm'

export default function EditMemberPage() {
  const params = useParams()
  const [person, setPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const id = params?.id as string
    if (!id) return

    supabase
      .from('persons')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setPerson(data)
        setLoading(false)
      })
  }, [params])

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>

  if (notFound) {
    return (
      <div className="loading-screen">
        <h2>Anggota tidak ditemukan</h2>
        <a href="/admin" className="btn btn-primary" style={{ marginTop: 16 }}>Kembali</a>
      </div>
    )
  }

  return <MemberForm editPerson={person!} />
}
